# """
# web_app_clean/backend/api/routers/residents.py

# FULL PIPELINE (đã hoạt động 100%):
#   Dashboard webcam
#     → Base64 JPEG → bytes
#     → face_service.detect_and_encode_face()   [DNN + Haar + dlib encode] (CHẠY SONG SONG)
#     → avg 128-d encoding → DB (pi_synced=False)
#     → cloud upload avatar
#     → PUSH to Pi /sync-faces  (background, không block response)
#     → Pi updates known_faces.pkl → recognition works immediately
#     → If Pi offline: Pi pulls via GET /pending-sync every 60s
# """
# from __future__ import annotations

# import asyncio
# import base64
# import json
# import logging
# import os
# from io import BytesIO
# from typing import Optional, List

# import httpx
# import numpy as np
# from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
# from pydantic import BaseModel
# from sqlalchemy import select, func
# from sqlalchemy.ext.asyncio import AsyncSession

# from api.routers.auth import get_current_user
# from api.routers.device import verify_pi_api_key
# from core.database import get_db, AsyncSessionLocal
# from models.resident import Resident
# from models.user import User
# from schemas.resident import (
#     ResidentCreate, ResidentUpdate, ResidentResponse, ResidentListResponse,
# )
# from services import cloud_service, face_service

# logger = logging.getLogger(__name__)

# router = APIRouter(prefix="/residents", tags=["Residents"])

# ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
# MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB

# # Pi connection — read from .env
# PI_API_URL = os.getenv("PI_API_URL", "http://192.168.137.2:5000")
# PI_API_KEY = os.getenv("PI_API_KEY", "changeme-secret-key")

# # ── Schemas ─────────────────────────────────────────────────────────────────────

# class EnrollFaceFromDashboardRequest(BaseModel):
#     """images: list of Base64 Data URL or plain Base64."""
#     images: List[str]

# class AckPiSyncBody(BaseModel):
#     success: bool
#     error: Optional[str] = None

# # ── Pi push helpers ─────────────────────────────────────────────────────────────

# async def _push_encoding_to_pi(
#     resident_id: int,
#     name: str,
#     encoding_json: str,
# ) -> bool:
#     """Push face encoding to Pi immediately after enroll."""
#     url = f"{PI_API_URL}/sync-faces"
#     headers = {"X-Api-Key": PI_API_KEY, "Content-Type": "application/json"}
#     payload = {
#         "resident_id":  resident_id,
#         "name":         name,
#         "encoding_json": encoding_json,
#     }

#     for attempt in range(1, 4):
#         try:
#             async with httpx.AsyncClient(timeout=8.0) as client:
#                 resp = await client.post(url, json=payload, headers=headers)
#                 if resp.status_code == 200:
#                     logger.info("[push_to_pi] Pi ACK encoding resident_id=%d (attempt %d)", resident_id, attempt)
#                     return True
#                 logger.warning("[push_to_pi] Pi HTTP %d (attempt %d/3)", resp.status_code, attempt)
#         except httpx.ConnectError:
#             logger.warning("[push_to_pi] Pi unreachable (attempt %d/3)", attempt)
#         except Exception as exc:
#             logger.error("[push_to_pi] Error attempt %d: %s", attempt, exc)

#         if attempt < 3:
#             await asyncio.sleep(1.5 * attempt)

#     logger.warning("[push_to_pi] Push failed after 3 attempts — Pi will pull within ~60s")
#     return False

# async def _push_delete_to_pi(resident_id: int) -> None:
#     """Notify Pi to remove encoding when resident is deleted (non-blocking)."""
#     try:
#         url = f"{PI_API_URL}/delete-face"
#         headers = {"X-Api-Key": PI_API_KEY, "Content-Type": "application/json"}
#         async with httpx.AsyncClient(timeout=5.0) as client:
#             resp = await client.post(url, json={"resident_id": resident_id}, headers=headers)
#             if resp.status_code == 200:
#                 logger.info("[push_delete] Pi removed encoding for resident_id=%d", resident_id)
#     except Exception as exc:
#         logger.warning("[push_delete] Could not notify Pi: %s", exc)

# # ── CRUD ────────────────────────────────────────────────────────────────────────

