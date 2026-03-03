"""EDI: edi_configs, edi_records.

Revision ID: 018
Revises: 017
Create Date: 2026-03-03
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "018"
down_revision: Union[str, None] = "017"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "edi_configs",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("edi_type", sa.String(100), nullable=True),
        sa.Column("mode", sa.String(50), nullable=True),
        sa.Column("tid", sa.String(100), nullable=True),
        sa.Column("tsi", sa.String(100), nullable=True),
        sa.Column("remarks", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )

    op.create_table(
        "edi_records",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("edi_config_id", sa.Uuid(), nullable=True),
        sa.Column("company", sa.String(255), nullable=True),
        sa.Column("report_date", sa.Date(), nullable=True),
        sa.Column("report_type", sa.String(100), nullable=True),
        sa.Column("client", sa.String(255), nullable=True),
        sa.Column("invoice_number", sa.String(100), nullable=True),
        sa.Column("bol_number", sa.String(100), nullable=True),
        sa.Column("po_number", sa.String(100), nullable=True),
        sa.Column("tracking_number", sa.String(100), nullable=True),
        sa.Column("ap_date", sa.Date(), nullable=True),
        sa.Column("sent_by", sa.String(255), nullable=True),
        sa.Column("sent_at", sa.DateTime(), nullable=True),
        sa.Column("status", sa.String(50), nullable=True, server_default="pending"),
        sa.Column("tp_number", sa.String(100), nullable=True),
        sa.Column("tp_name", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("edi_records")
    op.drop_table("edi_configs")
