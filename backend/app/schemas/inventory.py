from pydantic import BaseModel, model_validator
from typing import Optional
from uuid import UUID
from datetime import date


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
    size: Optional[str] = None
    cost: Optional[float] = 0
    total: Optional[float] = None     # None이면 quantity × cost 자동 계산
    entry_date: Optional[date] = None
    note: Optional[str] = None

    @model_validator(mode="after")
    def calc_total(self):
        """total 미입력 시 quantity × cost 자동 계산."""
        if self.total is None:
            qty = self.quantity or 0
            cst = self.cost or 0
            self.total = round(qty * cst, 2)
        return self


class InventoryItemUpdate(BaseModel):
    sku: Optional[str] = None
    name: Optional[str] = None
    quantity: Optional[float] = None
    size: Optional[str] = None
    cost: Optional[float] = None
    total: Optional[float] = None
    entry_date: Optional[date] = None
    note: Optional[str] = None


class InventoryItemResponse(BaseModel):
    id: UUID
    warehouse_id: UUID
    sku: Optional[str] = None
    name: Optional[str] = None
    quantity: float
    size: Optional[str] = None
    cost: Optional[float] = None
    total: Optional[float] = None
    entry_date: Optional[date] = None
    note: Optional[str] = None

    class Config:
        from_attributes = True
