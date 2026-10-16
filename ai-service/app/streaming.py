from __future__ import annotations

import asyncio
from typing import AsyncIterator, TypeVar

from starlette.requests import Request

T = TypeVar("T")

# Teardown tasks must outlive the request task that spawned them (see `until_disconnect`), so keep a reference.
_teardowns: set[asyncio.Future[None]] = set()


async def _wait_for_disconnect(request: Request) -> None:
    while True:
        message = await request.receive()
        if message["type"] == "http.disconnect":
            return


async def until_disconnect(request: Request, source: AsyncIterator[T]) -> AsyncIterator[T]:
    """Yields `source` items, but stops (and cancels `source`) the moment the client goes away.

    Servers only report a dropped connection when something is *written*, and a model call can sit silent for
    seconds. Without this, an abandoned chat would keep a provider request (and its cost) running to completion.
    Cancelling the producer task cancels the LangGraph run and the in-flight provider HTTP request under it.
    """
    queue: asyncio.Queue[tuple[str, object]] = asyncio.Queue(maxsize=64)

    async def produce() -> None:
        try:
            async for item in source:
                await queue.put(("item", item))
            await queue.put(("end", None))
        except asyncio.CancelledError:
            raise
        except BaseException as error:  # noqa: BLE001 - re-raised in the consumer, in order with the items
            await queue.put(("error", error))

    producer = asyncio.create_task(produce())
    watcher = asyncio.create_task(_wait_for_disconnect(request))
    getter: asyncio.Task[tuple[str, object]] | None = None
    try:
        while True:
            getter = asyncio.create_task(queue.get())
            await asyncio.wait({getter, watcher}, return_when=asyncio.FIRST_COMPLETED)
            if not getter.done():
                return
            kind, payload = getter.result()
            if kind == "end":
                return
            if kind == "error":
                raise payload  # type: ignore[misc]
            yield payload  # type: ignore[misc]
    finally:
        # The server cancels the request task as soon as the client is gone. A second cancel arriving while
        # LangGraph is still tearing down its node tasks would interrupt that teardown and leave the model call
        # running, so teardown runs as its own task, shielded from the request's cancellation.
        async def teardown() -> None:
            tasks = [t for t in (producer, watcher, getter) if t is not None]
            for task in tasks:
                task.cancel()
            await asyncio.gather(*tasks, return_exceptions=True)

        cleanup = asyncio.ensure_future(teardown())
        _teardowns.add(cleanup)
        cleanup.add_done_callback(_teardowns.discard)
        await asyncio.shield(cleanup)
