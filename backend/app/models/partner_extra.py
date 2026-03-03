"""
파트너 추가 확장 모델:
- PartnerTeam (팀 멤버십)
- PartnerService (서비스 아이템)
- LocationStaff / LocationContact / LocationEquipment
- PartnerEmailTemplate (이메일 템플릿)
- CarrierOperationInfo (운영 정보 확장)
"""
from sqlalchemy import Column, String, Text, Boolean, DateTime, Numeric, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from app.core.database import Base


class PartnerTeam(Base):
    """파트너별 팀 멤버십 (Name, Role)."""
    __tablename__ = "partner_teams"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    partner_id = Column(UUID(as_uuid=True), ForeignKey("partners.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(String(100), nullable=True)   # Admin, Viewer, Dispatcher, etc.
    email = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    partner = relationship("Partner", backref="team_members")


class PartnerService(Base):
    """파트너 제공 서비스 아이템 (Item, Type, Quantity)."""
    __tablename__ = "partner_services"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    partner_id = Column(UUID(as_uuid=True), ForeignKey("partners.id", ondelete="CASCADE"), nullable=False)
    item = Column(String(255), nullable=False)    # Air freight, FCL, LCL, LTL, Ocean freight
    service_type = Column(String(100), nullable=True)
    quantity = Column(Numeric(12, 3), nullable=True)
    unit = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)

    partner = relationship("Partner", backref="services")


class PartnerEmailTemplate(Base):
    """파트너별 이메일 템플릿 (Load Confirmation, Driver Display 등)."""
    __tablename__ = "partner_email_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    partner_id = Column(UUID(as_uuid=True), ForeignKey("partners.id", ondelete="CASCADE"), nullable=False)
    template_type = Column(String(100), nullable=False)   # load_confirmation, driver_display
    send_reply = Column(Boolean, default=False)
    subject = Column(String(512), nullable=True)
    body = Column(Text, nullable=True)
    leading_team = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    partner = relationship("Partner", backref="email_templates")


class CarrierOperationInfo(Base):
    """캐리어 운영 정보 (Operation Times, Default Trip/Rate Type, etc.)."""
    __tablename__ = "carrier_operation_info"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    partner_id = Column(UUID(as_uuid=True), ForeignKey("partners.id", ondelete="CASCADE"), nullable=False, unique=True)

    operation_times = Column(String(100), nullable=True)  # MON-FRI, SAT, SUN, 24/7, BY APPT
    timezone = Column(String(100), nullable=True)
    default_trip_type = Column(String(100), nullable=True)
    default_rate_type = Column(String(100), nullable=True)
    load_hours = Column(String(100), nullable=True)
    shift_type = Column(String(100), nullable=True)
    pickup_hours = Column(String(100), nullable=True)
    postal_message = Column(Text, nullable=True)

    # Payment extended
    pay_per_day = Column(String(100), nullable=True)
    invoice_tt = Column(String(100), nullable=True)
    invoice_et = Column(String(100), nullable=True)
    invoice_etransfer = Column(String(100), nullable=True)
    other_payment_terms = Column(Text, nullable=True)
    payment_notes = Column(Text, nullable=True)

    # API Works (연동 설정)
    api_key = Column(String(255), nullable=True)
    api_secret = Column(String(255), nullable=True)
    api_endpoint = Column(String(512), nullable=True)
    api_notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    partner = relationship("Partner", backref="operation_info", uselist=False)


class LocationStaff(Base):
    """로케이션별 담당자 (Staff)."""
    __tablename__ = "location_staff"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    location_id = Column(UUID(as_uuid=True), ForeignKey("partner_locations.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    tag = Column(String(100), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)


class LocationContact(Base):
    """로케이션별 연락처."""
    __tablename__ = "location_contacts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    location_id = Column(UUID(as_uuid=True), ForeignKey("partner_locations.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    department = Column(String(100), nullable=True)
    phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)


class LocationEquipment(Base):
    """로케이션별 장비."""
    __tablename__ = "location_equipment"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    location_id = Column(UUID(as_uuid=True), ForeignKey("partner_locations.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    equipment_type = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
