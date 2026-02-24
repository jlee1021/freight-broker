"""Warehouses and inventory_items tables.

Revision ID: 004
Revises: 003
Create Date: 2025-02-23

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "warehouses",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("address", sa.String(512), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "inventory_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("warehouse_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("sku", sa.String(100), nullable=True),
        sa.Column("name", sa.String(255), nullable=True),
        sa.Column("quantity", sa.Numeric(12, 2), nullable=True),
        sa.ForeignKeyConstraint(["warehouse_id"], ["warehouses.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("inventory_items")
    op.drop_table("warehouses")
