"""Initial migration — create all tables

Revision ID: 001_initial
Revises:
Create Date: 2024-01-01 00:00:00
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ------------------------------------------------------------------
    # users
    # ------------------------------------------------------------------
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("username", sa.String(64), nullable=False),
        sa.Column("email", sa.String(128), nullable=False),
        sa.Column("hashed_password", sa.String(256), nullable=False),
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default="true",   # ✅ fix: PostgreSQL-compatible
        ),
        sa.Column(
            "is_superuser",
            sa.Boolean(),
            nullable=False,
            server_default="false",  # ✅ fix: PostgreSQL-compatible
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=True,
            server_default=sa.text("NOW()"),  # ✅ fix: auto-set on insert
        ),
        sa.Column("last_login", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_id",       "users", ["id"])
    op.create_index("ix_users_username", "users", ["username"], unique=True)
    op.create_index("ix_users_email",    "users", ["email"],    unique=True)

    # ------------------------------------------------------------------
    # residents
    # ------------------------------------------------------------------
    op.create_table(
        "residents",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(128), nullable=False),
        sa.Column("email", sa.String(128), nullable=True),
        sa.Column("phone", sa.String(32), nullable=True),
        sa.Column("face_image_url", sa.Text(), nullable=True),
        sa.Column("face_image_public_id", sa.String(256), nullable=True),
        sa.Column("face_encoding", sa.Text(), nullable=True),
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default="true",  # ✅ fix
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=True,
            server_default=sa.text("NOW()"),  # ✅ fix
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_residents_id",   "residents", ["id"])
    op.create_index("ix_residents_name", "residents", ["name"])

    # ------------------------------------------------------------------
    # access_logs
    # ------------------------------------------------------------------
    op.create_table(
        "access_logs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("resident_id", sa.Integer(), nullable=True),
        sa.Column(
            "timestamp",
            sa.DateTime(timezone=True),
            nullable=True,
            server_default=sa.text("NOW()"),  # ✅ fix: auto-set on insert
        ),
        sa.Column("method", sa.String(32), nullable=True),
        sa.Column("status", sa.String(32), nullable=True),
        sa.Column("image_url", sa.Text(), nullable=True),
        sa.Column("image_public_id", sa.String(256), nullable=True),  # ✅ fix: thêm để xóa ảnh Cloudinary
        sa.Column("notes", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(
            ["resident_id"], ["residents.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_access_logs_id",          "access_logs", ["id"])
    op.create_index("ix_access_logs_timestamp",   "access_logs", ["timestamp"])
    op.create_index("ix_access_logs_status",      "access_logs", ["status"])
    op.create_index("ix_access_logs_resident_id", "access_logs", ["resident_id"])

    # ------------------------------------------------------------------
    # system_events
    # ------------------------------------------------------------------
    op.create_table(
        "system_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("type", sa.String(64), nullable=False),
        sa.Column("payload_json", sa.Text(), nullable=True),
        sa.Column("image_url", sa.Text(), nullable=True),
        sa.Column(
            "timestamp",
            sa.DateTime(timezone=True),
            nullable=True,
            server_default=sa.text("NOW()"),  # ✅ fix: auto-set on insert
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_system_events_id",        "system_events", ["id"])
    op.create_index("ix_system_events_type",      "system_events", ["type"])
    op.create_index("ix_system_events_timestamp", "system_events", ["timestamp"])


def downgrade() -> None:
    # ✅ fix: drop indexes trước để tránh lỗi constraint trên một số DB engine
    op.drop_index("ix_system_events_timestamp", table_name="system_events")
    op.drop_index("ix_system_events_type",      table_name="system_events")
    op.drop_index("ix_system_events_id",        table_name="system_events")
    op.drop_table("system_events")

    op.drop_index("ix_access_logs_resident_id", table_name="access_logs")
    op.drop_index("ix_access_logs_status",      table_name="access_logs")
    op.drop_index("ix_access_logs_timestamp",   table_name="access_logs")
    op.drop_index("ix_access_logs_id",          table_name="access_logs")
    op.drop_table("access_logs")

    op.drop_index("ix_residents_name", table_name="residents")
    op.drop_index("ix_residents_id",   table_name="residents")
    op.drop_table("residents")

    op.drop_index("ix_users_email",    table_name="users")
    op.drop_index("ix_users_username", table_name="users")
    op.drop_index("ix_users_id",       table_name="users")
    op.drop_table("users")
