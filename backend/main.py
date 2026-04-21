# """
# main.py
# FastAPI application factory.
# Mounts all routers, configures CORS, runs startup tasks (DB init, seed admin).
# """

# import logging
# import os
# from contextlib import asynccontextmanager

# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from dotenv import load_dotenv

# from core.database import init_db, AsyncSessionLocal
# from core.security import hash_password
# from models.user import User
# from sqlalchemy import select

# load_dotenv()

# logging.basicConfig(
#     level=logging.INFO,
#     format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
# )
# logger = logging.getLogger(__name__)

# # ✅ Tối ưu CORS: Cho phép cả localhost và IP mạng LAN của bạn
# CORS_ORIGINS = os.getenv(
#     "CORS_ORIGINS",
#     "http://localhost:3000,http://localhost:5173,http://10.6.4.204:5173,http://127.0.0.1:5173"
# ).split(",")


# # ─── Lifespan (startup / shutdown) ───────────────────────────────────────────

# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     """Xử lý khởi tạo khi bật Server và dọn dẹp khi tắt Server."""
#     logger.info("Starting Smart Door API...")

#     # Khởi tạo các bảng trong Database
#     await init_db()
#     logger.info("Database initialized")

#     # Tạo Admin mặc định nếu chưa có
#     await seed_admin()

#     yield
#     logger.info("Application shutting down")


# async def seed_admin():
#     """Tạo tài khoản admin/admin123 nếu DB trống."""
#     async with AsyncSessionLocal() as db:
#         result = await db.execute(select(User).limit(1))
#         if result.scalar_one_or_none() is None:
#             admin = User(
#                 username="admin",
#                 email="admin@smartdoor.local",
#                 hashed_password=hash_password("admin123"),
#                 is_active=True,
#                 is_superuser=True,
#             )
#             db.add(admin)
#             await db.commit()
#             logger.info("Default admin user created: admin / admin123")


# # ─── App factory ─────────────────────────────────────────────────────────────

# def create_app() -> FastAPI:
#     app = FastAPI(
#         title="Smart Door Access Control API",
#         version="1.0.0",
#         lifespan=lifespan,
#         docs_url="/api/docs",
#         openapi_url="/api/openapi.json",
#     )

#     # ✅ VÁ LỖI 404: Tắt strict_slashes để chấp nhận cả /heartbeat và /heartbeat/
#     app.router.redirect_slashes = False

#     app.add_middleware(
#         CORSMiddleware,
#         allow_origins=CORS_ORIGINS,
#         allow_credentials=True,
#         allow_methods=["*"],
#         allow_headers=["*"],
#     )

#     # ─── Mount routers ────────────────────────────────────────────────────────
#     from api.routers.auth import router as auth_router
#     from api.routers.residents import router as residents_router
#     from api.routers.access_logs import router as access_logs_router
#     from api.routers.events import router as events_router
#     from api.routers.device import router as device_router
#     from api.routers.pin_management import router as pin_router
#     from api.routers.websocket import router as ws_router

#     API_PREFIX = "/api"

#     # Gắn các module vào đường dẫn /api
#     app.include_router(auth_router, prefix=API_PREFIX)
#     app.include_router(residents_router, prefix=API_PREFIX)
#     app.include_router(access_logs_router, prefix=API_PREFIX)
#     app.include_router(events_router, prefix=API_PREFIX)
#     app.include_router(device_router, prefix=API_PREFIX)
#     app.include_router(pin_router, prefix=API_PREFIX)

#     # WebSocket thường không dùng prefix /api để Nginx dễ cấu hình proxy
#     app.include_router(ws_router)

#     @app.get("/health", tags=["Health"])
#     async def health_check():
#         return {"status": "ok", "ip_config": "10.6.4.204"}

#     return app


# app = create_app()

# if __name__ == "__main__":
#     import uvicorn
#     # Chạy server trên tất cả các card mạng (0.0.0.0) để Pi có thể kết nối vào
#     uvicorn.run(
#         "main:app",
#         host="0.0.0.0",
#         port=8000,
#         reload=True,
#     )

