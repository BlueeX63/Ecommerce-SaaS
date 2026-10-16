from __future__ import annotations

import base64
import binascii

from app import clients
from app.config import get_settings
from app.errors import PROVIDER_FAILURE, ServiceError
from app.limits import image_gate
from app.prompts import CLEAN_PROMPT, studio_prompt

IMAGE_SIZE = "1024x1024"
EXTENSIONS = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}


def _decode(response: object) -> bytes:
    data = getattr(response, "data", None) or []
    b64 = getattr(data[0], "b64_json", None) if data else None
    if not b64:
        raise ValueError("Image model returned no image")
    try:
        return base64.b64decode(b64, validate=True)
    except binascii.Error as error:
        raise ValueError("Image model returned invalid data") from error


async def generate_studio_image(product_name: str, category: str | None, description: str | None) -> bytes:
    """A PNG studio photo generated from the product's name and details."""
    client = clients.openai_client()
    async with image_gate().slot():
        try:
            response = await client.images.generate(
                model=get_settings().ai_image_model,
                prompt=studio_prompt(product_name, category, description),
                size=IMAGE_SIZE,
                quality="high",
                output_format="png",
                n=1,
            )
            return _decode(response)
        except ServiceError:
            raise
        except Exception as error:  # noqa: BLE001
            raise clients.provider_failure("product-image-generate", error) from error


async def clean_studio_image(image: bytes, content_type: str) -> bytes:
    """Re-shoots a product image onto a clean studio background. Bytes only: this service never fetches URLs."""
    extension = EXTENSIONS.get(content_type)
    if extension is None:
        raise ServiceError(415, "UNSUPPORTED_MEDIA", "Unsupported image type")
    client = clients.openai_client()
    async with image_gate().slot():
        try:
            response = await client.images.edit(
                model=get_settings().ai_image_model,
                image=(f"product.{extension}", image, content_type),
                prompt=CLEAN_PROMPT,
                size=IMAGE_SIZE,
                quality="high",
                output_format="png",
                n=1,
            )
            return _decode(response)
        except ServiceError:
            raise
        except Exception as error:  # noqa: BLE001
            raise clients.provider_failure("product-image-clean", error) from error


__all__ = ["generate_studio_image", "clean_studio_image", "PROVIDER_FAILURE"]
