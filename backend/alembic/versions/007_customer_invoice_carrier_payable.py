"""Customer invoices (AR) and carrier payables (AP).

Revision ID: 007
Revises: 006
Create Date: 2025-02-23

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "007"
down_revision: Union[str, None] = "006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "customer_invoices",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("load_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("customer_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("invoice_number", sa.String(50), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("status", sa.String(20), nullable=True),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("sent_at", sa.DateTime(), nullable=True),
        sa.Column("paid_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["customer_id"], ["partners.id"]),
        sa.ForeignKeyConstraint(["load_id"], ["loads.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_customer_invoices_invoice_number", "customer_invoices", ["invoice_number"], unique=True)
    op.create_table(
        "carrier_payables",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("carrier_segment_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("invoice_number", sa.String(50), nullable=True),
        sa.Column("status", sa.String(20), nullable=True),
        sa.Column("paid_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["carrier_segment_id"], ["carrier_segments.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("carrier_payables")
    op.drop_index("ix_customer_invoices_invoice_number", table_name="customer_invoices")
    op.drop_table("customer_invoices")
