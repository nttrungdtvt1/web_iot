"""
models/access_log.py
Access log ORM model — records every door access attempt.
"""

from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
from core.database import Base


class AccessMethod(str, enum.Enum):
    """Method used to attempt access."""
    FACE = "face"
    PIN = "pin"
    RFID = "rfid"
    MANUAL = "manual"
    REMOTE = "remote"


class AccessStatus(str, enum.Enum):
    """Result of the access attempt."""
    GRANTED = "granted"
    DENIED = "denied"
    UNKNOWN = "unknown"


class AccessLog(Base):
    """
    Records each door access event.
    Links to a resident if identified, otherwise resident_id is NULL (unknown person).
    """

    __tablename__ = "access_logs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # Foreign key to residents — nullable for unknown persons
    resident_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("residents.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True
    )

    method: Mapped[str] = mapped_column(
        String(32),
        default=AccessMethod.FACE
    )

    status: Mapped[str] = mapped_column(
        String(32),
        default=AccessStatus.UNKNOWN,
        index=True
    )

    # Snapshot image URL from cloud storage
    image_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Extra details (e.g., confidence score for face recognition)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationship to resident
    resident: Mapped[Optional["Resident"]] = relationship(
        "Resident", back_populates="access_logs"
    )
