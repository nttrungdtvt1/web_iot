# # # # # # """api/routers/events.py"""

# # # # # # import hmac
# # # # # # import json
# # # # # # import logging
# # # # # # import os
# # # # # # from datetime import datetime, timezone
# # # # # # from typing import Optional

# # # # # # from fastapi import APIRouter, Depends, Header, HTTPException, Query
# # # # # # from sqlalchemy import func, select
# # # # # # from sqlalchemy.ext.asyncio import AsyncSession

# # # # # # from api.routers.auth import get_current_user
# # # # # # from api.routers.websocket import broadcast_event
# # # # # # from core.database import get_db
# # # # # # from models.access_log import AccessLog, AccessStatus
# # # # # # from models.system_event import SystemEvent
# # # # # # from models.user import User
# # # # # # from schemas.event import EventCreate, EventListResponse, EventResponse
# # # # # # from services import notify_service

# # # # # # router = APIRouter(prefix="/events", tags=["Events"])
# # # # # # logger = logging.getLogger(__name__)


# # # # # # # ---------------------------------------------------------------------------
# # # # # # # Pi auth dependency
# # # # # # # ---------------------------------------------------------------------------

# # # # # # def verify_pi_key(
# # # # # #     x_pi_api_key: str = Header(..., alias="X-Pi-Api-Key"), # ✅ VÁ LỖI: Bắt buộc phải có Header này (không dùng Optional None nữa)
# # # # # # ) -> str:
# # # # # #     """Xác thực API Key gửi từ Raspberry Pi bằng thuật toán chống Timing Attack."""
# # # # # #     expected = os.getenv("PI_API_KEY", "raspberry-pi-secret-key")

# # # # # #     # ✅ VÁ LỖI: So sánh an toàn. Cả 2 biến lúc này chắc chắn là string.
# # # # # #     if not hmac.compare_digest(x_pi_api_key.encode('utf-8'), expected.encode('utf-8')):
# # # # # #         raise HTTPException(status_code=403, detail="Invalid Pi API key")

# # # # # #     return x_pi_api_key


# # # # # # # ---------------------------------------------------------------------------
# # # # # # # Endpoints
# # # # # # # ---------------------------------------------------------------------------

# # # # # # @router.post("", response_model=EventResponse, status_code=201)
# # # # # # async def create_event(
# # # # # #     body: EventCreate,
# # # # # #     db: AsyncSession = Depends(get_db),
# # # # # #     api_key: str = Depends(verify_pi_key), # ✅ Đã gắn người gác cổng
# # # # # # ):
# # # # # #     event = SystemEvent(
# # # # # #         type=body.type,
# # # # # #         image_url=body.image_url,
# # # # # #         payload_json=json.dumps(body.payload) if body.payload else None,
# # # # # #         timestamp=body.timestamp or datetime.now(timezone.utc),
# # # # # #     )
# # # # # #     db.add(event)
# # # # # #     await db.flush()  # lấy event.id trước khi commit

# # # # # #     # Tạo access log cho các sự kiện liên quan ra/vào
# # # # # #     if body.type in ("face_recognized", "face_unknown", "pin_correct", "pin_wrong"):
# # # # # #         method = "face" if "face" in body.type else "pin"
# # # # # #         status = (
# # # # # #             AccessStatus.GRANTED
# # # # # #             if body.type in ("face_recognized", "pin_correct")
# # # # # #             else AccessStatus.DENIED
# # # # # #         )

# # # # # #         # ✅ fix: ép kiểu resident_id về int, tránh string từ payload
# # # # # #         raw_rid = body.payload.get("resident_id") if body.payload else None
# # # # # #         try:
# # # # # #             resident_id = int(raw_rid) if raw_rid is not None else None
# # # # # #         except (ValueError, TypeError):
# # # # # #             resident_id = None

# # # # # #         db.add(AccessLog(
# # # # # #             resident_id=resident_id,
# # # # # #             method=method,
# # # # # #             status=status,
# # # # # #             image_url=body.image_url,
# # # # # #             image_public_id=body.payload.get("image_public_id") if body.payload else None,  # ✅ fix
# # # # # #             timestamp=datetime.now(timezone.utc),  # ✅ fix: luôn set timestamp
# # # # # #         ))

# # # # # #     await db.commit()
# # # # # #     await db.refresh(event)

# # # # # #     # ✅ fix: wrap broadcast trong try/except riêng — không để lỗi WS chặn notify
# # # # # #     try:
# # # # # #         await broadcast_event(
# # # # # #             event.type,
# # # # # #             {
# # # # # #                 "id":        event.id,
# # # # # #                 "type":      event.type,
# # # # # #                 "image_url": event.image_url,
# # # # # #                 "payload":   body.payload or {},
# # # # # #                 "timestamp": event.timestamp.isoformat(),
# # # # # #             },
# # # # # #         )
# # # # # #     except Exception as e:
# # # # # #         logger.warning("broadcast_event failed: %s", e)

# # # # # #     # Gửi thông báo theo loại sự kiện
# # # # # #     try:
# # # # # #         if event.type == "face_unknown":
# # # # # #             await notify_service.alert_unknown_face(body.image_url)
# # # # # #         elif event.type == "door_forced":
# # # # # #             await notify_service.alert_door_forced(body.image_url)
# # # # # #         elif event.type == "alarm_triggered":
# # # # # #             await notify_service.alert_alarm_triggered(body.image_url)
# # # # # #     except Exception as e:
# # # # # #         logger.error("notify_service failed for event %s: %s", event.type, e)

# # # # # #     return event


# # # # # # # ✅ fix: thêm auth cho GET /latest
# # # # # # @router.get("/latest", response_model=list[EventResponse])
# # # # # # async def get_latest_events(
# # # # # #     limit: int = Query(10, ge=1, le=50),
# # # # # #     db: AsyncSession = Depends(get_db),
# # # # # #     current_user: User = Depends(get_current_user),
# # # # # # ):
# # # # # #     result = await db.execute(
# # # # # #         select(SystemEvent)
# # # # # #         .order_by(SystemEvent.timestamp.desc())
# # # # # #         .limit(limit)
# # # # # #     )
# # # # # #     return result.scalars().all()


