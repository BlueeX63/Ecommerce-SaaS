from __future__ import annotations

import logging
from functools import lru_cache

import httpx
from langchain_anthropic import ChatAnthropic
from openai import AsyncOpenAI

from app.config import get_settings
from app.errors import NOT_CONFIGURED_OPENAI, NOT_CONFIGURED_TEXT, PROVIDER_FAILURE, ServiceError

log = logging.getLogger("ai.provider")


@lru_cache
def openai_client() -> AsyncOpenAI:
    """One pooled client per process (connection reuse). Built lazily so the service boots without keys."""
    key = get_settings().openai_api_key
    if not key:
        raise NOT_CONFIGURED_OPENAI
    return AsyncOpenAI(api_key=key, timeout=120.0, max_retries=2)


@lru_cache
def text_model(max_tokens: int) -> ChatAnthropic:
    """Anthropic chat model, one cached instance per token cap (each holds a pooled HTTP client)."""
    settings = get_settings()
    if not settings.anthropic_api_key:
        raise NOT_CONFIGURED_TEXT
    return ChatAnthropic(
        model=settings.ai_text_model,
        api_key=settings.anthropic_api_key,
        max_tokens=max_tokens,
        timeout=30.0,
        max_retries=2,
    )


@lru_cache
def backend_http() -> httpx.AsyncClient:
    """Pooled keep-alive client for the internal store-tool calls back to the main backend."""
    return httpx.AsyncClient(
        base_url=get_settings().backend_internal_url,
        timeout=httpx.Timeout(10.0, connect=3.0),
        limits=httpx.Limits(max_connections=100, max_keepalive_connections=20),
    )


def provider_failure(scope: str, error: BaseException) -> ServiceError:
    """Logs a provider failure without request content or keys, and returns a safe generic error."""
    if isinstance(error, ServiceError):
        return error
    status = getattr(error, "status_code", None)
    log.error("provider error scope=%s status=%s type=%s", scope, status, type(error).__name__)
    return PROVIDER_FAILURE


async def close_clients() -> None:
    if backend_http.cache_info().currsize:
        await backend_http().aclose()
    if openai_client.cache_info().currsize:
        await openai_client().close()
    backend_http.cache_clear()
    openai_client.cache_clear()
    text_model.cache_clear()
