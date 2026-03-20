# api/routers/__init__.py
from .auth import router as auth_router
from .access_logs import router as access_logs_router
from .residents import router as residents_router
from .events import router as events_router
from .device import router as device_router
from .pin_management import router as pin_management_router
from .websocket import router as websocket_router

__all__ = [
    "auth_router",
    "access_logs_router",
    "residents_router",
    "events_router",
    "device_router",
    "pin_management_router",
    "websocket_router",
]
