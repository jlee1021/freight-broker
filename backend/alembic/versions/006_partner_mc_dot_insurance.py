"""Partner: mc_number, dot_number, insurance_expiry, payment_terms.

Revision ID: 006
Revises: 005
Create Date: 2025-02-23

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("partners", sa.Column("mc_number", sa.String(50), nullable=True))
    op.add_column("partners", sa.Column("dot_number", sa.String(50), nullable=True))
    op.add_column("partners", sa.Column("insurance_expiry", sa.Date(), nullable=True))
    op.add_column("partners", sa.Column("payment_terms", sa.String(100), nullable=True))


def downgrade() -> None:
    op.drop_column("partners", "payment_terms")
    op.drop_column("partners", "insurance_expiry")
    op.drop_column("partners", "dot_number")
    op.drop_column("partners", "mc_number")
