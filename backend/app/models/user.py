from sqlalchemy import Column, String, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
import enum

from app.core.database import Base


class UserRole(str, enum.Enum):
    dispatcher = "dispatcher"
    sales = "sales"
    billing = "billing"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    role = Column(String(50), default=UserRole.dispatcher.value)
    partner_id = Column(UUID(as_uuid=True), ForeignKey("partners.id"), nullable=True)

    partner = relationship("Partner", backref="portal_users", foreign_keys=[partner_id])
    loads_dispatched = relationship("Load", back_populates="dispatcher", foreign_keys="Load.dispatcher_id")
    load_notes = relationship("LoadNote", back_populates="user")
