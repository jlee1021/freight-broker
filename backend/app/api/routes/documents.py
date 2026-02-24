import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from fastapi import APIRouter, Depends, HTTPException
from html import escape
from fastapi.responses import HTMLResponse, Response
from pydantic import BaseModel

try:
    from weasyprint import HTML as WeasyHTML
    WEASYPRINT_AVAILABLE = True
except Exception:
    WEASYPRINT_AVAILABLE = False
from sqlalchemy.orm import Session, joinedload
from uuid import UUID

from app.core.config import get_settings
from app.core.database import get_db
from app.models.load import Load
from app.models.setting import Setting

router = APIRouter()
settings = get_settings()


class SendDocumentEmailBody(BaseModel):
    document_type: str  # lc, bol, pallet-tag
    to_email: str


def _get_branding(db: Session) -> tuple[str, str]:
    """Returns (company_name, company_logo_url) from settings."""
    name_row = db.query(Setting).filter(Setting.key == "company_name").first()
    logo_row = db.query(Setting).filter(Setting.key == "company_logo_url").first()
    name = (name_row.value or "").strip() if name_row and name_row.value else ""
    logo = (logo_row.value or "").strip() if logo_row and logo_row.value else ""
    return (name, logo)


def _branding_header(db: Session) -> str:
    company_name, company_logo_url = _get_branding(db)
    if not company_name and not company_logo_url:
        return ""
    logo_html = f'<img src="{escape(company_logo_url)}" alt="Logo" style="max-height: 48px; margin-right: 12px;" />' if company_logo_url else ""
    name_html = escape(company_name) if company_name else ""
    return f'<div style="margin-bottom: 16px; display: flex; align-items: center;">{logo_html}<span style="font-size: 1.25rem; font-weight: 600;">{name_html}</span></div><hr/>'


def _e(val) -> str:
    """Safely escape a value for HTML output."""
    if val is None:
        return ""
    return escape(str(val))


