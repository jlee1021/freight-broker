"""
파트너 확장 모델: PartnerLocation, PartnerStaff, CarrierContact, CarrierVehicle
참조 솔루션 clone 대상 — Partner Location/Staff, Carrier Contacts/Vehicles
"""
from sqlalchemy import Column, String, Text, Boolean, Date, DateTime, Integer, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from app.core.database import Base


class PartnerLocation(Base):
    """파트너별 다중 위치 — 배송지·청구지 등."""
    __tablename__ = "partner_locations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    partner_id = Column(UUID(as_uuid=True), ForeignKey("partners.id", ondelete="CASCADE"), nullable=False)

    # 공통 필드
    name = Column(String(255), nullable=True)         # 위치명
    address = Column(String(512), nullable=True)
    tel = Column(String(50), nullable=True)
    city = Column(String(255), nullable=True)
    state = Column(String(100), nullable=True)
    zip_code = Column(String(20), nullable=True)
    entry_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)

    # Customer 전용 필드
    bill = Column(String(255), nullable=True)          # Bill To
    description = Column(Text, nullable=True)
    billing_ship_to = Column(String(255), nullable=True)
    comments = Column(Text, nullable=True)

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    partner = relationship("Partner", backref="locations")


class PartnerStaff(Base):
    """파트너 소속 담당자 (Staff)."""
    __tablename__ = "partner_staff"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    partner_id = Column(UUID(as_uuid=True), ForeignKey("partners.id", ondelete="CASCADE"), nullable=False)
    full_name = Column(String(255), nullable=False)
    department = Column(String(100), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    title = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    partner = relationship("Partner", backref="staff_members")


class CarrierContact(Base):
    """캐리어 연락처 1:N."""
    __tablename__ = "carrier_contacts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    partner_id = Column(UUID(as_uuid=True), ForeignKey("partners.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    department = Column(String(100), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    is_primary = Column(Boolean, default=False)

    partner = relationship("Partner", backref="carrier_contacts")


class CarrierVehicle(Base):
    """캐리어 차량 1:N."""
    __tablename__ = "carrier_vehicles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    partner_id = Column(UUID(as_uuid=True), ForeignKey("partners.id", ondelete="CASCADE"), nullable=False)
    vehicle_type = Column(String(100), nullable=True)   # 차량 유형
    vehicle_number = Column(String(100), nullable=True) # 차량 번호
    model = Column(String(100), nullable=True)
    price = Column(Numeric(12, 2), nullable=True)

    partner = relationship("Partner", backref="vehicles")
