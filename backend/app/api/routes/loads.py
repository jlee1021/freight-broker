import csv
import io
from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from uuid import UUID
from datetime import time as dt_time, date as dt_date

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.load import Load, ShipperStop, ConsigneeStop, CarrierSegment, Reference
from app.models.partner import Partner
from app.schemas.load import (
    LoadCreate,
    LoadUpdate,
    LoadUpdateFull,
    LoadResponse,
    LoadDetailResponse,
    LoadListResponse,
    ShipperStopCreate,
    ConsigneeStopCreate,
    CarrierSegmentCreate,
    ReferenceCreate,
)

router = APIRouter()


def _time_from_str(s: Optional[str]):
    if not s:
        return None
    try:
        parts = s.strip().split(":")
        if len(parts) >= 2:
            return dt_time(int(parts[0]), int(parts[1]), int(parts[2]) if len(parts) > 2 else 0)
    except (ValueError, IndexError):
        pass
    return None


def _recompute_load_financials(load: Load, db: Session) -> None:
    """Set revenue, cost, profit_pct, gst, total_with_gst from rate and carrier totals."""
    rate = load.rate or 0
    fsc = load.fsc_percent or 0
    other = load.other_charges or 0
    revenue = float(rate) * (1 + float(fsc) / 100) + float(other)
    load.revenue = round(revenue, 2)
    # carrier_segments may not be loaded yet — fetch directly to avoid N+1 on lazy load
    segments = load.carrier_segments if load.carrier_segments is not None else (
        db.query(CarrierSegment).filter(CarrierSegment.load_id == load.id).all()
    )
    cost = sum(float(s.total or 0) for s in segments)
    load.cost = round(cost, 2)
    if revenue:
        load.profit_pct = round((revenue - cost) / revenue * 100, 2)
    gst_rate = 0.05 if (load.tax_code or "").upper() == "GST" else 0
    load.gst = round(revenue * gst_rate, 2)
    load.total_with_gst = round(revenue + (revenue * gst_rate), 2)


def _load_to_detail(load: Load) -> LoadDetailResponse:
    return LoadDetailResponse(
        id=load.id,
        load_number=load.load_number,
        status=load.status,
        customer_id=load.customer_id,
        dispatcher_id=load.dispatcher_id,
        sales_rep_id=load.sales_rep_id,
        billing_rep_id=load.billing_rep_id,
        rate=load.rate,
        fsc_percent=load.fsc_percent,
        tax_code=load.tax_code,
        other_charges=load.other_charges or 0,
        auto_rate=load.auto_rate,
        equipment_type=load.equipment_type,
        weight=load.weight,
        weight_unit=load.weight_unit or "lbs",
        commodity=load.commodity,
        po_number=load.po_number,
        revenue=load.revenue,
        cost=load.cost,
        profit_pct=load.profit_pct,
        gst=load.gst,
        total_with_gst=load.total_with_gst,
        created_at=load.created_at,
        customer_name=load.customer.name if load.customer else None,
        dispatcher_name=load.dispatcher.full_name if load.dispatcher else None,
        shipper_stops=sorted(load.shipper_stops, key=lambda x: x.sequence or 0),
        consignee_stops=sorted(load.consignee_stops, key=lambda x: x.sequence or 0),
        carrier_segments=load.carrier_segments,
        references=load.references,
    )


def _portal_filter_loads(query, user: User, db: Session):
    """포털 사용자(고객/캐리어)면 자신의 로드만 보이도록 필터."""
    if not user.partner_id:
        return query
    partner = db.query(Partner).filter(Partner.id == user.partner_id).first()
    if not partner:
        return query
    if (partner.type or "").strip().lower() == "customer":
        return query.filter(Load.customer_id == user.partner_id)
    if (partner.type or "").strip().lower() == "carrier":
        return query.join(CarrierSegment).filter(CarrierSegment.carrier_id == user.partner_id).distinct()
    return query