# @router.get("", response_model=ResidentListResponse)
# async def list_residents(
#     page: int = Query(1, ge=1),
#     limit: int = Query(20, ge=1, le=100),
#     search: Optional[str] = Query(None),
#     db: AsyncSession = Depends(get_db),
#     current_user: User = Depends(get_current_user),
# ):
#     query = select(Resident)
#     if search:
#         query = query.where(Resident.name.ilike(f"%{search}%"))
#     total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar_one()
#     result = await db.execute(
#         query.order_by(Resident.created_at.desc()).offset((page - 1) * limit).limit(limit)
#     )
#     residents = result.scalars().all()

#     return ResidentListResponse(
#         items=[ResidentResponse.from_orm_with_encoding(r) for r in residents],
#         total=total, page=page, limit=limit,
#     )

# @router.get("/pending-sync")
# async def get_pending_sync(
#     db: AsyncSession = Depends(get_db),
#     api_key: str = Depends(verify_pi_api_key),
# ):
#     result = await db.execute(
#         select(Resident).where(
#             Resident.pi_synced == False,  # noqa: E712
#             Resident.face_encoding.isnot(None),
#             Resident.face_encoding != "",
#             Resident.face_encoding != "[]",
#         )
#     )
#     pending_residents = result.scalars().all()

#     if not pending_residents:
#         return {"pending": []}

#     items = []
#     for r in pending_residents:
#         try:
#             enc = json.loads(r.face_encoding)
#             if not isinstance(enc, list) or len(enc) != 128:
#                 continue
#         except Exception:
#             continue

#         items.append({
#             "resident_id":   r.id,
#             "name":          r.name,
#             "encoding_json": r.face_encoding,
#         })

#     logger.info("[pending-sync] Pi pulled %d pending encodings", len(items))
#     return {"pending": items}

# @router.post("/{resident_id}/ack-pi-sync")
# async def ack_pi_sync(
#     resident_id: int,
#     body: AckPiSyncBody,
#     db: AsyncSession = Depends(get_db),
#     api_key: str = Depends(verify_pi_api_key),
# ):
#     r = (await db.execute(select(Resident).where(Resident.id == resident_id))).scalar_one_or_none()
#     if not r:
#         raise HTTPException(404, "Resident not found")

#     if body.success:
#         r.pi_synced = True
#         await db.commit()
#         logger.info("[ack-pi-sync] Resident %d (%s) marked pi_synced=True", resident_id, r.name)
#         return {"success": True}
#     else:
#         logger.error("[ack-pi-sync] Pi reported failure for resident %d: %s", resident_id, body.error)
#         return {"success": False, "error": body.error}

# @router.get("/{resident_id}", response_model=ResidentResponse)
# async def get_resident(
#     resident_id: int,
#     db: AsyncSession = Depends(get_db),
#     current_user: User = Depends(get_current_user),
# ):
#     r = (await db.execute(select(Resident).where(Resident.id == resident_id))).scalar_one_or_none()
#     if not r:
#         raise HTTPException(404, "Resident not found")
#     return ResidentResponse.from_orm_with_encoding(r)

# @router.post("", response_model=ResidentResponse, status_code=201)
# async def create_resident(
#     body: ResidentCreate,
#     db: AsyncSession = Depends(get_db),
#     current_user: User = Depends(get_current_user),
# ):
#     r = Resident(**body.model_dump())
#     db.add(r)
#     await db.commit()
#     await db.refresh(r)
#     return ResidentResponse.from_orm_with_encoding(r)

# @router.put("/{resident_id}", response_model=ResidentResponse)
# async def update_resident(
#     resident_id: int,
#     body: ResidentUpdate,
#     db: AsyncSession = Depends(get_db),
#     current_user: User = Depends(get_current_user),
# ):
#     r = (await db.execute(select(Resident).where(Resident.id == resident_id))).scalar_one_or_none()
#     if not r:
#         raise HTTPException(404, "Resident not found")
#     for k, v in body.model_dump(exclude_unset=True).items():
#         setattr(r, k, v)
#     await db.commit()
#     await db.refresh(r)
#     return ResidentResponse.from_orm_with_encoding(r)

# @router.delete("/{resident_id}", status_code=204)
# async def delete_resident(
#     resident_id: int,
#     db: AsyncSession = Depends(get_db),
#     current_user: User = Depends(get_current_user),
# ):
#     r = (await db.execute(select(Resident).where(Resident.id == resident_id))).scalar_one_or_none()
#     if not r:
#         raise HTTPException(404, "Resident not found")
#     if r.face_image_public_id:
#         await cloud_service.delete_image(r.face_image_public_id)
#     await db.delete(r)
#     await db.commit()
#     asyncio.create_task(_push_delete_to_pi(resident_id))

