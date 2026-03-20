"""Add pin_config table

Revision ID: 002_add_pin_config
Revises: 001_initial
Create Date: 2024-01-02 00:00:00
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "002_add_pin_config"
down_revision: Union[str, None] = "001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "pin_config",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("hashed_pin", sa.String(256), nullable=False),
        sa.Column(
            "pi_synced",
            sa.Boolean(),
            nullable=False,
            server_default="false",
        ),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("pin_config")
