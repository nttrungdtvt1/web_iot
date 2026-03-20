"""
alembic/env.py
Alembic migration environment configuration.
Supports async SQLAlchemy with SQLite and PostgreSQL.
"""

import asyncio
import os
import sys
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

# from models.pin import PinConfig  # noqa  ← thêm dòng này

from alembic import context
from dotenv import load_dotenv

# Make sure backend root is on the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

load_dotenv()

# Alembic Config object from alembic.ini
config = context.config

# Set up Python logging from alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Import all models so Alembic can detect them
from core.database import Base      # noqa
from models.user import User        # noqa
from models.resident import Resident        # noqa
from models.access_log import AccessLog     # noqa
from models.system_event import SystemEvent # noqa

target_metadata = Base.metadata

# Override sqlalchemy.url from environment variable
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./smart_door.db")


def get_async_url(url: str) -> str:
    """
    Convert a plain DB URL to its async-driver equivalent.
    Idempotent — safe to call even if URL is already async format.
    """
    # ✅ fix: kiểm tra đã là async format chưa trước khi convert
    if url.startswith("sqlite+aiosqlite"):
        return url
    if url.startswith("sqlite:///"):
        return url.replace("sqlite:///", "sqlite+aiosqlite:///", 1)

    if url.startswith("postgresql+asyncpg"):
        return url
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("postgres://"):
        # Heroku / Railway hay dùng "postgres://"
        return url.replace("postgres://", "postgresql+asyncpg://", 1)

    return url


def get_sync_url(url: str) -> str:
    """
    Return a sync-driver URL for offline mode (no actual connection needed).
    Offline mode chỉ render SQL text nên không cần async driver.
    """
    # ✅ fix: offline dùng sync URL để tránh asyncpg/aiosqlite raise error
    if url.startswith("sqlite+aiosqlite"):
        return url.replace("sqlite+aiosqlite", "sqlite", 1)
    if url.startswith("postgresql+asyncpg"):
        return url.replace("postgresql+asyncpg", "postgresql", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)
    return url


def _is_sqlite(url: str) -> bool:
    return "sqlite" in url


def run_migrations_offline() -> None:
    """
    Run migrations in 'offline' mode.
    No database connection needed — generates SQL scripts.
    """
    # ✅ fix: dùng sync URL cho offline mode
    url = get_sync_url(DATABASE_URL)

    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,            # ✅ fix: detect server_default changes
        render_as_batch=_is_sqlite(url),        # ✅ fix: SQLite cần batch mode
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        compare_server_default=True,                    # ✅ fix
        render_as_batch=_is_sqlite(str(connection.engine.url)),  # ✅ fix
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations using async engine."""
    configuration = config.get_section(config.config_ini_section, {})
    # ✅ fix: dùng async URL cho online mode
    configuration["sqlalchemy.url"] = get_async_url(DATABASE_URL)

    connectable = async_engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode (with live DB connection)."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
