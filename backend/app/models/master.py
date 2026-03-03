"""
마스터 데이터 모델: City, TypeMaster(+SubType), Permission
참조 솔루션 clone 대상 — Settings 마스터 데이터 관리
"""
from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from app.core.database import Base


class City(Base):
    """도시 마스터 — Code, City, Province, Country, Timezone."""
    __tablename__ = "cities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(20), nullable=True, index=True)          # 도시 코드 (예: YVR)
    name = Column(String(255), nullable=False)                     # 도시명
    province = Column(String(100), nullable=True)                  # 주/도 (예: BC, ON)
    country = Column(String(100), nullable=True, default="CANADA") # 국가
    zip_code = Column(String(20), nullable=True)                   # 우편번호
    timezone = Column(String(100), nullable=True)                  # 시간대 (예: America/Vancouver)
    remarks = Column(Text, nullable=True)                          # 메모
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class TypeMaster(Base):
    """유형 마스터 — Type / SubType 계층 구조."""
    __tablename__ = "type_masters"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type_name = Column(String(255), nullable=False)               # 유형명
    use_subtype = Column(Boolean, default=False)                  # 서브타입 사용 여부
    description = Column(Text, nullable=True)                     # 설명
    remark = Column(Text, nullable=True)                          # 비고
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # SubType 자식 관계
    subtypes = relationship("SubTypeMaster", back_populates="parent", cascade="all, delete-orphan")


class SubTypeMaster(Base):
    """서브 유형 마스터 — TypeMaster의 자식."""
    __tablename__ = "subtype_masters"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("type_masters.id", ondelete="CASCADE"), nullable=False)
    subtype_name = Column(String(255), nullable=False)            # 서브타입명
    is_active = Column(Boolean, default=True)

    parent = relationship("TypeMaster", back_populates="subtypes")


class Permission(Base):
    """권한 마스터 — 권한 이름·설명·생성일 CRUD."""
    __tablename__ = "permissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, unique=True)       # 권한명 (예: manage_loads)
    description = Column(Text, nullable=True)                     # 설명
    resource = Column(String(100), nullable=True)                 # 리소스 (예: loads, partners)
    action = Column(String(50), nullable=True)                    # 동작 (예: read, write, delete)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
