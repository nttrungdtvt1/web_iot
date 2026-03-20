"""api/routers/events.py"""

import hmac
import json
import logging
import os
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.routers.auth import get_current_user
from api.routers.websocket import broadcast_event
from core.database import get_db
from models.access_log import AccessLog, AccessStatus
from models.system_event import SystemEvent
from models.user import User
from schemas.event import EventCreate, EventListResponse, EventResponse
from services import notify_service

router = APIRouter(prefix="/events", tags=["Events"])
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Pi auth dependency
# ---------------------------------------------------------------------------

def verify_pi_key(
    x_pi_api_key: str = Header(..., alias="X-Pi-Api-Key"), # ✅ VÁ LỖI: Bắt buộc phải có Header này (không dùng Optional None nữa)
) -> str:
    """Xác thực API Key gửi từ Raspberry Pi bằng thuật toán chống Timing Attack."""
    expected = os.getenv("PI_API_KEY", "raspberry-pi-secret-key")

    # ✅ VÁ LỖI: So sánh an toàn. Cả 2 biến lúc này chắc chắn là string.
    if not hmac.compare_digest(x_pi_api_key.encode('utf-8'), expected.encode('utf-8')):
        raise HTTPException(status_code=403, detail="Invalid Pi API key")

    return x_pi_api_key


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("", response_model=EventResponse, status_code=201)
async def create_event(
    body: EventCreate,
    db: AsyncSession = Depends(get_db),
    api_key: str = Depends(verify_pi_key), # ✅ Đã gắn người gác cổng
):
    event = SystemEvent(
        type=body.type,
        image_url=body.image_url,
        payload_json=json.dumps(body.payload) if body.payload else None,
        timestamp=body.timestamp or datetime.now(timezone.utc),
    )
    db.add(event)
    await db.flush()  # lấy event.id trước khi commit

    # Tạo access log cho các sự kiện liên quan ra/vào
    if body.type in ("face_recognized", "face_unknown", "pin_correct", "pin_wrong"):
        method = "face" if "face" in body.type else "pin"
        status = (
            AccessStatus.GRANTED
            if body.type in ("face_recognized", "pin_correct")
            else AccessStatus.DENIED
        )

        # ✅ fix: ép kiểu resident_id về int, tránh string từ payload
        raw_rid = body.payload.get("resident_id") if body.payload else None
        try:
            resident_id = int(raw_rid) if raw_rid is not None else None
        except (ValueError, TypeError):
            resident_id = None

        db.add(AccessLog(
            resident_id=resident_id,
            method=method,
            status=status,
            image_url=body.image_url,
            image_public_id=body.payload.get("image_public_id") if body.payload else None,  # ✅ fix
            timestamp=datetime.now(timezone.utc),  # ✅ fix: luôn set timestamp
        ))

    await db.commit()
    await db.refresh(event)

    # ✅ fix: wrap broadcast trong try/except riêng — không để lỗi WS chặn notify
    try:
        await broadcast_event(
            event.type,
            {
                "id":        event.id,
                "type":      event.type,
                "image_url": event.image_url,
                "payload":   body.payload or {},
                "timestamp": event.timestamp.isoformat(),
            },
        )
    except Exception as e:
        logger.warning("broadcast_event failed: %s", e)

    # Gửi thông báo theo loại sự kiện
    try:
        if event.type == "face_unknown":
            await notify_service.alert_unknown_face(body.image_url)
        elif event.type == "door_forced":
            await notify_service.alert_door_forced(body.image_url)
        elif event.type == "alarm_triggered":
            await notify_service.alert_alarm_triggered(body.image_url)
    except Exception as e:
        logger.error("notify_service failed for event %s: %s", event.type, e)

    return event


# ✅ fix: thêm auth cho GET /latest
@router.get("/latest", response_model=list[EventResponse])
async def get_latest_events(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(SystemEvent)
        .order_by(SystemEvent.timestamp.desc())
        .limit(limit)
    )
    return result.scalars().all()


# ✅ fix: thêm auth cho GET /events
@router.get("", response_model=EventListResponse)
async def list_events(
    event_type: Optional[str] = Query(None, alias="type"),
    page:  int = Query(1,  ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(SystemEvent).order_by(SystemEvent.timestamp.desc())
    if event_type:
        query = query.where(SystemEvent.type == event_type)

    total = (
        await db.execute(
            select(func.count()).select_from(query.order_by(None).subquery())
        )
    ).scalar_one()

    events = (
        await db.execute(query.offset((page - 1) * limit).limit(limit))
    ).scalars().all()

    # ✅ fix: trả đủ page + limit cho client phân trang
    return EventListResponse(items=events, total=total, page=page, limit=limit)
