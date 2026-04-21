"""
models/resident.py
Resident ORM model — stores face images and encodings for face recognition.
"""

from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
if TYPE_CHECKING:
    from models.access_log import AccessLog
from sqlalchemy import String, Text, DateTime, Boolean
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

    # Cờ đồng bộ với Raspberry Pi.
    # True  = Pi đã có encoding mới nhất.
    # False = encoding vừa được cập nhật từ Dashboard, Pi cần tải lại.
    # ✅ Đã cập nhật thêm server_default="true" để Alembic chạy mượt mà
    pi_synced: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true", nullable=False)

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
