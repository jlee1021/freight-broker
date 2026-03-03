"""
OS List (Order Sheet) + OSD (Overages, Shortages, Damages) 모델
"""
from sqlalchemy import Column, String, Text, Boolean, Date, DateTime, Numeric, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from app.core.database import Base


class OsOrder(Base):
    """OS List — Order Sheet (고객 주문서)."""
    __tablename__ = "os_orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_code = Column(String(100), nullable=True, index=True)
    status = Column(String(50), default="pending")  # pending, out_order, on_going, receiving, complete
    contract_type = Column(String(100), nullable=True)

    customer_id = Column(UUID(as_uuid=True), ForeignKey("partners.id"), nullable=True)
    buyer = Column(String(255), nullable=True)
    sales_rep = Column(String(255), nullable=True)
    customer_po = Column(String(100), nullable=True)

    load_date = Column(Date, nullable=True)
    deliver_date = Column(Date, nullable=True)

    product_name = Column(String(255), nullable=True)
    qty = Column(Numeric(12, 3), nullable=True)
    unit_price = Column(Numeric(12, 2), nullable=True)
    currency = Column(String(10), default="CAD")
    tax = Column(Numeric(12, 2), nullable=True)
    subtotal = Column(Numeric(12, 2), nullable=True)
    total = Column(Numeric(12, 2), nullable=True)

    invoice_number = Column(String(100), nullable=True)
    billing_type = Column(String(100), nullable=True)
    memo = Column(Text, nullable=True)

    created_by = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    customer = relationship("Partner", foreign_keys=[customer_id])


class OsdRecord(Base):
    """OSD — Overages, Shortages, Damages."""
    __tablename__ = "osd_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    load_id = Column(UUID(as_uuid=True), ForeignKey("loads.id"), nullable=True)
    ref_number = Column(String(100), nullable=True)
    status = Column(String(50), default="open")  # open, closed, pending
    osd_type = Column(String(50), nullable=True)  # overage, shortage, damage

    amount = Column(Numeric(12, 2), nullable=True)
    ar_amount = Column(Numeric(12, 2), nullable=True)
    ap_amount = Column(Numeric(12, 2), nullable=True)

    customer_id = Column(UUID(as_uuid=True), ForeignKey("partners.id"), nullable=True)
    shipper_id = Column(UUID(as_uuid=True), ForeignKey("partners.id"), nullable=True)
    carrier_id = Column(UUID(as_uuid=True), ForeignKey("partners.id"), nullable=True)

    ship_date = Column(Date, nullable=True)
    delivery_date = Column(Date, nullable=True)
    due_date = Column(Date, nullable=True)
    expired_cargo = Column(Boolean, default=False)
    company_name = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    load = relationship("Load", foreign_keys=[load_id])
    customer = relationship("Partner", foreign_keys=[customer_id])
    shipper = relationship("Partner", foreign_keys=[shipper_id])
    carrier = relationship("Partner", foreign_keys=[carrier_id])
