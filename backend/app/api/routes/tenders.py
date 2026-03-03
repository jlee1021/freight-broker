"""Tender Workflow — 캐리어에게 화물 제안 발송/수락/거절"""
import smtplib
import logging
from datetime import datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload
from typing import Optional

from app.core.config import get_settings
from app.core.database import get_db
from app.models.load import Load
from app.models.partner import Partner
from app.models.tender import Tender
from app.models.setting import Setting

logger = logging.getLogger("freight_broker.tender")
router = APIRouter()
public_router = APIRouter()  # 인증 불필요 (토큰 기반)
app_settings = get_settings()


# ---- Pydantic Schemas ----

class TenderCreate(BaseModel):
    carrier_id: UUID
    message: Optional[str] = None
    rate_offered: Optional[float] = None


class TenderReject(BaseModel):
    reject_reason: Optional[str] = None


class TenderResponse(BaseModel):
    id: UUID
    load_id: UUID
    carrier_id: UUID
    carrier_name: Optional[str] = None
    status: str
    message: Optional[str] = None
    rate_offered: Optional[float] = None
    reject_reason: Optional[str] = None
    sent_at: Optional[datetime] = None
    responded_at: Optional[datetime] = None
    created_at: Optional[datetime] = None


# ---- Helper ----

def _get_setting(db: Session, key: str, default: str = "") -> str:
    row = db.query(Setting).filter(Setting.key == key).first()
    return (row.value or "").strip() if row else default


def _send_tender_email(tender: Tender, load: Load, carrier: Partner, company_name: str) -> bool:
    if not app_settings.smtp_host or not app_settings.from_email:
        logger.warning("SMTP not configured — tender email skipped for %s", tender.id)
        return False
    if not carrier.contact_email:
        logger.warning("Carrier %s has no contact_email — tender email skipped", carrier.name)
        return False

    shipper = load.shipper_stops[0] if load.shipper_stops else None
    consignee = load.consignee_stops[0] if load.consignee_stops else None
    base_url = f"http://{app_settings.cors_origins.split(',')[0].split('://')[-1].split(':')[0]}:8000"
    accept_url = f"{base_url}/api/v1/tenders/respond/{tender.token}/accept"
    reject_url = f"{base_url}/api/v1/tenders/respond/{tender.token}/reject"

    html = f"""
<html><body style="font-family: sans-serif; max-width: 600px; margin: 20px;">
  <h2>Freight Tender — Load {load.load_number}</h2>
  <p>Dear {carrier.name},</p>
  <p><strong>{company_name or 'FreightBroker Pro'}</strong> is offering you the following load:</p>
  <table border="1" cellpadding="8" style="border-collapse:collapse; width:100%; margin: 12px 0;">
    <tr style="background:#f3f4f6;"><th>Load #</th><th>Origin</th><th>Destination</th><th>Equipment</th><th>Rate Offered</th></tr>
    <tr>
      <td><strong>{load.load_number}</strong></td>
      <td>{f"{shipper.city}, {shipper.province}" if shipper else '-'}</td>
      <td>{f"{consignee.city}, {consignee.province}" if consignee else '-'}</td>
      <td>{load.equipment_type or '-'}</td>
      <td>{"${:,.2f} CAD".format(float(tender.rate_offered)) if tender.rate_offered else 'TBD'}</td>
    </tr>
  </table>
  {"<p><em>" + tender.message + "</em></p>" if tender.message else ""}
  <p>Please respond using the buttons below:</p>
  <div style="margin: 20px 0;">
    <a href="{accept_url}" style="background:#16a34a;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;margin-right:12px;font-weight:600;">Accept</a>
    <a href="{reject_url}" style="background:#dc2626;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:600;">Decline</a>
  </div>
  <p style="color:#6b7280;font-size:0.875rem;">If the buttons don't work, copy these links:<br/>
    Accept: {accept_url}<br/>Decline: {reject_url}
  </p>
  <br/><p>Best regards,<br/><strong>{company_name or 'FreightBroker Pro'}</strong></p>
</body></html>
"""
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Freight Tender: Load {load.load_number}"
        msg["From"] = app_settings.from_email
        msg["To"] = carrier.contact_email
        msg.attach(MIMEText(html, "html", "utf-8"))

        with smtplib.SMTP(app_settings.smtp_host, app_settings.smtp_port) as server:
            server.starttls()
            if app_settings.smtp_user and app_settings.smtp_password:
                server.login(app_settings.smtp_user, app_settings.smtp_password)
            server.sendmail(app_settings.from_email, [carrier.contact_email], msg.as_string())

        logger.info("Tender email sent to %s for load %s", carrier.contact_email, load.load_number)
        return True
    except Exception as e:
        logger.error("Tender email failed: %s", e)
        return False


