"""Attachment document_type (POD etc), carrier segment rating/on_time.

Revision ID: 009
Revises: 008
Create Date: 2025-02-23

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "009"
down_revision: Union[str, None] = "008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("load_attachments", sa.Column("document_type", sa.String(50), nullable=True))
    op.execute("UPDATE load_attachments SET document_type = 'other' WHERE document_type IS NULL")
    op.add_column("carrier_segments", sa.Column("rating", sa.Integer(), nullable=True))
    op.add_column("carrier_segments", sa.Column("on_time", sa.Boolean(), nullable=True))


def downgrade() -> None:
    op.drop_column("carrier_segments", "on_time")
    op.drop_column("carrier_segments", "rating")
    op.drop_column("load_attachments", "document_type")
