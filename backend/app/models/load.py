from sqlalchemy import Column, String, Text, Date, Time, Numeric, ForeignKey, Integer, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import date, datetime
import uuid

from app.core.database import Base


class LoadAttachment(Base):
    __tablename__ = "load_attachments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    load_id = Column(UUID(as_uuid=True), ForeignKey("loads.id", ondelete="CASCADE"), nullable=False)
    original_filename = Column(String(255), nullable=False)
    stored_path = Column(String(512), nullable=False)  # path under upload_dir
    content_type = Column(String(100), nullable=True)
    document_type = Column(String(50), nullable=True)  # pod, bol, rate_confirmation, other
    created_at = Column(DateTime, default=datetime.utcnow)

    load = relationship("Load", back_populates="attachments")


class Load(Base):
    __tablename__ = "loads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    load_number = Column(String(50), unique=True, nullable=False, index=True)
    status = Column(String(50), default="pending")  # pending, unassigned, on_hold, need_to_cover, assigned, in_transit, delivered, cancel

    customer_id = Column(UUID(as_uuid=True), ForeignKey("partners.id"), nullable=True)
    dispatcher_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    sales_rep_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    billing_rep_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    rate = Column(Numeric(12, 2), nullable=True)
    fsc_percent = Column(Numeric(5, 2), nullable=True)
    tax_code = Column(String(20), nullable=True)
    other_charges = Column(Numeric(12, 2), default=0)
    equipment_type = Column(String(50), nullable=True)
    weight = Column(Numeric(12, 2), nullable=True)
    weight_unit = Column(String(10), default="lbs")
    commodity = Column(String(255), nullable=True)
    po_number = Column(String(100), nullable=True)
    revenue = Column(Numeric(12, 2), nullable=True)
    cost = Column(Numeric(12, 2), nullable=True)
    profit_pct = Column(Numeric(5, 2), nullable=True)
    gst = Column(Numeric(12, 2), nullable=True)
    total_with_gst = Column(Numeric(12, 2), nullable=True)
    auto_rate = Column(Boolean, default=False)

    # 확장 필드 (참조 솔루션 clone)
    bill_to = Column(String(255), nullable=True)          # 청구 대상
    order_id = Column(String(100), nullable=True)         # Order ID
    freight_id = Column(String(100), nullable=True)       # Freight ID
    is_on_hold = Column(Boolean, default=False)           # Hold 상태
    load_type = Column(String(50), nullable=True)         # 로드 유형
    ref_number = Column(String(100), nullable=True)       # Ref Number
    created_by = Column(String(255), nullable=True)       # 생성자
    last_modified_by = Column(String(255), nullable=True) # 최종 수정자

    created_at = Column(Date, default=date.today)
    updated_at = Column(Date, default=date.today, onupdate=date.today)

    customer = relationship("Partner", back_populates="loads_as_customer")
    dispatcher = relationship("User", back_populates="loads_dispatched", foreign_keys=[dispatcher_id])
    shipper_stops = relationship("ShipperStop", back_populates="load", order_by="ShipperStop.sequence")
    consignee_stops = relationship("ConsigneeStop", back_populates="load", order_by="ConsigneeStop.sequence")
    carrier_segments = relationship("CarrierSegment", back_populates="load")
    references = relationship("Reference", back_populates="load")
    attachments = relationship("LoadAttachment", back_populates="load", cascade="all, delete-orphan")
    customer_invoices = relationship("CustomerInvoice", back_populates="load", cascade="all, delete-orphan")
    notes = relationship("LoadNote", back_populates="load", cascade="all, delete-orphan", order_by="LoadNote.created_at")
    tenders = relationship("Tender", back_populates="load", cascade="all, delete-orphan")


