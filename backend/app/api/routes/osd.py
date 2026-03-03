"""OSD (Overages, Shortages, Damages) CRUD API."""
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel
from typing import Optional
import uuid

from app.core.database import get_db
from app.models.os_osd import OsdRecord

router = APIRouter()


class OsdIn(BaseModel):
    load_id: Optional[str] = None
    ref_number: Optional[str] = None
    status: Optional[str] = "open"
    osd_type: Optional[str] = None
    amount: Optional[float] = None
    ar_amount: Optional[float] = None
    ap_amount: Optional[float] = None
    customer_id: Optional[str] = None
    shipper_id: Optional[str] = None
    carrier_id: Optional[str] = None
    ship_date: Optional[date] = None
    delivery_date: Optional[date] = None
    due_date: Optional[date] = None
    expired_cargo: Optional[bool] = False
    company_name: Optional[str] = None
    notes: Optional[str] = None


def _to_dict(o: OsdRecord) -> dict:
    return {
        "id": str(o.id),
        "load_id": str(o.load_id) if o.load_id else None,
        "load_number": o.load.load_number if o.load else None,
        "ref_number": o.ref_number,
        "status": o.status,
        "osd_type": o.osd_type,
        "amount": float(o.amount) if o.amount is not None else None,
        "ar_amount": float(o.ar_amount) if o.ar_amount is not None else None,
        "ap_amount": float(o.ap_amount) if o.ap_amount is not None else None,
        "customer_id": str(o.customer_id) if o.customer_id else None,
        "customer_name": o.customer.name if o.customer else None,
        "shipper_id": str(o.shipper_id) if o.shipper_id else None,
        "shipper_name": o.shipper.name if o.shipper else None,
        "carrier_id": str(o.carrier_id) if o.carrier_id else None,
        "carrier_name": o.carrier.name if o.carrier else None,
        "ship_date": str(o.ship_date) if o.ship_date else None,
        "delivery_date": str(o.delivery_date) if o.delivery_date else None,
        "due_date": str(o.due_date) if o.due_date else None,
        "expired_cargo": o.expired_cargo,
        "company_name": o.company_name,
        "notes": o.notes,
        "created_at": str(o.created_at) if o.created_at else None,
    }


@router.get("")
def list_osd(
    status: Optional[str] = Query(None),
    osd_type: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(OsdRecord).options(
        joinedload(OsdRecord.load),
        joinedload(OsdRecord.customer),
        joinedload(OsdRecord.shipper),
        joinedload(OsdRecord.carrier),
    )
    if status:
        query = query.filter(OsdRecord.status == status)
    if osd_type:
        query = query.filter(OsdRecord.osd_type == osd_type)
    if date_from:
        query = query.filter(OsdRecord.ship_date >= date_from)
    if date_to:
        query = query.filter(OsdRecord.ship_date <= date_to)
    items = query.order_by(OsdRecord.created_at.desc()).all()
    return [_to_dict(o) for o in items]


@router.get("/{osd_id}")
def get_osd(osd_id: str, db: Session = Depends(get_db)):
    o = db.query(OsdRecord).options(
        joinedload(OsdRecord.load),
        joinedload(OsdRecord.customer),
        joinedload(OsdRecord.shipper),
        joinedload(OsdRecord.carrier),
    ).filter(OsdRecord.id == uuid.UUID(osd_id)).first()
    if not o:
        raise HTTPException(status_code=404, detail="Not found")
    return _to_dict(o)


def _parse_uuid(val: Optional[str]):
    if not val:
        return None
    try:
        return uuid.UUID(val)
    except ValueError:
        return None


@router.post("", status_code=201)
def create_osd(body: OsdIn, db: Session = Depends(get_db)):
    data = body.model_dump()
    data["load_id"] = _parse_uuid(data.get("load_id"))
    data["customer_id"] = _parse_uuid(data.get("customer_id"))
    data["shipper_id"] = _parse_uuid(data.get("shipper_id"))
    data["carrier_id"] = _parse_uuid(data.get("carrier_id"))
    o = OsdRecord(**data)
    db.add(o)
    db.commit()
    db.refresh(o)
    return _to_dict(o)


@router.patch("/{osd_id}")
def update_osd(osd_id: str, body: OsdIn, db: Session = Depends(get_db)):
    o = db.query(OsdRecord).filter(OsdRecord.id == uuid.UUID(osd_id)).first()
    if not o:
        raise HTTPException(status_code=404, detail="Not found")
    data = body.model_dump(exclude_unset=True)
    for uuid_field in ("load_id", "customer_id", "shipper_id", "carrier_id"):
        if uuid_field in data:
            data[uuid_field] = _parse_uuid(data[uuid_field])
    for k, v in data.items():
        setattr(o, k, v)
    db.commit()
    db.refresh(o)
    return _to_dict(o)


@router.delete("/{osd_id}", status_code=204)
def delete_osd(osd_id: str, db: Session = Depends(get_db)):
    o = db.query(OsdRecord).filter(OsdRecord.id == uuid.UUID(osd_id)).first()
    if not o:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(o)
    db.commit()