def _get_load_with_relations(load_id: UUID, db: Session) -> Load | None:
    return (
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


@router.get("/load/{load_id}/lc", response_class=HTMLResponse)
def load_confirmation(load_id: UUID, db: Session = Depends(get_db)):
    load = _get_load_with_relations(load_id, db)
    if not load:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Load not found")
    shipper = load.shipper_stops[0] if load.shipper_stops else None
    consignee = load.consignee_stops[0] if load.consignee_stops else None
    customer_name = load.customer.name if load.customer else ""
    header = _branding_header(db)
    html = f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Load Confirmation - {_e(load.load_number)}</title></head>
<body style="font-family: sans-serif; max-width: 800px; margin: 20px;">
  {header}
  <h1>Load Confirmation</h1>
  <p><strong>Load#:</strong> {_e(load.load_number)} &nbsp; <strong>Status:</strong> {_e(load.status)}</p>
  <p><strong>Customer:</strong> {_e(customer_name)}</p>
  <p><strong>Rate:</strong> {_e(load.rate) or '-'} CAD &nbsp; FSC: {_e(load.fsc_percent) or 0}% &nbsp; Total: {_e(load.total_with_gst) or '-'}</p>
  <hr/>
  <h2>Shipper</h2>
  <p>{_e(shipper.name) if shipper else '-'}<br/>{_e(shipper.address) if shipper else ''} {_e(shipper.city) if shipper else ''} {_e(shipper.province) if shipper else ''} {_e(shipper.postal_code) if shipper else ''}</p>
  <p>Pickup: {_e(shipper.pickup_date) if shipper else '-'} {_e(shipper.time_start) if shipper else ''} - {_e(shipper.time_end) if shipper else ''}</p>
  <hr/>
  <h2>Consignee</h2>
  <p>{_e(consignee.name) if consignee else '-'}<br/>{_e(consignee.address) if consignee else ''} {_e(consignee.city) if consignee else ''} {_e(consignee.province) if consignee else ''}</p>
  <p>Due: {_e(consignee.due_date) if consignee else '-'}</p>
  <hr/>
  <p><small>Print this page to PDF (Ctrl+P / Cmd+P)</small></p>
</body>
</html>
"""
    return HTMLResponse(html)


def _html_to_pdf(html: str) -> bytes:
    if not WEASYPRINT_AVAILABLE:
        raise HTTPException(status_code=503, detail="PDF generation not available (install weasyprint)")
    return WeasyHTML(string=html).write_pdf()


def _load_doc_pdf(load_id: UUID, doc_type: str, filename_prefix: str, db: Session) -> Response:
    load = _get_load_with_relations(load_id, db)
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    html = _render_document_html(load, doc_type, db)
    pdf_bytes = _html_to_pdf(html)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename_prefix}-{load.load_number}.pdf"'},
    )


@router.get("/load/{load_id}/lc/pdf")
def load_confirmation_pdf(load_id: UUID, db: Session = Depends(get_db)):
    return _load_doc_pdf(load_id, "lc", "LC", db)


@router.get("/load/{load_id}/rate-confirmation/pdf")
def rate_confirmation_pdf(load_id: UUID, db: Session = Depends(get_db)):
    return _load_doc_pdf(load_id, "rate-confirmation", "RateConfirmation", db)


@router.get("/load/{load_id}/bol/pdf")
def bill_of_lading_pdf(load_id: UUID, db: Session = Depends(get_db)):
    return _load_doc_pdf(load_id, "bol", "BOL", db)


@router.get("/load/{load_id}/pallet-tag/pdf")
def pallet_tag_pdf(load_id: UUID, db: Session = Depends(get_db)):
    return _load_doc_pdf(load_id, "pallet-tag", "PalletTag", db)


@router.get("/load/{load_id}/rate-confirmation", response_class=HTMLResponse)
def rate_confirmation(load_id: UUID, db: Session = Depends(get_db)):
    load = _get_load_with_relations(load_id, db)
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    shipper = load.shipper_stops[0] if load.shipper_stops else None
    consignee = load.consignee_stops[0] if load.consignee_stops else None
    customer_name = load.customer.name if load.customer else ""
    header = _branding_header(db)
    html = f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Rate Confirmation - {_e(load.load_number)}</title></head>
<body style="font-family: sans-serif; max-width: 800px; margin: 20px;">
  {header}
  <h1>Rate Confirmation</h1>
  <p><strong>Load#:</strong> {_e(load.load_number)} &nbsp; <strong>Status:</strong> {_e(load.status)}</p>
  <p><strong>Customer:</strong> {_e(customer_name)}</p>
  <p><strong>Rate:</strong> {_e(load.rate) or '-'} CAD &nbsp; FSC: {_e(load.fsc_percent) or 0}% &nbsp; Total: {_e(load.total_with_gst) or '-'}</p>
  <p><strong>Equipment:</strong> {_e(load.equipment_type) or '-'} &nbsp; <strong>Weight:</strong> {_e(load.weight) or '-'} {_e(load.weight_unit) or 'lbs'}</p>
  <hr/>
  <h2>Shipper</h2>
  <p>{_e(shipper.name) if shipper else '-'}<br/>{_e(shipper.address) if shipper else ''} {_e(shipper.city) if shipper else ''}</p>
  <p>Pickup: {_e(shipper.pickup_date) if shipper else '-'}</p>
  <hr/>
  <h2>Consignee</h2>
  <p>{_e(consignee.name) if consignee else '-'}<br/>{_e(consignee.address) if consignee else ''} {_e(consignee.city) if consignee else ''}</p>
  <p>Due: {_e(consignee.due_date) if consignee else '-'}</p>
  <p><small>Print to PDF (Ctrl+P / Cmd+P)</small></p>
</body>
</html>
"""
    return HTMLResponse(html)


@router.get("/load/{load_id}/bol", response_class=HTMLResponse)
def bill_of_lading(load_id: UUID, db: Session = Depends(get_db)):
    load = _get_load_with_relations(load_id, db)
    if not load:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Load not found")
    shipper = load.shipper_stops[0] if load.shipper_stops else None
    consignee = load.consignee_stops[0] if load.consignee_stops else None
    customer_name = load.customer.name if load.customer else ""
    header = _branding_header(db)
    html = f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Bill of Lading - {_e(load.load_number)}</title></head>
<body style="font-family: sans-serif; max-width: 800px; margin: 20px;">
  {header}
  <h1>Bill of Lading</h1>
  <p><strong>B/L #:</strong> {_e(load.load_number)}</p>
  <table border="1" cellpadding="8" style="width:100%; border-collapse: collapse;">
    <tr><th>Shipper</th><th>Consignee</th></tr>
    <tr>
      <td>{_e(shipper.name) if shipper else '-'}<br/>{_e(shipper.address) if shipper else ''}<br/>{_e(shipper.city) if shipper else ''}, {_e(shipper.province) if shipper else ''} {_e(shipper.postal_code) if shipper else ''}</td>
      <td>{_e(consignee.name) if consignee else '-'}<br/>{_e(consignee.address) if consignee else ''}<br/>{_e(consignee.city) if consignee else ''}, {_e(consignee.province) if consignee else ''}</td>
    </tr>
  </table>
  <p><strong>Customer:</strong> {_e(customer_name)}</p>
  <p><strong>Rate:</strong> {_e(load.rate) or '-'} CAD</p>
  <p><small>Print to PDF (Ctrl+P / Cmd+P)</small></p>
</body>
</html>
"""
    return HTMLResponse(html)


@router.get("/load/{load_id}/pallet-tag", response_class=HTMLResponse)
def pallet_tag(load_id: UUID, db: Session = Depends(get_db)):
    load = _get_load_with_relations(load_id, db)
    if not load:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Load not found")
    shipper = load.shipper_stops[0] if load.shipper_stops else None
    consignee = load.consignee_stops[0] if load.consignee_stops else None
    header = _branding_header(db)
    html = f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Pallet Tag - {_e(load.load_number)}</title></head>
<body style="font-family: sans-serif; max-width: 400px; margin: 20px; border: 2px solid #333; padding: 16px;">
  {header}
  <h2>PALLET TAG</h2>
  <p><strong>Load#:</strong> {_e(load.load_number)}</p>
  <p><strong>From:</strong> {_e(shipper.name) if shipper else '-'}</p>
  <p><strong>To:</strong> {_e(consignee.name) if consignee else '-'}</p>
  <p><small>Print to PDF (Ctrl+P / Cmd+P)</small></p>
</body>
</html>
"""
    return HTMLResponse(html)


def _render_document_html(load: Load, doc_type: str, db: Session) -> str:
    shipper = load.shipper_stops[0] if load.shipper_stops else None
    consignee = load.consignee_stops[0] if load.consignee_stops else None
    customer_name = load.customer.name if load.customer else ""
    header = _branding_header(db)
    if doc_type == "lc":
        return f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Load Confirmation - {_e(load.load_number)}</title></head>
<body style="font-family: sans-serif; max-width: 800px; margin: 20px;">
  {header}
  <h1>Load Confirmation</h1>
  <p><strong>Load#:</strong> {_e(load.load_number)} &nbsp; <strong>Status:</strong> {_e(load.status)}</p>
  <p><strong>Customer:</strong> {_e(customer_name)}</p>
  <p><strong>Rate:</strong> {_e(load.rate) or '-'} CAD &nbsp; FSC: {_e(load.fsc_percent) or 0}% &nbsp; Total: {_e(load.total_with_gst) or '-'}</p>
  <hr/>
  <h2>Shipper</h2>
  <p>{_e(shipper.name) if shipper else '-'}<br/>{_e(shipper.address) if shipper else ''} {_e(shipper.city) if shipper else ''} {_e(shipper.province) if shipper else ''} {_e(shipper.postal_code) if shipper else ''}</p>
  <p>Pickup: {_e(shipper.pickup_date) if shipper else '-'} {_e(shipper.time_start) if shipper else ''} - {_e(shipper.time_end) if shipper else ''}</p>
  <hr/>
  <h2>Consignee</h2>
  <p>{_e(consignee.name) if consignee else '-'}<br/>{_e(consignee.address) if consignee else ''} {_e(consignee.city) if consignee else ''} {_e(consignee.province) if consignee else ''}</p>
  <p>Due: {_e(consignee.due_date) if consignee else '-'}</p>
</body>
</html>
"""
    if doc_type == "bol":
        return f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Bill of Lading - {_e(load.load_number)}</title></head>
<body style="font-family: sans-serif; max-width: 800px; margin: 20px;">
  {header}
  <h1>Bill of Lading</h1>
  <p><strong>B/L #:</strong> {_e(load.load_number)}</p>
  <table border="1" cellpadding="8" style="width:100%; border-collapse: collapse;">
    <tr><th>Shipper</th><th>Consignee</th></tr>
    <tr>
      <td>{_e(shipper.name) if shipper else '-'}<br/>{_e(shipper.address) if shipper else ''}<br/>{_e(shipper.city) if shipper else ''}, {_e(shipper.province) if shipper else ''} {_e(shipper.postal_code) if shipper else ''}</td>
      <td>{_e(consignee.name) if consignee else '-'}<br/>{_e(consignee.address) if consignee else ''}<br/>{_e(consignee.city) if consignee else ''}, {_e(consignee.province) if consignee else ''}</td>
    </tr>
  </table>
  <p><strong>Customer:</strong> {_e(customer_name)}</p>
  <p><strong>Rate:</strong> {_e(load.rate) or '-'} CAD</p>
</body>
</html>
"""
    if doc_type == "pallet-tag":
        return f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Pallet Tag - {_e(load.load_number)}</title></head>
<body style="font-family: sans-serif; max-width: 400px; margin: 20px; border: 2px solid #333; padding: 16px;">
  {header}
  <h2>PALLET TAG</h2>
  <p><strong>Load#:</strong> {_e(load.load_number)}</p>
  <p><strong>From:</strong> {_e(shipper.name) if shipper else '-'}</p>
  <p><strong>To:</strong> {_e(consignee.name) if consignee else '-'}</p>
</body>
</html>
"""
    if doc_type == "rate-confirmation":
        return f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Rate Confirmation - {_e(load.load_number)}</title></head>
<body style="font-family: sans-serif; max-width: 800px; margin: 20px;">
  {header}
  <h1>Rate Confirmation</h1>
  <p><strong>Load#:</strong> {_e(load.load_number)} &nbsp; <strong>Status:</strong> {_e(load.status)}</p>
  <p><strong>Customer:</strong> {_e(customer_name)}</p>
  <p><strong>Rate:</strong> {_e(load.rate) or '-'} CAD &nbsp; FSC: {_e(load.fsc_percent) or 0}% &nbsp; Total: {_e(load.total_with_gst) or '-'}</p>
  <p><strong>Equipment:</strong> {_e(load.equipment_type) or '-'} &nbsp; <strong>Weight:</strong> {_e(load.weight) or '-'} {_e(getattr(load, 'weight_unit', None)) or 'lbs'}</p>
  <hr/>
  <h2>Shipper</h2>
  <p>{_e(shipper.name) if shipper else '-'}<br/>{_e(shipper.address) if shipper else ''} {_e(shipper.city) if shipper else ''}</p>
  <p>Pickup: {_e(shipper.pickup_date) if shipper else '-'}</p>
  <hr/>
  <h2>Consignee</h2>
  <p>{_e(consignee.name) if consignee else '-'}<br/>{_e(consignee.address) if consignee else ''} {_e(consignee.city) if consignee else ''}</p>
  <p>Due: {_e(consignee.due_date) if consignee else '-'}</p>
</body>
</html>
"""
    raise HTTPException(status_code=400, detail="document_type must be lc, bol, pallet-tag, or rate-confirmation")


@router.post("/load/{load_id}/send-email")
def send_document_email(load_id: UUID, body: SendDocumentEmailBody, db: Session = Depends(get_db)):
    load = _get_load_with_relations(load_id, db)
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    if not body.to_email or "@" not in body.to_email:
        raise HTTPException(status_code=400, detail="Valid to_email required")
    doc_type = body.document_type.lower().strip()
    if doc_type not in ("lc", "bol", "pallet-tag"):
        raise HTTPException(status_code=400, detail="document_type must be lc, bol, or pallet-tag")

    html = _render_document_html(load, doc_type, db)
    subject = f"{'Load Confirmation' if doc_type == 'lc' else 'Bill of Lading' if doc_type == 'bol' else 'Pallet Tag'} - {load.load_number}"

    if not settings.smtp_host or not settings.from_email:
        return {"sent": False, "message": "Email not configured (set SMTP_HOST, FROM_EMAIL in env)"}

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.from_email
        msg["To"] = body.to_email
        msg.attach(MIMEText(html, "html", "utf-8"))
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.starttls()
            if settings.smtp_user and settings.smtp_password:
                server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.from_email, [body.to_email], msg.as_string())
        return {"sent": True, "message": "Email sent"}
    except Exception as e:
        return {"sent": False, "message": str(e)}
