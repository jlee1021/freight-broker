"""Load/Order expansion: bill_to, audit fields, shipper/consignee pallet extension, carrier segment extension.

Revision ID: 016
Revises: 015
Create Date: 2026-03-03
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "016"
down_revision: Union[str, None] = "015"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. loads 테이블 확장
    op.add_column("loads", sa.Column("bill_to", sa.String(255), nullable=True))
    op.add_column("loads", sa.Column("order_id", sa.String(100), nullable=True))
    op.add_column("loads", sa.Column("freight_id", sa.String(100), nullable=True))
    op.add_column("loads", sa.Column("is_on_hold", sa.Boolean(), nullable=True, server_default="false"))
    op.add_column("loads", sa.Column("load_type", sa.String(50), nullable=True))
    op.add_column("loads", sa.Column("ref_number", sa.String(100), nullable=True))
    op.add_column("loads", sa.Column("created_by", sa.String(255), nullable=True))
    op.add_column("loads", sa.Column("last_modified_by", sa.String(255), nullable=True))

    # 2. shipper_stops 팔레트 확장 (명시적 컬럼)
    op.add_column("shipper_stops", sa.Column("total_pallets", sa.Integer(), nullable=True))
    op.add_column("shipper_stops", sa.Column("temperature", sa.String(50), nullable=True))
    op.add_column("shipper_stops", sa.Column("gross_value", sa.Numeric(12, 2), nullable=True))
    op.add_column("shipper_stops", sa.Column("cubic", sa.Numeric(10, 2), nullable=True))
    op.add_column("shipper_stops", sa.Column("weight_stop", sa.Numeric(12, 2), nullable=True))
    op.add_column("shipper_stops", sa.Column("width", sa.Numeric(8, 2), nullable=True))
    op.add_column("shipper_stops", sa.Column("length", sa.Numeric(8, 2), nullable=True))
    op.add_column("shipper_stops", sa.Column("height", sa.Numeric(8, 2), nullable=True))
    op.add_column("shipper_stops", sa.Column("contact", sa.String(255), nullable=True))
    op.add_column("shipper_stops", sa.Column("appointment", sa.String(255), nullable=True))
    op.add_column("shipper_stops", sa.Column("by_time", sa.String(100), nullable=True))

    # 3. consignee_stops 팔레트 확장
    op.add_column("consignee_stops", sa.Column("total_pallets", sa.Integer(), nullable=True))
    op.add_column("consignee_stops", sa.Column("temperature", sa.String(50), nullable=True))
    op.add_column("consignee_stops", sa.Column("gross_value", sa.Numeric(12, 2), nullable=True))
    op.add_column("consignee_stops", sa.Column("cubic", sa.Numeric(10, 2), nullable=True))
    op.add_column("consignee_stops", sa.Column("weight_stop", sa.Numeric(12, 2), nullable=True))
    op.add_column("consignee_stops", sa.Column("width", sa.Numeric(8, 2), nullable=True))
    op.add_column("consignee_stops", sa.Column("length", sa.Numeric(8, 2), nullable=True))
    op.add_column("consignee_stops", sa.Column("height", sa.Numeric(8, 2), nullable=True))
    op.add_column("consignee_stops", sa.Column("contact", sa.String(255), nullable=True))
    op.add_column("consignee_stops", sa.Column("appointment", sa.String(255), nullable=True))
    op.add_column("consignee_stops", sa.Column("by_time", sa.String(100), nullable=True))

    # 4. carrier_segments 확장
    op.add_column("carrier_segments", sa.Column("equipment", sa.String(100), nullable=True))
    op.add_column("carrier_segments", sa.Column("stop_type", sa.String(100), nullable=True))
    op.add_column("carrier_segments", sa.Column("bol_date", sa.Date(), nullable=True))
    op.add_column("carrier_segments", sa.Column("arrival_date", sa.Date(), nullable=True))
    op.add_column("carrier_segments", sa.Column("arrival_time", sa.String(10), nullable=True))
    op.add_column("carrier_segments", sa.Column("pu_date", sa.Date(), nullable=True))
    op.add_column("carrier_segments", sa.Column("pu_time", sa.String(10), nullable=True))
    op.add_column("carrier_segments", sa.Column("seal_tags", sa.String(255), nullable=True))

    # 5. references — bill_of_lading 체크박스
    op.add_column("references", sa.Column("bill_of_lading", sa.Boolean(), nullable=True, server_default="false"))


def downgrade() -> None:
    op.drop_column("references", "bill_of_lading")
    for col in ["equipment", "stop_type", "bol_date", "arrival_date", "arrival_time", "pu_date", "pu_time", "seal_tags"]:
        op.drop_column("carrier_segments", col)
    for col in ["total_pallets", "temperature", "gross_value", "cubic", "weight_stop", "width", "length", "height", "contact", "appointment", "by_time"]:
        op.drop_column("consignee_stops", col)
        op.drop_column("shipper_stops", col)
    for col in ["bill_to", "order_id", "freight_id", "is_on_hold", "load_type", "ref_number", "created_by", "last_modified_by"]:
        op.drop_column("loads", col)
