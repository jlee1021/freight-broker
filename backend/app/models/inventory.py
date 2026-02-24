from sqlalchemy import Column, String, Numeric, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.core.database import Base


class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    address = Column(String(512), nullable=True)

    items = relationship("InventoryItem", back_populates="warehouse", cascade="all, delete-orphan")


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    warehouse_id = Column(UUID(as_uuid=True), ForeignKey("warehouses.id", ondelete="CASCADE"), nullable=False)
    sku = Column(String(100), nullable=True)
    name = Column(String(255), nullable=True)
    quantity = Column(Numeric(12, 2), default=0)

    warehouse = relationship("Warehouse", back_populates="items")
