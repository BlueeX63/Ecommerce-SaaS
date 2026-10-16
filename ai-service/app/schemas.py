from __future__ import annotations

import re
from typing import Annotated, Any, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

TOOL_NAME = re.compile(r"^[a-z_]{1,40}$")

Trimmed = Annotated[str, StringConstraints(strip_whitespace=True)]


class Strict(BaseModel):
    """Requests only come from our own backend, so unknown fields are a bug, not something to ignore."""

    model_config = ConfigDict(extra="forbid")


# --------------------------------------------------------------------------------------------- tools


class ToolSpec(Strict):
    """One store tool, owned and executed by the backend. The AI service only advertises it to the model."""

    name: Annotated[str, StringConstraints(pattern=TOOL_NAME.pattern)]
    description: Annotated[str, StringConstraints(min_length=1, max_length=2000)]
    input_schema: dict[str, Any]
    read_only: bool = False


class StoreInfo(Strict):
    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=80)]
    delivery_options: list[Annotated[str, StringConstraints(max_length=200)]] = Field(default_factory=list, max_length=10)


# --------------------------------------------------------------------------------------------- chat / voice


class ChatTurn(Strict):
    role: Literal["user", "assistant"]
    content: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=1000)]


class ChatRequest(Strict):
    store: StoreInfo
    messages: Annotated[list[ChatTurn], Field(min_length=1, max_length=20)]
    tools: Annotated[list[ToolSpec], Field(max_length=16)]
    # Short-lived credential the backend minted for this shopper and store. Opaque here: it is only handed
    # back to the backend when a tool runs, so this service can never choose a tenant or customer itself.
    tool_token: Annotated[str, StringConstraints(min_length=20, max_length=4096)]


class VoiceRequest(Strict):
    store: StoreInfo
    tools: Annotated[list[ToolSpec], Field(max_length=16)]


class VoiceResponse(BaseModel):
    clientSecret: str
    expiresAt: int | None = None
    model: str


# --------------------------------------------------------------------------------------------- listing


class ListingRequest(Strict):
    product_name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]
    current_description: Annotated[str, StringConstraints(strip_whitespace=True, max_length=1500)] | None = None
    category_names: list[Annotated[str, StringConstraints(max_length=100)]] = Field(default_factory=list, max_length=200)


class ListingResponse(BaseModel):
    description: str
    sku: str
    category: str | None


# --------------------------------------------------------------------------------------------- images


class GenerateImageRequest(Strict):
    product_name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]
    category: Annotated[str, StringConstraints(strip_whitespace=True, max_length=100)] | None = None
    description: Annotated[str, StringConstraints(strip_whitespace=True, max_length=1500)] | None = None


# --------------------------------------------------------------------------------------------- order support


class SupportWindow(Strict):
    open: bool
    reason: str | None = None
    hours_left: float = Field(ge=0)


class SupportOrder(Strict):
    number: Annotated[str, StringConstraints(max_length=60)]
    status: Annotated[str, StringConstraints(max_length=40)]


class SupportTurn(Strict):
    role: Literal["customer", "assistant", "staff"]
    text: Annotated[str, StringConstraints(max_length=1000)]


class SupportRequest(Strict):
    order: SupportOrder
    window: SupportWindow
    history: list[SupportTurn] = Field(default_factory=list, max_length=60)
    message: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=1000)]


class SupportAddress(BaseModel):
    line1: str | None = None
    landmark: str | None = None
    city: str | None = None
    state: str | None = None
    postalCode: str | None = None


class SupportResponse(BaseModel):
    intent: Literal["change_phone", "change_address", "need_info", "talk_to_human", "other"]
    reply: str
    phone: str | None = None
    address: SupportAddress | None = None