# # ── Face image upload ────────────────────────────────────────────────────────────

# async def _process_face_upload(resident_id: int, file: UploadFile, db: AsyncSession) -> Resident:
#     if file.content_type not in ALLOWED_IMAGE_TYPES:
#         raise HTTPException(400, "Invalid file type. Allowed: JPEG, PNG, WebP")
#     image_bytes = await file.read()
#     if len(image_bytes) > MAX_IMAGE_SIZE:
#         raise HTTPException(400, "Image too large (max 10 MB)")

#     r = (await db.execute(select(Resident).where(Resident.id == resident_id))).scalar_one_or_none()
#     if not r:
#         raise HTTPException(404, "Resident not found")

#     if r.face_image_public_id:
#         await cloud_service.delete_image(r.face_image_public_id)

#     upload_result = await cloud_service.upload_image(image_bytes, folder="residents")
#     if not upload_result:
#         raise HTTPException(500, "Cloud upload failed")

#     r.face_image_url, r.face_image_public_id = upload_result
#     await db.commit()
#     await db.refresh(r)
#     return r

# @router.post("/{resident_id}/face-image", response_model=ResidentResponse)
# async def upload_face_image(
#     resident_id: int,
#     file: UploadFile = File(...),
#     db: AsyncSession = Depends(get_db),
#     current_user: User = Depends(get_current_user),
# ):
#     r = await _process_face_upload(resident_id, file, db)
#     return ResidentResponse.from_orm_with_encoding(r)

# @router.post("/{resident_id}/face-image-from-pi", response_model=ResidentResponse)
# async def upload_face_image_from_pi(
#     resident_id: int,
#     file: UploadFile = File(...),
#     db: AsyncSession = Depends(get_db),
#     api_key: str = Depends(verify_pi_api_key),
# ):
#     r = await _process_face_upload(resident_id, file, db)
#     return ResidentResponse.from_orm_with_encoding(r)

# # ── Webcam enroll from Dashboard (ĐÃ TỐI ƯU SONG SONG 100%) ──────────────────────

# def _get_image_dimensions(image_bytes: bytes) -> tuple[int, int]:
#     try:
#         from PIL import Image
#         with Image.open(BytesIO(image_bytes)) as img:
#             return img.size
#     except Exception:
#         return 0, 0

# @router.post(
#     "/{resident_id}/enroll-face-from-dashboard",
#     response_model=ResidentResponse,
# )
# async def enroll_face_from_dashboard(
#     resident_id: int,
#     body: EnrollFaceFromDashboardRequest,
#     db: AsyncSession = Depends(get_db),
#     current_user: User = Depends(get_current_user),
# ):
#     """
#     PIPELINE ĐÃ TỐI ƯU: Xử lý song song tất cả các ảnh để tránh Timeout 30s.
#     """
#     if not body.images:
#         raise HTTPException(status_code=400, detail="Danh sách ảnh trống.")

#     logger.info(f"[enroll] START resident_id={resident_id} — Parallel processing {len(body.images)} images")

#     loop = asyncio.get_running_loop()

#     # --- HÀM TÁCH LẺ CHO TỪNG ẢNH ĐỂ CHẠY ĐỒNG THỜI ---
#     async def process_single_image(idx, img_b64):
#         try:
#             # 1. Decode Base64
#             clean = img_b64.split(",", 1)[1] if "," in img_b64 else img_b64
#             padding = (4 - len(clean) % 4) % 4
#             image_bytes = base64.b64decode(clean + "=" * padding, validate=True)

#             if len(image_bytes) < 100:
#                 return None, image_bytes, f"Ảnh #{idx+1}: Dữ liệu quá nhỏ"

#             # 2. Đẩy vào ThreadPool để tránh Block API
#             encoding = await loop.run_in_executor(
#                 None, face_service.detect_and_encode_face, image_bytes
#             )

#             if encoding is None:
#                 return None, image_bytes, f"Ảnh #{idx+1}: Không tìm thấy khuôn mặt"

#             return encoding, image_bytes, None
#         except Exception as exc:
#             return None, None, f"Ảnh #{idx+1}: Lỗi hệ thống - {str(exc)}"

