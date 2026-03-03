"""Inventory expansion: size, cost, total, entry_date, note.

Revision ID: 015
Revises: 014
Create Date: 2026-03-03
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "015"
down_revision: Union[str, None] = "014"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("inventory_items", sa.Column("size", sa.String(100), nullable=True))
    op.add_column("inventory_items", sa.Column("cost", sa.Numeric(12, 2), nullable=True, server_default="0"))
    op.add_column("inventory_items", sa.Column("total", sa.Numeric(14, 2), nullable=True, server_default="0"))
    op.add_column("inventory_items", sa.Column("entry_date", sa.Date(), nullable=True))
    op.add_column("inventory_items", sa.Column("note", sa.Text(), nullable=True))


def downgrade() -> None:
    for col in ["size", "cost", "total", "entry_date", "note"]:
        op.drop_column("inventory_items", col)
