"""Initial tables: users, partners, locations, loads, shipper_stops, consignee_stops, carrier_segments, references.

Revision ID: 001
Revises:
Create Date: 2025-02-23

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "locations",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("address", sa.String(512), nullable=True),
        sa.Column("city", sa.String(255), nullable=True),
        sa.Column("province", sa.String(100), nullable=True),
        sa.Column("country", sa.String(100), nullable=True),
        sa.Column("postal_code", sa.String(20), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=True),
        sa.Column("role", sa.String(50), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_table(
        "partners",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("type", sa.String(50), nullable=True),
        sa.Column("contact_email", sa.String(255), nullable=True),
        sa.Column("contact_phone", sa.String(50), nullable=True),
        sa.Column("address", sa.String(512), nullable=True),
        sa.Column("city", sa.String(255), nullable=True),
        sa.Column("province", sa.String(100), nullable=True),
        sa.Column("country", sa.String(100), nullable=True),
        sa.Column("postal_code", sa.String(20), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), default=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "loads",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("load_number", sa.String(50), nullable=False),
        sa.Column("status", sa.String(50), nullable=True),
        sa.Column("customer_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("dispatcher_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("sales_rep_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("billing_rep_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("rate", sa.Numeric(12, 2), nullable=True),
        sa.Column("fsc_percent", sa.Numeric(5, 2), nullable=True),
        sa.Column("tax_code", sa.String(20), nullable=True),
        sa.Column("other_charges", sa.Numeric(12, 2), nullable=True),
        sa.Column("revenue", sa.Numeric(12, 2), nullable=True),
        sa.Column("cost", sa.Numeric(12, 2), nullable=True),
        sa.Column("profit_pct", sa.Numeric(5, 2), nullable=True),
        sa.Column("gst", sa.Numeric(12, 2), nullable=True),
        sa.Column("total_with_gst", sa.Numeric(12, 2), nullable=True),
        sa.Column("auto_rate", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.Date(), nullable=True),
        sa.Column("updated_at", sa.Date(), nullable=True),
        sa.ForeignKeyConstraint(["billing_rep_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["customer_id"], ["partners.id"]),
        sa.ForeignKeyConstraint(["dispatcher_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["sales_rep_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_loads_load_number", "loads", ["load_number"], unique=True)
    op.create_table(
        "shipper_stops",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("load_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("sequence", sa.Integer(), nullable=True),
        sa.Column("name", sa.String(255), nullable=True),
        sa.Column("address", sa.String(512), nullable=True),
        sa.Column("city", sa.String(255), nullable=True),
        sa.Column("province", sa.String(100), nullable=True),
        sa.Column("country", sa.String(100), nullable=True),
        sa.Column("postal_code", sa.String(20), nullable=True),
        sa.Column("type", sa.String(50), nullable=True),
        sa.Column("pickup_date", sa.Date(), nullable=True),
        sa.Column("time_start", sa.Time(), nullable=True),
        sa.Column("time_end", sa.Time(), nullable=True),
        sa.Column("pallet_info", postgresql.JSONB(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["load_id"], ["loads.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "consignee_stops",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("load_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("sequence", sa.Integer(), nullable=True),
        sa.Column("name", sa.String(255), nullable=True),
        sa.Column("address", sa.String(512), nullable=True),
        sa.Column("city", sa.String(255), nullable=True),
        sa.Column("province", sa.String(100), nullable=True),
        sa.Column("country", sa.String(100), nullable=True),
        sa.Column("postal_code", sa.String(20), nullable=True),
        sa.Column("type", sa.String(50), nullable=True),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("time_start", sa.Time(), nullable=True),
        sa.Column("time_end", sa.Time(), nullable=True),
        sa.Column("pallet_info", postgresql.JSONB(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["load_id"], ["loads.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "carrier_segments",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("load_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("carrier_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("carrier_invoice_number", sa.String(100), nullable=True),
        sa.Column("invoice_date", sa.Date(), nullable=True),
        sa.Column("rate", sa.Numeric(12, 2), nullable=True),
        sa.Column("fsc_percent", sa.Numeric(5, 2), nullable=True),
        sa.Column("lc_number", sa.String(100), nullable=True),
        sa.Column("tax_code", sa.String(20), nullable=True),
        sa.Column("total", sa.Numeric(12, 2), nullable=True),
        sa.Column("load_status", sa.String(50), nullable=True),
        sa.ForeignKeyConstraint(["carrier_id"], ["partners.id"]),
        sa.ForeignKeyConstraint(["load_id"], ["loads.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "references",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("load_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("reference_number", sa.String(100), nullable=True),
        sa.Column("reference_type", sa.String(50), nullable=True),
        sa.Column("special_instructions", sa.Text(), nullable=True),
        sa.Column("internal_notes", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["load_id"], ["loads.id"]),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("references")
    op.drop_table("carrier_segments")
    op.drop_table("consignee_stops")
    op.drop_table("shipper_stops")
    op.drop_index("ix_loads_load_number", table_name="loads")
    op.drop_table("loads")
    op.drop_table("partners")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
    op.drop_table("locations")
