# # """api/routers/device.py"""

# # import logging
# # import os
# # from datetime import datetime, timezone

# # import httpx
# # from fastapi import APIRouter, Depends, HTTPException
# # from pydantic import BaseModel
# # from sqlalchemy import select
# # from sqlalchemy.ext.asyncio import AsyncSession

# # from api.routers.auth import get_current_user
# # from api.routers.websocket import broadcast_event
# # from core.database import get_db
# # from models.user import User
# # from models.pin_config import PinConfig # Đảm bảo bạn đã có model này

# # router = APIRouter(prefix="/device", tags=["Device Control"])
# # logger = logging.getLogger(__name__)

# # # IP của Pi (dùng để Backend gọi ngược xuống Pi)
# # PI_API_URL = os.getenv("PI_API_URL", "http://192.168.1.100:5000")
# # PI_API_KEY  = os.getenv("PI_API_KEY",  "raspberry-pi-secret-key")


# # # ---------------------------------------------------------------------------
# # # Schemas
# # # ---------------------------------------------------------------------------

# # class EnrollRequest(BaseModel):
# #     resident_id: int
# #     name: str

# # class HeartbeatPayload(BaseModel):
# #     status: str = "online"
# #     temp: float | None = None


# # # ---------------------------------------------------------------------------
# # # Internal helper
# # # ---------------------------------------------------------------------------

# # async def call_pi(method: str, path: str, body: dict | None = None) -> dict:
# #     url = f"{PI_API_URL}{path}"
# #     headers = {"X-Api-Key": PI_API_KEY, "Content-Type": "application/json"}

# #     if method not in ("GET", "POST"):
# #         raise ValueError(f"Unsupported HTTP method for Pi: {method}")

# #     try:
# #         async with httpx.AsyncClient(timeout=10.0) as client:
# #             if method == "GET":
# #                 resp = await client.get(url, headers=headers)
# #             else:
# #                 resp = await client.post(url, headers=headers, json=body or {})

# #             resp.raise_for_status()
# #             return resp.json()

# #     except Exception as e:
# #         logger.error(f"Call Pi failed: {url} - {str(e)}")
# #         raise HTTPException(502, f"Cannot reach Raspberry Pi: {str(e)}")


# # # ---------------------------------------------------------------------------
# # # Endpoints cho Raspberry Pi gọi lên (Pi -> Cloud)
# # # ---------------------------------------------------------------------------

# # # ✅ MỚI: Endpoint nhận "nhịp tim" từ Pi
# # @router.post("/heartbeat")
# # @router.post("/heartbeat/") # Hỗ trợ cả có và không có dấu gạch chéo
# # async def device_heartbeat(payload: HeartbeatPayload):
# #     """Pi báo cáo trạng thái định kỳ."""
# #     # Bạn có thể lưu timestamp này vào DB để biết Pi offline lúc nào
# #     logger.debug(f"Heartbeat received from Pi. Status: {payload.status}")
# #     return {"status": "ok", "server_time": datetime.now(timezone.utc).isoformat()}


# # # ✅ MỚI: Endpoint để Pi lấy mã PIN chưa đồng bộ
# # @router.get("/pending-pin")
# # @router.get("/pending-pin/")
# # async def get_pending_pins(db: AsyncSession = Depends(get_db)):
# #     """Pi hỏi xem có mã PIN nào mới cần cập nhật không."""
# #     # Logic tạm thời: Trả về danh sách trống hoặc query từ bảng PinConfig
# #     # result = await db.execute(select(PinConfig).where(PinConfig.synced == False))
# #     # pins = result.scalars().all()
# #     return {"pending_pins": []}


# # # ---------------------------------------------------------------------------
# # # Endpoints cho người dùng điều khiển (Web -> Cloud -> Pi)
# # # ---------------------------------------------------------------------------

