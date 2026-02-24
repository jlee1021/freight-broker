from datetime import date, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.core.database import get_db
from app.models.load import Load, CarrierSegment
from app.models.invoice import CustomerInvoice
from app.models.partner import Partner

router = APIRouter()


@router.get("/dashboard")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total = db.query(Load).count()
    by_status = (
        db.query(Load.status, func.count(Load.id))
        .group_by(Load.status)
        .all()
    )
    status_counts = {s: c for s, c in by_status}
    revenue_cost = (
        db.query(
            func.coalesce(func.sum(Load.revenue), 0),
            func.coalesce(func.sum(Load.cost), 0),
        )
        .first()
    )
    total_revenue = float(revenue_cost[0] or 0)
    total_cost = float(revenue_cost[1] or 0)
    total_profit = total_revenue - total_cost
    recent = db.query(Load).order_by(Load.created_at.desc()).limit(10).all()
    ar_outstanding = db.query(func.coalesce(func.sum(CustomerInvoice.amount), 0)).filter(
        CustomerInvoice.status.in_(["draft", "sent"])
    ).scalar() or 0
    overdue_invoices = db.query(CustomerInvoice).filter(
        CustomerInvoice.status.in_(["draft", "sent"]),
        CustomerInvoice.due_date < date.today(),
    ).count()
    insurance_expiring = db.query(Partner).filter(
        Partner.type == "carrier",
        Partner.insurance_expiry.isnot(None),
        Partner.insurance_expiry >= date.today(),
        Partner.insurance_expiry <= date.today() + timedelta(days=30),
    ).count()
    return {
        "total_loads": total,
        "by_status": status_counts,
        "total_revenue": round(total_revenue, 2),
        "total_cost": round(total_cost, 2),
        "total_profit": round(total_profit, 2),
        "recent_loads": [{"id": str(l.id), "load_number": l.load_number, "status": l.status, "rate": float(l.rate or 0), "created_at": str(l.created_at) if l.created_at else None} for l in recent],
        "ar_outstanding": round(float(ar_outstanding), 2),
        "overdue_invoices_count": overdue_invoices,
        "insurance_expiring_soon_count": insurance_expiring,
    }


@router.get("/profit")
def get_profit_summary(db: Session = Depends(get_db)):
    revenue_cost = (
        db.query(
            func.coalesce(func.sum(Load.revenue), 0),
            func.coalesce(func.sum(Load.cost), 0),
        )
        .first()
    )
    total_revenue = float(revenue_cost[0] or 0)
    total_cost = float(revenue_cost[1] or 0)
    return {
        "total_revenue": round(total_revenue, 2),
        "total_cost": round(total_cost, 2),
        "total_profit": round(total_revenue - total_cost, 2),
    }


@router.get("/reports/revenue")
def reports_revenue(
    group_by: str = Query("customer", description="customer or carrier"),
    date_from: date | None = None,
    date_to: date | None = None,
    db: Session = Depends(get_db),
):

    q = db.query(Load).options(
        joinedload(Load.customer),
        joinedload(Load.carrier_segments).joinedload(CarrierSegment.carrier),
    ).filter(Load.status != "cancel")
    if date_from:
        q = q.filter(Load.created_at >= date_from)
    if date_to:
        q = q.filter(Load.created_at <= date_to)
    loads = q.all()

    if group_by == "customer":
        agg: dict[str, dict] = {}
        for l in loads:
            key = str(l.customer_id) if l.customer_id else "_no_customer"
            name = l.customer.name if l.customer else "No customer"
            if key not in agg:
                agg[key] = {"name": name, "revenue": 0, "cost": 0, "load_count": 0}
            agg[key]["revenue"] += float(l.revenue or 0)
            agg[key]["cost"] += float(l.cost or 0)
            agg[key]["load_count"] += 1
        return {"items": [{"id": k, "name": v["name"], "revenue": round(v["revenue"], 2), "cost": round(v["cost"], 2), "profit": round(v["revenue"] - v["cost"], 2), "load_count": v["load_count"]} for k, v in agg.items()]}
    else:
        agg = {}
        for l in loads:
            for seg in l.carrier_segments:
                key = str(seg.carrier_id) if seg.carrier_id else "_no_carrier"
                name = seg.carrier.name if seg.carrier else "No carrier"
                if key not in agg:
                    agg[key] = {"name": name, "revenue": 0, "cost": 0, "load_count": 0}
                agg[key]["cost"] += float(seg.total or 0)
                agg[key]["load_count"] += 1
        return {"items": [{"id": k, "name": v["name"], "cost": round(v["cost"], 2), "load_count": v["load_count"]} for k, v in agg.items()]}


@router.get("/carrier-performance")
def get_carrier_performance(db: Session = Depends(get_db)):
    """캐리어별 평균 평점·온타임 건수."""
    segs = (
        db.query(CarrierSegment)
        .options(joinedload(CarrierSegment.carrier))
        .filter(CarrierSegment.carrier_id.isnot(None))
        .all()
    )
    agg: dict[str, dict] = {}
    for s in segs:
        cid = str(s.carrier_id)
        if cid not in agg:
            agg[cid] = {"name": s.carrier.name if s.carrier else "-", "ratings": [], "on_time_count": 0, "total_count": 0}
        agg[cid]["total_count"] += 1
        if s.rating is not None:
            agg[cid]["ratings"].append(s.rating)
        if s.on_time is True:
            agg[cid]["on_time_count"] += 1
    items = []
    for cid, v in agg.items():
        avg_rating = round(sum(v["ratings"]) / len(v["ratings"]), 1) if v["ratings"] else None
        on_time_pct = round(100 * v["on_time_count"] / v["total_count"], 1) if v["total_count"] else None
        items.append({
            "carrier_id": cid,
            "name": v["name"],
            "average_rating": avg_rating,
            "on_time_count": v["on_time_count"],
            "total_loads": v["total_count"],
            "on_time_pct": on_time_pct,
        })
    return {"items": items}


@router.get("/reports/by-lane")
def reports_by_lane(
    date_from: date | None = None,
    date_to: date | None = None,
    db: Session = Depends(get_db),
):
    """레인(구간)별 리포트: shipper/consignee city, province로 그룹, 수익/비용/마진."""
    from app.models.load import ShipperStop, ConsigneeStop

    q = db.query(Load).options(
        joinedload(Load.shipper_stops),
        joinedload(Load.consignee_stops),
    ).filter(Load.status != "cancel")
    if date_from:
        q = q.filter(Load.created_at >= date_from)
    if date_to:
        q = q.filter(Load.created_at <= date_to)
    loads = q.all()

    agg: dict[tuple[str, str], dict] = {}
    for l in loads:
        origin = "–"
        dest = "–"
        if l.shipper_stops:
            s = l.shipper_stops[0]
            origin = ", ".join(filter(None, [s.city, s.province])) or s.address or "–"
        if l.consignee_stops:
            c = l.consignee_stops[0]
            dest = ", ".join(filter(None, [c.city, c.province])) or c.address or "–"
        key = (origin, dest)
        if key not in agg:
            agg[key] = {"revenue": 0.0, "cost": 0.0, "load_count": 0}
        agg[key]["revenue"] += float(l.revenue or 0)
        agg[key]["cost"] += float(l.cost or 0)
        agg[key]["load_count"] += 1

    items = [
        {
            "origin": o,
            "destination": d,
            "load_count": v["load_count"],
            "revenue": round(v["revenue"], 2),
            "cost": round(v["cost"], 2),
            "profit": round(v["revenue"] - v["cost"], 2),
        }
        for (o, d), v in agg.items()
    ]
    return {"items": items}
