from __future__ import annotations

import hmac

from fastapi import Header, HTTPException

from app.config import get_settings


async def require_service_token(authorization: str | None = Header(default=None)) -> None:
    """Only the main backend (which holds the shared token) may call /v1 routes."""
    expected = get_settings().ai_service_token
    scheme, _, supplied = (authorization or "").partition(" ")
    if scheme.lower() != "bearer" or not hmac.compare_digest(supplied.strip().encode(), expected.encode()):
        raise HTTPException(status_code=401, detail="Unauthorized")
