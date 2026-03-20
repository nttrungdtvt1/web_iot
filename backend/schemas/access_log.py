"""schemas/access_log.py"""
from datetime import datetime
from datetime import date as DateType
from typing import Optional
from pydantic import BaseModel, Field


class AccessLogCreate(BaseModel):
    resident_id: Optional[int] = None
    method: str = "face"
    status: str = "unknown"
    image_url: Optional[str] = None
    notes: Optional[str] = None


class AccessLogResponse(BaseModel):
    id: int
    resident_id: Optional[int] = None
    resident_name: Optional[str] = None
    timestamp: datetime
    method: str
    status: str
    image_url: Optional[str] = None
    notes: Optional[str] = None
    model_config = {"from_attributes": True}


class AccessLogFilter(BaseModel):
    date: Optional[DateType] = None
    status: Optional[str] = None
    method: Optional[str] = None
    resident_id: Optional[int] = None
    page: int = Field(1, ge=1)
    limit: int = Field(20, ge=1, le=100)


class AccessLogListResponse(BaseModel):
    items: list[AccessLogResponse]
    total: int
    page: int
    limit: int
