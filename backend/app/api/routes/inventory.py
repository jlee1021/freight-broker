from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.inventory import Warehouse, InventoryItem
from app.schemas.inventory import (
    WarehouseCreate,
    WarehouseUpdate,
    WarehouseResponse,
    InventoryItemCreate,
    InventoryItemUpdate,
    InventoryItemResponse,
)

router = APIRouter()


# Warehouses
@router.get("/warehouses", response_model=list[WarehouseResponse])
def list_warehouses(db: Session = Depends(get_db)):
    return db.query(Warehouse).all()


@router.post("/warehouses", response_model=WarehouseResponse)
def create_warehouse(payload: WarehouseCreate, db: Session = Depends(get_db)):
    w = Warehouse(name=payload.name, address=payload.address)
    db.add(w)
    db.commit()
    db.refresh(w)
    return w


@router.get("/warehouses/{warehouse_id}", response_model=WarehouseResponse)
def get_warehouse(warehouse_id: UUID, db: Session = Depends(get_db)):
    w = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    return w


@router.patch("/warehouses/{warehouse_id}", response_model=WarehouseResponse)
def update_warehouse(warehouse_id: UUID, payload: WarehouseUpdate, db: Session = Depends(get_db)):
    w = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(w, k, v)
    db.commit()
    db.refresh(w)
    return w


@router.delete("/warehouses/{warehouse_id}")
def delete_warehouse(warehouse_id: UUID, db: Session = Depends(get_db)):
    w = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    db.delete(w)
    db.commit()
    return {"ok": True}


# Inventory items
@router.get("/warehouses/{warehouse_id}/items", response_model=list[InventoryItemResponse])
def list_items(warehouse_id: UUID, db: Session = Depends(get_db)):
    if not db.query(Warehouse).filter(Warehouse.id == warehouse_id).first():
        raise HTTPException(status_code=404, detail="Warehouse not found")
    return db.query(InventoryItem).filter(InventoryItem.warehouse_id == warehouse_id).all()


@router.post("/warehouses/{warehouse_id}/items", response_model=InventoryItemResponse)
def create_item(warehouse_id: UUID, payload: InventoryItemCreate, db: Session = Depends(get_db)):
    if not db.query(Warehouse).filter(Warehouse.id == warehouse_id).first():
        raise HTTPException(status_code=404, detail="Warehouse not found")
    item = InventoryItem(
        warehouse_id=warehouse_id,
        sku=payload.sku,
        name=payload.name,
        quantity=payload.quantity or 0,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/warehouses/{warehouse_id}/items/{item_id}", response_model=InventoryItemResponse)
def update_item(
    warehouse_id: UUID,
    item_id: UUID,
    payload: InventoryItemUpdate,
    db: Session = Depends(get_db),
):
    item = (
        db.query(InventoryItem)
        .filter(InventoryItem.id == item_id, InventoryItem.warehouse_id == warehouse_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(item, k, v)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/warehouses/{warehouse_id}/items/{item_id}")
def delete_item(warehouse_id: UUID, item_id: UUID, db: Session = Depends(get_db)):
    item = (
        db.query(InventoryItem)
        .filter(InventoryItem.id == item_id, InventoryItem.warehouse_id == warehouse_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
    return {"ok": True}
