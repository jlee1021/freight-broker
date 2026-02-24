import csv
import io
from uuid import UUID
from datetime import date, datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse, Response, StreamingResponse
from sqlalchemy.orm import Session, joinedload

try:
    from weasyprint import HTML as WeasyHTML
    _WEASYPRINT_AVAILABLE = True
except Exception:
    _WEASYPRINT_AVAILABLE = False

from app.core.database import get_db
from app.core.config import get_settings
from app.api.deps import get_current_user
from app.models.user import User
from app.models.load import Load
from app.models.partner import Partner
from app.models.invoice import CustomerInvoice, CarrierPayable
from app.models.load import CarrierSegment
from app.schemas.invoice import (
    CustomerInvoiceCreate,
    CustomerInvoiceUpdate,
    CustomerInvoiceResponse,
    CarrierPayableCreate,
    CarrierPayableUpdate,
    CarrierPayableResponse,
)

router = APIRouter(prefix="/invoices", tags=["invoices"])


def _portal_can_access_customer_invoice(ci: CustomerInvoice, user: User, db: Session) -> bool:
    if not user.partner_id:
        return True
    partner = db.query(Partner).filter(Partner.id == user.partner_id).first()
    return partner and (partner.type or "").strip().lower() == "customer" and ci.customer_id == user.partner_id


def _portal_can_access_carrier_payable(cp: CarrierPayable, user: User, db: Session) -> bool:
    if not user.partner_id:
        return True
    partner = db.query(Partner).filter(Partner.id == user.partner_id).first()
    if not partner or (partner.type or "").strip().lower() != "carrier":
        return True
    return cp.carrier_segment and cp.carrier_segment.carrier_id == user.partner_id


def _ci_to_response(ci: CustomerInvoice) -> CustomerInvoiceResponse:
    load_number = ci.load.load_number if ci.load else None
    customer_name = ci.customer.name if ci.customer else None
    return CustomerInvoiceResponse(
        id=ci.id,
        load_id=ci.load_id,
        customer_id=ci.customer_id,
        invoice_number=ci.invoice_number,
        amount=ci.amount,
        status=ci.status,
        due_date=ci.due_date,
        sent_at=ci.sent_at,
        paid_at=ci.paid_at,
        created_at=ci.created_at,
        load_number=load_number,
        customer_name=customer_name,
    )


def _cp_to_response(cp: CarrierPayable) -> CarrierPayableResponse:
    seg = cp.carrier_segment
    load_number = seg.load.load_number if seg and seg.load else None
    carrier_name = seg.carrier.name if seg and seg.carrier else None
    return CarrierPayableResponse(
        id=cp.id,
        carrier_segment_id=cp.carrier_segment_id,
        amount=cp.amount,
        invoice_number=cp.invoice_number,
        status=cp.status,
        paid_at=cp.paid_at,
        created_at=cp.created_at,
        load_number=load_number,
        carrier_name=carrier_name,
    )


# --- Customer Invoices (AR) ---
@router.get("/customer", response_model=list[CustomerInvoiceResponse])
def list_customer_invoices(
    status: str | None = None,
    customer_id: UUID | None = None,
    overdue: bool = False,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = db.query(CustomerInvoice).options(
        joinedload(CustomerInvoice.load),
        joinedload(CustomerInvoice.customer),
    )
    if user.partner_id:
        partner = db.query(Partner).filter(Partner.id == user.partner_id).first()
        if partner and (partner.type or "").strip().lower() == "customer":
            query = query.filter(CustomerInvoice.customer_id == user.partner_id)
    if status:
        query = query.filter(CustomerInvoice.status == status)
    if customer_id:
        query = query.filter(CustomerInvoice.customer_id == customer_id)
    if overdue:
        today = date.today()
        query = query.filter(
            CustomerInvoice.due_date.isnot(None),
            CustomerInvoice.due_date < today,
            CustomerInvoice.status.in_(["draft", "sent"]),
        )
    items = query.order_by(CustomerInvoice.created_at.desc()).all()
    return [_ci_to_response(i) for i in items]


@router.get("/customer/export/csv")
def export_customer_invoices_csv(
    status: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(CustomerInvoice).options(
        joinedload(CustomerInvoice.load),
        joinedload(CustomerInvoice.customer),
    )
    if status:
        query = query.filter(CustomerInvoice.status == status)
    items = query.order_by(CustomerInvoice.created_at.desc()).limit(10000).all()
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["invoice_number", "load_number", "customer_name", "amount", "status", "due_date", "created_at"])
    for i in items:
        w.writerow([
            i.invoice_number,
            i.load.load_number if i.load else "",
            i.customer.name if i.customer else "",
            i.amount,
            i.status,
            str(i.due_date) if i.due_date else "",
            str(i.created_at) if i.created_at else "",
        ])
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=ar_invoices_export.csv"},
    )


