# web_app_clean/backend/api/routers/pin_management.py
"""
api/routers/pin_management.py

Quản lý mã PIN truy cập:
- Đổi PIN trên Web (Bcrypt cho Web, Plaintext tạm thời cho Pi).
- Đồng bộ PIN xuống Raspberry Pi (Pi sẽ tạo HMAC từ plaintext).
- Xóa plaintext ngay sau khi đồng bộ thành công để đảm bảo bảo mật.
"""

import logging
import os

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.routers.auth import get_current_user
from api.routers.device import verify_pi_api_key
from api.routers.websocket import broadcast_event
from core.database import get_db
from core.security import hash_password, verify_password
from models.pin_config import PinConfig
from models.user import User

router = APIRouter(prefix="/pin", tags=["PIN Management"])
logger = logging.getLogger(__name__)

PI_API_URL = os.getenv("PI_API_URL", "http://192.168.137.2:5000")
PI_API_KEY  = os.getenv("PI_API_KEY",  "raspberry-pi-secret-key")

# PIN mặc định nếu chưa có record trong DB
DEFAULT_PIN = os.getenv("DEFAULT_PIN", "1234")


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class PinUpdateRequest(BaseModel):
    current_pin: str = Field(..., min_length=4, max_length=8)
    new_pin:     str = Field(..., min_length=4, max_length=8)

    @field_validator("new_pin", "current_pin")
    @classmethod
    def digits_only(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError("PIN must be digits only")
        return v


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

async def _get_pin_config(db: AsyncSession) -> PinConfig:
    """Lấy PIN config duy nhất từ DB, tạo mới nếu chưa có."""
    result = await db.execute(select(PinConfig).limit(1))
    config = result.scalar_one_or_none()
    if config is None:
        config = PinConfig(
            hashed_pin=hash_password(DEFAULT_PIN),
            pi_synced=False,
            pin_plaintext=None
        )
        db.add(config)
        await db.commit()
        await db.refresh(config)
    return config


async def _sync_pi_direct(pin_plaintext: str) -> bool:
    """
    Chủ động đẩy PIN xuống Pi qua HTTP Request.
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{PI_API_URL}/pin/update",
                headers={"X-Api-Key": PI_API_KEY},
                json={"pin": pin_plaintext},
            )
            resp.raise_for_status()
            return True
    except Exception as e:
        logger.warning(f"_sync_pi_direct failed: {e}")
        return False


# ---------------------------------------------------------------------------
# Endpoints cho Web Dashboard
# ---------------------------------------------------------------------------

@router.post("/update")
async def update_pin(
    body: PinUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cập nhật PIN mới từ giao diện Web."""
    config = await _get_pin_config(db)

    # 1. Kiểm tra PIN cũ (Bcrypt)
    if not verify_password(body.current_pin, config.hashed_pin):
        raise HTTPException(status_code=400, detail="Current PIN is incorrect")

    # 2. Cập nhật mã PIN mới vào DB
    config.hashed_pin = hash_password(body.new_pin)
    config.pin_plaintext = body.new_pin  # Lưu tạm để Pi polling hoặc sync
    config.pi_synced = False

    await db.commit()
    await db.refresh(config)

    # 3. Thử đẩy trực tiếp xuống Pi (Push mode)
    pi_synced = await _sync_pi_direct(body.new_pin)

    if pi_synced:
        config.pi_synced = True
        config.pin_plaintext = None  # Xóa ngay lập tức nếu sync thành công
        await db.commit()

    await broadcast_event("pin_updated", {"triggered_by": current_user.username, "pi_synced": pi_synced})

    return {
        "success": True,
        "pi_synced": pi_synced,
        "message": "PIN updated. Pi is now in sync." if pi_synced else "PIN updated. Waiting for Pi to sync."
    }


@router.get("/status")
async def get_pin_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Kiểm tra trạng thái đồng bộ PIN của thiết bị."""
    config = await _get_pin_config(db)
    return {
        "pi_synced": config.pi_synced,
        "updated_at": config.updated_at
    }


# ---------------------------------------------------------------------------
# Endpoints cho Raspberry Pi (Xác thực bằng API Key)
# ---------------------------------------------------------------------------

@router.post("/ack-pin")
async def acknowledge_pin_sync(
    db: AsyncSession = Depends(get_db),
    api_key: str = Depends(verify_pi_api_key)
):
    """
    Endpoint để Pi xác nhận: 'Tôi đã nhận PIN và cài vào STM32 thành công'.
    Giúp Backend xóa bỏ pin_plaintext để bảo mật.
    """
    config = await _get_pin_config(db)

    config.pi_synced = True
    config.pin_plaintext = None # QUAN TRỌNG: Xóa sạch dấu vết plaintext

    await db.commit()
    logger.info("Pi acknowledged PIN sync. Plaintext cleared from DB.")

    await broadcast_event("pi_sync_complete", {"status": "success"})
    return {"status": "confirmed"}
