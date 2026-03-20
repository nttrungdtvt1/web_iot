"""
schemas/resident.py
Pydantic schemas for Resident request/response validation.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class ResidentBase(BaseModel):
    """Shared fields for resident creation and updates."""
    name: str = Field(..., min_length=1, max_length=128, description="Full name of resident")
    email: Optional[str] = Field(None, max_length=128)
    phone: Optional[str] = Field(None, max_length=32)


class ResidentCreate(ResidentBase):
    """Schema for creating a new resident."""
    pass


class ResidentUpdate(BaseModel):
    """Schema for updating a resident — all fields optional."""
    name: Optional[str] = Field(None, min_length=1, max_length=128)
    email: Optional[str] = Field(None, max_length=128)
    phone: Optional[str] = Field(None, max_length=32)
    is_active: Optional[bool] = None


class ResidentResponse(ResidentBase):
    """Schema for returning resident data to the client."""
    id: int
    face_image_url: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    has_face_encoding: bool = False

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_with_encoding(cls, resident) -> "ResidentResponse":
        """Create response with has_face_encoding flag derived from model."""
        data = cls.model_validate(resident)
        data.has_face_encoding = resident.face_encoding is not None
        return data


class ResidentListResponse(BaseModel):
    """Paginated list of residents."""
    items: list[ResidentResponse]
    total: int
    page: int
    limit: int
