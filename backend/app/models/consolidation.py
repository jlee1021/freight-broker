"""
Consolidation 모델: 다중 Shipper/Consignee를 하나의 통합 로드로 묶는 엔티티
참조 솔루션 clone 대상 — Dispatch > Consolidation
"""
from sqlalchemy import Column, String, Text, Boolean, Date, DateTime, Numeric, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from app.core.database import Base


class Consolidation(Base):
    """통합 로드 — 여러 고객 Shipper를 하나의 Carrier Consignee 로드로 묶음."""
    __tablename__ = "consolidations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    consolidation_number = Column(String(50), unique=True, nullable=False, index=True)
    status = Column(String(50), default="pending")          # pending, in_transit, delivered, cancelled
    description = Column(Text, nullable=True)
    equipment_type = Column(String(100), nullable=True)
    total_weight = Column(Numeric(12, 2), nullable=True)
    weight_unit = Column(String(10), default="lbs")
    is_active = Column(Boolean, default=True)

    # 감사 필드
    created_by = Column(String(255), nullable=True)
    last_modified_by = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # 연결 항목
    customer_shippers = relationship("ConsolidationShipper", back_populates="consolidation", cascade="all, delete-orphan")
    carrier_consignees = relationship("ConsolidationConsignee", back_populates="consolidation", cascade="all, delete-orphan")


class ConsolidationShipper(Base):
    """통합 로드의 Customer/Shipper 항목."""
    __tablename__ = "consolidation_shippers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    consolidation_id = Column(UUID(as_uuid=True), ForeignKey("consolidations.id", ondelete="CASCADE"), nullable=False)
    partner_id = Column(UUID(as_uuid=True), ForeignKey("partners.id", ondelete="SET NULL"), nullable=True)
    name = Column(String(255), nullable=True)        # 파트너 스냅샷 (편집용)
    address = Column(String(512), nullable=True)
    city = Column(String(255), nullable=True)
    contact = Column(String(255), nullable=True)
    pickup_date = Column(Date, nullable=True)
    pallet_count = Column(Integer, nullable=True)
    weight = Column(Numeric(12, 2), nullable=True)
    notes = Column(Text, nullable=True)
    sequence = Column(Integer, default=1)

    consolidation = relationship("Consolidation", back_populates="customer_shippers")
    partner = relationship("Partner")


class ConsolidationConsignee(Base):
    """통합 로드의 Carrier/Consignee 항목."""
    __tablename__ = "consolidation_consignees"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    consolidation_id = Column(UUID(as_uuid=True), ForeignKey("consolidations.id", ondelete="CASCADE"), nullable=False)
    partner_id = Column(UUID(as_uuid=True), ForeignKey("partners.id", ondelete="SET NULL"), nullable=True)
    name = Column(String(255), nullable=True)
    address = Column(String(512), nullable=True)
    city = Column(String(255), nullable=True)
    contact = Column(String(255), nullable=True)
    delivery_date = Column(Date, nullable=True)
    pallet_count = Column(Integer, nullable=True)
    weight = Column(Numeric(12, 2), nullable=True)
    notes = Column(Text, nullable=True)
    sequence = Column(Integer, default=1)

    consolidation = relationship("Consolidation", back_populates="carrier_consignees")
    partner = relationship("Partner")
