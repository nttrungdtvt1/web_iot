"""core/database.py
SQLAlchemy engine, session factory, and Base model.
Supports SQLite (dev) and PostgreSQL (prod) via DATABASE_URL env variable.
"""

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./smart_door.db")

# Convert sync URL to async URL for async engine
def get_async_url(url: str) -> str:
    if url.startswith("sqlite:///"):
        return url.replace("sqlite:///", "sqlite+aiosqlite:///")
    elif url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://")
    return url

ASYNC_DATABASE_URL = get_async_url(DATABASE_URL)

# Async engine configuration
if "sqlite" in ASYNC_DATABASE_URL:
    # SQLite needs special pool config for async
    async_engine = create_async_engine(
        ASYNC_DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=True,
    )
else:
    async_engine = create_async_engine(
        ASYNC_DATABASE_URL,
        echo=False,
        pool_size=10,
        max_overflow=20,
    )

# Session factory
AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


async def get_db() -> AsyncSession:
    """
    FastAPI dependency: yields an async database session.
    Ensures session is closed after use.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """
    Initialize the database by creating all tables.
    Called on application startup.
    """
    async with async_engine.begin() as conn:
        # Import all models so Base knows about them
        from models.resident import Resident  # noqa: F401 — needed for Base.metadata
        from models.access_log import AccessLog  # noqa: F401
        from models.system_event import SystemEvent  # noqa: F401
        from models.user import User  # noqa: F401
        from models.pin_config import PinConfig  # noqa: F401

        await conn.run_sync(Base.metadata.create_all)
