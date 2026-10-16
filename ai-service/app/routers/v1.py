from __future__ import annotations

import json
import logging
from typing import Any, AsyncIterator

from fastapi import APIRouter, Depends, Request, Response
from fastapi.responses import StreamingResponse

from app import clients, images
from app.config import get_settings
from app.errors import PROVIDER_FAILURE, ServiceError
from app.graphs import listing as listing_graph
from app.graphs import store_chat, support as support_graph
from app.limits import text_gate
from app.prompts import store_instructions
from app.schemas import (
    ChatRequest,
    GenerateImageRequest,
    ListingRequest,
    ListingResponse,
    SupportRequest,
    SupportResponse,
    VoiceRequest,
    VoiceResponse,
)
from app.security import require_service_token
from app.streaming import until_disconnect

log = logging.getLogger("ai.http")

router = APIRouter(prefix="/v1", dependencies=[Depends(require_service_token)])

MAX_IMAGE_BYTES = 10 * 1024 * 1024
VOICE = "marin"


def _sse(event: dict[str, Any]) -> bytes:
    return f"data: {json.dumps(event, separators=(',', ':'))}\n\n".encode()


@router.get("/status")
async def status() -> dict[str, bool]:
    """Which providers are configured. Booleans only, never a key."""
    settings = get_settings()
    return {"text": bool(settings.anthropic_api_key), "image": bool(settings.openai_api_key), "voice": bool(settings.openai_api_key)}


# --------------------------------------------------------------------------------------------- store chat (SSE)


@router.post("/chat/stream")
async def chat_stream(body: ChatRequest, request: Request) -> StreamingResponse:
    """Streams the assistant's reply as server-sent events: {delta}, {tool}, then {done} or {error}."""
    clients.text_model(store_chat.MAX_TOKENS)  # a plain 503 (not a half-open stream) when the key is unset
    system = store_instructions(body.store, voice=False)
    config = store_chat.graph_config(system, body.tools, body.tool_token)
    state = {"messages": store_chat.to_messages(body.messages), "rounds": 0}

    async def events() -> AsyncIterator[bytes]:
        try:
            async with text_gate().slot():
                run = store_chat.chat_graph.astream(state, config, stream_mode=["messages", "custom"])
                async for mode, payload in until_disconnect(request, run):
                    if mode == "custom":
                        yield _sse(payload)
                    else:
                        chunk, meta = payload
                        if meta.get("langgraph_node") == "agent":
                            text = store_chat.text_of(chunk)
                            if text:
                                yield _sse({"type": "delta", "text": text})
            yield _sse({"type": "done"})
        except ServiceError as error:
            yield _sse({"type": "error", "message": error.message})
        except Exception as error:  # noqa: BLE001
            yield _sse({"type": "error", "message": clients.provider_failure("store-chat", error).message})

    return StreamingResponse(
        events(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-store, no-transform", "X-Accel-Buffering": "no"},
    )


# --------------------------------------------------------------------------------------------- voice


@router.post("/voice/session", response_model=VoiceResponse)
async def voice_session(body: VoiceRequest) -> VoiceResponse:
    """Mints a short-lived realtime client secret, pinned server-side to this store's instructions and tools."""
    settings = get_settings()
    client = clients.openai_client()
    tools = [{"type": "function", "name": t.name, "description": t.description, "parameters": t.input_schema} for t in body.tools]
    try:
        secret = await client.realtime.client_secrets.create(
            expires_after={"anchor": "created_at", "seconds": 600},
            session={
                "type": "realtime",
                "model": settings.ai_realtime_model,
                "instructions": store_instructions(body.store, voice=True),
                "audio": {"output": {"voice": VOICE}},
                "tools": tools,
                "tool_choice": "auto",
            },
        )
    except Exception as error:  # noqa: BLE001
        raise clients.provider_failure("store-voice", error) from error
    return VoiceResponse(clientSecret=secret.value, expiresAt=getattr(secret, "expires_at", None), model=settings.ai_realtime_model)


# --------------------------------------------------------------------------------------------- merchant tools


@router.post("/listing", response_model=ListingResponse)
async def product_listing(body: ListingRequest) -> ListingResponse:
    clients.text_model(800)
    async with text_gate().slot():
        try:
            return await listing_graph.run(body)
        except ServiceError:
            raise
        except Exception as error:  # noqa: BLE001
            raise clients.provider_failure("product-listing", error) from error


@router.post("/images/generate")
async def image_generate(body: GenerateImageRequest) -> Response:
    png = await images.generate_studio_image(body.product_name, body.category, body.description)
    return Response(content=png, media_type="image/png")


@router.post("/images/clean")
async def image_clean(request: Request) -> Response:
    """Body is the raw image; Content-Type says which format. The backend has already validated ownership."""
    declared = request.headers.get("content-length")
    if declared and declared.isdigit() and int(declared) > MAX_IMAGE_BYTES:
        raise ServiceError(413, "TOO_LARGE", "Image is too large to process")
    chunks: list[bytes] = []
    size = 0
    async for chunk in request.stream():
        size += len(chunk)
        if size > MAX_IMAGE_BYTES:
            raise ServiceError(413, "TOO_LARGE", "Image is too large to process")
        chunks.append(chunk)
    if not size:
        raise ServiceError(400, "EMPTY", "No image supplied")
    content_type = (request.headers.get("content-type") or "").split(";")[0].strip().lower()
    png = await images.clean_studio_image(b"".join(chunks), content_type)
    return Response(content=png, media_type="image/png")


# --------------------------------------------------------------------------------------------- order support


@router.post("/support/analyze", response_model=SupportResponse)
async def support_analyze(body: SupportRequest) -> SupportResponse:
    clients.text_model(400)
    async with text_gate().slot():
        try:
            return await support_graph.run(body)
        except ServiceError:
            raise
        except Exception as error:  # noqa: BLE001
            raise clients.provider_failure("order-support", error) from error


__all__ = ["router", "PROVIDER_FAILURE"]