# # @router.post("/unlock-door")
# # async def unlock_door(current_user: User = Depends(get_current_user)):
# #     await call_pi("POST", "/door/unlock")
# #     await broadcast_event("door_opened", {"triggered_by": current_user.username, "method": "remote"})
# #     return {"success": True, "message": "Door unlocked"}

# # @router.get("/status")
# # async def get_device_status(current_user: User = Depends(get_current_user)):
# #     try:
# #         result = await call_pi("GET", "/status")
# #         return {"online": True, **result}
# #     except Exception:
# #         return {"online": False}

# # @router.post("/trigger-enroll")
# # async def trigger_enroll(body: EnrollRequest, current_user: User = Depends(get_current_user)):
# #     await call_pi("POST", "/camera/enroll", {"name": body.name, "id": body.resident_id})
# #     await broadcast_event("enroll_started", {"resident_id": body.resident_id, "name": body.name})
# #     return {"success": True}

# """
# api/routers/device.py

# Mục đích: Router điều khiển thiết bị từ xa.
#   - Người dùng nhấn nút trên Web → Frontend gọi /api/device/... → Backend
#     forward lệnh HTTP xuống Raspberry Pi (192.168.137.2:5000) → Pi xử lý
#     phần cứng (UART → STM32).

# VẤN ĐỀ CŨ:
#   1. PI_API_URL hard-code "http://192.168.1.100:5000" → sai IP → 404/502.
#   2. Thiếu endpoint /stop-alarm và /lock-door mà Dashboard.jsx và Settings.jsx
#      đang gọi → 404.
#   3. Thiếu endpoint /change-pin mà Dashboard.jsx (ChangePinModal) gọi → 404.

# GIẢI PHÁP:
#   1. Đọc PI_API_URL từ .env (đã set = http://192.168.137.2:5000).
#   2. Thêm đủ các endpoint: stop-alarm, lock-door, unlock-door, change-pin,
#      status, trigger-enroll, heartbeat, pending-pin.

# LUỒNG LỆNH (Web → Pi):
#   React button click
#     → apiClient.post('/device/unlock-door')
#     → FastAPI POST /api/device/unlock-door
#     → httpx.post('http://192.168.137.2:5000/door/unlock')
#     → Pi aiohttp server handle_unlock()
#     → uart.send('CMD_UNLOCK_DOOR\\n')
#     → STM32 mở chốt cửa
# """

# import logging
# import os
# from datetime import datetime, timezone

# import httpx
# from fastapi import APIRouter, Depends, HTTPException
# from pydantic import BaseModel
# from sqlalchemy.ext.asyncio import AsyncSession

# from api.routers.auth import get_current_user
# from api.routers.websocket import broadcast_event
# from core.database import get_db
# from models.user import User

# router = APIRouter(prefix='/device', tags=['Device Control'])
# logger = logging.getLogger(__name__)

# # ── Cấu hình kết nối Pi ──────────────────────────────────────────────────────
# # Đọc từ backend/.env: PI_API_URL=http://192.168.137.2:5000
# PI_API_URL = os.getenv('PI_API_URL', 'http://192.168.137.2:5000')
# PI_API_KEY = os.getenv('PI_API_KEY', 'raspberry-pi-secret-key')


# # ── Schemas ──────────────────────────────────────────────────────────────────

# class EnrollRequest(BaseModel):
#     resident_id: int
#     name: str

# class HeartbeatPayload(BaseModel):
#     status: str = 'online'
#     temp: float | None = None

# class ChangePinRequest(BaseModel):
#     current_pin: str
#     new_pin: str


# # ── Helper: gọi HTTP đến Pi ──────────────────────────────────────────────────

# async def call_pi(method: str, path: str, body: dict | None = None) -> dict:
#     """
#     Forward lệnh từ Backend đến Pi Local API Server.
#     Raises HTTPException(502) nếu Pi không phản hồi.
#     """
#     url     = f'{PI_API_URL}{path}'
#     headers = {'X-Api-Key': PI_API_KEY, 'Content-Type': 'application/json'}

