"""api/routers/access_logs.py"""

from datetime import date, datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from api.routers.auth import get_current_user
from core.database import get_db
from models.access_log import AccessLog
from models.user import User
from schemas.access_log import AccessLogResponse, AccessLogListResponse

router = APIRouter(prefix="/access-logs", tags=["Access Logs"])


# ✅ fix: /stats khai báo TRƯỚC để không bị shadow bởi dynamic route
@router.get("/stats")
async def get_access_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today = datetime.now(timezone.utc).date()
    today_start = datetime(today.year, today.month, today.day, tzinfo=timezone.utc)
    today_end   = today_start + timedelta(days=1)  # ✅ fix: dùng < thay vì 23:59:59

    today_rows = (
        await db.execute(
            select(AccessLog.status, func.count(AccessLog.id).label("c"))
            .where(
                AccessLog.timestamp >= today_start,
                AccessLog.timestamp <  today_end,   # ✅ fix
            )
            .group_by(AccessLog.status)
        )
    ).all()

    total_rows = (
        await db.execute(
            select(AccessLog.status, func.count(AccessLog.id).label("c"))
            .group_by(AccessLog.status)
        )
    ).all()

    td = {r.status: r.c for r in today_rows}
    tt = {r.status: r.c for r in total_rows}

    return {
        "today": {
            "granted": td.get("granted", 0),
            "denied":  td.get("denied",  0),
            "unknown": td.get("unknown", 0),
            "total":   sum(td.values()),
        },
        "total": {
            "granted": tt.get("granted", 0),
            "denied":  tt.get("denied",  0),
            "unknown": tt.get("unknown", 0),
            "total":   sum(tt.values()),
        },
    }


@router.get("", response_model=AccessLogListResponse)
async def list_access_logs(
    date_filter: Optional[date] = Query(None, alias="date"),
    status:      Optional[str] = Query(None),
    method:      Optional[str] = Query(None),
    resident_id: Optional[int] = Query(None),
    page:  int = Query(1,  ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # ✅ fix: build base query rồi apply filter — dùng lại cho cả count lẫn fetch
    base = (
        select(AccessLog)
        .options(selectinload(AccessLog.resident))
        .order_by(AccessLog.timestamp.desc())
    )

    if date_filter:
        start = datetime(
            date_filter.year, date_filter.month, date_filter.day,
            tzinfo=timezone.utc,
        )
        end = start + timedelta(days=1)          # ✅ fix: < ngày kế, không dùng 23:59:59
        base = base.where(
            AccessLog.timestamp >= start,
            AccessLog.timestamp <  end,
        )
    if status:      base = base.where(AccessLog.status      == status)
    if method:      base = base.where(AccessLog.method      == method)
    if resident_id: base = base.where(AccessLog.resident_id == resident_id)

    # ✅ fix: count đúng filtered_query (không phải toàn bảng)
    total = (
        await db.execute(
            select(func.count()).select_from(base.order_by(None).subquery())
        )
    ).scalar_one()

    logs = (
        await db.execute(base.offset((page - 1) * limit).limit(limit))
    ).scalars().all()

    items = [
        AccessLogResponse(
            id=log.id,
            resident_id=log.resident_id,
            resident_name=log.resident.name if log.resident else None,
            timestamp=log.timestamp,
            method=log.method,
            status=log.status,
            image_url=log.image_url,
            image_public_id=log.image_public_id,  # ✅ fix: thêm field mới
            notes=log.notes,
        )
        for log in logs
    ]

    return AccessLogListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
    )
