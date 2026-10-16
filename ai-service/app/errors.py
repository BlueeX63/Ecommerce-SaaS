from __future__ import annotations


class ServiceError(Exception):
    """An error that is safe to show the caller: a status, a stable code and a generic message."""

    def __init__(self, status: int, code: str, message: str) -> None:
        super().__init__(message)
        self.status = status
        self.code = code
        self.message = message


NOT_CONFIGURED_TEXT = ServiceError(503, "NOT_CONFIGURED", "AI text features are not configured on this server.")
NOT_CONFIGURED_OPENAI = ServiceError(503, "NOT_CONFIGURED", "AI image and voice features are not configured on this server.")
PROVIDER_FAILURE = ServiceError(502, "PROVIDER_FAILURE", "The AI service is temporarily unavailable. Please try again.")
BUSY = ServiceError(503, "BUSY", "The AI service is busy. Please try again in a moment.")
