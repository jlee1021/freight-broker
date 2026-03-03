from sqlalchemy import Column, String, Numeric, Integer, ForeignKey, Date, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.core.database import Base


class InvoiceStatus(str, enum.Enum):
    draft = "draft"
    sent = "sent"
    paid = "paid"


class CustomerInvoice(Base):
    __tablename__ = "customer_invoices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    load_id = Column(UUID(as_uuid=True), ForeignKey("loads.id", ondelete="CASCADE"), nullable=False)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("partners.id"), nullable=True)
    invoice_number = Column(String(50), unique=True, nullable=False, index=True)
    amount = Column(Numeric(12, 2), nullable=False)
    status = Column(String(20), default=InvoiceStatus.draft.value)
    due_date = Column(Date, nullable=True)
    sent_at = Column(DateTime, nullable=True)
    paid_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_reminder_sent_at = Column(DateTime, nullable=True)
    reminder_sent_count = Column(Integer, default=0, nullable=False)

    load = relationship("Load", back_populates="customer_invoices")
    customer = relationship("Partner", back_populates="customer_invoices")


class CarrierPayable(Base):
    __tablename__ = "carrier_payables"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    carrier_segment_id = Column(UUID(as_uuid=True), ForeignKey("carrier_segments.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    invoice_number = Column(String(50), nullable=True)
    status = Column(String(20), default=InvoiceStatus.draft.value)
    paid_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    carrier_segment = relationship("CarrierSegment", back_populates="carrier_payable")
