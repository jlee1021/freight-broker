"""Consolidation: consolidations, consolidation_shippers, consolidation_consignees.

Revision ID: 017
Revises: 016
Create Date: 2026-03-03
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "017"
down_revision: Union[str, None] = "016"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "consolidations",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("consolidation_number", sa.String(50), nullable=False, unique=True),
        sa.Column("status", sa.String(50), nullable=True, server_default="pending"),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("equipment_type", sa.String(100), nullable=True),
        sa.Column("total_weight", sa.Numeric(12, 2), nullable=True),
        sa.Column("weight_unit", sa.String(10), nullable=True, server_default="lbs"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_by", sa.String(255), nullable=True),
        sa.Column("last_modified_by", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_consolidations_number", "consolidations", ["consolidation_number"])

    op.create_table(
        "consolidation_shippers",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("consolidation_id", sa.Uuid(), sa.ForeignKey("consolidations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("partner_id", sa.Uuid(), sa.ForeignKey("partners.id", ondelete="SET NULL"), nullable=True),
        sa.Column("name", sa.String(255), nullable=True),
        sa.Column("address", sa.String(512), nullable=True),
        sa.Column("city", sa.String(255), nullable=True),
        sa.Column("contact", sa.String(255), nullable=True),
        sa.Column("pickup_date", sa.Date(), nullable=True),
        sa.Column("pallet_count", sa.Integer(), nullable=True),
        sa.Column("weight", sa.Numeric(12, 2), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("sequence", sa.Integer(), nullable=True, server_default="1"),
    )

    op.create_table(
        "consolidation_consignees",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("consolidation_id", sa.Uuid(), sa.ForeignKey("consolidations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("partner_id", sa.Uuid(), sa.ForeignKey("partners.id", ondelete="SET NULL"), nullable=True),
        sa.Column("name", sa.String(255), nullable=True),
        sa.Column("address", sa.String(512), nullable=True),
        sa.Column("city", sa.String(255), nullable=True),
        sa.Column("contact", sa.String(255), nullable=True),
        sa.Column("delivery_date", sa.Date(), nullable=True),
        sa.Column("pallet_count", sa.Integer(), nullable=True),
        sa.Column("weight", sa.Numeric(12, 2), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("sequence", sa.Integer(), nullable=True, server_default="1"),
    )


def downgrade() -> None:
    op.drop_table("consolidation_consignees")
    op.drop_table("consolidation_shippers")
    op.drop_table("consolidations")
