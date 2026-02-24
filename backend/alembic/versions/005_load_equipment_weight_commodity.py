"""Load: equipment_type, weight, weight_unit, commodity, po_number.

Revision ID: 005
Revises: 004
Create Date: 2025-02-23

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("loads", sa.Column("equipment_type", sa.String(50), nullable=True))
    op.add_column("loads", sa.Column("weight", sa.Numeric(12, 2), nullable=True))
    op.add_column("loads", sa.Column("weight_unit", sa.String(10), nullable=True))
    op.add_column("loads", sa.Column("commodity", sa.String(255), nullable=True))
    op.add_column("loads", sa.Column("po_number", sa.String(100), nullable=True))


def downgrade() -> None:
    op.drop_column("loads", "po_number")
    op.drop_column("loads", "commodity")
    op.drop_column("loads", "weight_unit")
    op.drop_column("loads", "weight")
    op.drop_column("loads", "equipment_type")
