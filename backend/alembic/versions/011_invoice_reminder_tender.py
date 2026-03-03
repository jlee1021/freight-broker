"""AR invoice reminder fields + tenders table.

Revision ID: 011
Revises: 010
Create Date: 2026-02-24
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "011"
down_revision: Union[str, None] = "010"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # AR 인보이스 리마인더 추적 필드
    op.add_column("customer_invoices", sa.Column("last_reminder_sent_at", sa.DateTime(), nullable=True))
    op.add_column("customer_invoices", sa.Column("reminder_sent_count", sa.Integer(), nullable=False, server_default="0"))

    # Tender 테이블 (캐리어에게 화물 제안 발송)
    op.create_table(
        "tenders",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("load_id", sa.Uuid(), sa.ForeignKey("loads.id", ondelete="CASCADE"), nullable=False),
        sa.Column("carrier_id", sa.Uuid(), sa.ForeignKey("partners.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("token", sa.String(64), nullable=False, unique=True),
        sa.Column("rate_offered", sa.Numeric(12, 2), nullable=True),
        sa.Column("reject_reason", sa.String(100), nullable=True),
        sa.Column("sent_at", sa.DateTime(), nullable=True),
        sa.Column("responded_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_tenders_load_id", "tenders", ["load_id"])
    op.create_index("ix_tenders_carrier_id", "tenders", ["carrier_id"])
    op.create_index("ix_tenders_token", "tenders", ["token"], unique=True)


def downgrade() -> None:
    op.drop_table("tenders")
    op.drop_column("customer_invoices", "reminder_sent_count")
    op.drop_column("customer_invoices", "last_reminder_sent_at")
