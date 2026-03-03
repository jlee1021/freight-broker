"""OS List, OSD, Partner Team/Service/EmailTemplate/OperationInfo, Location sub-resources.

Revision ID: 019
Revises: 018
Create Date: 2026-03-03
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "019"
down_revision: Union[str, None] = "018"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── OS Orders ────────────────────────────────────────────────────
    op.create_table(
        "os_orders",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("order_code", sa.String(100), nullable=True),
        sa.Column("status", sa.String(50), nullable=True, server_default="pending"),
        sa.Column("contract_type", sa.String(100), nullable=True),
        sa.Column("customer_id", sa.Uuid(), sa.ForeignKey("partners.id"), nullable=True),
        sa.Column("buyer", sa.String(255), nullable=True),
        sa.Column("sales_rep", sa.String(255), nullable=True),
        sa.Column("customer_po", sa.String(100), nullable=True),
        sa.Column("load_date", sa.Date(), nullable=True),
        sa.Column("deliver_date", sa.Date(), nullable=True),
        sa.Column("product_name", sa.String(255), nullable=True),
        sa.Column("qty", sa.Numeric(12, 3), nullable=True),
        sa.Column("unit_price", sa.Numeric(12, 2), nullable=True),
        sa.Column("currency", sa.String(10), nullable=True, server_default="CAD"),
        sa.Column("tax", sa.Numeric(12, 2), nullable=True),
        sa.Column("subtotal", sa.Numeric(12, 2), nullable=True),
        sa.Column("total", sa.Numeric(12, 2), nullable=True),
        sa.Column("invoice_number", sa.String(100), nullable=True),
        sa.Column("billing_type", sa.String(100), nullable=True),
        sa.Column("memo", sa.Text(), nullable=True),
        sa.Column("created_by", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_os_orders_order_code", "os_orders", ["order_code"])

    # ── OSD Records ──────────────────────────────────────────────────
    op.create_table(
        "osd_records",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("load_id", sa.Uuid(), sa.ForeignKey("loads.id"), nullable=True),
        sa.Column("ref_number", sa.String(100), nullable=True),
        sa.Column("status", sa.String(50), nullable=True, server_default="open"),
        sa.Column("osd_type", sa.String(50), nullable=True),
        sa.Column("amount", sa.Numeric(12, 2), nullable=True),
        sa.Column("ar_amount", sa.Numeric(12, 2), nullable=True),
        sa.Column("ap_amount", sa.Numeric(12, 2), nullable=True),
        sa.Column("customer_id", sa.Uuid(), sa.ForeignKey("partners.id"), nullable=True),
        sa.Column("shipper_id", sa.Uuid(), sa.ForeignKey("partners.id"), nullable=True),
        sa.Column("carrier_id", sa.Uuid(), sa.ForeignKey("partners.id"), nullable=True),
        sa.Column("ship_date", sa.Date(), nullable=True),
        sa.Column("delivery_date", sa.Date(), nullable=True),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("expired_cargo", sa.Boolean(), nullable=True, server_default="false"),
        sa.Column("company_name", sa.String(255), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )

    # ── Partner Teams ────────────────────────────────────────────────
    op.create_table(
        "partner_teams",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("partner_id", sa.Uuid(), sa.ForeignKey("partners.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("role", sa.String(100), nullable=True),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=True, server_default="true"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )

    # ── Partner Services ─────────────────────────────────────────────
    op.create_table(
        "partner_services",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("partner_id", sa.Uuid(), sa.ForeignKey("partners.id", ondelete="CASCADE"), nullable=False),
        sa.Column("item", sa.String(255), nullable=False),
        sa.Column("service_type", sa.String(100), nullable=True),
        sa.Column("quantity", sa.Numeric(12, 3), nullable=True),
        sa.Column("unit", sa.String(50), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=True, server_default="true"),
    )

    # ── Partner Email Templates ──────────────────────────────────────
    op.create_table(
        "partner_email_templates",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("partner_id", sa.Uuid(), sa.ForeignKey("partners.id", ondelete="CASCADE"), nullable=False),
        sa.Column("template_type", sa.String(100), nullable=False),
        sa.Column("send_reply", sa.Boolean(), nullable=True, server_default="false"),
        sa.Column("subject", sa.String(512), nullable=True),
        sa.Column("body", sa.Text(), nullable=True),
        sa.Column("leading_team", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )

    # ── Carrier Operation Info ───────────────────────────────────────
    op.create_table(
        "carrier_operation_info",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("partner_id", sa.Uuid(), sa.ForeignKey("partners.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("operation_times", sa.String(100), nullable=True),
        sa.Column("timezone", sa.String(100), nullable=True),
        sa.Column("default_trip_type", sa.String(100), nullable=True),
        sa.Column("default_rate_type", sa.String(100), nullable=True),
        sa.Column("load_hours", sa.String(100), nullable=True),
        sa.Column("shift_type", sa.String(100), nullable=True),
        sa.Column("pickup_hours", sa.String(100), nullable=True),
        sa.Column("postal_message", sa.Text(), nullable=True),
        sa.Column("pay_per_day", sa.String(100), nullable=True),
        sa.Column("invoice_tt", sa.String(100), nullable=True),
        sa.Column("invoice_et", sa.String(100), nullable=True),
        sa.Column("invoice_etransfer", sa.String(100), nullable=True),
        sa.Column("other_payment_terms", sa.Text(), nullable=True),
        sa.Column("payment_notes", sa.Text(), nullable=True),
        sa.Column("api_key", sa.String(255), nullable=True),
        sa.Column("api_secret", sa.String(255), nullable=True),
        sa.Column("api_endpoint", sa.String(512), nullable=True),
        sa.Column("api_notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )

    # ── Location Staff ───────────────────────────────────────────────
    op.create_table(
        "location_staff",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("location_id", sa.Uuid(), sa.ForeignKey("partner_locations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("tag", sa.String(100), nullable=True),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("phone", sa.String(50), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=True, server_default="true"),
    )

    # ── Location Contacts ────────────────────────────────────────────
    op.create_table(
        "location_contacts",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("location_id", sa.Uuid(), sa.ForeignKey("partner_locations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("department", sa.String(100), nullable=True),
        sa.Column("phone", sa.String(50), nullable=True),
        sa.Column("email", sa.String(255), nullable=True),
    )

    # ── Location Equipment ───────────────────────────────────────────
    op.create_table(
        "location_equipment",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("location_id", sa.Uuid(), sa.ForeignKey("partner_locations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("equipment_type", sa.String(100), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
    )

    # ── Partner extras: credit_limit, truck_calls ────────────────────
    with op.batch_alter_table("partners") as batch_op:
        batch_op.add_column(sa.Column("credit_limit", sa.Numeric(12, 2), nullable=True))
        batch_op.add_column(sa.Column("truck_calls", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("account_type", sa.String(100), nullable=True))
        batch_op.add_column(sa.Column("discount_pct", sa.Numeric(5, 2), nullable=True))
        batch_op.add_column(sa.Column("currency", sa.String(10), nullable=True))
        batch_op.add_column(sa.Column("expense_terms", sa.String(100), nullable=True))

    # ── Load extras: waybill fields ──────────────────────────────────
    with op.batch_alter_table("loads") as batch_op:
        batch_op.add_column(sa.Column("waybill_type", sa.String(50), nullable=True))
        batch_op.add_column(sa.Column("billing_type", sa.String(100), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("loads") as batch_op:
        batch_op.drop_column("billing_type")
        batch_op.drop_column("waybill_type")

    with op.batch_alter_table("partners") as batch_op:
        batch_op.drop_column("expense_terms")
        batch_op.drop_column("currency")
        batch_op.drop_column("discount_pct")
        batch_op.drop_column("account_type")
        batch_op.drop_column("truck_calls")
        batch_op.drop_column("credit_limit")

    op.drop_table("location_equipment")
    op.drop_table("location_contacts")
    op.drop_table("location_staff")
    op.drop_table("carrier_operation_info")
    op.drop_table("partner_email_templates")
    op.drop_table("partner_services")
    op.drop_table("partner_teams")
    op.drop_index("ix_os_orders_order_code", "os_orders")
    op.drop_table("osd_records")
    op.drop_table("os_orders")