@router.get("", response_model=LoadListResponse)
def list_loads(
    status: Optional[str] = None,
    q: Optional[str] = None,
    customer_id: Optional[UUID] = None,
    date_from: Optional[dt_date] = None,
    date_to: Optional[dt_date] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=2000),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = db.query(Load)
    query = _portal_filter_loads(query, user, db)
    if status:
        query = query.filter(Load.status == status)
    if q:
        query = query.filter(Load.load_number.ilike(f"%{q}%"))
    if customer_id:
        query = query.filter(Load.customer_id == customer_id)
    if date_from:
        query = query.filter(Load.created_at >= date_from)
    if date_to:
        query = query.filter(Load.created_at <= date_to)
    total = query.count()
    items = query.order_by(Load.created_at.desc()).offset(skip).limit(limit).all()
    return LoadListResponse(total=total, items=items)


class BulkStatusUpdate(BaseModel):
    load_ids: list[UUID]
    status: str


@router.patch("/bulk-status")
def bulk_update_status(body: BulkStatusUpdate, db: Session = Depends(get_db)):
    """여러 로드의 상태를 한 번에 변경."""
    if not body.load_ids:
        return {"updated": 0, "message": "No load_ids"}
    allowed = {"pending", "unassigned", "on_hold", "need_to_cover", "assigned", "in_transit", "delivered", "cancel"}
    status = (body.status or "").strip().lower()
    if status not in allowed:
        raise HTTPException(status_code=400, detail=f"Invalid status. Use one of: {allowed}")
    count = db.query(Load).filter(Load.id.in_(body.load_ids)).update({Load.status: status}, synchronize_session=False)
    db.commit()
    return {"updated": count, "status": status}


@router.get("/export/csv")
def export_loads_csv(
    status: Optional[str] = None,
    date_from: Optional[dt_date] = None,
    date_to: Optional[dt_date] = None,
    limit: int = Query(5000, ge=1, le=50000),
    db: Session = Depends(get_db),
):
    """Export loads as CSV (revenue, cost, customer, status, dates)."""
    query = db.query(Load).options(joinedload(Load.customer)).filter(Load.status != "cancel")
    if status:
        query = query.filter(Load.status == status)
    if date_from:
        query = query.filter(Load.created_at >= date_from)
    if date_to:
        query = query.filter(Load.created_at <= date_to)
    items = query.order_by(Load.created_at.desc()).limit(limit).all()
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["load_number", "status", "customer", "rate", "revenue", "cost", "profit_pct", "created_at"])
    for l in items:
        w.writerow([
            l.load_number,
            l.status or "",
            l.customer.name if l.customer else "",
            l.rate,
            l.revenue,
            l.cost,
            l.profit_pct,
            str(l.created_at) if l.created_at else "",
        ])
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=loads_export.csv"},
    )


def _load_belongs_to_portal_user(load: Load, user: User, db: Session) -> bool:
    if not user.partner_id:
        return True
    partner = db.query(Partner).filter(Partner.id == user.partner_id).first()
    if not partner:
        return True
    if (partner.type or "").strip().lower() == "customer":
        return load.customer_id == user.partner_id
    if (partner.type or "").strip().lower() == "carrier":
        return any(seg.carrier_id == user.partner_id for seg in (load.carrier_segments or []))
    return True


