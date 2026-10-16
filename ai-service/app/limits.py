from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager
from typing import AsyncIterator

from app.config import get_settings
from app.errors import BUSY


class Gate:
    """Bounded concurrency with a queue timeout. A burst degrades into fast 503s instead of piling unbounded
    work (and unbounded provider spend) behind slow upstream calls."""

    def __init__(self, size: int) -> None:
        self._sem = asyncio.Semaphore(size)

    @asynccontextmanager
    async def slot(self) -> AsyncIterator[None]:
        try:
            await asyncio.wait_for(self._sem.acquire(), timeout=get_settings().queue_timeout_seconds)
        except asyncio.TimeoutError:
            raise BUSY from None
        try:
            yield
        finally:
            self._sem.release()


_gates: dict[str, Gate] = {}


def text_gate() -> Gate:
    return _gates.setdefault("text", Gate(get_settings().max_concurrent_text))


def image_gate() -> Gate:
    return _gates.setdefault("image", Gate(get_settings().max_concurrent_images))


def reset_gates() -> None:
    _gates.clear()
