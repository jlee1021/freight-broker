"""Partner expansion: locations, staff, carrier contacts/vehicles, extended carrier fields.

Revision ID: 013
Revises: 012
Create Date: 2026-03-03
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "013"
down_revision: Union[str, None] = "012"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. partners 테이블 캐리어 확장 컬럼 추가
    op.add_column("partners", sa.Column("code", sa.String(50), nullable=True))
    op.add_column("partners", sa.Column("legal_name", sa.String(255), nullable=True))
    op.add_column("partners", sa.Column("operating_status", sa.String(100), nullable=True))
    op.add_column("partners", sa.Column("carrier_type", sa.String(100), nullable=True))
    op.add_column("partners", sa.Column("service_hours", sa.String(100), nullable=True))
    op.add_column("partners", sa.Column("mc_status", sa.String(50), nullable=True))
    op.add_column("partners", sa.Column("hazmat_carrier", sa.Boolean(), nullable=True, server_default="false"))
    op.add_column("partners", sa.Column("w9_received", sa.Boolean(), nullable=True, server_default="false"))
    op.add_column("partners", sa.Column("default_tax_code", sa.String(20), nullable=True))
    op.add_column("partners", sa.Column("payment_days", sa.Integer(), nullable=True))
    op.add_column("partners", sa.Column("payment_type", sa.String(50), nullable=True))
    op.add_column("partners", sa.Column("ach_eft_banking", sa.String(255), nullable=True))
    op.add_column("partners", sa.Column("factor_company_name", sa.String(255), nullable=True))
    op.add_column("partners", sa.Column("personal_message", sa.Text(), nullable=True))
    op.add_column("partners", sa.Column("bill_to", sa.String(255), nullable=True))
    op.add_column("partners", sa.Column("created_at", sa.DateTime(), nullable=True))

    # 2. partner_locations: 파트너별 다중 위치
    op.create_table(
        "partner_locations",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("partner_id", sa.Uuid(), sa.ForeignKey("partners.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=True),
        sa.Column("address", sa.String(512), nullable=True),
        sa.Column("tel", sa.String(50), nullable=True),
        sa.Column("city", sa.String(255), nullable=True),
        sa.Column("state", sa.String(100), nullable=True),
        sa.Column("zip_code", sa.String(20), nullable=True),
        sa.Column("entry_date", sa.Date(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        # Customer 전용 필드
        sa.Column("bill", sa.String(255), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("billing_ship_to", sa.String(255), nullable=True),
        sa.Column("comments", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_partner_locations_partner_id", "partner_locations", ["partner_id"])

    # 3. partner_staff: 파트너 소속 담당자
    op.create_table(
        "partner_staff",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("partner_id", sa.Uuid(), sa.ForeignKey("partners.id", ondelete="CASCADE"), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("department", sa.String(100), nullable=True),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("phone", sa.String(50), nullable=True),
        sa.Column("title", sa.String(100), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_partner_staff_partner_id", "partner_staff", ["partner_id"])

    # 4. carrier_contacts: 캐리어 연락처 1:N
    op.create_table(
        "carrier_contacts",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("partner_id", sa.Uuid(), sa.ForeignKey("partners.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("department", sa.String(100), nullable=True),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("phone", sa.String(50), nullable=True),
        sa.Column("is_primary", sa.Boolean(), nullable=False, server_default="false"),
    )

    # 5. carrier_vehicles: 캐리어 차량 1:N
    op.create_table(
        "carrier_vehicles",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("partner_id", sa.Uuid(), sa.ForeignKey("partners.id", ondelete="CASCADE"), nullable=False),
        sa.Column("vehicle_type", sa.String(100), nullable=True),
        sa.Column("vehicle_number", sa.String(100), nullable=True),
        sa.Column("model", sa.String(100), nullable=True),
        sa.Column("price", sa.Numeric(12, 2), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("carrier_vehicles")
    op.drop_table("carrier_contacts")
    op.drop_table("partner_staff")
    op.drop_table("partner_locations")
    for col in ["code", "legal_name", "operating_status", "carrier_type", "service_hours",
                "mc_status", "hazmat_carrier", "w9_received", "default_tax_code",
                "payment_days", "payment_type", "ach_eft_banking", "factor_company_name",
                "personal_message", "bill_to", "created_at"]:
        op.drop_column("partners", col)
