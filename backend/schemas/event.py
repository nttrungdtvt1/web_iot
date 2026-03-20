"""
schemas/event.py
Pydantic schemas for SystemEvent request/response validation.
"""

from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field


class EventCreate(BaseModel):
    """
    Schema for events sent by Raspberry Pi to POST /events.
    The Pi sends this payload when something happens at the door.
    """
    type: str = Field(..., description="Event type: motion, face_recognized, alarm_triggered, etc.")
    image_url: Optional[str] = Field(None, description="Snapshot image URL")
    payload: Optional[dict[str, Any]] = Field(
        None,
        description="Additional event data as key-value pairs"
    )
    timestamp: Optional[datetime] = Field(
        None,
        description="Event timestamp from Pi (uses server time if not provided)"
    )


class EventResponse(BaseModel):
    """Schema for returning event data to dashboard clients."""
    id: int
    type: str
    payload_json: Optional[str] = None
    image_url: Optional[str] = None
    timestamp: datetime

    model_config = {"from_attributes": True}


class EventListResponse(BaseModel):
    """Paginated list of events."""
    items: list[EventResponse]
    total: int


class WebSocketMessage(BaseModel):
    """Schema for messages pushed over WebSocket to the dashboard."""
    event: str  # event type name
    data: dict[str, Any]  # event payload
    timestamp: datetime
