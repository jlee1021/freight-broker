"""Account modules: item_types, expenses, expense_details, debit_credits.

Revision ID: 014
Revises: 013
Create Date: 2026-03-03
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "014"
down_revision: Union[str, None] = "013"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. 아이템 유형 마스터
    op.create_table(
        "item_types",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("code", sa.String(50), nullable=True),
        sa.Column("type_name", sa.String(255), nullable=False),
        sa.Column("lvl1", sa.String(100), nullable=True),
        sa.Column("lvl2", sa.String(100), nullable=True),
        sa.Column("dividers", sa.String(100), nullable=True),
        sa.Column("uom", sa.String(50), nullable=True),
        sa.Column("rc", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("rebate", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("account_type", sa.String(100), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_item_types_code", "item_types", ["code"])

    # 2. 비용 항목
    op.create_table(
        "expenses",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("ref_no", sa.String(100), nullable=True),
        sa.Column("item_type_id", sa.Uuid(), sa.ForeignKey("item_types.id", ondelete="SET NULL"), nullable=True),
        sa.Column("bill_to", sa.String(255), nullable=True),
        sa.Column("po_no", sa.String(100), nullable=True),
        sa.Column("memo", sa.Text(), nullable=True),
        sa.Column("expense_date", sa.Date(), nullable=True),
        sa.Column("amount", sa.Numeric(12, 2), nullable=True, server_default="0"),
        sa.Column("tax_amount", sa.Numeric(12, 2), nullable=True, server_default="0"),
        sa.Column("account", sa.String(255), nullable=True),
        sa.Column("vendor", sa.String(255), nullable=True),
        sa.Column("status", sa.String(50), nullable=True, server_default="pending"),
        sa.Column("created_by", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )

    # 3. 비용 상세
    op.create_table(
        "expense_details",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("expense_id", sa.Uuid(), sa.ForeignKey("expenses.id", ondelete="CASCADE"), nullable=False),
        sa.Column("entry_number", sa.String(100), nullable=True),
        sa.Column("general_account", sa.String(255), nullable=True),
        sa.Column("entry_type", sa.String(100), nullable=True),
        sa.Column("status", sa.String(50), nullable=True),
        sa.Column("accountability", sa.String(255), nullable=True),
        sa.Column("vendor", sa.String(255), nullable=True),
        sa.Column("amount", sa.Numeric(12, 2), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )

    # 4. 차변/대변
    op.create_table(
        "debit_credits",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("entry_type", sa.String(20), nullable=False),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("debit_amount", sa.Numeric(12, 2), nullable=True, server_default="0"),
        sa.Column("credit_amount", sa.Numeric(12, 2), nullable=True, server_default="0"),
        sa.Column("customer_code", sa.String(100), nullable=True),
        sa.Column("tax_number", sa.String(100), nullable=True),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("attachment_url", sa.String(512), nullable=True),
        sa.Column("status", sa.String(50), nullable=True, server_default="pending"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("debit_credits")
    op.drop_table("expense_details")
    op.drop_table("expenses")
    op.drop_table("item_types")
