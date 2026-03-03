from sqlalchemy import Column, String, Numeric, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
import secrets

from app.core.database import Base


class Tender(Base):
    __tablename__ = "tenders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    load_id = Column(UUID(as_uuid=True), ForeignKey("loads.id", ondelete="CASCADE"), nullable=False)
    carrier_id = Column(UUID(as_uuid=True), ForeignKey("partners.id", ondelete="CASCADE"), nullable=False)

    # pending / accepted / rejected / cancelled
    status = Column(String(20), nullable=False, default="pending")

    message = Column(Text, nullable=True)
    token = Column(String(64), nullable=False, unique=True, default=lambda: secrets.token_urlsafe(32))
    rate_offered = Column(Numeric(12, 2), nullable=True)
    reject_reason = Column(String(100), nullable=True)

    sent_at = Column(DateTime, nullable=True)
    responded_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    load = relationship("Load", back_populates="tenders")
    carrier = relationship("Partner", foreign_keys=[carrier_id])
