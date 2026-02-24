"""User partner_id for customer/carrier portal.

Revision ID: 010
Revises: 009
Create Date: 2025-02-23

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "010"
down_revision: Union[str, None] = "009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("partner_id", sa.Uuid(), nullable=True))
    op.create_foreign_key(
        "fk_users_partner_id_partners",
        "users",
        "partners",
        ["partner_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint("fk_users_partner_id_partners", "users", type_="foreignkey")
    op.drop_column("users", "partner_id")
