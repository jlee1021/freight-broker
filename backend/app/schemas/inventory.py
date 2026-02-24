from pydantic import BaseModel
from typing import Optional
from uuid import UUID


class WarehouseCreate(BaseModel):
    name: str
    address: Optional[str] = None


class WarehouseUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None


class WarehouseResponse(BaseModel):
    id: UUID
    name: str
    address: Optional[str] = None

    class Config:
        from_attributes = True


class InventoryItemCreate(BaseModel):
    sku: Optional[str] = None
    name: Optional[str] = None
    quantity: Optional[float] = 0


class InventoryItemUpdate(BaseModel):
    sku: Optional[str] = None
    name: Optional[str] = None
    quantity: Optional[float] = None


class InventoryItemResponse(BaseModel):
    id: UUID
    warehouse_id: UUID
    sku: Optional[str] = None
    name: Optional[str] = None
    quantity: float

    class Config:
        from_attributes = True
