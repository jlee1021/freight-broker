"""Settings masters: cities, type_masters, subtype_masters, permissions.

Revision ID: 012
Revises: 011
Create Date: 2026-03-03
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "012"
down_revision: Union[str, None] = "011"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. 도시 마스터
    op.create_table(
        "cities",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("code", sa.String(20), nullable=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("province", sa.String(100), nullable=True),
        sa.Column("country", sa.String(100), nullable=True, server_default="CANADA"),
        sa.Column("zip_code", sa.String(20), nullable=True),
        sa.Column("timezone", sa.String(100), nullable=True),
        sa.Column("remarks", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_cities_code", "cities", ["code"])

    # 2. 유형 마스터 (Type)
    op.create_table(
        "type_masters",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("type_name", sa.String(255), nullable=False),
        sa.Column("use_subtype", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("remark", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )

    # 3. 서브 유형 마스터 (SubType)
    op.create_table(
        "subtype_masters",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("parent_id", sa.Uuid(), sa.ForeignKey("type_masters.id", ondelete="CASCADE"), nullable=False),
        sa.Column("subtype_name", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
    )

    # 4. 권한 마스터
    op.create_table(
        "permissions",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("resource", sa.String(100), nullable=True),
        sa.Column("action", sa.String(50), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_permissions_name", "permissions", ["name"], unique=True)


def downgrade() -> None:
    op.drop_table("permissions")
    op.drop_table("subtype_masters")
    op.drop_table("type_masters")
    op.drop_table("cities")
