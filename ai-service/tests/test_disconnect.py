from __future__ import annotations

import asyncio
import socket
import threading
import time
from typing import Any

import httpx
import pytest
import uvicorn
from langchain_core.messages import AIMessageChunk
from langchain_core.outputs import ChatGenerationChunk

from app import clients
from app.main import create_app
from tests.conftest import AUTH, ScriptedChat


def free_port() -> int:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def test_closing_the_connection_cancels_the_in_flight_model_call(monkeypatch: pytest.MonkeyPatch) -> None:
    """Uses a real server: only a real socket close exercises disconnect handling (ASGI test clients cannot)."""
    state = {"started": False, "cancelled": False}

    class Hangs(ScriptedChat):
        def bind_tools(self, tools: Any, **kwargs: Any) -> "Hangs":
            return self

        async def _astream(self, messages: Any, stop: Any = None, run_manager: Any = None, **kwargs: Any) -> Any:
            state["started"] = True
            yield ChatGenerationChunk(message=AIMessageChunk(content="Hello "))
            try:
                await asyncio.sleep(30)
            except asyncio.CancelledError:
                state["cancelled"] = True
                raise

    monkeypatch.setattr(clients, "text_model", lambda max_tokens: Hangs(script=[], seen=[], bound=[], calls=0))
    port = free_port()
    server = uvicorn.Server(uvicorn.Config(create_app(), host="127.0.0.1", port=port, log_level="error"))
    thread = threading.Thread(target=server.run, daemon=True)
    thread.start()
    try:
        deadline = time.time() + 10
        while not server.started and time.time() < deadline:
            time.sleep(0.05)
        assert server.started

        body = {"store": {"name": "A"}, "messages": [{"role": "user", "content": "hi"}], "tools": [], "tool_token": "x" * 40}
        with httpx.Client(headers=AUTH, timeout=10) as client:
            with client.stream("POST", f"http://127.0.0.1:{port}/v1/chat/stream", json=body) as response:
                assert '"delta"' in next(response.iter_text())
            # leaving the block closes the socket while the model is still "thinking"

        deadline = time.time() + 5
        while not state["cancelled"] and time.time() < deadline:
            time.sleep(0.05)
        assert state["started"] and state["cancelled"]
    finally:
        server.should_exit = True
        thread.join(timeout=5)