# # # # # # # ✅ fix: thêm auth cho GET /events
# # # # # # @router.get("", response_model=EventListResponse)
# # # # # # async def list_events(
# # # # # #     event_type: Optional[str] = Query(None, alias="type"),
# # # # # #     page:  int = Query(1,  ge=1),
# # # # # #     limit: int = Query(20, ge=1, le=100),
# # # # # #     db: AsyncSession = Depends(get_db),
# # # # # #     current_user: User = Depends(get_current_user),
# # # # # # ):
# # # # # #     query = select(SystemEvent).order_by(SystemEvent.timestamp.desc())
# # # # # #     if event_type:
# # # # # #         query = query.where(SystemEvent.type == event_type)

# # # # # #     total = (
# # # # # #         await db.execute(
# # # # # #             select(func.count()).select_from(query.order_by(None).subquery())
# # # # # #         )
# # # # # #     ).scalar_one()

# # # # # #     events = (
# # # # # #         await db.execute(query.offset((page - 1) * limit).limit(limit))
# # # # # #     ).scalars().all()

# # # # # #     # ✅ fix: trả đủ page + limit cho client phân trang
# # # # # #     return EventListResponse(items=events, total=total, page=page, limit=limit)

# # # # # """api/routers/events.py

# # # # # CHANGES v3:
# # # # #   [FIX-LIVE-STREAM] Handle scan_frame, scan_started, scan_ended event types:
# # # # #     - scan_frame: broadcast directly to WS (NOT stored in DB — high frequency)
# # # # #     - scan_started: broadcast, NOT stored
# # # # #     - scan_ended:  broadcast, NOT stored (result will come via face_recognized/face_unknown)

# # # # #   All other event types behave exactly as before.
# # # # # """

# # # # # import hmac
# # # # # import json
# # # # # import logging
# # # # # import os
# # # # # from datetime import datetime, timezone
# # # # # from typing import Optional

# # # # # from fastapi import APIRouter, Depends, Header, HTTPException, Query
# # # # # from sqlalchemy import func, select
# # # # # from sqlalchemy.ext.asyncio import AsyncSession

# # # # # from api.routers.auth import get_current_user
# # # # # from api.routers.websocket import broadcast_event
# # # # # from core.database import get_db
# # # # # from models.access_log import AccessLog, AccessStatus
# # # # # from models.system_event import SystemEvent
# # # # # from models.user import User
# # # # # from schemas.event import EventCreate, EventListResponse, EventResponse
# # # # # from services import notify_service

# # # # # router = APIRouter(prefix="/events", tags=["Events"])
# # # # # logger = logging.getLogger(__name__)

# # # # # # [FIX-LIVE-STREAM] Events that should NOT be persisted to DB (high-frequency streaming)
# # # # # _EPHEMERAL_EVENTS = {"scan_frame", "scan_started", "scan_ended"}


# # # # # def verify_pi_key(
# # # # #     x_pi_api_key: str = Header(..., alias="X-Pi-Api-Key"),
# # # # # ) -> str:
# # # # #     expected = os.getenv("PI_API_KEY", "raspberry-pi-secret-key")
# # # # #     if not hmac.compare_digest(x_pi_api_key.encode("utf-8"), expected.encode("utf-8")):
# # # # #         raise HTTPException(status_code=403, detail="Invalid Pi API key")
# # # # #     return x_pi_api_key


# # # # # @router.post("", response_model=EventResponse, status_code=201)
# # # # # async def create_event(
# # # # #     body: EventCreate,
# # # # #     db: AsyncSession = Depends(get_db),
# # # # #     api_key: str = Depends(verify_pi_key),
# # # # # ):
# # # # #     # [FIX-LIVE-STREAM] Ephemeral events: broadcast only, skip DB write
# # # # #     if body.type in _EPHEMERAL_EVENTS:
# # # # #         try:
# # # # #             await broadcast_event(
# # # # #                 body.type,
# # # # #                 body.payload or {},
# # # # #             )
# # # # #         except Exception as e:
# # # # #             logger.warning("broadcast ephemeral event failed: %s", e)

# # # # #         # Return minimal response without DB touch
# # # # #         return EventResponse(
# # # # #             id=0,
# # # # #             type=body.type,
# # # # #             image_url=None,
# # # # #             payload_json=None,
# # # # #             timestamp=body.timestamp or datetime.now(timezone.utc),
# # # # #         )

# # # # #     # Normal event: persist to DB
# # # # #     event = SystemEvent(
# # # # #         type=body.type,
# # # # #         image_url=body.image_url,
# # # # #         payload_json=json.dumps(body.payload) if body.payload else None,
# # # # #         timestamp=body.timestamp or datetime.now(timezone.utc),
# # # # #     )
# # # # #     db.add(event)
# # # # #     await db.flush()

# # # # #     # Create access log for door-related events
# # # # #     if body.type in ("face_recognized", "face_unknown", "pin_correct", "pin_wrong"):
# # # # #         method = "face" if "face" in body.type else "pin"
# # # # #         status = (
# # # # #             AccessStatus.GRANTED
# # # # #             if body.type in ("face_recognized", "pin_correct")
# # # # #             else AccessStatus.DENIED
# # # # #         )
# # # # #         raw_rid = body.payload.get("resident_id") if body.payload else None
# # # # #         try:
# # # # #             resident_id = int(raw_rid) if raw_rid is not None else None
# # # # #         except (ValueError, TypeError):
# # # # #             resident_id = None

# # # # #         db.add(AccessLog(
# # # # #             resident_id=resident_id,
# # # # #             method=method,
# # # # #             status=status,
# # # # #             image_url=body.image_url,
# # # # #             image_public_id=body.payload.get("image_public_id") if body.payload else None,
# # # # #             timestamp=datetime.now(timezone.utc),
# # # # #         ))

# # # # #     await db.commit()
# # # # #     await db.refresh(event)