"""
backend/main.py

Mục đích: FastAPI application factory — khởi tạo app, mount routers,
          cấu hình CORS, chạy startup tasks (DB init, seed admin).

VẤN ĐỀ CŨ:
  - CORS_ORIGINS hard-code IP cũ "10.6.4.204" → trình duyệt bị block CORS.
  - health endpoint trả về ip_config sai.

GIẢI PHÁP:
  - Đọc CORS_ORIGINS từ .env (đã cấu hình đúng IP mạng LAN 192.168.137.1).
  - redirect_slashes=False để chấp nhận cả /heartbeat và /heartbeat/.

KIẾN TRÚC:
  Windows PC (Server): 192.168.137.1
    - FastAPI chạy tại port 8000
    - Nhận request từ:
        * Vite proxy (Frontend) qua /api/*
        * Raspberry Pi qua POST /api/events, GET /api/device/pending-pin, v.v.
"""

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from core.database import init_db, AsyncSessionLocal
from core.security import hash_password
from models.user import User
from sqlalchemy import select

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(name)s | %(message)s',
)
logger = logging.getLogger(__name__)

# Đọc CORS từ .env — đã bao gồm IP LAN 192.168.137.1:5173
# CORS_ORIGINS = os.getenv(
#     'CORS_ORIGINS',
#     'http://localhost:3000,http://localhost:5173,http://192.168.137.1:5173,http://127.0.0.1:5173'
# ).split(',')
CORS_ORIGINS = os.getenv(
    'CORS_ORIGINS',
    'http://localhost:3000,http://localhost:5173,https://localhost:5173,'
    'http://192.168.137.1:5173,https://192.168.137.1:5173,'
    'http://127.0.0.1:5173,https://127.0.0.1:5173'
).split(',')

# ─── Lifespan ────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info('Starting Smart Door API...')
    await init_db()
    logger.info('Database initialized')
    await seed_admin()
    yield
    logger.info('Application shutting down')


async def seed_admin():
    """Tạo tài khoản admin/admin123 nếu DB trống."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).limit(1))
        if result.scalar_one_or_none() is None:
            admin = User(
                username='admin',
                email='admin@smartdoor.local',
                hashed_password=hash_password('admin123'),
                is_active=True,
                is_superuser=True,
            )
            db.add(admin)
            await db.commit()
            logger.info('Default admin created: admin / admin123')


# ─── App factory ─────────────────────────────────────────────────────────────

def create_app() -> FastAPI:
    app = FastAPI(
        title='Smart Door Access Control API',
        version='1.0.0',
        lifespan=lifespan,
        docs_url='/api/docs',
        openapi_url='/api/openapi.json',
    )

    # Tắt redirect_slashes để chấp nhận /heartbeat và /heartbeat/ như nhau
    app.router.redirect_slashes = False

    app.add_middleware(
        CORSMiddleware,
        allow_origins=CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=['*'],
        allow_headers=['*'],
    )

    # ─── Mount routers ────────────────────────────────────────────────────
    from api.routers.auth          import router as auth_router
    from api.routers.residents     import router as residents_router
    from api.routers.access_logs   import router as access_logs_router
    from api.routers.events        import router as events_router
    from api.routers.device        import router as device_router
    from api.routers.pin_management import router as pin_router
    from api.routers.websocket     import router as ws_router

    API_PREFIX = '/api'

    app.include_router(auth_router,          prefix=API_PREFIX)
    app.include_router(residents_router,     prefix=API_PREFIX)
    app.include_router(access_logs_router,   prefix=API_PREFIX)
    app.include_router(events_router,        prefix=API_PREFIX)
    app.include_router(device_router,        prefix=API_PREFIX)
    app.include_router(pin_router,           prefix=API_PREFIX)

    # WebSocket không dùng prefix /api để Nginx dễ proxy (location /ws/)
    app.include_router(ws_router)

    @app.get('/health', tags=['Health'])
    async def health_check():
        return {'status': 'ok', 'server': '192.168.137.1', 'pi': '192.168.137.2'}

    return app


app = create_app()

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(
        'main:app',
        host='0.0.0.0',   # bind tất cả interfaces để Pi cũng gọi được
        port=8000,
        reload=True,
    )