class ShipperStop(Base):
    __tablename__ = "shipper_stops"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    load_id = Column(UUID(as_uuid=True), ForeignKey("loads.id"), nullable=False)
    sequence = Column(Integer, default=1)
    name = Column(String(255), nullable=True)
    address = Column(String(512), nullable=True)
    city = Column(String(255), nullable=True)
    province = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    postal_code = Column(String(20), nullable=True)
    type = Column(String(50), nullable=True)
    pickup_date = Column(Date, nullable=True)
    time_start = Column(Time, nullable=True)
    time_end = Column(Time, nullable=True)
    pallet_info = Column(JSONB, nullable=True)
    notes = Column(Text, nullable=True)
    # 팔레트 확장 필드
    total_pallets = Column(Integer, nullable=True)
    temperature = Column(String(50), nullable=True)
    gross_value = Column(Numeric(12, 2), nullable=True)
    cubic = Column(Numeric(10, 2), nullable=True)
    weight_stop = Column(Numeric(12, 2), nullable=True)
    width = Column(Numeric(8, 2), nullable=True)
    length = Column(Numeric(8, 2), nullable=True)
    height = Column(Numeric(8, 2), nullable=True)
    contact = Column(String(255), nullable=True)
    appointment = Column(String(255), nullable=True)
    by_time = Column(String(100), nullable=True)

    load = relationship("Load", back_populates="shipper_stops")


class ConsigneeStop(Base):
    __tablename__ = "consignee_stops"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    load_id = Column(UUID(as_uuid=True), ForeignKey("loads.id"), nullable=False)
    sequence = Column(Integer, default=1)
    name = Column(String(255), nullable=True)
    address = Column(String(512), nullable=True)
    city = Column(String(255), nullable=True)
    province = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    postal_code = Column(String(20), nullable=True)
    type = Column(String(50), nullable=True)
    due_date = Column(Date, nullable=True)
    time_start = Column(Time, nullable=True)
    time_end = Column(Time, nullable=True)
    pallet_info = Column(JSONB, nullable=True)
    notes = Column(Text, nullable=True)
    # 팔레트 확장 필드
    total_pallets = Column(Integer, nullable=True)
    temperature = Column(String(50), nullable=True)
    gross_value = Column(Numeric(12, 2), nullable=True)
    cubic = Column(Numeric(10, 2), nullable=True)
    weight_stop = Column(Numeric(12, 2), nullable=True)
    width = Column(Numeric(8, 2), nullable=True)
    length = Column(Numeric(8, 2), nullable=True)
    height = Column(Numeric(8, 2), nullable=True)
    contact = Column(String(255), nullable=True)
    appointment = Column(String(255), nullable=True)
    by_time = Column(String(100), nullable=True)

    load = relationship("Load", back_populates="consignee_stops")


class CarrierSegment(Base):
    __tablename__ = "carrier_segments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    load_id = Column(UUID(as_uuid=True), ForeignKey("loads.id"), nullable=False)
    carrier_id = Column(UUID(as_uuid=True), ForeignKey("partners.id"), nullable=True)
    carrier_invoice_number = Column(String(100), nullable=True)
    invoice_date = Column(Date, nullable=True)
    rate = Column(Numeric(12, 2), nullable=True)
    fsc_percent = Column(Numeric(5, 2), nullable=True)
    lc_number = Column(String(100), nullable=True)
    tax_code = Column(String(20), nullable=True)
    total = Column(Numeric(12, 2), nullable=True)
    load_status = Column(String(50), nullable=True)
    rating = Column(Integer, nullable=True)
    on_time = Column(Boolean, nullable=True)
    # 구간 확장 필드
    equipment = Column(String(100), nullable=True)    # 장비 유형
    stop_type = Column(String(100), nullable=True)    # 정류 유형
    bol_date = Column(Date, nullable=True)            # BOL 날짜
    arrival_date = Column(Date, nullable=True)        # 도착 날짜
    arrival_time = Column(String(10), nullable=True)  # 도착 시간
    pu_date = Column(Date, nullable=True)             # P/U 날짜
    pu_time = Column(String(10), nullable=True)       # P/U 시간
    seal_tags = Column(String(255), nullable=True)    # Seal / Tags

    load = relationship("Load", back_populates="carrier_segments")
    carrier = relationship("Partner", back_populates="carrier_segments")
    carrier_payable = relationship("CarrierPayable", back_populates="carrier_segment", uselist=False)


class Reference(Base):
    __tablename__ = "references"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    load_id = Column(UUID(as_uuid=True), ForeignKey("loads.id"), nullable=False)
    reference_number = Column(String(100), nullable=True)
    reference_type = Column(String(50), nullable=True)
    special_instructions = Column(Text, nullable=True)
    internal_notes = Column(Text, nullable=True)
    bill_of_lading = Column(Boolean, default=False)  # BOL 체크박스

    load = relationship("Load", back_populates="references")