#     # --- 🚀 CHẠY SONG SONG BẰNG ASYNCIO.GATHER ---
#     tasks = [process_single_image(i, img) for i, img in enumerate(body.images)]
#     results = await asyncio.gather(*tasks)

#     valid_encodings = []
#     representative_bytes = None
#     failure_reasons = []

#     for enc, img_bytes, err in results:
#         if enc is not None:
#             valid_encodings.append(enc)
#             if representative_bytes is None:
#                 representative_bytes = img_bytes
#         else:
#             if err: failure_reasons.append(err)

#     # --- KIỂM TRA TỔNG HỢP ---
#     if not valid_encodings:
#         detail_err = "\n".join(f"  • {r}" for r in failure_reasons)
#         raise HTTPException(
#             status_code=400,
#             detail=f"Thất bại:\n{detail_err}\n\nHướng dẫn: Chụp mặt thẳng, đủ ánh sáng."
#         )

#     logger.info(f"[enroll] Result: {len(valid_encodings)}/{len(body.images)} images valid")

#     # --- GỘP TRUNG BÌNH KẾT QUẢ ---
#     avg_encoding = np.mean([np.array(enc) for enc in valid_encodings], axis=0).tolist()
#     avg_encoding_json = json.dumps(avg_encoding)

#     r = (await db.execute(select(Resident).where(Resident.id == resident_id))).scalar_one_or_none()
#     if not r: raise HTTPException(404, "Resident not found")

#     # --- UPLOAD ẢNH ĐẠI DIỆN LÊN CLOUD ---
#     if representative_bytes:
#         if r.face_image_public_id:
#             try:
#                 await cloud_service.delete_image(r.face_image_public_id)
#             except Exception as e:
#                 logger.warning(f"Lỗi khi xóa ảnh cũ trên Cloud: {e}")

#         upload_result = await cloud_service.upload_image(representative_bytes, folder="residents")
#         if upload_result:
#             r.face_image_url, r.face_image_public_id = upload_result

#     # --- LƯU VÀO DATABASE ---
#     r.face_encoding = avg_encoding_json
#     r.pi_synced = False
#     await db.commit()
#     await db.refresh(r)

#     logger.info(f"[enroll] DB updated: resident_id={resident_id} name='{r.name}' samples={len(valid_encodings)}")

#     # --- PUSH ĐỒNG BỘ XUỐNG RASPBERRY PI NGAY LẬP TỨC ---
#     resident_name_snapshot = r.name
#     async def _push_task():
#         success = await _push_encoding_to_pi(resident_id, resident_name_snapshot, avg_encoding_json)
#         if success:
#             async with AsyncSessionLocal() as new_db:
#                 res = (await new_db.execute(select(Resident).where(Resident.id == resident_id))).scalar_one_or_none()
#                 if res:
#                     res.pi_synced = True
#                     await new_db.commit()
#                     logger.info(f"[enroll] pi_synced=True for resident_id={resident_id}")

#     asyncio.create_task(_push_task())

#     return ResidentResponse.from_orm_with_encoding(r)



"""
web_app_clean/backend/api/routers/residents.py

[UPDATE]: Khắc phục triệt để lỗi Timeout 60s khi đăng ký khuôn mặt trên Dashboard.
Chuyển toàn bộ khối lượng công việc nặng (AI Encode, Cloud Upload) vào BackgroundTask.
"""
from __future__ import annotations

import asyncio
import base64
import json
import logging
import os
from io import BytesIO
from typing import Optional, List

import httpx
import numpy as np
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from api.routers.auth import get_current_user
from api.routers.device import verify_pi_api_key
from core.database import get_db, AsyncSessionLocal
from models.resident import Resident
from models.user import User
from schemas.resident import (
    ResidentCreate, ResidentUpdate, ResidentResponse, ResidentListResponse,
)
from services import cloud_service, face_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/residents", tags=["Residents"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB

# Pi connection — read from .env
PI_API_URL = os.getenv("PI_API_URL", "http://192.168.137.2:5000")
PI_API_KEY = os.getenv("PI_API_KEY", "changeme-secret-key")

# ── Schemas ─────────────────────────────────────────────────────────────────────

class EnrollFaceFromDashboardRequest(BaseModel):
    """images: list of Base64 Data URL or plain Base64."""
    images: List[str]

