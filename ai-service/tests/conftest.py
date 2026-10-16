from __future__ import annotations

import json
import os
from typing import Any, AsyncIterator, Callable

os.environ["AI_SERVICE_TOKEN"] = "t" * 40
os.environ["ANTHROPIC_API_KEY"] = "test-anthropic"
os.environ["OPENAI_API_KEY"] = "test-openai"
os.environ["BACKEND_INTERNAL_URL"] = "http://backend.test"

import httpx
import pytest
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AIMessage, AIMessageChunk, BaseMessage
from langchain_core.outputs import ChatGeneration, ChatGenerationChunk, ChatResult

from app import clients
from app.limits import reset_gates
from app.main import create_app

AUTH = {"Authorization": f"Bearer {'t' * 40}"}


class ScriptedChat(BaseChatModel):
    """Plays back pre-written replies and records what it was asked, streaming like the real provider does."""

    script: list[Any]
    seen: list[list[BaseMessage]] = []
    bound: list[Any] = []
    calls: int = 0

    @property
    def _llm_type(self) -> str:
        return "scripted"

    def bind_tools(self, tools: Any, **kwargs: Any) -> "ScriptedChat":
        self.bound.append((tools, kwargs))
        return self

    def _next(self, messages: list[BaseMessage]) -> AIMessage:
        self.seen.append(list(messages))
        item = self.script[min(self.calls, len(self.script) - 1)]
        self.calls += 1
        if callable(item):
            item = item()
        if isinstance(item, Exception):
            raise item
        return item

    def _generate(self, messages: list[BaseMessage], stop: Any = None, run_manager: Any = None, **kwargs: Any) -> ChatResult:
        return ChatResult(generations=[ChatGeneration(message=self._next(messages))])

    async def _astream(self, messages: list[BaseMessage], stop: Any = None, run_manager: Any = None, **kwargs: Any) -> AsyncIterator[ChatGenerationChunk]:
        message = self._next(messages)
        text = message.content if isinstance(message.content, str) else ""
        half = max(1, len(text) // 2)
        for part in (text[:half], text[half:]):
            if part:
                yield ChatGenerationChunk(message=AIMessageChunk(content=part))
        for index, call in enumerate(message.tool_calls):
            yield ChatGenerationChunk(
                message=AIMessageChunk(
                    content="",
                    tool_call_chunks=[{"name": call["name"], "args": json.dumps(call["args"]), "id": call["id"], "index": index}],
                )
            )


def tool_call(name: str, args: dict[str, Any], id_: str) -> dict[str, Any]:
    return {"name": name, "args": args, "id": id_, "type": "tool_call"}


@pytest.fixture(autouse=True)
def _reset() -> None:
    reset_gates()
    clients.text_model.cache_clear()
    clients.openai_client.cache_clear()
    clients.backend_http.cache_clear()


@pytest.fixture
def model(monkeypatch: pytest.MonkeyPatch) -> Callable[[list[Any]], ScriptedChat]:
    def install(script: list[Any]) -> ScriptedChat:
        fake = ScriptedChat(script=script, seen=[], bound=[], calls=0)
        monkeypatch.setattr(clients, "text_model", lambda max_tokens: fake)
        return fake

    return install


@pytest.fixture
def backend(monkeypatch: pytest.MonkeyPatch) -> list[httpx.Request]:
    """A fake main backend: records tool calls and answers each with {"ok": <tool name>}."""
    requests: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        return httpx.Response(200, json={"ok": request.url.path.rsplit("/", 1)[-1]})

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler), base_url="http://backend.test")
    monkeypatch.setattr(clients, "backend_http", lambda: client)
    return requests


@pytest.fixture
async def api() -> AsyncIterator[httpx.AsyncClient]:
    transport = httpx.ASGITransport(app=create_app())
    async with httpx.AsyncClient(transport=transport, base_url="http://ai.test", headers=AUTH) as client:
        yield client
