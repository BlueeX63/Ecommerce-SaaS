from __future__ import annotations

from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    ai_service_token: str = Field(min_length=32)
    backend_internal_url: str = "http://localhost:4000"

    anthropic_api_key: str | None = None
    openai_api_key: str | None = None
    ai_text_model: str = "claude-sonnet-5-5"
    ai_image_model: str = "gpt-image-2"
    ai_realtime_model: str = "gpt-realtime-2.1"

    max_concurrent_text: int = Field(default=64, ge=1)
    max_concurrent_images: int = Field(default=4, ge=1)
    queue_timeout_seconds: float = Field(default=20, gt=0)

    port: int = 8000
    log_level: str = "info"

    @field_validator("anthropic_api_key", "openai_api_key", mode="before")
    @classmethod
    def _blank_to_none(cls, value: str | None) -> str | None:
        return value if value and value.strip() else None

    @field_validator("backend_internal_url")
    @classmethod
    def _strip_slash(cls, value: str) -> str:
        return value.rstrip("/")


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
