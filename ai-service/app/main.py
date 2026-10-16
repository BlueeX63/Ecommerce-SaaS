from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app import clients
from app.config import get_settings
from app.errors import ServiceError
from app.routers.v1 import router as v1_router

log = logging.getLogger("ai")


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    logging.basicConfig(level=settings.log_level.upper(), format="%(asctime)s %(levelname)s %(name)s %(message)s")
    log.info("ai-service starting text=%s image=%s", bool(settings.anthropic_api_key), bool(settings.openai_api_key))
    yield
    await clients.close_clients()


def create_app() -> FastAPI:
    # No interactive docs/OpenAPI in production images: the surface is internal and token-protected.
    app = FastAPI(title="Monolith AI service", lifespan=lifespan, docs_url=None, redoc_url=None, openapi_url=None)

    @app.get("/healthz", include_in_schema=False)
    async def healthz() -> dict[str, str]:
        return {"status": "ok"}

    app.include_router(v1_router)

    @app.exception_handler(ServiceError)
    async def service_error(_req: Request, error: ServiceError) -> JSONResponse:
        return JSONResponse(status_code=error.status, content={"error": error.code, "message": error.message})

    @app.exception_handler(HTTPException)
    async def http_error(_req: Request, error: HTTPException) -> JSONResponse:
        return JSONResponse(status_code=error.status_code, content={"error": "HTTP_ERROR", "message": str(error.detail)})

    @app.exception_handler(RequestValidationError)
    async def invalid_request(_req: Request, error: RequestValidationError) -> JSONResponse:
        # Field paths only: never echo the submitted values back (they may contain shopper text).
        fields = [".".join(str(p) for p in e["loc"]) for e in error.errors()]
        return JSONResponse(status_code=422, content={"error": "INVALID_REQUEST", "message": "Invalid request", "fields": fields})

    return app


app = create_app()