# # # # #     # Broadcast to WebSocket clients
# # # # #     try:
# # # # #         await broadcast_event(
# # # # #             event.type,
# # # # #             {
# # # # #                 "id":        event.id,
# # # # #                 "type":      event.type,
# # # # #                 "image_url": event.image_url,
# # # # #                 "payload":   body.payload or {},
# # # # #                 "timestamp": event.timestamp.isoformat(),
# # # # #             },
# # # # #         )
# # # # #     except Exception as e:
# # # # #         logger.warning("broadcast_event failed: %s", e)

# # # # #     # Push notifications for security events
# # # # #     try:
# # # # #         if event.type == "face_unknown":
# # # # #             await notify_service.alert_unknown_face(body.image_url)
# # # # #         elif event.type == "door_forced":
# # # # #             await notify_service.alert_door_forced(body.image_url)
# # # # #         elif event.type == "alarm_triggered":
# # # # #             await notify_service.alert_alarm_triggered(body.image_url)
# # # # #     except Exception as e:
# # # # #         logger.error("notify_service failed for event %s: %s", event.type, e)

# # # # #     return event


# # # # # @router.get("/latest", response_model=list[EventResponse])
# # # # # async def get_latest_events(
# # # # #     limit: int = Query(10, ge=1, le=50),
# # # # #     db: AsyncSession = Depends(get_db),
# # # # #     current_user: User = Depends(get_current_user),
# # # # # ):
# # # # #     result = await db.execute(
# # # # #         select(SystemEvent)
# # # # #         .order_by(SystemEvent.timestamp.desc())
# # # # #         .limit(limit)
# # # # #     )
# # # # #     return result.scalars().all()


# # # # # @router.get("", response_model=EventListResponse)
# # # # # async def list_events(
# # # # #     event_type: Optional[str] = Query(None, alias="type"),
# # # # #     page:  int = Query(1,  ge=1),
# # # # #     limit: int = Query(20, ge=1, le=100),
# # # # #     db: AsyncSession = Depends(get_db),
# # # # #     current_user: User = Depends(get_current_user),
# # # # # ):
# # # # #     query = select(SystemEvent).order_by(SystemEvent.timestamp.desc())
# # # # #     if event_type:
# # # # #         query = query.where(SystemEvent.type == event_type)

# # # # #     total = (
# # # # #         await db.execute(
# # # # #             select(func.count()).select_from(query.order_by(None).subquery())
# # # # #         )
# # # # #     ).scalar_one()

# # # # #     result = await db.execute(
# # # # #         query.offset((page - 1) * limit).limit(limit)
# # # # #     )
# # # # #     events = result.scalars().all()

# # # # #     return EventListResponse(items=events, total=total, page=page, limit=limit)


# # # # """api/routers/events.py

# # # # CHANGES v4:
# # # #   [FIX-LIVE-STREAM] Xử lý sự kiện ngầm cho Camera
# # # #   [FIX-UNKNOWN-NAME] Tự động tra cứu Resident ID từ tên người (Pi gửi lên) để hiển thị đúng tên Chủ nhà.
# # # #   [FIX-ACCESS-LOG] Hỗ trợ lưu log cho cả chuẩn cũ và chuẩn "access" mới.
# # # # """

# # # # import hmac
# # # # import json
# # # # import logging
# # # # import os
# # # # from datetime import datetime, timezone
# # # # from typing import Optional

# # # # from fastapi import APIRouter, Depends, Header, HTTPException, Query
# # # # from sqlalchemy import func, select
# # # # from sqlalchemy.ext.asyncio import AsyncSession

# # # # from api.routers.auth import get_current_user
# # # # from api.routers.websocket import broadcast_event
# # # # from core.database import get_db
# # # # from models.access_log import AccessLog, AccessStatus
# # # # from models.system_event import SystemEvent
# # # # from models.user import User
# # # # from models.resident import Resident  # ✅ ĐÃ THÊM: Import bảng Resident để tra cứu tên
# # # # from schemas.event import EventCreate, EventListResponse, EventResponse
# # # # from services import notify_service

# # # # router = APIRouter(prefix="/events", tags=["Events"])
# # # # logger = logging.getLogger(__name__)

# # # # # Events that should NOT be persisted to DB (high-frequency streaming)
# # # # _EPHEMERAL_EVENTS = {"scan_frame", "scan_started", "scan_ended"}


# # # # def verify_pi_key(
# # # #     x_pi_api_key: str = Header(..., alias="X-Pi-Api-Key"),
# # # # ) -> str:
# # # #     expected = os.getenv("PI_API_KEY", "raspberry-pi-secret-key")
# # # #     if not hmac.compare_digest(x_pi_api_key.encode("utf-8"), expected.encode("utf-8")):
# # # #         raise HTTPException(status_code=403, detail="Invalid Pi API key")
# # # #     return x_pi_api_key


# # # # @router.post("", response_model=EventResponse, status_code=201)
# # # # async def create_event(
# # # #     body: EventCreate,
# # # #     db: AsyncSession = Depends(get_db),
# # # #     api_key: str = Depends(verify_pi_key),
# # # # ):
# # # #     # 1. Ephemeral events: broadcast only, skip DB write
# # # #     if body.type in _EPHEMERAL_EVENTS:
# # # #         try:
# # # #             await broadcast_event(
# # # #                 body.type,
# # # #                 body.payload or {},
# # # #             )
# # # #         except Exception as e:
# # # #             logger.warning("broadcast ephemeral event failed: %s", e)

# # # #         return EventResponse(
# # # #             id=0,
# # # #             type=body.type,
# # # #             image_url=None,
# # # #             payload_json=None,
# # # #             timestamp=body.timestamp or datetime.now(timezone.utc),
# # # #         )

# # # #     # ✅ ĐÃ FIX: Lấy image_url thực tế (Do Pi có thể bọc nó bên trong payload)
# # # #     actual_image_url = body.image_url or (body.payload.get("image_url") if body.payload else None)

# # # #     # 2. Normal event: persist to DB
# # # #     event = SystemEvent(
# # # #         type=body.type,
# # # #         image_url=actual_image_url,
# # # #         payload_json=json.dumps(body.payload) if body.payload else None,
# # # #         timestamp=body.timestamp or datetime.now(timezone.utc),
# # # #     )
# # # #     db.add(event)
# # # #     await db.flush()

