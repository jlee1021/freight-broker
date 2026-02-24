from sqlalchemy import Column, String, Text, Boolean, Date
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid

from app.core.database import Base


class Location(Base):
    __tablename__ = "locations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    address = Column(String(512), nullable=True)
    city = Column(String(255), nullable=True)
    province = Column(String(100), nullable=True)
    country = Column(String(100), default="CANADA")
    postal_code = Column(String(20), nullable=True)


class Partner(Base):
    __tablename__ = "partners"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    type = Column(String(50), nullable=True)  # customer, carrier
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    address = Column(String(512), nullable=True)
    city = Column(String(255), nullable=True)
    province = Column(String(100), nullable=True)
    country = Column(String(100), default="CANADA")
    postal_code = Column(String(20), nullable=True)
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    mc_number = Column(String(50), nullable=True)
    dot_number = Column(String(50), nullable=True)
    insurance_expiry = Column(Date, nullable=True)
    payment_terms = Column(String(100), nullable=True)

    loads_as_customer = relationship("Load", back_populates="customer")
    carrier_segments = relationship("CarrierSegment", back_populates="carrier")
    customer_invoices = relationship("CustomerInvoice", back_populates="customer")
