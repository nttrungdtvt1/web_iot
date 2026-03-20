"""
models/resident.py
Resident ORM model — stores face images and encodings for face recognition.
"""

from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Text, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from core.database import Base


class Resident(Base):
    """
    Represents a registered resident/authorized person.
    Stores face encoding for real-time recognition by the Raspberry Pi.
    """

    __tablename__ = "residents"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    email: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)

    # Cloud storage URL for the face photo
    face_image_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Public ID used to delete from cloud storage
    face_image_public_id: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)

    # JSON-serialized 128-dimensional face encoding vector (list of floats)
    face_encoding: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    # Relationship to access logs
    access_logs: Mapped[list["AccessLog"]] = relationship(
        "AccessLog", back_populates="resident", lazy="select"
    )