# # # #     # 3. Create access log (Hỗ trợ cả chuẩn cũ và chuẩn "access")
# # # #     is_access_event = body.type in ("face_recognized", "face_unknown", "pin_correct", "pin_wrong", "access")

# # # #     if is_access_event:
# # # #         # Xác định phương thức và trạng thái
# # # #         if body.type == "access":
# # # #             method = body.payload.get("method", "face") if body.payload else "face"
# # # #             success = body.payload.get("success", False) if body.payload else False
# # # #             status = AccessStatus.GRANTED if success else AccessStatus.DENIED
# # # #         else:
# # # #             method = "face" if "face" in body.type else "pin"
# # # #             status = (
# # # #                 AccessStatus.GRANTED
# # # #                 if body.type in ("face_recognized", "pin_correct")
# # # #                 else AccessStatus.DENIED
# # # #             )

# # # #         # ✅ TỰ ĐỘNG TRA CỨU ID TỪ TÊN (Mấu chốt giải quyết lỗi "Không xác định")
# # # #         resident_id = None
# # # #         if body.payload:
# # # #             raw_rid = body.payload.get("resident_id")
# # # #             if raw_rid is not None:
# # # #                 try:
# # # #                     resident_id = int(raw_rid)
# # # #                 except (ValueError, TypeError):
# # # #                     pass
            
# # # #             # Nếu Pi gửi lên Tên người (ví dụ: Trung), tự động chui vào DB lấy ID ra!
# # # #             if resident_id is None:
# # # #                 name_from_pi = body.payload.get("name")
# # # #                 if name_from_pi and str(name_from_pi).lower() not in ("unknown", "none", "", "khách lạ"):
# # # #                     stmt = select(Resident.id).where(Resident.name == name_from_pi).limit(1)
# # # #                     res = await db.execute(stmt)
# # # #                     resident_id = res.scalar_one_or_none()

# # # #         db.add(AccessLog(
# # # #             resident_id=resident_id,
# # # #             method=method,
# # # #             status=status,
# # # #             image_url=actual_image_url,
# # # #             image_public_id=body.payload.get("image_public_id") if body.payload else None,
# # # #             timestamp=datetime.now(timezone.utc),
# # # #         ))

# # # #     await db.commit()
# # # #     await db.refresh(event)

# # # #     # 4. Broadcast to WebSocket clients
# # # #     try:
# # # #         await broadcast_event(
# # # #             event.type,
# # # #             {
# # # #                 "id":        event.id,
# # # #                 "type":      event.type,
# # # #                 "image_url": actual_image_url,
# # # #                 "payload":   body.payload or {},
# # # #                 "timestamp": event.timestamp.isoformat(),
# # # #             },
# # # #         )
# # # #     except Exception as e:
# # # #         logger.warning("broadcast_event failed: %s", e)

# # # #     # 5. Push notifications for security events
# # # #     try:
# # # #         is_unknown = event.type == "face_unknown" or (event.type == "access" and body.payload and not body.payload.get("success"))
        
# # # #         if is_unknown:
# # # #             await notify_service.alert_unknown_face(actual_image_url)
# # # #         elif event.type == "door_forced":
# # # #             await notify_service.alert_door_forced(actual_image_url)
# # # #         elif event.type == "alarm_triggered":
# # # #             await notify_service.alert_alarm_triggered(actual_image_url)
# # # #     except Exception as e:
# # # #         logger.error("notify_service failed for event %s: %s", event.type, e)

# # # #     return event


# # # # @router.get("/latest", response_model=list[EventResponse])
# # # # async def get_latest_events(
# # # #     limit: int = Query(10, ge=1, le=50),
# # # #     db: AsyncSession = Depends(get_db),
# # # #     current_user: User = Depends(get_current_user),
# # # # ):
# # # #     result = await db.execute(
# # # #         select(SystemEvent)
# # # #         .order_by(SystemEvent.timestamp.desc())
# # # #         .limit(limit)
# # # #     )
# # # #     return result.scalars().all()


# # # # @router.get("", response_model=EventListResponse)
# # # # async def list_events(
# # # #     event_type: Optional[str] = Query(None, alias="type"),
# # # #     page:  int = Query(1,  ge=1),
# # # #     limit: int = Query(20, ge=1, le=100),
# # # #     db: AsyncSession = Depends(get_db),
# # # #     current_user: User = Depends(get_current_user),
# # # # ):
# # # #     query = select(SystemEvent).order_by(SystemEvent.timestamp.desc())
# # # #     if event_type:
# # # #         query = query.where(SystemEvent.type == event_type)

# # # #     total = (
# # # #         await db.execute(
# # # #             select(func.count()).select_from(query.order_by(None).subquery())
# # # #         )
# # # #     ).scalar_one()

# # # #     result = await db.execute(
# # # #         query.offset((page - 1) * limit).limit(limit)
# # # #     )
# # # #     events = result.scalars().all()

# # # #     return EventListResponse(items=events, total=total, page=page, limit=limit)


# # # """api/routers/events.py

# # # CHANGES v5:
# # #   [FIX-DB-MATCHING] So sánh tên KHÔNG phân biệt hoa/thường (Case-insensitive) để tìm Resident ID. Giải quyết dứt điểm lỗi "Không xác định".
# # # """

# # # import hmac
# # # import json
# # # import logging
# # # import os
# # # from datetime import datetime, timezone
# # # from typing import Optional

# # # from fastapi import APIRouter, Depends, Header, HTTPException, Query
# # # from sqlalchemy import func, select
# # # from sqlalchemy.ext.asyncio import AsyncSession

# # # from api.routers.auth import get_current_user
# # # from api.routers.websocket import broadcast_event
# # # from core.database import get_db
# # # from models.access_log import AccessLog, AccessStatus
# # # from models.system_event import SystemEvent
# # # from models.user import User
# # # from models.resident import Resident
# # # from schemas.event import EventCreate, EventListResponse, EventResponse
# # # from services import notify_service

# # # router = APIRouter(prefix="/events", tags=["Events"])
# # # logger = logging.getLogger(__name__)

# # # _EPHEMERAL_EVENTS = {"scan_frame", "scan_started", "scan_ended"}