#     try:
#         async with httpx.AsyncClient(timeout=10.0) as client:
#             if method == 'GET':
#                 resp = await client.get(url, headers=headers)
#             else:
#                 resp = await client.post(url, headers=headers, json=body or {})
#             resp.raise_for_status()
#             return resp.json()
#     except httpx.ConnectError:
#         logger.error(f'Pi unreachable: {url}')
#         raise HTTPException(502, 'Cannot reach Raspberry Pi. Check IP and network.')
#     except httpx.TimeoutException:
#         logger.error(f'Pi timeout: {url}')
#         raise HTTPException(502, 'Raspberry Pi request timed out.')
#     except httpx.HTTPStatusError as e:
#         logger.error(f'Pi HTTP error {e.response.status_code}: {url}')
#         raise HTTPException(502, f'Pi returned error {e.response.status_code}')
#     except Exception as e:
#         logger.error(f'call_pi unexpected error: {e}')
#         raise HTTPException(502, f'Cannot reach Raspberry Pi: {str(e)}')


# # ── Endpoints: Pi → Backend (heartbeat, pending-pin) ─────────────────────────

# @router.post('/heartbeat')
# @router.post('/heartbeat/')
# async def device_heartbeat(payload: HeartbeatPayload):
#     """Pi báo cáo trạng thái sống định kỳ (mỗi 30 giây)."""
#     logger.debug(f'Heartbeat from Pi. Status: {payload.status}')
#     return {'status': 'ok', 'server_time': datetime.now(timezone.utc).isoformat()}


# @router.get('/pending-pin')
# @router.get('/pending-pin/')
# async def get_pending_pins(db: AsyncSession = Depends(get_db)):
#     """Pi hỏi xem có PIN mới cần cập nhật không."""
#     # Tích hợp đầy đủ với PinConfig model — hiện trả về danh sách trống
#     return {'pending_pins': []}


# # ── Endpoints: Web → Backend → Pi ────────────────────────────────────────────

# @router.post('/unlock-door')
# async def unlock_door(current_user: User = Depends(get_current_user)):
#     """Mở khóa cửa từ xa: Backend gọi Pi POST /door/unlock."""
#     await call_pi('POST', '/door/unlock')
#     await broadcast_event('door_opened', {
#         'triggered_by': current_user.username,
#         'method': 'remote',
#     })
#     return {'success': True, 'message': 'Door unlocked'}


# @router.post('/lock-door')
# async def lock_door(current_user: User = Depends(get_current_user)):
#     """Khóa cửa từ xa: Backend gọi Pi POST /door/lock."""
#     await call_pi('POST', '/door/lock')
#     await broadcast_event('door_locked', {
#         'triggered_by': current_user.username,
#     })
#     return {'success': True, 'message': 'Door locked'}


# @router.post('/stop-alarm')
# async def stop_alarm(current_user: User = Depends(get_current_user)):
#     """Dừng còi báo động: Backend gọi Pi POST /alarm/stop."""
#     await call_pi('POST', '/alarm/stop')
#     await broadcast_event('alarm_stopped', {
#         'triggered_by': current_user.username,
#         'stopped_by': 'dashboard',
#     })
#     return {'success': True, 'message': 'Alarm stopped'}


# @router.post('/change-pin')
# async def change_pin_via_device(
#     body: ChangePinRequest,
#     current_user: User = Depends(get_current_user),
# ):
#     """
#     Đổi PIN qua device endpoint (shortcut từ Dashboard).
#     Delegate sang /api/pin/update để tái sử dụng logic xác thực và sync.
#     """
#     # Import trực tiếp để gọi nội bộ thay vì HTTP round-trip
#     from api.routers.pin_management import update_pin, PinUpdateRequest
#     from core.database import AsyncSessionLocal

