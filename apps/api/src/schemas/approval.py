"""Approval-related schemas."""
from pydantic import BaseModel
from .event import EventResponse


class ApprovalActionResponse(BaseModel):
    """Schema for approval action response."""
    success: bool
    message: str
    event: EventResponse