# # # def verify_pi_key(
# # #     x_pi_api_key: str = Header(..., alias="X-Pi-Api-Key"),
# # # ) -> str:
# # #     expected = os.getenv("PI_API_KEY", "raspberry-pi-secret-key")
# # #     if not hmac.compare_digest(x_pi_api_key.encode("utf-8"), expected.encode("utf-8")):
# # #         raise HTTPException(status_code=403, detail="Invalid Pi API key")
# # #     return x_pi_api_key

# # # @router.post("", response_model=EventResponse, status_code=201)
# # # async def create_event(
# # #     body: EventCreate,
# # #     db: AsyncSession = Depends(get_db),
# # #     api_key: str = Depends(verify_pi_key),
# # # ):
# # #     if body.type in _EPHEMERAL_EVENTS:
# # #         try:
# # #             await broadcast_event(body.type, body.payload or {})
# # #         except Exception as e:
# # #             logger.warning("broadcast ephemeral event failed: %s", e)

# # #         return EventResponse(
# # #             id=0, type=body.type, image_url=None, payload_json=None,
# # #             timestamp=body.timestamp or datetime.now(timezone.utc),
# # #         )

# # #     actual_image_url = body.image_url or (body.payload.get("image_url") if body.payload else None)

# # #     event = SystemEvent(
# # #         type=body.type,
# # #         image_url=actual_image_url,
# # #         payload_json=json.dumps(body.payload) if body.payload else None,
# # #         timestamp=body.timestamp or datetime.now(timezone.utc),
# # #     )
# # #     db.add(event)
# # #     await db.flush()

# # #     is_access_event = body.type in ("face_recognized", "face_unknown", "pin_correct", "pin_wrong", "access")

# # #     if is_access_event:
# # #         if body.type == "access":
# # #             method = body.payload.get("method", "face") if body.payload else "face"
# # #             success = body.payload.get("success", False) if body.payload else False
# # #             status = AccessStatus.GRANTED if success else AccessStatus.DENIED
# # #         else:
# # #             method = "face" if "face" in body.type else "pin"
# # #             status = AccessStatus.GRANTED if body.type in ("face_recognized", "pin_correct") else AccessStatus.DENIED

# # #         resident_id = None
# # #         if body.payload:
# # #             raw_rid = body.payload.get("resident_id")
# # #             if raw_rid is not None:
# # #                 try:
# # #                     resident_id = int(raw_rid)
# # #                 except (ValueError, TypeError):
# # #                     pass
            
# # #             # ✅ ĐÃ FIX: Ép cả Database và Tên thành CHỮ THƯỜNG (lower) để so sánh.
# # #             # Tránh lỗi "Trung" != "trung"
# # #             if resident_id is None:
# # #                 name_from_pi = body.payload.get("name")
# # #                 if name_from_pi and str(name_from_pi).lower() not in ("unknown", "none", "", "khách lạ"):
# # #                     stmt = select(Resident.id).where(func.lower(Resident.name) == str(name_from_pi).lower()).limit(1)
# # #                     res = await db.execute(stmt)
# # #                     resident_id = res.scalar_one_or_none()

# # #         db.add(AccessLog(
# # #             resident_id=resident_id,
# # #             method=method,
# # #             status=status,
# # #             image_url=actual_image_url,
# # #             image_public_id=body.payload.get("image_public_id") if body.payload else None,
# # #             timestamp=datetime.now(timezone.utc),
# # #         ))

# # #     await db.commit()
# # #     await db.refresh(event)

# # #     try:
# # #         await broadcast_event(
# # #             event.type,
# # #             {
# # #                 "id":        event.id,
# # #                 "type":      event.type,
# # #                 "image_url": actual_image_url,
# # #                 "payload":   body.payload or {},
# # #                 "timestamp": event.timestamp.isoformat(),
# # #             },
# # #         )
# # #     except Exception as e:
# # #         logger.warning("broadcast_event failed: %s", e)

# # #     try:
# # #         is_unknown = event.type == "face_unknown" or (event.type == "access" and body.payload and not body.payload.get("success"))
# # #         if is_unknown:
# # #             await notify_service.alert_unknown_face(actual_image_url)
# # #         elif event.type == "door_forced":
# # #             await notify_service.alert_door_forced(actual_image_url)
# # #         elif event.type == "alarm_triggered":
# # #             await notify_service.alert_alarm_triggered(actual_image_url)
# # #     except Exception as e:
# # #         logger.error("notify_service failed for event %s: %s", event.type, e)

# # #     return event

# # # @router.get("/latest", response_model=list[EventResponse])
# # # async def get_latest_events(
# # #     limit: int = Query(10, ge=1, le=50),
# # #     db: AsyncSession = Depends(get_db),
# # #     current_user: User = Depends(get_current_user),
# # # ):
# # #     result = await db.execute(
# # #         select(SystemEvent).order_by(SystemEvent.timestamp.desc()).limit(limit)
# # #     )
# # #     return result.scalars().all()

# # # @router.get("", response_model=EventListResponse)
# # # async def list_events(
# # #     event_type: Optional[str] = Query(None, alias="type"),
# # #     page:  int = Query(1,  ge=1),
# # #     limit: int = Query(20, ge=1, le=100),
# # #     db: AsyncSession = Depends(get_db),
# # #     current_user: User = Depends(get_current_user),
# # # ):
# # #     query = select(SystemEvent).order_by(SystemEvent.timestamp.desc())
# # #     if event_type:
# # #         query = query.where(SystemEvent.type == event_type)

# # #     total = (await db.execute(select(func.count()).select_from(query.order_by(None).subquery()))).scalar_one()
# # #     result = await db.execute(query.offset((page - 1) * limit).limit(limit))
# # #     events = result.scalars().all()

# # #     return EventListResponse(items=events, total=total, page=page, limit=limit)


# # """api/routers/events.py

# # CHANGES v6:
# #   [FIX-NAME-ID-SPLIT] Xử lý chuỗi "name__idX" do Pi gửi lên (ví dụ "trung__id1"). 
# #   Tự động tách lấy resident_id = 1 để ghi log chính xác, và dọn dẹp tên gửi về Web.
# # """