#     async with AsyncSessionLocal() as db:
#         result = await update_pin(
#             body=PinUpdateRequest(
#                 current_pin=body.current_pin,
#                 new_pin=body.new_pin,
#             ),
#             db=db,
#             current_user=current_user,
#         )
#     return result


# @router.get('/status')
# async def get_device_status(current_user: User = Depends(get_current_user)):
#     """Lấy trạng thái hiện tại của Pi (cửa, alarm, camera)."""
#     try:
#         result = await call_pi('GET', '/status')
#         return {'online': True, **result}
#     except HTTPException:
#         return {'online': False, 'door_locked': True, 'alarm_active': False, 'camera_active': False}


# @router.post('/trigger-enroll')
# async def trigger_enroll(
#     body: EnrollRequest,
#     current_user: User = Depends(get_current_user),
# ):
#     """Kích hoạt chụp ảnh đăng ký khuôn mặt trên Pi."""
#     await call_pi('POST', '/camera/enroll', {'name': body.name, 'id': body.resident_id})
#     await broadcast_event('enroll_started', {
#         'resident_id': body.resident_id,
#         'name': body.name,
#     })
#     return {'success': True}

"""
api/routers/device.py

Mục đích: Router điều khiển thiết bị từ xa.
  - Người dùng nhấn nút trên Web → Frontend gọi /api/device/... → Backend
    forward lệnh HTTP xuống Raspberry Pi (192.168.137.2:5000) → Pi xử lý
    phần cứng (UART → STM32).
"""

import logging
import os
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from api.routers.auth import get_current_user
from api.routers.websocket import broadcast_event
from core.database import get_db
from models.user import User

router = APIRouter(prefix='/device', tags=['Device Control'])
logger = logging.getLogger(__name__)

# ── Cấu hình kết nối Pi ──────────────────────────────────────────────────────
# Đọc từ backend/.env: PI_API_URL=http://192.168.137.2:5000
PI_API_URL = os.getenv('PI_API_URL', 'http://192.168.137.2:5000')
PI_API_KEY = os.getenv('PI_API_KEY', 'raspberry-pi-secret-key')


# ── Schemas ──────────────────────────────────────────────────────────────────

class EnrollRequest(BaseModel):
    resident_id: int
    name: str

class HeartbeatPayload(BaseModel):
    status: str = 'online'
    temp: float | None = None

class ChangePinRequest(BaseModel):
    current_pin: str
    new_pin: str


# ── Helper: gọi HTTP đến Pi ──────────────────────────────────────────────────

async def call_pi(method: str, path: str, body: dict | None = None) -> dict:
    """
    Forward lệnh từ Backend đến Pi Local API Server.
    Raises HTTPException(502) nếu Pi không phản hồi.
    """
    url     = f'{PI_API_URL}{path}'
    headers = {'X-Api-Key': PI_API_KEY, 'Content-Type': 'application/json'}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            if method == 'GET':
                resp = await client.get(url, headers=headers)
            else:
                resp = await client.post(url, headers=headers, json=body or {})
            resp.raise_for_status()
            return resp.json()
    except httpx.ConnectError:
        logger.error(f'Pi unreachable: {url}')
        raise HTTPException(502, 'Cannot reach Raspberry Pi. Check IP and network.')
    except httpx.TimeoutException:
        logger.error(f'Pi timeout: {url}')
        raise HTTPException(502, 'Raspberry Pi request timed out.')
    except httpx.HTTPStatusError as e:
        logger.error(f'Pi HTTP error {e.response.status_code}: {url}')
        raise HTTPException(502, f'Pi returned error {e.response.status_code}')
    except Exception as e:
        logger.error(f'call_pi unexpected error: {e}')
        raise HTTPException(502, f'Cannot reach Raspberry Pi: {str(e)}')


# ── Endpoints: Pi → Backend (heartbeat, pending-pin) ─────────────────────────

