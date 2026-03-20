"""api/routers/residents.py"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from api.routers.auth import get_current_user
from core.database import get_db
from models.resident import Resident
from models.user import User
from schemas.resident import ResidentCreate, ResidentUpdate, ResidentResponse, ResidentListResponse
from services import cloud_service, face_service

router = APIRouter(prefix="/residents", tags=["Residents"])
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_SIZE = 10 * 1024 * 1024

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
    result = await db.execute(query.order_by(Resident.created_at.desc()).offset((page-1)*limit).limit(limit))
    residents = result.scalars().all()
    return ResidentListResponse(items=[ResidentResponse.model_validate(r) for r in residents], total=total, page=page, limit=limit)

@router.get("/{resident_id}", response_model=ResidentResponse)
async def get_resident(resident_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    r = (await db.execute(select(Resident).where(Resident.id == resident_id))).scalar_one_or_none()
    if not r: raise HTTPException(404, "Resident not found")
    return ResidentResponse.model_validate(r)

@router.post("", response_model=ResidentResponse, status_code=201)
async def create_resident(body: ResidentCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    r = Resident(**body.model_dump())
    db.add(r); await db.commit(); await db.refresh(r)

    # Đã xóa đoạn code gọi Pi tự động ở đây! Hệ thống sẽ chỉ tạo tên rỗng.

    return ResidentResponse.model_validate(r)

@router.put("/{resident_id}", response_model=ResidentResponse)
async def update_resident(resident_id: int, body: ResidentUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    r = (await db.execute(select(Resident).where(Resident.id == resident_id))).scalar_one_or_none()
    if not r: raise HTTPException(404, "Resident not found")
    for k, v in body.model_dump(exclude_unset=True).items(): setattr(r, k, v)
    await db.commit(); await db.refresh(r)
    return ResidentResponse.model_validate(r)

@router.delete("/{resident_id}", status_code=204)
async def delete_resident(resident_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    r = (await db.execute(select(Resident).where(Resident.id == resident_id))).scalar_one_or_none()
    if not r: raise HTTPException(404, "Resident not found")
    if r.face_image_public_id: await cloud_service.delete_image(r.face_image_public_id)
    await db.delete(r); await db.commit()

@router.post("/{resident_id}/face-image", response_model=ResidentResponse)
async def upload_face_image(resident_id: int, file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(400, "Invalid file type. Allowed: JPEG, PNG, WebP")
    image_bytes = await file.read()
    if len(image_bytes) > MAX_IMAGE_SIZE: raise HTTPException(400, "Image too large")

    r = (await db.execute(select(Resident).where(Resident.id == resident_id))).scalar_one_or_none()
    if not r: raise HTTPException(404, "Resident not found")

    # === ĐÃ TẮT CHECK AI VÌ PI ĐÃ CHECK RỒI ===
    # try: encoding = face_service.detect_and_encode_face(image_bytes)
    # except ValueError as e: raise HTTPException(400, str(e))
    # if encoding is None: raise HTTPException(400, "No face detected")
    # ==========================================

    if r.face_image_public_id: await cloud_service.delete_image(r.face_image_public_id)

    upload_result = await cloud_service.upload_image(image_bytes, folder="residents")
    if not upload_result: raise HTTPException(500, "Upload failed")

    r.face_image_url, r.face_image_public_id = upload_result

    # Cho một encoding giả vào DB để không bị lỗi null, vì Pi đã tự lưu mặt rồi
    r.face_encoding = "[]"

    await db.commit(); await db.refresh(r)
    return ResidentResponse.model_validate(r)
