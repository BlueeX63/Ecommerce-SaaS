"""Storefront shopping assistant as a LangGraph agent: `agent` (model) <-> `tools` (executed by the backend).

The graph is compiled once at import. Everything request-specific (system prompt, tool list, the backend tool
token) travels in `config["configurable"]`, so one compiled graph serves every store concurrently and nothing is
kept between requests.
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Annotated, Any, TypedDict

from langchain_core.messages import AIMessage, AnyMessage, HumanMessage, SystemMessage, ToolMessage
from langchain_core.runnables import RunnableConfig
from langgraph.config import get_stream_writer
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages

from app import clients
from app.schemas import ChatTurn, ToolSpec

log = logging.getLogger("ai.chat")

MAX_TOOL_ROUNDS = 4
MAX_TOKENS = 500
TOOL_FAILED = {"error": "TOOL_FAILED", "message": "Something went wrong. Please try again."}


class ChatState(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]
    rounds: int


def anthropic_tools(specs: list[ToolSpec]) -> list[dict[str, Any]]:
    tools: list[dict[str, Any]] = [
        {"name": t.name, "description": t.description, "input_schema": t.input_schema} for t in specs
    ]
    if tools:
        # Tool definitions are identical for every shopper of every store, so they are the ideal cached prefix.
        tools[-1] = {**tools[-1], "cache_control": {"type": "ephemeral"}}
    return tools


async def agent(state: ChatState, config: RunnableConfig) -> dict[str, Any]:
    cfg = config["configurable"]
    model = clients.text_model(MAX_TOKENS).bind_tools(cfg["tools"])
    system = SystemMessage(content=[{"type": "text", "text": cfg["system"], "cache_control": {"type": "ephemeral"}}])
    reply = await model.ainvoke([system, *state["messages"]], config)
    return {"messages": [reply], "rounds": state["rounds"] + 1}


async def execute_tool(token: str, name: str, args: dict[str, Any]) -> Any:
    """Runs one tool on the backend with the per-request token. Never raises: the model gets an error result."""
    try:
        response = await clients.backend_http().post(
            f"/internal/ai/tools/{name}", json=args, headers={"Authorization": f"Bearer {token}"}
        )
        if response.status_code != 200:
            log.error("tool call failed name=%s status=%s", name, response.status_code)
            return TOOL_FAILED
        return response.json()
    except Exception as error:  # noqa: BLE001 - any transport/JSON failure becomes a tool error, never a crash
        log.error("tool call error name=%s type=%s", name, type(error).__name__)
        return TOOL_FAILED


async def tools(state: ChatState, config: RunnableConfig) -> dict[str, Any]:
    cfg = config["configurable"]
    token: str = cfg["tool_token"]
    read_only: set[str] = cfg["read_only"]
    writer = get_stream_writer()
    calls = [c for c in state["messages"][-1].tool_calls]  # type: ignore[union-attr]
    results: dict[str, Any] = {}

    async def run(call: dict[str, Any]) -> None:
        writer({"type": "tool", "name": call["name"]})
        results[call["id"]] = await execute_tool(token, call["name"], call["args"] or {})

    # Lookups are independent, so they run concurrently. Anything that changes state (add to cart) runs one at a
    # time, after the lookups and in the order the model asked for it.
    await asyncio.gather(*(run(c) for c in calls if c["name"] in read_only))
    for call in calls:
        if call["name"] not in read_only:
            await run(call)

    return {
        "messages": [
            ToolMessage(content=json.dumps(results[c["id"]]), tool_call_id=c["id"], name=c["name"]) for c in calls
        ]
    }


def after_agent(state: ChatState) -> str:
    last = state["messages"][-1]
    return "tools" if isinstance(last, AIMessage) and last.tool_calls else END


def after_tools(state: ChatState) -> str:
    # The round cap bounds cost: the final round's tool calls still run (so "add it" is honoured), then we stop.
    return END if state["rounds"] >= MAX_TOOL_ROUNDS else "agent"


def build_graph():
    graph = StateGraph(ChatState)
    graph.add_node("agent", agent)
    graph.add_node("tools", tools)
    graph.add_edge(START, "agent")
    graph.add_conditional_edges("agent", after_agent, {"tools": "tools", END: END})
    graph.add_conditional_edges("tools", after_tools, {"agent": "agent", END: END})
    return graph.compile()


chat_graph = build_graph()


def to_messages(turns: list[ChatTurn]) -> list[AnyMessage]:
    return [HumanMessage(content=t.content) if t.role == "user" else AIMessage(content=t.content) for t in turns]


def graph_config(system: str, specs: list[ToolSpec], tool_token: str) -> RunnableConfig:
    return {
        "configurable": {
            "system": system,
            "tools": anthropic_tools(specs),
            "read_only": {t.name for t in specs if t.read_only},
            "tool_token": tool_token,
        },
        # agent+tools per round, plus one slack step; the graph itself stops at MAX_TOOL_ROUNDS.
        "recursion_limit": 2 * MAX_TOOL_ROUNDS + 2,
    }


def text_of(chunk: Any) -> str:
    content = getattr(chunk, "content", "")
    if isinstance(content, str):
        return content
    return "".join(b.get("text", "") for b in content if isinstance(b, dict) and b.get("type") == "text")