# # import hmac
# # import json
# # import logging
# # import os
# # from datetime import datetime, timezone
# # from typing import Optional

# # from fastapi import APIRouter, Depends, Header, HTTPException, Query
# # from sqlalchemy import func, select
# # from sqlalchemy.ext.asyncio import AsyncSession

# # from api.routers.auth import get_current_user
# # from api.routers.websocket import broadcast_event
# # from core.database import get_db
# # from models.access_log import AccessLog, AccessStatus
# # from models.system_event import SystemEvent
# # from models.user import User
# # from models.resident import Resident
# # from schemas.event import EventCreate, EventListResponse, EventResponse
# # from services import notify_service

# # router = APIRouter(prefix="/events", tags=["Events"])
# # logger = logging.getLogger(__name__)

# # _EPHEMERAL_EVENTS = {"scan_frame", "scan_started", "scan_ended"}

# # def verify_pi_key(
# #     x_pi_api_key: str = Header(..., alias="X-Pi-Api-Key"),
# # ) -> str:
# #     expected = os.getenv("PI_API_KEY", "raspberry-pi-secret-key")
# #     if not hmac.compare_digest(x_pi_api_key.encode("utf-8"), expected.encode("utf-8")):
# #         raise HTTPException(status_code=403, detail="Invalid Pi API key")
# #     return x_pi_api_key

# # @router.post("", response_model=EventResponse, status_code=201)
# # async def create_event(
# #     body: EventCreate,
# #     db: AsyncSession = Depends(get_db),
# #     api_key: str = Depends(verify_pi_key),
# # ):
# #     if body.type in _EPHEMERAL_EVENTS:
# #         try:
# #             await broadcast_event(body.type, body.payload or {})
# #         except Exception as e:
# #             logger.warning("broadcast ephemeral event failed: %s", e)

# #         return EventResponse(
# #             id=0, type=body.type, image_url=None, payload_json=None,
# #             timestamp=body.timestamp or datetime.now(timezone.utc),
# #         )

# #     actual_image_url = body.image_url or (body.payload.get("image_url") if body.payload else None)

# #     event = SystemEvent(
# #         type=body.type,
# #         image_url=actual_image_url,
# #         payload_json=json.dumps(body.payload) if body.payload else None,
# #         timestamp=body.timestamp or datetime.now(timezone.utc),
# #     )
# #     db.add(event)
# #     await db.flush()

# #     is_access_event = body.type in ("face_recognized", "face_unknown", "pin_correct", "pin_wrong", "access")

# #     if is_access_event:
# #         if body.type == "access":
# #             method = body.payload.get("method", "face") if body.payload else "face"
# #             success = body.payload.get("success", False) if body.payload else False
# #             status = AccessStatus.GRANTED if success else AccessStatus.DENIED
# #         else:
# #             method = "face" if "face" in body.type else "pin"
# #             status = AccessStatus.GRANTED if body.type in ("face_recognized", "pin_correct") else AccessStatus.DENIED

# #         resident_id = None
# #         if body.payload:
# #             raw_rid = body.payload.get("resident_id")
# #             if raw_rid is not None:
# #                 try:
# #                     resident_id = int(raw_rid)
# #                 except (ValueError, TypeError):
# #                     pass
            
# #             name_from_pi = body.payload.get("name")
# #             if name_from_pi and isinstance(name_from_pi, str):
# #                 # ✅ THUẬT TOÁN BÓC TÁCH: "trung__id1" -> Tên: "trung", ID: 1
# #                 if "__id" in name_from_pi:
# #                     parts = name_from_pi.split("__id")
# #                     if len(parts) == 2 and parts[1].isdigit():
# #                         resident_id = int(parts[1])  # Lấy trực tiếp ID, siêu chính xác!
                        
# #                         # Dọn dẹp lại cái tên cho sạch đẹp để gửi qua Web Socket
# #                         clean_name = parts[0].replace("_", " ").title()
# #                         body.payload["name"] = clean_name
# #                         name_from_pi = clean_name

# #                 # Fallback: Dò bằng chữ nếu không có cái đuôi __id
# #                 if resident_id is None and name_from_pi.lower() not in ("unknown", "none", "", "khách lạ"):
# #                     stmt = select(Resident.id).where(func.lower(Resident.name) == name_from_pi.lower()).limit(1)
# #                     res = await db.execute(stmt)
# #                     resident_id = res.scalar_one_or_none()

# #         db.add(AccessLog(
# #             resident_id=resident_id,
# #             method=method,
# #             status=status,
# #             image_url=actual_image_url,
# #             image_public_id=body.payload.get("image_public_id") if body.payload else None,
# #             timestamp=datetime.now(timezone.utc),
# #         ))

# #     await db.commit()
# #     await db.refresh(event)

# #     try:
# #         await broadcast_event(
# #             event.type,
# #             {
# #                 "id":        event.id,
# #                 "type":      event.type,
# #                 "image_url": actual_image_url,
# #                 "payload":   body.payload or {},
# #                 "timestamp": event.timestamp.isoformat(),
# #             },
# #         )
# #     except Exception as e:
# #         logger.warning("broadcast_event failed: %s", e)

# #     try:
# #         is_unknown = event.type == "face_unknown" or (event.type == "access" and body.payload and not body.payload.get("success"))
# #         if is_unknown:
# #             await notify_service.alert_unknown_face(actual_image_url)
# #         elif event.type == "door_forced":
# #             await notify_service.alert_door_forced(actual_image_url)
# #         elif event.type == "alarm_triggered":
# #             await notify_service.alert_alarm_triggered(actual_image_url)
# #     except Exception as e:
# #         logger.error("notify_service failed for event %s: %s", event.type, e)

# #     return event

# # @router.get("/latest", response_model=list[EventResponse])
# # async def get_latest_events(
# #     limit: int = Query(10, ge=1, le=50),
# #     db: AsyncSession = Depends(get_db),
# #     current_user: User = Depends(get_current_user),
# # ):
# #     result = await db.execute(
# #         select(SystemEvent).order_by(SystemEvent.timestamp.desc()).limit(limit)
# #     )
# #     return result.scalars().all()

