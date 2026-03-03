from sqlalchemy import Column, String, Numeric, ForeignKey, Date, Text
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
    """재고 아이템 — Size·Cost·Total·EntryDate·Note 확장 포함."""
    __tablename__ = "inventory_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    warehouse_id = Column(UUID(as_uuid=True), ForeignKey("warehouses.id", ondelete="CASCADE"), nullable=False)
    sku = Column(String(100), nullable=True)
    name = Column(String(255), nullable=True)
    quantity = Column(Numeric(12, 2), default=0)
    size = Column(String(100), nullable=True)             # 크기 (예: S/M/L, 10x20x30cm)
    cost = Column(Numeric(12, 2), default=0)              # 단가
    total = Column(Numeric(14, 2), default=0)             # 합계 (quantity × cost, 자동 계산 또는 수동 입력)
    entry_date = Column(Date, nullable=True)              # 입고일
    note = Column(Text, nullable=True)                    # 메모

    warehouse = relationship("Warehouse", back_populates="items")
