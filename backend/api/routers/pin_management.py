"""api/routers/pin_management.py"""

import logging
import os

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.routers.auth import get_current_user
from api.routers.websocket import broadcast_event
from core.database import get_db
from core.security import hash_password, verify_password
from models.pin_config import PinConfig          # ✅ fix: lưu PIN vào DB (xem model bên dưới)
from models.user import User

router = APIRouter(prefix="/pin", tags=["PIN Management"])
logger = logging.getLogger(__name__)

PI_API_URL = os.getenv("PI_API_URL", "http://192.168.1.100:5000")
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
    """Lấy PIN config từ DB, tạo mới nếu chưa có."""
    result = await db.execute(select(PinConfig).limit(1))
    config = result.scalar_one_or_none()
    if config is None:
        # ✅ fix: khởi tạo lần đầu từ DEFAULT_PIN, lưu vào DB
        config = PinConfig(hashed_pin=hash_password(DEFAULT_PIN), pi_synced=False)
        db.add(config)
        await db.commit()
        await db.refresh(config)
    return config


async def _sync_pi(pin_hash: str) -> bool:
    """
    Đồng bộ PIN hash xuống Pi.
    ✅ fix: gửi hash thay vì plaintext PIN.
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{PI_API_URL}/pin/update",
                headers={"X-Api-Key": PI_API_KEY},
                json={"pin_hash": pin_hash},   # ✅ fix: không gửi raw PIN
            )
            resp.raise_for_status()
            return True
    except httpx.TimeoutException:
        logger.warning("_sync_pi: timeout")
        return False
    except httpx.ConnectError:
        logger.warning("_sync_pi: cannot reach Pi")
        return False
    except httpx.HTTPStatusError as e:
        logger.warning("_sync_pi: Pi returned %s", e.response.status_code)
        return False
    except Exception as e:
        logger.error("_sync_pi: unexpected error — %s", e)
        return False


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/update")
async def update_pin(
    body: PinUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    config = await _get_pin_config(db)

    # ✅ fix: verify qua bcrypt thay vì SHA256
    if not verify_password(body.current_pin, config.hashed_pin):
        raise HTTPException(status_code=400, detail="Current PIN is incorrect")

    # ✅ fix: hash bằng bcrypt + lưu vào DB
    new_hashed = hash_password(body.new_pin)
    config.hashed_pin = new_hashed
    config.pi_synced  = False
    await db.commit()
    await db.refresh(config)

    # Sync xuống Pi
    pi_synced = await _sync_pi(new_hashed)
    if pi_synced:
        config.pi_synced = True
        await db.commit()

    await broadcast_event("pin_updated", {"triggered_by": current_user.username})

    return {
        "success":   True,
        "pi_synced": pi_synced,
        "message":   "PIN updated and synced" if pi_synced else "PIN updated (Pi sync pending)",
    }


@router.post("/sync")
async def sync_pin(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # ✅ fix: thực sự sync — lấy hash từ DB và gửi xuống Pi
    config = await _get_pin_config(db)
    pi_synced = await _sync_pi(config.hashed_pin)

    if pi_synced:
        config.pi_synced = True
        await db.commit()

    return {
        "success":   pi_synced,
        "pi_synced": pi_synced,
        "message":   "PIN synced to Pi" if pi_synced else "Pi unreachable, sync failed",
    }


@router.get("/status")
async def get_pin_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # ✅ fix: thêm endpoint để frontend kiểm tra trạng thái sync
    config = await _get_pin_config(db)
    return {
        "pi_synced": config.pi_synced,
        "has_pin":   True,
    }