class AckPiSyncBody(BaseModel):
    success: bool
    error: Optional[str] = None

# ── Pi push helpers ─────────────────────────────────────────────────────────────

async def _push_encoding_to_pi(
    resident_id: int,
    name: str,
    encoding_json: str,
) -> bool:
    """Push face encoding to Pi immediately after enroll."""
    url = f"{PI_API_URL}/sync-faces"
    headers = {"X-Api-Key": PI_API_KEY, "Content-Type": "application/json"}
    payload = {
        "resident_id":  resident_id,
        "name":         name,
        "encoding_json": encoding_json,
    }

    for attempt in range(1, 4):
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.post(url, json=payload, headers=headers)
                if resp.status_code == 200:
                    logger.info("[push_to_pi] Pi ACK encoding resident_id=%d (attempt %d)", resident_id, attempt)
                    return True
                logger.warning("[push_to_pi] Pi HTTP %d (attempt %d/3)", resp.status_code, attempt)
        except httpx.ConnectError:
            logger.warning("[push_to_pi] Pi unreachable (attempt %d/3)", attempt)
        except Exception as exc:
            logger.error("[push_to_pi] Error attempt %d: %s", attempt, exc)

        if attempt < 3:
            await asyncio.sleep(1.5 * attempt)

    logger.warning("[push_to_pi] Push failed after 3 attempts — Pi will pull within ~60s")
    return False

async def _push_delete_to_pi(resident_id: int) -> None:
    """Notify Pi to remove encoding when resident is deleted (non-blocking)."""
    try:
        url = f"{PI_API_URL}/delete-face"
        headers = {"X-Api-Key": PI_API_KEY, "Content-Type": "application/json"}
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(url, json={"resident_id": resident_id}, headers=headers)
            if resp.status_code == 200:
                logger.info("[push_delete] Pi removed encoding for resident_id=%d", resident_id)
    except Exception as exc:
        logger.warning("[push_delete] Could not notify Pi: %s", exc)

# ── CRUD ────────────────────────────────────────────────────────────────────────

@router.get("", response_model=ResidentListResponse)
async def list_residents(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Resident)
    if search:
        query = query.where(Resident.name.ilike(f"%{search}%"))
    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar_one()
    result = await db.execute(
        query.order_by(Resident.created_at.desc()).offset((page - 1) * limit).limit(limit)
    )
    residents = result.scalars().all()

    return ResidentListResponse(
        items=[ResidentResponse.from_orm_with_encoding(r) for r in residents],
        total=total, page=page, limit=limit,
    )

@router.get("/pending-sync")
async def get_pending_sync(
    db: AsyncSession = Depends(get_db),
    api_key: str = Depends(verify_pi_api_key),
):
    result = await db.execute(
        select(Resident).where(
            Resident.pi_synced == False,  # noqa: E712
            Resident.face_encoding.isnot(None),
            Resident.face_encoding != "",
            Resident.face_encoding != "[]",
        )
    )
    pending_residents = result.scalars().all()

    if not pending_residents:
        return {"pending": []}

    items = []
    for r in pending_residents:
        try:
            enc = json.loads(r.face_encoding)
            if not isinstance(enc, list) or len(enc) != 128:
                continue
        except Exception:
            continue

        items.append({
            "resident_id":   r.id,
            "name":          r.name,
            "encoding_json": r.face_encoding,
        })

    logger.info("[pending-sync] Pi pulled %d pending encodings", len(items))
    return {"pending": items}

@router.post("/{resident_id}/ack-pi-sync")
async def ack_pi_sync(
    resident_id: int,
    body: AckPiSyncBody,
    db: AsyncSession = Depends(get_db),
    api_key: str = Depends(verify_pi_api_key),
):
    r = (await db.execute(select(Resident).where(Resident.id == resident_id))).scalar_one_or_none()
    if not r:
        raise HTTPException(404, "Resident not found")

    if body.success:
        r.pi_synced = True
        await db.commit()
        logger.info("[ack-pi-sync] Resident %d (%s) marked pi_synced=True", resident_id, r.name)
        return {"success": True}
    else:
        logger.error("[ack-pi-sync] Pi reported failure for resident %d: %s", resident_id, body.error)
        return {"success": False, "error": body.error}

