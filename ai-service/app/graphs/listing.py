"""Product listing generator: `generate` (forced tool call) -> `validate`, retrying once on an invalid answer."""

from __future__ import annotations

from typing import Annotated, Any, TypedDict

from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import END, START, StateGraph
from pydantic import BaseModel, StringConstraints, ValidationError

from app import clients
from app.prompts import LISTING_SYSTEM, escape_tags
from app.schemas import ListingRequest, ListingResponse

TOOL_NAME = "save_product_listing"
MAX_ATTEMPTS = 2


class Listing(BaseModel):
    """The fields the merchant form can be filled with. Validated strictly before anything reaches the form."""

    description: Annotated[str, StringConstraints(strip_whitespace=True, min_length=20, max_length=1500)]
    sku: Annotated[str, StringConstraints(strip_whitespace=True, max_length=40, pattern=r"^[A-Za-z0-9-]*$")]
    # Must be one of the category names the merchant already has, or null when none fits.
    category: Annotated[str, StringConstraints(strip_whitespace=True, max_length=100)] | None


def _tool() -> dict[str, Any]:
    schema = Listing.model_json_schema()
    schema.pop("title", None)
    for prop in schema.get("properties", {}).values():
        prop.pop("title", None)
    return {"name": TOOL_NAME, "description": "Saves the finished product listing.", "input_schema": schema}


LISTING_TOOL = _tool()


class ListingState(TypedDict, total=False):
    request: ListingRequest
    attempts: int
    raw: dict[str, Any] | None
    listing: Listing | None


def user_message(request: ListingRequest) -> str:
    categories = "\n".join(f"- {escape_tags(c)}" for c in request.category_names) or "(none)"
    parts = [
        f"<product_name>{escape_tags(request.product_name)}</product_name>",
        f"<current_description>{escape_tags(request.current_description)}</current_description>"
        if request.current_description
        else "",
        f"<available_categories>\n{categories}\n</available_categories>",
        "Call the save_product_listing tool with the listing.",
    ]
    return "\n".join(p for p in parts if p)


async def generate(state: ListingState) -> ListingState:
    model = clients.text_model(800).bind_tools([LISTING_TOOL], tool_choice=TOOL_NAME)
    reply = await model.ainvoke(
        [
            SystemMessage(content=[{"type": "text", "text": LISTING_SYSTEM, "cache_control": {"type": "ephemeral"}}]),
            HumanMessage(content=user_message(state["request"])),
        ]
    )
    call = next((c for c in reply.tool_calls if c["name"] == TOOL_NAME), None)
    return {"attempts": state.get("attempts", 0) + 1, "raw": call["args"] if call else None, "listing": None}


async def validate(state: ListingState) -> ListingState:
    try:
        return {"listing": Listing.model_validate(state["raw"])} if state.get("raw") else {"listing": None}
    except ValidationError:
        return {"listing": None}


def route(state: ListingState) -> str:
    if state.get("listing") is not None:
        return END
    if state.get("attempts", 0) >= MAX_ATTEMPTS:
        raise ValueError("Model did not return a valid listing")
    return "generate"


def build_graph():
    graph = StateGraph(ListingState)
    graph.add_node("generate", generate)
    graph.add_node("validate", validate)
    graph.add_edge(START, "generate")
    graph.add_edge("generate", "validate")
    graph.add_conditional_edges("validate", route, {"generate": "generate", END: END})
    return graph.compile()


listing_graph = build_graph()


async def run(request: ListingRequest) -> ListingResponse:
    final = await listing_graph.ainvoke({"request": request, "attempts": 0})
    listing: Listing = final["listing"]
    # Hand back the merchant's own spelling of the category, or null if the model went off-list.
    by_lower = {c.lower(): c for c in request.category_names}
    category = by_lower.get(listing.category.lower()) if listing.category else None
    return ListingResponse(description=listing.description, sku=listing.sku, category=category)