@router.get("/{load_id}", response_model=LoadDetailResponse)
def get_load(load_id: UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    load = (
        db.query(Load)
        .options(
            joinedload(Load.customer),
            joinedload(Load.dispatcher),
            joinedload(Load.shipper_stops),
            joinedload(Load.consignee_stops),
            joinedload(Load.carrier_segments),
            joinedload(Load.references),
        )
        .filter(Load.id == load_id)
        .first()
    )
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    if not _load_belongs_to_portal_user(load, user, db):
        raise HTTPException(status_code=404, detail="Load not found")
    return _load_to_detail(load)


@router.post("", response_model=LoadResponse)
def create_load(payload: LoadCreate, db: Session = Depends(get_db)):
    load = Load(**payload.model_dump())
    db.add(load)
    db.commit()
    db.refresh(load)
    return load


@router.patch("/{load_id}", response_model=LoadDetailResponse)
def update_load(load_id: UUID, payload: LoadUpdate, db: Session = Depends(get_db)):
    load = (
        db.query(Load)
        .options(
            joinedload(Load.customer),
            joinedload(Load.dispatcher),
            joinedload(Load.shipper_stops),
            joinedload(Load.consignee_stops),
            joinedload(Load.carrier_segments),
            joinedload(Load.references),
        )
        .filter(Load.id == load_id)
        .first()
    )
    if not load:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Load not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(load, k, v)
    _recompute_load_financials(load, db)
    db.commit()
    db.refresh(load)
    return _load_to_detail(load)


@router.put("/{load_id}", response_model=LoadDetailResponse)
def update_load_full(load_id: UUID, payload: LoadUpdateFull, db: Session = Depends(get_db)):
    load = (
        db.query(Load)
        .options(
            joinedload(Load.customer),
            joinedload(Load.dispatcher),
            joinedload(Load.shipper_stops),
            joinedload(Load.consignee_stops),
            joinedload(Load.carrier_segments),
            joinedload(Load.references),
        )
        .filter(Load.id == load_id)
        .first()
    )
    if not load:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Load not found")

    data = payload.model_dump(exclude_unset=True)
    nested = ["shipper_stops", "consignee_stops", "carrier_segments", "references"]
    for k, v in data.items():
        if k in nested:
            continue
        setattr(load, k, v)

    if payload.shipper_stops is not None:
        db.query(ShipperStop).filter(ShipperStop.load_id == load_id).delete()
        for i, s in enumerate(payload.shipper_stops):
            d = s.model_dump()
            d["load_id"] = load_id
            d["sequence"] = i + 1
            d["time_start"] = _time_from_str(d.get("time_start"))
            d["time_end"] = _time_from_str(d.get("time_end"))
            db.add(ShipperStop(**d))
    if payload.consignee_stops is not None:
        db.query(ConsigneeStop).filter(ConsigneeStop.load_id == load_id).delete()
        for i, c in enumerate(payload.consignee_stops):
            d = c.model_dump()
            d["load_id"] = load_id
            d["sequence"] = i + 1
            d["time_start"] = _time_from_str(d.get("time_start"))
            d["time_end"] = _time_from_str(d.get("time_end"))
            db.add(ConsigneeStop(**d))
    if payload.carrier_segments is not None:
        db.query(CarrierSegment).filter(CarrierSegment.load_id == load_id).delete()
        for seg in payload.carrier_segments:
            d = seg.model_dump()
            d["load_id"] = load_id
            db.add(CarrierSegment(**d))
    if payload.references is not None:
        db.query(Reference).filter(Reference.load_id == load_id).delete()
        for ref in payload.references:
            d = ref.model_dump()
            d["load_id"] = load_id
            db.add(Reference(**d))

    db.flush()
    load = (
        db.query(Load)
        .options(
            joinedload(Load.customer),
            joinedload(Load.dispatcher),
            joinedload(Load.shipper_stops),
            joinedload(Load.consignee_stops),
            joinedload(Load.carrier_segments),
            joinedload(Load.references),
        )
        .filter(Load.id == load_id)
        .first()
    )
    _recompute_load_financials(load, db)
    db.commit()
    db.refresh(load)
    load = (
        db.query(Load)
        .options(
            joinedload(Load.customer),
            joinedload(Load.dispatcher),
            joinedload(Load.shipper_stops),
            joinedload(Load.consignee_stops),
            joinedload(Load.carrier_segments),
            joinedload(Load.references),
        )
        .filter(Load.id == load_id)
        .first()
    )
    return _load_to_detail(load)