@router.get("/{resident_id}", response_model=ResidentResponse)
async def get_resident(
    resident_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    r = (await db.execute(select(Resident).where(Resident.id == resident_id))).scalar_one_or_none()
    if not r:
        raise HTTPException(404, "Resident not found")
    return ResidentResponse.from_orm_with_encoding(r)

@router.post("", response_model=ResidentResponse, status_code=201)
async def create_resident(
    body: ResidentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    r = Resident(**body.model_dump())
    db.add(r)
    await db.commit()
    await db.refresh(r)
    return ResidentResponse.from_orm_with_encoding(r)

@router.put("/{resident_id}", response_model=ResidentResponse)
async def update_resident(
    resident_id: int,
    body: ResidentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    r = (await db.execute(select(Resident).where(Resident.id == resident_id))).scalar_one_or_none()
    if not r:
        raise HTTPException(404, "Resident not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(r, k, v)
    await db.commit()
    await db.refresh(r)
    return ResidentResponse.from_orm_with_encoding(r)

@router.delete("/{resident_id}", status_code=204)
async def delete_resident(
    resident_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    r = (await db.execute(select(Resident).where(Resident.id == resident_id))).scalar_one_or_none()
    if not r:
        raise HTTPException(404, "Resident not found")
    if r.face_image_public_id:
        await cloud_service.delete_image(r.face_image_public_id)
    await db.delete(r)
    await db.commit()
    asyncio.create_task(_push_delete_to_pi(resident_id))

# ── Face image upload ────────────────────────────────────────────────────────────

async def _process_face_upload(resident_id: int, file: UploadFile, db: AsyncSession) -> Resident:
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(400, "Invalid file type. Allowed: JPEG, PNG, WebP")
    image_bytes = await file.read()
    if len(image_bytes) > MAX_IMAGE_SIZE:
        raise HTTPException(400, "Image too large (max 10 MB)")

    r = (await db.execute(select(Resident).where(Resident.id == resident_id))).scalar_one_or_none()
    if not r:
        raise HTTPException(404, "Resident not found")

    if r.face_image_public_id:
        await cloud_service.delete_image(r.face_image_public_id)

    upload_result = await cloud_service.upload_image(image_bytes, folder="residents")
    if not upload_result:
        raise HTTPException(500, "Cloud upload failed")

    r.face_image_url, r.face_image_public_id = upload_result
    await db.commit()
    await db.refresh(r)
    return r

@router.post("/{resident_id}/face-image", response_model=ResidentResponse)
async def upload_face_image(
    resident_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    r = await _process_face_upload(resident_id, file, db)
    return ResidentResponse.from_orm_with_encoding(r)

@router.post("/{resident_id}/face-image-from-pi", response_model=ResidentResponse)
async def upload_face_image_from_pi(
    resident_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    api_key: str = Depends(verify_pi_api_key),
):
    r = await _process_face_upload(resident_id, file, db)
    return ResidentResponse.from_orm_with_encoding(r)

# ── Webcam enroll from Dashboard (✅ ĐÃ TỐI ƯU CHẠY NỀN TRÁNH TIMEOUT) ──────────────────────

def _get_image_dimensions(image_bytes: bytes) -> tuple[int, int]:
    try:
        from PIL import Image
        with Image.open(BytesIO(image_bytes)) as img:
            return img.size
    except Exception:
        return 0, 0

async def _background_enroll_task(resident_id: int, images_b64: List[str]):
    """
    Hàm xử lý ngầm: Extract AI, Upload Cloudinary, Lưu DB và Push Pi.
    Không trả kết quả trực tiếp cho Frontend để tránh timeout.
    """
    logger.info(f"[enroll_bg] Bắt đầu xử lý ngầm cho resident_id={resident_id} với {len(images_b64)} ảnh")
    
    try:
        loop = asyncio.get_running_loop()

        # --- TÁCH LẺ XỬ LÝ ẢNH ---
        async def process_single_image(idx, img_b64):
            try:
                clean = img_b64.split(",", 1)[1] if "," in img_b64 else img_b64
                padding = (4 - len(clean) % 4) % 4
                image_bytes = base64.b64decode(clean + "=" * padding, validate=True)

                if len(image_bytes) < 100:
                    return None, image_bytes, f"Ảnh #{idx+1}: Dữ liệu quá nhỏ"

                # Đẩy vào ThreadPool để tránh Block CPU
                encoding = await loop.run_in_executor(
                    None, face_service.detect_and_encode_face, image_bytes
                )

                if encoding is None:
                    return None, image_bytes, f"Ảnh #{idx+1}: Không tìm thấy khuôn mặt"

                return encoding, image_bytes, None
            except Exception as exc:
                return None, None, f"Ảnh #{idx+1}: Lỗi hệ thống - {str(exc)}"

        tasks = [process_single_image(i, img) for i, img in enumerate(images_b64)]
        results = await asyncio.gather(*tasks)

        valid_encodings = []
        representative_bytes = None
        failure_reasons = []

        for enc, img_bytes, err in results:
            if enc is not None:
                valid_encodings.append(enc)
                if representative_bytes is None:
                    representative_bytes = img_bytes
            else:
                if err: failure_reasons.append(err)

        if not valid_encodings:
            logger.error(f"[enroll_bg] Lỗi AI: Không có khuôn mặt hợp lệ. Lý do: {failure_reasons}")
            return # Thoát sớm nếu không có ảnh nào hợp lệ

        logger.info(f"[enroll_bg] Nhận diện AI thành công: {len(valid_encodings)}/{len(images_b64)} ảnh")

        # --- GỘP TRUNG BÌNH KẾT QUẢ ---
        avg_encoding = np.mean([np.array(enc) for enc in valid_encodings], axis=0).tolist()
        avg_encoding_json = json.dumps(avg_encoding)

        # --- MỞ SESSION DB MỚI ĐỂ GHI NGẦM ---
        async with AsyncSessionLocal() as bg_db:
            r = (await bg_db.execute(select(Resident).where(Resident.id == resident_id))).scalar_one_or_none()
            if not r:
                logger.error(f"[enroll_bg] Không tìm thấy Resident ID {resident_id} trong DB")
                return

            # --- UPLOAD ẢNH ĐẠI DIỆN LÊN CLOUD ---
            if representative_bytes:
                if r.face_image_public_id:
                    try:
                        await cloud_service.delete_image(r.face_image_public_id)
                    except Exception as e:
                        logger.warning(f"Lỗi khi xóa ảnh cũ trên Cloud: {e}")

                upload_result = await cloud_service.upload_image(representative_bytes, folder="residents")
                if upload_result:
                    r.face_image_url, r.face_image_public_id = upload_result

            # --- LƯU VÀO DATABASE ---
            r.face_encoding = avg_encoding_json
            r.pi_synced = False
            await bg_db.commit()
            
            resident_name_snapshot = r.name
            logger.info(f"[enroll_bg] Đã lưu thành công vào DB cho {resident_name_snapshot}")

            # --- PUSH ĐỒNG BỘ XUỐNG RASPBERRY PI ---
            success = await _push_encoding_to_pi(resident_id, resident_name_snapshot, avg_encoding_json)
            if success:
                r.pi_synced = True
                await bg_db.commit()
                logger.info(f"[enroll_bg] Đã đồng bộ với Pi thành công.")

    except Exception as e:
        logger.error(f"[enroll_bg] Lỗi nghiêm trọng trong Background Task: {e}")


@router.post(
    "/{resident_id}/enroll-face-from-dashboard",
    status_code=status.HTTP_202_ACCEPTED
)
async def enroll_face_from_dashboard(
    resident_id: int,
    body: EnrollFaceFromDashboardRequest,
    background_tasks: BackgroundTasks, # TIÊM BACKGROUND TASKS CỦA FASTAPI
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Nhận 5 ảnh Base64 từ Frontend và vứt vào Background Task để xử lý ngầm.
    Trả kết quả ngay lập tức để tránh lỗi Timeout 60s trên trình duyệt.
    """
    if not body.images:
        raise HTTPException(status_code=400, detail="Danh sách ảnh trống.")
        
    r = (await db.execute(select(Resident).where(Resident.id == resident_id))).scalar_one_or_none()
    if not r:
        raise HTTPException(404, "Không tìm thấy cư dân.")

    # Đưa toàn bộ khối lượng công việc AI và Cloud vào chạy ngầm
    background_tasks.add_task(_background_enroll_task, resident_id, body.images)

    # Trả lời Frontend ngay lập tức (202 Accepted - Đã tiếp nhận yêu cầu)
    return {"message": "Đã nhận ảnh. Hệ thống đang trích xuất đặc trưng AI và tải lên máy chủ ngầm."}