@router.post('/heartbeat')
@router.post('/heartbeat/')
async def device_heartbeat(payload: HeartbeatPayload):
    """Pi báo cáo trạng thái sống định kỳ (mỗi 30 giây)."""
    logger.debug(f'Heartbeat from Pi. Status: {payload.status}')
    return {'status': 'ok', 'server_time': datetime.now(timezone.utc).isoformat()}


@router.get('/pending-pin')
@router.get('/pending-pin/')
async def get_pending_pins(db: AsyncSession = Depends(get_db)):
    """Pi hỏi xem có PIN mới cần cập nhật không."""
    # Tích hợp đầy đủ với PinConfig model — hiện trả về danh sách trống
    return {'pending_pins': []}


# ── Endpoints: Web → Backend → Pi ────────────────────────────────────────────

@router.post('/unlock-door')
async def unlock_door(current_user: User = Depends(get_current_user)):
    """Mở khóa cửa từ xa: Backend gọi Pi POST /door/unlock."""
    await call_pi('POST', '/door/unlock')
    await broadcast_event('door_opened', {
        'triggered_by': current_user.username,
        'method': 'remote',
    })
    return {'success': True, 'message': 'Door unlocked'}


@router.post('/lock-door')
async def lock_door(current_user: User = Depends(get_current_user)):
    """Khóa cửa từ xa: Backend gọi Pi POST /door/lock."""
    await call_pi('POST', '/door/lock')
    await broadcast_event('door_locked', {
        'triggered_by': current_user.username,
    })
    return {'success': True, 'message': 'Door locked'}


@router.post('/stop-alarm')
async def stop_alarm(current_user: User = Depends(get_current_user)):
    """Dừng còi báo động: Backend gọi Pi POST /alarm/stop."""
    await call_pi('POST', '/alarm/stop')
    await broadcast_event('alarm_stopped', {
        'triggered_by': current_user.username,
        'stopped_by': 'dashboard',
    })
    return {'success': True, 'message': 'Alarm stopped'}


# ✅ ĐÃ THÊM: Endpoint Test Buzzer (Phục vụ nút bấm trên Dashboard)
@router.post('/test-buzzer')
async def test_buzzer(current_user: User = Depends(get_current_user)):
    """Kích hoạt còi ngắn để kiểm tra phần cứng."""
    await call_pi('POST', '/buzzer/test')
    return {'success': True, 'message': 'Buzzer test triggered'}


@router.post('/change-pin')
async def change_pin_via_device(
    body: ChangePinRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Đổi PIN qua device endpoint (shortcut từ Dashboard).
    Delegate sang /api/pin/update để tái sử dụng logic xác thực và sync.
    """
    # Import trực tiếp để gọi nội bộ thay vì HTTP round-trip
    from api.routers.pin_management import update_pin, PinUpdateRequest
    from core.database import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        result = await update_pin(
            body=PinUpdateRequest(
                current_pin=body.current_pin,
                new_pin=body.new_pin,
            ),
            db=db,
            current_user=current_user,
        )
    return result


@router.get('/status')
async def get_device_status(current_user: User = Depends(get_current_user)):
    """Lấy trạng thái hiện tại của Pi (cửa, alarm, camera)."""
    try:
        result = await call_pi('GET', '/status')
        return {'online': True, **result}
    except HTTPException:
        return {'online': False, 'door_locked': True, 'alarm_active': False, 'camera_active': False}


@router.post('/trigger-enroll')
async def trigger_enroll(
    body: EnrollRequest,
    current_user: User = Depends(get_current_user),
):
    """Kích hoạt chụp ảnh đăng ký khuôn mặt trên Pi."""
    await call_pi('POST', '/camera/enroll', {'name': body.name, 'id': body.resident_id})
    await broadcast_event('enroll_started', {
        'resident_id': body.resident_id,
        'name': body.name,
    })
    return {'success': True}
