from sqlalchemy import Column, String, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.database import Base


class LoadNote(Base):
    __tablename__ = "load_notes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    load_id = Column(UUID(as_uuid=True), ForeignKey("loads.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    body = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    load = relationship("Load", back_populates="notes")
    user = relationship("User", back_populates="load_notes")