# # @router.get("", response_model=EventListResponse)
# # async def list_events(
# #     event_type: Optional[str] = Query(None, alias="type"),
# #     page:  int = Query(1,  ge=1),
# #     limit: int = Query(20, ge=1, le=100),
# #     db: AsyncSession = Depends(get_db),
# #     current_user: User = Depends(get_current_user),
# # ):
# #     query = select(SystemEvent).order_by(SystemEvent.timestamp.desc())
# #     if event_type:
# #         query = query.where(SystemEvent.type == event_type)

# #     total = (await db.execute(select(func.count()).select_from(query.order_by(None).subquery()))).scalar_one()
# #     result = await db.execute(query.offset((page - 1) * limit).limit(limit))
# #     events = result.scalars().all()

# #     return EventListResponse(items=events, total=total, page=page, limit=limit)



# """api/routers/events.py

# CHANGES v7:
#   [FIX-GHOST-LOGS] Chỉ lưu Lịch sử ra vào (AccessLog) khi nhận được sự kiện "access" (đã đính kèm ảnh Cloudinary).
#   Ngăn chặn việc lưu log ảo (không có ảnh) khi mới chỉ nhận được "face_recognized".
# """

# import hmac
# import json
# import logging
# import os
# from datetime import datetime, timezone
# from typing import Optional

# from fastapi import APIRouter, Depends, Header, HTTPException, Query
# from sqlalchemy import func, select
# from sqlalchemy.ext.asyncio import AsyncSession

# from api.routers.auth import get_current_user
# from api.routers.websocket import broadcast_event
# from core.database import get_db
# from models.access_log import AccessLog, AccessStatus
# from models.system_event import SystemEvent
# from models.user import User
# from models.resident import Resident
# from schemas.event import EventCreate, EventListResponse, EventResponse
# from services import notify_service

# router = APIRouter(prefix="/events", tags=["Events"])
# logger = logging.getLogger(__name__)

# _EPHEMERAL_EVENTS = {"scan_frame", "scan_started", "scan_ended"}

# def verify_pi_key(
#     x_pi_api_key: str = Header(..., alias="X-Pi-Api-Key"),
# ) -> str:
#     expected = os.getenv("PI_API_KEY", "raspberry-pi-secret-key")
#     if not hmac.compare_digest(x_pi_api_key.encode("utf-8"), expected.encode("utf-8")):
#         raise HTTPException(status_code=403, detail="Invalid Pi API key")
#     return x_pi_api_key

# @router.post("", response_model=EventResponse, status_code=201)
# async def create_event(
#     body: EventCreate,
#     db: AsyncSession = Depends(get_db),
#     api_key: str = Depends(verify_pi_key),
# ):
#     if body.type in _EPHEMERAL_EVENTS:
#         try:
#             await broadcast_event(body.type, body.payload or {})
#         except Exception as e:
#             pass
#         return EventResponse(
#             id=0, type=body.type, image_url=None, payload_json=None,
#             timestamp=body.timestamp or datetime.now(timezone.utc),
#         )

#     actual_image_url = body.image_url or (body.payload.get("image_url") if body.payload else None)

#     event = SystemEvent(
#         type=body.type,
#         image_url=actual_image_url,
#         payload_json=json.dumps(body.payload) if body.payload else None,
#         timestamp=body.timestamp or datetime.now(timezone.utc),
#     )
#     db.add(event)
#     await db.flush()

#     # ✅ ĐÃ FIX CỐT LÕI: Chỉ duy nhất sự kiện "access" mới được phép chép vào Lịch sử ra vào.
#     # Ngăn chặn "face_recognized" tạo log ma không có ảnh.
#     is_access_event = body.type == "access"

#     if is_access_event:
#         method = body.payload.get("method", "face") if body.payload else "face"
#         success = body.payload.get("success", False) if body.payload else False
#         status = AccessStatus.GRANTED if success else AccessStatus.DENIED

#         resident_id = None
#         if body.payload:
#             raw_rid = body.payload.get("resident_id")
#             if raw_rid is not None:
#                 try:
#                     resident_id = int(raw_rid)
#                 except (ValueError, TypeError):
#                     pass
            
#             name_from_pi = body.payload.get("name")
#             if name_from_pi and isinstance(name_from_pi, str):
#                 if "__id" in name_from_pi:
#                     parts = name_from_pi.split("__id")
#                     if len(parts) == 2 and parts[1].isdigit():
#                         resident_id = int(parts[1])
#                         clean_name = parts[0].replace("_", " ").title()
#                         body.payload["name"] = clean_name
#                         name_from_pi = clean_name

#                 if resident_id is None and name_from_pi.lower() not in ("unknown", "none", "", "khách lạ"):
#                     stmt = select(Resident.id).where(func.lower(Resident.name) == name_from_pi.lower()).limit(1)
#                     res = await db.execute(stmt)
#                     resident_id = res.scalar_one_or_none()

#         db.add(AccessLog(
#             resident_id=resident_id,
#             method=method,
#             status=status,
#             image_url=actual_image_url,
#             image_public_id=body.payload.get("image_public_id") if body.payload else None,
#             timestamp=datetime.now(timezone.utc),
#         ))

#     await db.commit()
#     await db.refresh(event)

#     try:
#         await broadcast_event(
#             event.type,
#             {
#                 "id":        event.id,
#                 "type":      event.type,
#                 "image_url": actual_image_url,
#                 "payload":   body.payload or {},
#                 "timestamp": event.timestamp.isoformat(),
#             },
#         )
#     except Exception as e:
#         pass

#     try:
#         is_unknown = event.type == "face_unknown" or (event.type == "access" and body.payload and not body.payload.get("success"))
#         if is_unknown:
#             await notify_service.alert_unknown_face(actual_image_url)
#         elif event.type == "door_forced":
#             await notify_service.alert_door_forced(actual_image_url)
#         elif event.type == "alarm_triggered":
#             await notify_service.alert_alarm_triggered(actual_image_url)
#     except Exception as e:
#         pass

#     return event