def _tender_to_response(t: Tender) -> TenderResponse:
    return TenderResponse(
        id=t.id,
        load_id=t.load_id,
        carrier_id=t.carrier_id,
        carrier_name=t.carrier.name if t.carrier else None,
        status=t.status,
        message=t.message,
        rate_offered=float(t.rate_offered) if t.rate_offered else None,
        reject_reason=t.reject_reason,
        sent_at=t.sent_at,
        responded_at=t.responded_at,
        created_at=t.created_at,
    )


# ---- Endpoints ----

@router.get("/{load_id}/tenders")
def list_tenders(load_id: UUID, db: Session = Depends(get_db)):
    load = db.query(Load).filter(Load.id == load_id).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    tenders = (
        db.query(Tender)
        .options(joinedload(Tender.carrier))
        .filter(Tender.load_id == load_id)
        .order_by(Tender.created_at.desc())
        .all()
    )
    return {"items": [_tender_to_response(t) for t in tenders]}


@router.post("/{load_id}/tenders")
def create_tender(load_id: UUID, payload: TenderCreate, db: Session = Depends(get_db)):
    load = (
        db.query(Load)
        .options(joinedload(Load.shipper_stops), joinedload(Load.consignee_stops))
        .filter(Load.id == load_id).first()
    )
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    carrier = db.query(Partner).filter(Partner.id == payload.carrier_id).first()
    if not carrier:
        raise HTTPException(status_code=404, detail="Carrier not found")

    company_name = _get_setting(db, "company_name")
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    tender = Tender(
        load_id=load_id,
        carrier_id=payload.carrier_id,
        message=payload.message,
        rate_offered=payload.rate_offered,
        status="pending",
        created_at=now,
    )
    db.add(tender)
    db.flush()

    email_sent = _send_tender_email(tender, load, carrier, company_name)
    if email_sent:
        tender.sent_at = now
        tender.status = "sent"

    db.commit()
    db.refresh(tender)
    tender = db.query(Tender).options(joinedload(Tender.carrier)).filter(Tender.id == tender.id).first()
    return _tender_to_response(tender)


@router.delete("/{load_id}/tenders/{tender_id}")
def cancel_tender(load_id: UUID, tender_id: UUID, db: Session = Depends(get_db)):
    tender = db.query(Tender).filter(Tender.id == tender_id, Tender.load_id == load_id).first()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
    tender.status = "cancelled"
    db.commit()
    return {"ok": True}


# ---- Public respond endpoints (no auth, token-based) ----

@public_router.get("/respond/{token}/accept")
def respond_accept(token: str, db: Session = Depends(get_db)):
    tender = db.query(Tender).filter(Tender.token == token).first()
    if not tender:
        return _respond_html("Invalid or expired tender link.", error=True)
    if tender.status not in ("pending", "sent"):
        return _respond_html(f"This tender has already been {tender.status}.", error=tender.status not in ("accepted",))
    tender.status = "accepted"
    tender.responded_at = datetime.now(timezone.utc).replace(tzinfo=None)
    db.commit()
    return _respond_html("Thank you! You have accepted this tender. The dispatcher will follow up shortly.")


@public_router.get("/respond/{token}/reject")
def respond_reject(token: str, db: Session = Depends(get_db)):
    tender = db.query(Tender).filter(Tender.token == token).first()
    if not tender:
        return _respond_html("Invalid or expired tender link.", error=True)
    if tender.status not in ("pending", "sent"):
        return _respond_html(f"This tender has already been {tender.status}.", error=tender.status not in ("rejected",))
    tender.status = "rejected"
    tender.responded_at = datetime.now(timezone.utc).replace(tzinfo=None)
    db.commit()
    return _respond_html("You have declined this tender. Thank you for your response.", error=False)


def _respond_html(message: str, error: bool = False) -> "HTMLResponse":
    from fastapi.responses import HTMLResponse
    color = "#dc2626" if error else "#16a34a"
    icon = "✗" if error else "✓"
    html = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Tender Response</title></head>
<body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f9fafb;">
  <div style="text-align:center;padding:40px;background:#fff;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,0.1);max-width:480px;">
    <div style="font-size:3rem;color:{color};">{icon}</div>
    <p style="font-size:1.125rem;color:#374151;margin-top:16px;">{message}</p>
    <p style="color:#9ca3af;font-size:0.875rem;margin-top:12px;">You may close this window.</p>
  </div>
</body></html>"""
    return HTMLResponse(html)