@router.post("/customer", response_model=CustomerInvoiceResponse)
def create_customer_invoice(payload: CustomerInvoiceCreate, db: Session = Depends(get_db)):
    load = db.query(Load).options(joinedload(Load.customer)).filter(Load.id == payload.load_id).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    existing = db.query(CustomerInvoice).filter(CustomerInvoice.load_id == payload.load_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Invoice already exists for this load")
    inv_num = payload.invoice_number or f"INV-{load.load_number}"
    if db.query(CustomerInvoice).filter(CustomerInvoice.invoice_number == inv_num).first():
        inv_num = f"{inv_num}-{payload.load_id.hex[:8]}"
    amount = float(load.revenue or 0)
    due = payload.due_date or (date.today() + timedelta(days=30))
    ci = CustomerInvoice(
        load_id=payload.load_id,
        customer_id=load.customer_id,
        invoice_number=inv_num,
        amount=amount,
        status="draft",
        due_date=due,
    )
    db.add(ci)
    db.commit()
    db.refresh(ci)
    ci = db.query(CustomerInvoice).options(joinedload(CustomerInvoice.load), joinedload(CustomerInvoice.customer)).filter(CustomerInvoice.id == ci.id).first()
    return _ci_to_response(ci)


@router.patch("/customer/{inv_id}", response_model=CustomerInvoiceResponse)
def update_customer_invoice(
    inv_id: UUID, payload: CustomerInvoiceUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    ci = db.query(CustomerInvoice).options(joinedload(CustomerInvoice.load), joinedload(CustomerInvoice.customer)).filter(CustomerInvoice.id == inv_id).first()
    if not ci:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if not _portal_can_access_customer_invoice(ci, user, db):
        raise HTTPException(status_code=404, detail="Invoice not found")
    if payload.status is not None:
        ci.status = payload.status
        if payload.status == "sent" and not ci.sent_at:
            ci.sent_at = datetime.utcnow()
        if payload.status == "paid":
            ci.paid_at = payload.paid_at or datetime.utcnow()
    if payload.paid_at is not None:
        ci.paid_at = payload.paid_at
    db.commit()
    db.refresh(ci)
    return _ci_to_response(ci)


@router.get("/customer/{inv_id}/document", response_class=HTMLResponse)
def customer_invoice_document(
    inv_id: UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    ci = db.query(CustomerInvoice).options(
        joinedload(CustomerInvoice.load).joinedload(Load.customer),
        joinedload(CustomerInvoice.customer),
    ).filter(CustomerInvoice.id == inv_id).first()
    if not ci or not ci.load:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if not _portal_can_access_customer_invoice(ci, user, db):
        raise HTTPException(status_code=404, detail="Invoice not found")
    load = ci.load
    cust = ci.customer or load.customer
    html = f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Invoice {ci.invoice_number}</title></head>
<body style="font-family: sans-serif; max-width: 800px; margin: 20px;">
  <h1>INVOICE</h1>
  <p><strong>Invoice #:</strong> {ci.invoice_number} &nbsp; <strong>Date:</strong> {ci.created_at.date() if ci.created_at else ''}</p>
  <p><strong>Due Date:</strong> {ci.due_date}</p>
  <hr/>
  <p><strong>Bill To:</strong><br/>{cust.name if cust else '-'}<br/>{cust.address if cust else ''}<br/>{cust.city if cust else ''}, {cust.province if cust else ''} {cust.postal_code if cust else ''}</p>
  <hr/>
  <p><strong>Load #:</strong> {load.load_number}</p>
  <table border="1" cellpadding="8" style="width:100%; border-collapse: collapse;">
    <tr><th>Description</th><th>Amount (CAD)</th></tr>
    <tr><td>Freight - Load {load.load_number}</td><td>{ci.amount}</td></tr>
  </table>
  <p style="margin-top: 20px;"><strong>Total: {ci.amount} CAD</strong></p>
  <p><small>Thank you for your business.</small></p>
</body>
</html>
"""
    return HTMLResponse(html)


def _html_to_pdf(html: str) -> bytes:
    if not _WEASYPRINT_AVAILABLE:
        raise HTTPException(status_code=503, detail="PDF generation not available (install weasyprint)")
    return WeasyHTML(string=html).write_pdf()


@router.get("/customer/{inv_id}/document/pdf")
def customer_invoice_document_pdf(
    inv_id: UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    ci = db.query(CustomerInvoice).options(
        joinedload(CustomerInvoice.load).joinedload(Load.customer),
        joinedload(CustomerInvoice.customer),
    ).filter(CustomerInvoice.id == inv_id).first()
    if not ci or not ci.load:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if not _portal_can_access_customer_invoice(ci, user, db):
        raise HTTPException(status_code=404, detail="Invoice not found")
    load = ci.load
    cust = ci.customer or load.customer
    html = f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Invoice {ci.invoice_number}</title></head>
<body style="font-family: sans-serif; max-width: 800px; margin: 20px;">
  <h1>INVOICE</h1>
  <p><strong>Invoice #:</strong> {ci.invoice_number} &nbsp; <strong>Date:</strong> {ci.created_at.date() if ci.created_at else ''}</p>
  <p><strong>Due Date:</strong> {ci.due_date}</p>
  <hr/>
  <p><strong>Bill To:</strong><br/>{cust.name if cust else '-'}<br/>{cust.address if cust else ''}<br/>{cust.city if cust else ''}, {cust.province if cust else ''} {cust.postal_code if cust else ''}</p>
  <hr/>
  <p><strong>Load #:</strong> {load.load_number}</p>
  <table border="1" cellpadding="8" style="width:100%; border-collapse: collapse;">
    <tr><th>Description</th><th>Amount (CAD)</th></tr>
    <tr><td>Freight - Load {load.load_number}</td><td>{ci.amount}</td></tr>
  </table>
  <p style="margin-top: 20px;"><strong>Total: {ci.amount} CAD</strong></p>
  <p><small>Thank you for your business.</small></p>
</body>
</html>
"""
    pdf_bytes = _html_to_pdf(html)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="Invoice-{ci.invoice_number}.pdf"'},
    )


# --- Carrier Payables (AP) ---
@router.get("/carrier", response_model=list[CarrierPayableResponse])
def list_carrier_payables(
    status: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = db.query(CarrierPayable).options(
        joinedload(CarrierPayable.carrier_segment).joinedload(CarrierSegment.load),
        joinedload(CarrierPayable.carrier_segment).joinedload(CarrierSegment.carrier),
    )
    if user.partner_id:
        partner = db.query(Partner).filter(Partner.id == user.partner_id).first()
        if partner and (partner.type or "").strip().lower() == "carrier":
            query = query.join(CarrierSegment).filter(CarrierSegment.carrier_id == user.partner_id)
    if status:
        query = query.filter(CarrierPayable.status == status)
    items = query.order_by(CarrierPayable.created_at.desc()).all()
    return [_cp_to_response(i) for i in items]


@router.get("/carrier/export/csv")
def export_carrier_payables_csv(
    status: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(CarrierPayable).options(
        joinedload(CarrierPayable.carrier_segment).joinedload(CarrierSegment.load),
        joinedload(CarrierPayable.carrier_segment).joinedload(CarrierSegment.carrier),
    )
    if status:
        query = query.filter(CarrierPayable.status == status)
    items = query.order_by(CarrierPayable.created_at.desc()).limit(10000).all()
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["invoice_number", "load_number", "carrier_name", "amount", "status", "created_at"])
    for p in items:
        seg = p.carrier_segment
        load_num = seg.load.load_number if seg and seg.load else ""
        carrier_name = seg.carrier.name if seg and seg.carrier else ""
        w.writerow([
            p.invoice_number or "",
            load_num,
            carrier_name,
            p.amount,
            p.status,
            str(p.created_at) if p.created_at else "",
        ])
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=ap_payables_export.csv"},
    )


@router.post("/carrier", response_model=CarrierPayableResponse)
def create_carrier_payable(payload: CarrierPayableCreate, db: Session = Depends(get_db)):
    seg = db.query(CarrierSegment).options(joinedload(CarrierSegment.load), joinedload(CarrierSegment.carrier)).filter(CarrierSegment.id == payload.carrier_segment_id).first()
    if not seg:
        raise HTTPException(status_code=404, detail="Carrier segment not found")
    existing = db.query(CarrierPayable).filter(CarrierPayable.carrier_segment_id == payload.carrier_segment_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Payable already exists for this segment")
    amount = float(seg.total or 0)
    inv_num = payload.invoice_number or seg.carrier_invoice_number or f"PAY-{seg.load.load_number}-{seg.id.hex[:8]}"
    cp = CarrierPayable(carrier_segment_id=payload.carrier_segment_id, amount=amount, invoice_number=inv_num, status="draft")
    db.add(cp)
    db.commit()
    db.refresh(cp)
    cp = db.query(CarrierPayable).options(
        joinedload(CarrierPayable.carrier_segment).joinedload(CarrierSegment.load),
        joinedload(CarrierPayable.carrier_segment).joinedload(CarrierSegment.carrier),
    ).filter(CarrierPayable.id == cp.id).first()
    return _cp_to_response(cp)


@router.patch("/carrier/{pay_id}", response_model=CarrierPayableResponse)
def update_carrier_payable(
    pay_id: UUID, payload: CarrierPayableUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    cp = db.query(CarrierPayable).options(
        joinedload(CarrierPayable.carrier_segment).joinedload(CarrierSegment.load),
        joinedload(CarrierPayable.carrier_segment).joinedload(CarrierSegment.carrier),
    ).filter(CarrierPayable.id == pay_id).first()
    if not cp:
        raise HTTPException(status_code=404, detail="Payable not found")
    if not _portal_can_access_carrier_payable(cp, user, db):
        raise HTTPException(status_code=404, detail="Payable not found")
    if payload.status is not None:
        cp.status = payload.status
        if payload.status == "paid":
            cp.paid_at = payload.paid_at or datetime.utcnow()
    if payload.paid_at is not None:
        cp.paid_at = payload.paid_at
    db.commit()
    db.refresh(cp)
    return _cp_to_response(cp)


@router.get("/carrier/{pay_id}/document", response_class=HTMLResponse)
def carrier_payable_document(
    pay_id: UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    cp = db.query(CarrierPayable).options(
        joinedload(CarrierPayable.carrier_segment).joinedload(CarrierSegment.load),
        joinedload(CarrierPayable.carrier_segment).joinedload(CarrierSegment.carrier),
    ).filter(CarrierPayable.id == pay_id).first()
    if not cp or not cp.carrier_segment:
        raise HTTPException(status_code=404, detail="Payable not found")
    if not _portal_can_access_carrier_payable(cp, user, db):
        raise HTTPException(status_code=404, detail="Payable not found")
    seg = cp.carrier_segment
    load = seg.load
    carrier = seg.carrier
    html = f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Carrier Invoice {cp.invoice_number or cp.id}</title></head>
<body style="font-family: sans-serif; max-width: 800px; margin: 20px;">
  <h1>CARRIER INVOICE / PAYABLE</h1>
  <p><strong>#:</strong> {cp.invoice_number or str(cp.id)[:8]} &nbsp; <strong>Load:</strong> {load.load_number if load else '-'}</p>
  <hr/>
  <p><strong>Carrier:</strong> {carrier.name if carrier else '-'}</p>
  <p><strong>Amount (CAD):</strong> {cp.amount}</p>
  <p><strong>Status:</strong> {cp.status}</p>
  <p><small>Internal use - carrier payment tracking.</small></p>
</body>
</html>
"""
    return HTMLResponse(html)


@router.get("/carrier/{pay_id}/document/pdf")
def carrier_payable_document_pdf(
    pay_id: UUID, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    cp = db.query(CarrierPayable).options(
        joinedload(CarrierPayable.carrier_segment).joinedload(CarrierSegment.load),
        joinedload(CarrierPayable.carrier_segment).joinedload(CarrierSegment.carrier),
    ).filter(CarrierPayable.id == pay_id).first()
    if not cp or not cp.carrier_segment:
        raise HTTPException(status_code=404, detail="Payable not found")
    if not _portal_can_access_carrier_payable(cp, user, db):
        raise HTTPException(status_code=404, detail="Payable not found")
    seg = cp.carrier_segment
    load = seg.load
    carrier = seg.carrier
    html = f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Carrier Invoice {cp.invoice_number or cp.id}</title></head>
<body style="font-family: sans-serif; max-width: 800px; margin: 20px;">
  <h1>CARRIER INVOICE / PAYABLE</h1>
  <p><strong>#:</strong> {cp.invoice_number or str(cp.id)[:8]} &nbsp; <strong>Load:</strong> {load.load_number if load else '-'}</p>
  <hr/>
  <p><strong>Carrier:</strong> {carrier.name if carrier else '-'}</p>
  <p><strong>Amount (CAD):</strong> {cp.amount}</p>
  <p><strong>Status:</strong> {cp.status}</p>
  <p><small>Internal use - carrier payment tracking.</small></p>
</body>
</html>
"""
    pdf_bytes = _html_to_pdf(html)
    fname = (cp.invoice_number or str(cp.id)[:8]).replace("/", "-")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="CarrierInvoice-{fname}.pdf"'},
    )
