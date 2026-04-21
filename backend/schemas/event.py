"""
backend/schemas/event.py

Pydantic schemas for system events from Raspberry Pi.

CHANGES v3:
  [FIX BUG #6] Đồng bộ tên sự kiện Live stream với Pi và Frontend:
  Sửa 'scan_started' thành 'face_scan_start'
  Sửa 'scan_ended' thành 'face_scan_end'
  để tránh lỗi 422 Unprocessable Entity.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from pydantic import BaseModel, field_validator


# All valid event types (including new scan stream events)
EVENT_TYPES = {
    # Core door events
    "motion_detected",
    "face_recognized",
    "face_unknown",
    "door_opened",
    "door_closed",
    "door_forced",
    "alarm_triggered",
    "alarm_stopped",
    "pin_correct",
    "pin_wrong",
    "system_online",
    "system_offline",
    # [NEW v3] Live scan stream events (ephemeral — not stored in DB)
    "scan_frame",
    "face_scan_start",  # ✅ Đã sửa từ scan_started
    "face_scan_end",    # ✅ Đã sửa từ scan_ended
}


class EventCreate(BaseModel):
    """
    Payload sent by Raspberry Pi to POST /api/events/.

    scan_frame:       type="scan_frame",      payload={"frame_b64": "...", "scan_state": "WATCH|STABILIZE|SCAN", "attempt": int}
    face_scan_start:  type="face_scan_start", payload={}
    face_scan_end:    type="face_scan_end",   payload={"reason": "recognized|denied|no_face|unstable", "name": str?, "confidence": float?}
    """
    type:      str
    payload:   Optional[dict[str, Any]] = None
    image_url: Optional[str]            = None
    timestamp: Optional[datetime]       = None

    @field_validator("type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        if v not in EVENT_TYPES:
            raise ValueError(
                f"Invalid event type: '{v}'. "
                f"Allowed: {sorted(EVENT_TYPES)}"
            )
        return v


class EventResponse(BaseModel):
    id:           int
    type:         str
    image_url:    Optional[str]
    payload_json: Optional[str]
    timestamp:    datetime

    model_config = {"from_attributes": True}


class EventListResponse(BaseModel):
    items: list[EventResponse]
    total: int
    page:  int
    limit: int
