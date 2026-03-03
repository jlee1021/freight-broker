from datetime import date, timedelta
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.core.database import get_db
from app.models.load import Load, CarrierSegment
from app.models.invoice import CustomerInvoice
from app.models.partner import Partner

router = APIRouter()


def _revenue_cost_profit_counts(q):
    """Query base for loads: returns (total_revenue, total_cost, total_loads)."""
    rev_cost = (
        q.with_entities(
            func.coalesce(func.sum(Load.revenue), 0),
            func.coalesce(func.sum(Load.cost), 0),
            func.count(Load.id),
        )
        .first()
    )
    r = float(rev_cost[0] or 0)
    c = float(rev_cost[1] or 0)
    n = rev_cost[2] or 0
    return r, c, r - c, n


@router.get("/dashboard")
def get_dashboard_stats(
    date_from: date | None = Query(None, description="Phase 2: filter start (inclusive)"),
    date_to: date | None = Query(None, description="Phase 2: filter end (inclusive)"),
    db: Session = Depends(get_db),
):
    base_q = db.query(Load)
    if date_from is not None:
        base_q = base_q.filter(Load.created_at >= date_from)
    if date_to is not None:
        base_q = base_q.filter(Load.created_at <= date_to)

    total = base_q.count()
    by_status = (
        base_q.with_entities(Load.status, func.count(Load.id))
        .group_by(Load.status)
        .all()
    )
    status_counts = {s: c for s, c in by_status}
    total_revenue, total_cost, total_profit, _ = _revenue_cost_profit_counts(base_q)

    # Recent loads (respect period when given)
    recent_q = (
        db.query(Load)
        .options(joinedload(Load.customer))
        .order_by(Load.created_at.desc())
        .limit(10)
    )
    if date_from is not None:
        recent_q = recent_q.filter(Load.created_at >= date_from)
    if date_to is not None:
        recent_q = recent_q.filter(Load.created_at <= date_to)
    recent = recent_q.all()

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

    out = {
        "total_loads": total,
        "by_status": status_counts,
        "total_revenue": round(total_revenue, 2),
        "total_cost": round(total_cost, 2),
        "total_profit": round(total_profit, 2),
        "recent_loads": [
            {
                "id": str(l.id),
                "load_number": l.load_number,
                "status": l.status,
                "rate": float(l.rate or 0),
                "created_at": str(l.created_at) if l.created_at else None,
                "customer_name": l.customer.name if l.customer else None,
            }
            for l in recent
        ],
        "ar_outstanding": round(float(ar_outstanding), 2),
        "overdue_invoices_count": overdue_invoices,
        "insurance_expiring_soon_count": insurance_expiring,
        "date_from": str(date_from) if date_from else None,
        "date_to": str(date_to) if date_to else None,
    }

    # Phase 2: previous period comparison (same-length period before date_from)
    if date_from is not None and date_to is not None and date_from <= date_to:
        period_days = (date_to - date_from).days + 1
        prev_end = date_from - timedelta(days=1)
        prev_start = prev_end - timedelta(days=period_days - 1)
        prev_q = db.query(Load).filter(
            Load.created_at >= prev_start,
            Load.created_at <= prev_end,
        )
        prev_revenue, prev_cost, prev_profit, prev_loads = _revenue_cost_profit_counts(prev_q)
        out["prev_revenue"] = round(prev_revenue, 2)
        out["prev_cost"] = round(prev_cost, 2)
        out["prev_profit"] = round(prev_profit, 2)
        out["prev_loads"] = prev_loads
        out["pct_change_revenue"] = round((total_revenue - prev_revenue) / prev_revenue * 100, 1) if prev_revenue else None
        out["pct_change_cost"] = round((total_cost - prev_cost) / prev_cost * 100, 1) if prev_cost else None
        out["pct_change_profit"] = round((total_profit - prev_profit) / abs(prev_profit) * 100, 1) if prev_profit else None
        out["pct_change_loads"] = round((total - prev_loads) / prev_loads * 100, 1) if prev_loads else None

    # Phase 3: Top 10 customers (by revenue in period)
    cust_q = db.query(Load).options(joinedload(Load.customer)).filter(Load.status != "cancel")
    if date_from is not None:
        cust_q = cust_q.filter(Load.created_at >= date_from)
    if date_to is not None:
        cust_q = cust_q.filter(Load.created_at <= date_to)
    loads_for_customers = cust_q.all()
    agg: dict[str, dict] = {}
    for l in loads_for_customers:
        cid = str(l.customer_id) if l.customer_id else "_no_customer"
        name = l.customer.name if l.customer else "No customer"
        if cid not in agg:
            agg[cid] = {"name": name, "revenue": 0.0, "cost": 0.0, "load_count": 0}
        agg[cid]["revenue"] += float(l.revenue or 0)
        agg[cid]["cost"] += float(l.cost or 0)
        agg[cid]["load_count"] += 1
    top_customers = []
    for cid, v in sorted(agg.items(), key=lambda x: -x[1]["revenue"])[:10]:
        profit = v["revenue"] - v["cost"]
        ratio = round(profit / v["revenue"] * 100, 1) if v["revenue"] else None
        balance = 0.0
        if cid != "_no_customer":
            try:
                balance = (
                    db.query(func.coalesce(func.sum(CustomerInvoice.amount), 0))
                    .filter(
                        CustomerInvoice.customer_id == UUID(cid),
                        CustomerInvoice.status.in_(["draft", "sent"]),
                    )
                    .scalar()
                    or 0
                )
            except (ValueError, TypeError):
                pass
        top_customers.append({
            "customer_id": cid,
            "name": v["name"],
            "balance": round(float(balance), 2),
            "income": round(v["revenue"], 2),
            "cost": round(v["cost"], 2),
            "profit": round(profit, 2),
            "ratio": ratio,
        })
    out["top_customers"] = top_customers

    # Phase 3: Recently dispatched carriers (loads with carrier segment, by updated_at)
    dispatched_q = (
        db.query(Load)
        .options(
            joinedload(Load.carrier_segments).joinedload(CarrierSegment.carrier),
        )
        .filter(Load.carrier_segments.any())
        .order_by(Load.updated_at.desc().nullslast(), Load.created_at.desc())
        .limit(10)
    )
    dispatched_loads = dispatched_q.all()
    recently_dispatched = []
    for l in dispatched_loads:
        seg = next((s for s in l.carrier_segments if s.carrier_id), None) or (l.carrier_segments[0] if l.carrier_segments else None)
        if not seg:
            continue
        d = l.updated_at or l.created_at
        recently_dispatched.append({
            "date": str(d) if d else None,
            "carrier_name": seg.carrier.name if seg.carrier else "–",
            "carrier_id": str(seg.carrier_id) if seg.carrier_id else None,
            "load_id": str(l.id),
            "load_number": l.load_number,
        })
    out["recently_dispatched_carriers"] = recently_dispatched

    return out


@router.get("/revenue-cost-trend")
def get_revenue_cost_trend(
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    group: str = Query("month", description="month or week"),
    db: Session = Depends(get_db),
):
    """Phase 2: time buckets (month/week) with revenue, cost, profit for charts."""
    if group == "week":
        trunc = func.date_trunc("week", Load.created_at)
    else:
        trunc = func.date_trunc("month", Load.created_at)
    rows = (
        db.query(
            trunc.label("period"),
            func.coalesce(func.sum(Load.revenue), 0).label("revenue"),
            func.coalesce(func.sum(Load.cost), 0).label("cost"),
        )
        .filter(Load.status != "cancel")
    )
    if date_from is not None:
        rows = rows.filter(Load.created_at >= date_from)
    if date_to is not None:
        rows = rows.filter(Load.created_at <= date_to)
    rows = rows.group_by(trunc).order_by(trunc)
    result = rows.all()
    out = []
    for row in result:
        rev = float(row.revenue)
        cost = float(row.cost)
        period_str = str(row.period)[:10] if group == "week" else str(row.period)[:7]
        out.append({
            "period": period_str,
            "revenue": round(rev, 2),
            "cost": round(cost, 2),
            "profit": round(rev - cost, 2),
        })
    return {"items": out}


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
