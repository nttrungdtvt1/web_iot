"""
models/system_event.py
System event ORM model — stores all IoT events from Raspberry Pi.
"""

from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column
import enum
from core.database import Base


class EventType(str, enum.Enum):
    """Types of system events that can be received from Pi."""
    MOTION = "motion"
    FACE_RECOGNIZED = "face_recognized"
    FACE_UNKNOWN = "face_unknown"
    DOOR_OPENED = "door_opened"
    DOOR_CLOSED = "door_closed"
    DOOR_FORCED = "door_forced"
    ALARM_TRIGGERED = "alarm_triggered"
    ALARM_STOPPED = "alarm_stopped"
    PIN_CORRECT = "pin_correct"
    PIN_WRONG = "pin_wrong"
    SYSTEM_ONLINE = "system_online"
    SYSTEM_OFFLINE = "system_offline"


class SystemEvent(Base):
    """
    Stores all events pushed from Raspberry Pi.
    payload_json holds event-specific data as a JSON string.
    """

    __tablename__ = "system_events"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)

    # JSON string with event-specific payload data
    payload_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Optional snapshot image captured by Pi camera
    image_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True
    )
