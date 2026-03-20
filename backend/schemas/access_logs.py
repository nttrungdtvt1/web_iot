"""api/routers/access_logs.py"""
from datetime import datetime, timezone
from datetime import date as DateType
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

@router.get("", response_model=AccessLogListResponse)
async def list_access_logs(
    date_filter: Optional[DateType] = Query(None, alias="date"),
    status: Optional[str] = Query(None),
    method: Optional[str] = Query(None),
    resident_id: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        select(AccessLog)
        .options(selectinload(AccessLog.resident))
        .order_by(AccessLog.timestamp.desc())
    )
    if date_filter:
        start = datetime(date_filter.year, date_filter.month, date_filter.day, 0, 0, 0, tzinfo=timezone.utc)
        end   = datetime(date_filter.year, date_filter.month, date_filter.day, 23, 59, 59, tzinfo=timezone.utc)
        query = query.where(AccessLog.timestamp.between(start, end))
    if status:      query = query.where(AccessLog.status == status)
    if method:      query = query.where(AccessLog.method == method)
    if resident_id: query = query.where(AccessLog.resident_id == resident_id)

    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar_one()
    logs  = (await db.execute(query.offset((page - 1) * limit).limit(limit))).scalars().all()

    items = [
        AccessLogResponse(
            id=l.id,
            resident_id=l.resident_id,
            resident_name=l.resident.name if l.resident else None,
            timestamp=l.timestamp,
            method=l.method,
            status=l.status,
            image_url=l.image_url,
            notes=l.notes,
        )
        for l in logs
    ]
    return AccessLogListResponse(items=items, total=total, page=page, limit=limit)


@router.get("/stats")
async def get_access_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today = datetime.now(timezone.utc).date()
    today_start = datetime(today.year, today.month, today.day, 0, 0, 0, tzinfo=timezone.utc)

    today_rows = (await db.execute(
        select(AccessLog.status, func.count(AccessLog.id).label("c"))
        .where(AccessLog.timestamp >= today_start)
        .group_by(AccessLog.status)
    )).all()

    total_rows = (await db.execute(
        select(AccessLog.status, func.count(AccessLog.id).label("c"))
        .group_by(AccessLog.status)
    )).all()

    td = {r.status: r.c for r in today_rows}
    tt = {r.status: r.c for r in total_rows}

    return {
        "today": {"granted": td.get("granted", 0), "denied": td.get("denied", 0), "unknown": td.get("unknown", 0), "total": sum(td.values())},
        "total": {"granted": tt.get("granted", 0), "denied": tt.get("denied", 0), "unknown": tt.get("unknown", 0), "total": sum(tt.values())},
    }
