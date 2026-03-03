"""
EDI 모델: EdiConfig (설정), EdiRecord (EDI 목록)
참조 솔루션 clone 대상 — Dispatch > EDI
"""
from sqlalchemy import Column, String, Text, Boolean, DateTime, Date
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timezone
import uuid

from app.core.database import Base


class EdiConfig(Base):
    """EDI 설정 — Type, Name, Mode, TID, TSI, Remarks, Status."""
    __tablename__ = "edi_configs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)             # 설정명
    edi_type = Column(String(100), nullable=True)          # EDI 유형 (예: 204, 214, 810)
    mode = Column(String(50), nullable=True)               # Test / Production
    tid = Column(String(100), nullable=True)               # Sender ID
    tsi = Column(String(100), nullable=True)               # Receiver ID
    remarks = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class EdiRecord(Base):
    """EDI 전송 기록 — Company, Date, Report Type, Client, Inv#, BoL#, P.O#, Trk#, 등."""
    __tablename__ = "edi_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    edi_config_id = Column(UUID(as_uuid=True), nullable=True)   # EdiConfig 참조 (비강제)
    company = Column(String(255), nullable=True)
    report_date = Column(Date, nullable=True)
    report_type = Column(String(100), nullable=True)
    client = Column(String(255), nullable=True)
    invoice_number = Column(String(100), nullable=True)
    bol_number = Column(String(100), nullable=True)
    po_number = Column(String(100), nullable=True)
    tracking_number = Column(String(100), nullable=True)
    ap_date = Column(Date, nullable=True)                   # Approved Date
    sent_by = Column(String(255), nullable=True)
    sent_at = Column(DateTime, nullable=True)
    status = Column(String(50), nullable=True, default="pending")  # pending, sent, failed
    tp_number = Column(String(100), nullable=True)          # Third Party #
    tp_name = Column(String(255), nullable=True)            # Third Party Name
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