# @router.get("/latest", response_model=list[EventResponse])
# async def get_latest_events(
#     limit: int = Query(10, ge=1, le=50),
#     db: AsyncSession = Depends(get_db),
#     current_user: User = Depends(get_current_user),
# ):
#     result = await db.execute(select(SystemEvent).order_by(SystemEvent.timestamp.desc()).limit(limit))
#     return result.scalars().all()

# @router.get("", response_model=EventListResponse)
# async def list_events(
#     event_type: Optional[str] = Query(None, alias="type"),
#     page:  int = Query(1,  ge=1),
#     limit: int = Query(20, ge=1, le=100),
#     db: AsyncSession = Depends(get_db),
#     current_user: User = Depends(get_current_user),
# ):
#     query = select(SystemEvent).order_by(SystemEvent.timestamp.desc())
#     if event_type:
#         query = query.where(SystemEvent.type == event_type)

#     total = (await db.execute(select(func.count()).select_from(query.order_by(None).subquery()))).scalar_one()
#     result = await db.execute(query.offset((page - 1) * limit).limit(limit))
#     events = result.scalars().all()

#     return EventListResponse(items=events, total=total, page=page, limit=limit)



"""api/routers/events.py

CHANGES v8:
  [FIX-ACCESS-LOG-CONDITION] Khôi phục điều kiện lưu AccessLog cho các sự kiện face_* và pin_*.
  [KEEP-NAME-SPLIT] Giữ lại logic bóc tách "name__idX" để tìm resident_id.
"""

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
from models.resident import Resident
from schemas.event import EventCreate, EventListResponse, EventResponse
from services import notify_service

router = APIRouter(prefix="/events", tags=["Events"])
logger = logging.getLogger(__name__)

_EPHEMERAL_EVENTS = {"scan_frame", "scan_started", "scan_ended"}

def verify_pi_key(
    x_pi_api_key: str = Header(..., alias="X-Pi-Api-Key"),
) -> str:
    expected = os.getenv("PI_API_KEY", "raspberry-pi-secret-key")
    if not hmac.compare_digest(x_pi_api_key.encode("utf-8"), expected.encode("utf-8")):
        raise HTTPException(status_code=403, detail="Invalid Pi API key")
    return x_pi_api_key

@router.post("", response_model=EventResponse, status_code=201)
async def create_event(
    body: EventCreate,
    db: AsyncSession = Depends(get_db),
    api_key: str = Depends(verify_pi_key),
):
    if body.type in _EPHEMERAL_EVENTS:
        try:
            await broadcast_event(body.type, body.payload or {})
        except Exception as e:
            pass
        return EventResponse(
            id=0, type=body.type, image_url=None, payload_json=None,
            timestamp=body.timestamp or datetime.now(timezone.utc),
        )

    actual_image_url = body.image_url or (body.payload.get("image_url") if body.payload else None)

    event = SystemEvent(
        type=body.type,
        image_url=actual_image_url,
        payload_json=json.dumps(body.payload) if body.payload else None,
        timestamp=body.timestamp or datetime.now(timezone.utc),
    )
    db.add(event)
    await db.flush()

    # ✅ ĐÃ KHÔI PHỤC: Chấp nhận các sự kiện chuẩn gốc để lưu vào AccessLog
    is_access_event = body.type in ("face_recognized", "face_unknown", "pin_correct", "pin_wrong", "access")

    if is_access_event:
        if body.type == "access":
            method = body.payload.get("method", "face") if body.payload else "face"
            success = body.payload.get("success", False) if body.payload else False
            status = AccessStatus.GRANTED if success else AccessStatus.DENIED
        else:
            method = "face" if "face" in body.type else "pin"
            status = AccessStatus.GRANTED if body.type in ("face_recognized", "pin_correct") else AccessStatus.DENIED

        resident_id = None
        if body.payload:
            raw_rid = body.payload.get("resident_id")
            if raw_rid is not None:
                try:
                    resident_id = int(raw_rid)
                except (ValueError, TypeError):
                    pass
            
            name_from_pi = body.payload.get("name")
            if name_from_pi and isinstance(name_from_pi, str):
                # ✅ GIỮ LẠI: Logic bóc tách tên và ID
                if "__id" in name_from_pi:
                    parts = name_from_pi.split("__id")
                    if len(parts) == 2 and parts[1].isdigit():
                        resident_id = int(parts[1])
                        clean_name = parts[0].replace("_", " ").title()
                        body.payload["name"] = clean_name
                        name_from_pi = clean_name

                if resident_id is None and name_from_pi.lower() not in ("unknown", "none", "", "khách lạ"):
                    stmt = select(Resident.id).where(func.lower(Resident.name) == name_from_pi.lower()).limit(1)
                    res = await db.execute(stmt)
                    resident_id = res.scalar_one_or_none()

        db.add(AccessLog(
            resident_id=resident_id,
            method=method,
            status=status,
            image_url=actual_image_url,
            image_public_id=body.payload.get("image_public_id") if body.payload else None,
            timestamp=datetime.now(timezone.utc),
        ))

    await db.commit()
    await db.refresh(event)

    try:
        await broadcast_event(
            event.type,
            {
                "id":        event.id,
                "type":      event.type,
                "image_url": actual_image_url,
                "payload":   body.payload or {},
                "timestamp": event.timestamp.isoformat(),
            },
        )
    except Exception as e:
        pass

    try:
        is_unknown = event.type == "face_unknown" or (event.type == "access" and body.payload and not body.payload.get("success"))
        if is_unknown:
            await notify_service.alert_unknown_face(actual_image_url)
        elif event.type == "door_forced":
            await notify_service.alert_door_forced(actual_image_url)
        elif event.type == "alarm_triggered":
            await notify_service.alert_alarm_triggered(actual_image_url)
    except Exception as e:
        pass

    return event

@router.get("/latest", response_model=list[EventResponse])
async def get_latest_events(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(SystemEvent).order_by(SystemEvent.timestamp.desc()).limit(limit))
    return result.scalars().all()

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

    total = (await db.execute(select(func.count()).select_from(query.order_by(None).subquery()))).scalar_one()
    result = await db.execute(query.offset((page - 1) * limit).limit(limit))
    events = result.scalars().all()

    return EventListResponse(items=events, total=total, page=page, limit=limit)