"""OS List (Order Sheet) CRUD API."""
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel
from typing import Optional
import uuid

from app.core.database import get_db
from app.models.os_osd import OsOrder

router = APIRouter()


class OsOrderIn(BaseModel):
    order_code: Optional[str] = None
    status: Optional[str] = "pending"
    contract_type: Optional[str] = None
    customer_id: Optional[str] = None
    buyer: Optional[str] = None
    sales_rep: Optional[str] = None
    customer_po: Optional[str] = None
    load_date: Optional[date] = None
    deliver_date: Optional[date] = None
    product_name: Optional[str] = None
    qty: Optional[float] = None
    unit_price: Optional[float] = None
    currency: Optional[str] = "CAD"
    tax: Optional[float] = None
    subtotal: Optional[float] = None
    total: Optional[float] = None
    invoice_number: Optional[str] = None
    billing_type: Optional[str] = None
    memo: Optional[str] = None
    created_by: Optional[str] = None


def _to_dict(o: OsOrder) -> dict:
    return {
        "id": str(o.id),
        "order_code": o.order_code,
        "status": o.status,
        "contract_type": o.contract_type,
        "customer_id": str(o.customer_id) if o.customer_id else None,
        "customer_name": o.customer.name if o.customer else None,
        "buyer": o.buyer,
        "sales_rep": o.sales_rep,
        "customer_po": o.customer_po,
        "load_date": str(o.load_date) if o.load_date else None,
        "deliver_date": str(o.deliver_date) if o.deliver_date else None,
        "product_name": o.product_name,
        "qty": float(o.qty) if o.qty is not None else None,
        "unit_price": float(o.unit_price) if o.unit_price is not None else None,
        "currency": o.currency,
        "tax": float(o.tax) if o.tax is not None else None,
        "subtotal": float(o.subtotal) if o.subtotal is not None else None,
        "total": float(o.total) if o.total is not None else None,
        "invoice_number": o.invoice_number,
        "billing_type": o.billing_type,
        "memo": o.memo,
        "created_by": o.created_by,
        "created_at": str(o.created_at) if o.created_at else None,
    }


@router.get("")
def list_os_orders(
    status: Optional[str] = Query(None),
    contract_type: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    q: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(OsOrder).options(joinedload(OsOrder.customer))
    if status:
        query = query.filter(OsOrder.status == status)
    if contract_type:
        query = query.filter(OsOrder.contract_type == contract_type)
    if date_from:
        query = query.filter(OsOrder.load_date >= date_from)
    if date_to:
        query = query.filter(OsOrder.load_date <= date_to)
    if q:
        query = query.filter(OsOrder.order_code.ilike(f"%{q}%"))
    items = query.order_by(OsOrder.created_at.desc()).all()
    return [_to_dict(o) for o in items]


@router.get("/{os_id}")
def get_os_order(os_id: str, db: Session = Depends(get_db)):
    o = db.query(OsOrder).options(joinedload(OsOrder.customer)).filter(OsOrder.id == uuid.UUID(os_id)).first()
    if not o:
        raise HTTPException(status_code=404, detail="Not found")
    return _to_dict(o)


@router.post("", status_code=201)
def create_os_order(body: OsOrderIn, db: Session = Depends(get_db)):
    o = OsOrder(**{k: v for k, v in body.model_dump().items() if k != "customer_id"})
    if body.customer_id:
        try:
            o.customer_id = uuid.UUID(body.customer_id)
        except ValueError:
            pass
    db.add(o)
    db.commit()
    db.refresh(o)
    return _to_dict(o)


@router.patch("/{os_id}")
def update_os_order(os_id: str, body: OsOrderIn, db: Session = Depends(get_db)):
    o = db.query(OsOrder).filter(OsOrder.id == uuid.UUID(os_id)).first()
    if not o:
        raise HTTPException(status_code=404, detail="Not found")
    data = body.model_dump(exclude_unset=True)
    if "customer_id" in data and data["customer_id"]:
        try:
            data["customer_id"] = uuid.UUID(data["customer_id"])
        except ValueError:
            data.pop("customer_id", None)
    for k, v in data.items():
        setattr(o, k, v)
    db.commit()
    db.refresh(o)
    return _to_dict(o)


@router.delete("/{os_id}", status_code=204)
def delete_os_order(os_id: str, db: Session = Depends(get_db)):
    o = db.query(OsOrder).filter(OsOrder.id == uuid.UUID(os_id)).first()
    if not o:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(o)
    db.commit()
