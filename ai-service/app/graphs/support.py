"""Order-help analysis: the model only *extracts* what the shopper wants; the backend decides and applies."""

from __future__ import annotations

from typing import Any, TypedDict

from langchain_core.messages import AIMessage, AnyMessage, HumanMessage, SystemMessage
from langgraph.graph import END, START, StateGraph

from app import clients
from app.prompts import support_system
from app.schemas import SupportAddress, SupportRequest, SupportResponse

TOOL_NAME = "respond"
INTENTS = ["change_phone", "change_address", "need_info", "talk_to_human", "other"]

RESPOND_TOOL: dict[str, Any] = {
    "name": TOOL_NAME,
    "description": "Reply to the shopper and report what they want done with their order.",
    "input_schema": {
        "type": "object",
        "properties": {
            "intent": {
                "type": "string",
                "enum": INTENTS,
                "description": "change_phone / change_address: the shopper gave the new value. need_info: they want a change but the value is missing or unclear. talk_to_human: they asked for a person or want something you cannot do (refunds, cancellations, complaints, product issues). other: anything else.",
            },
            "reply": {"type": "string", "description": "A short, friendly reply (1-3 sentences). Plain text."},
            "new_phone": {
                "type": "string",
                "description": "The new phone number, exactly as the shopper gave it. Only for change_phone.",
            },
            "new_address": {
                "type": "object",
                "description": "The new delivery address. Only for change_address; include only what the shopper provided.",
                "properties": {
                    "line1": {"type": "string"},
                    "landmark": {"type": "string"},
                    "city": {"type": "string"},
                    "state": {"type": "string"},
                    "postal_code": {"type": "string"},
                },
            },
        },
        "required": ["intent", "reply"],
    },
}


class SupportState(TypedDict, total=False):
    request: SupportRequest
    raw: dict[str, Any]
    result: SupportResponse


def build_messages(request: SupportRequest) -> list[AnyMessage]:
    turns: list[AnyMessage] = [
        HumanMessage(content=t.text) if t.role == "customer" else AIMessage(content=t.text)
        for t in request.history[-8:]
    ]
    turns.append(HumanMessage(content=request.message[:1000]))
    # The conversation must start with a user turn.
    while len(turns) > 1 and not isinstance(turns[0], HumanMessage):
        turns.pop(0)
    return turns


async def analyse(state: SupportState) -> SupportState:
    request = state["request"]
    system = support_system(
        request.order.number, request.order.status, request.window.open, request.window.hours_left, request.window.reason
    )
    model = clients.text_model(400).bind_tools([RESPOND_TOOL], tool_choice=TOOL_NAME)
    reply = await model.ainvoke(
        [SystemMessage(content=[{"type": "text", "text": system}]), *build_messages(request)]
    )
    call = next((c for c in reply.tool_calls if c["name"] == TOOL_NAME), None)
    if call is None:
        raise ValueError("No structured reply")
    return {"raw": call["args"]}


def _text(value: Any) -> str | None:
    return value.strip() if isinstance(value, str) and value.strip() else None


async def normalise(state: SupportState) -> SupportState:
    raw = state["raw"]
    intent = raw.get("intent") if raw.get("intent") in INTENTS else "other"
    address = raw.get("new_address")
    parsed = (
        SupportAddress(
            line1=_text(address.get("line1")),
            landmark=_text(address.get("landmark")),
            city=_text(address.get("city")),
            state=_text(address.get("state")),
            postalCode=_text(address.get("postal_code")),
        )
        if isinstance(address, dict)
        else None
    )
    return {
        "result": SupportResponse(
            intent=intent,
            reply=str(raw.get("reply") or "")[:600],
            phone=_text(raw.get("new_phone")),
            address=parsed,
        )
    }


def build_graph():
    graph = StateGraph(SupportState)
    graph.add_node("analyse", analyse)
    graph.add_node("normalise", normalise)
    graph.add_edge(START, "analyse")
    graph.add_edge("analyse", "normalise")
    graph.add_edge("normalise", END)
    return graph.compile()


support_graph = build_graph()


async def run(request: SupportRequest) -> SupportResponse:
    final = await support_graph.ainvoke({"request": request})
    return final["result"]
