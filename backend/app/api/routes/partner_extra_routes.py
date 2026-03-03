"""Partner 추가 확장 API: Team, Service, EmailTemplate, OperationInfo, Location sub-resources."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import uuid

from app.core.database import get_db
from app.models.partner_extra import (
    PartnerTeam, PartnerService, PartnerEmailTemplate, CarrierOperationInfo,
    LocationStaff, LocationContact, LocationEquipment,
)

router = APIRouter()


# ────────────────────────── Team ──────────────────────────────────────
class TeamIn(BaseModel):
    name: str
    role: Optional[str] = None
    email: Optional[str] = None
    is_active: Optional[bool] = True


@router.get("/{partner_id}/teams")
def list_teams(partner_id: str, db: Session = Depends(get_db)):
    items = db.query(PartnerTeam).filter(PartnerTeam.partner_id == uuid.UUID(partner_id)).all()
    return [{"id": str(x.id), "name": x.name, "role": x.role, "email": x.email, "is_active": x.is_active} for x in items]


@router.post("/{partner_id}/teams", status_code=201)
def create_team(partner_id: str, body: TeamIn, db: Session = Depends(get_db)):
    item = PartnerTeam(partner_id=uuid.UUID(partner_id), **body.model_dump())
    db.add(item); db.commit(); db.refresh(item)
    return {"id": str(item.id), "name": item.name, "role": item.role, "email": item.email, "is_active": item.is_active}


@router.patch("/{partner_id}/teams/{team_id}")
def update_team(partner_id: str, team_id: str, body: TeamIn, db: Session = Depends(get_db)):
    item = db.query(PartnerTeam).filter(PartnerTeam.id == uuid.UUID(team_id), PartnerTeam.partner_id == uuid.UUID(partner_id)).first()
    if not item:
        raise HTTPException(404, "Not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(item, k, v)
    db.commit(); db.refresh(item)
    return {"id": str(item.id), "name": item.name, "role": item.role, "email": item.email, "is_active": item.is_active}


@router.delete("/{partner_id}/teams/{team_id}", status_code=204)
def delete_team(partner_id: str, team_id: str, db: Session = Depends(get_db)):
    item = db.query(PartnerTeam).filter(PartnerTeam.id == uuid.UUID(team_id)).first()
    if not item:
        raise HTTPException(404, "Not found")
    db.delete(item); db.commit()


# ────────────────────────── Service ──────────────────────────────────
class ServiceIn(BaseModel):
    item: str
    service_type: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = True


def _svc_dict(x: PartnerService) -> dict:
    return {"id": str(x.id), "item": x.item, "service_type": x.service_type,
            "quantity": float(x.quantity) if x.quantity is not None else None,
            "unit": x.unit, "notes": x.notes, "is_active": x.is_active}


@router.get("/{partner_id}/services")
def list_services(partner_id: str, db: Session = Depends(get_db)):
    return [_svc_dict(x) for x in db.query(PartnerService).filter(PartnerService.partner_id == uuid.UUID(partner_id)).all()]


@router.post("/{partner_id}/services", status_code=201)
def create_service(partner_id: str, body: ServiceIn, db: Session = Depends(get_db)):
    item = PartnerService(partner_id=uuid.UUID(partner_id), **body.model_dump())
    db.add(item); db.commit(); db.refresh(item)
    return _svc_dict(item)


@router.patch("/{partner_id}/services/{svc_id}")
def update_service(partner_id: str, svc_id: str, body: ServiceIn, db: Session = Depends(get_db)):
    item = db.query(PartnerService).filter(PartnerService.id == uuid.UUID(svc_id)).first()
    if not item:
        raise HTTPException(404, "Not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(item, k, v)
    db.commit(); db.refresh(item)
    return _svc_dict(item)


@router.delete("/{partner_id}/services/{svc_id}", status_code=204)
def delete_service(partner_id: str, svc_id: str, db: Session = Depends(get_db)):
    item = db.query(PartnerService).filter(PartnerService.id == uuid.UUID(svc_id)).first()
    if item:
        db.delete(item); db.commit()


# ────────────────────────── Email Templates ──────────────────────────
class EmailTemplateIn(BaseModel):
    template_type: str
    send_reply: Optional[bool] = False
    subject: Optional[str] = None
    body: Optional[str] = None
    leading_team: Optional[str] = None


@router.get("/{partner_id}/email-templates")
def list_email_templates(partner_id: str, db: Session = Depends(get_db)):
    items = db.query(PartnerEmailTemplate).filter(PartnerEmailTemplate.partner_id == uuid.UUID(partner_id)).all()
    return [{"id": str(x.id), "template_type": x.template_type, "send_reply": x.send_reply, "subject": x.subject, "body": x.body, "leading_team": x.leading_team} for x in items]


@router.post("/{partner_id}/email-templates", status_code=201)
def create_email_template(partner_id: str, body: EmailTemplateIn, db: Session = Depends(get_db)):
    item = PartnerEmailTemplate(partner_id=uuid.UUID(partner_id), **body.model_dump())
    db.add(item); db.commit(); db.refresh(item)
    return {"id": str(item.id), "template_type": item.template_type, "send_reply": item.send_reply, "subject": item.subject, "body": item.body, "leading_team": item.leading_team}


@router.patch("/{partner_id}/email-templates/{tmpl_id}")
def update_email_template(partner_id: str, tmpl_id: str, body: EmailTemplateIn, db: Session = Depends(get_db)):
    item = db.query(PartnerEmailTemplate).filter(PartnerEmailTemplate.id == uuid.UUID(tmpl_id)).first()
    if not item:
        raise HTTPException(404, "Not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(item, k, v)
    db.commit(); db.refresh(item)
    return {"id": str(item.id), "template_type": item.template_type, "send_reply": item.send_reply, "subject": item.subject, "body": item.body, "leading_team": item.leading_team}


@router.delete("/{partner_id}/email-templates/{tmpl_id}", status_code=204)
def delete_email_template(partner_id: str, tmpl_id: str, db: Session = Depends(get_db)):
    item = db.query(PartnerEmailTemplate).filter(PartnerEmailTemplate.id == uuid.UUID(tmpl_id)).first()
    if item:
        db.delete(item); db.commit()


# ────────────────────────── Carrier Operation Info ───────────────────
class OperationInfoIn(BaseModel):
    operation_times: Optional[str] = None
    timezone: Optional[str] = None
    default_trip_type: Optional[str] = None
    default_rate_type: Optional[str] = None
    load_hours: Optional[str] = None
    shift_type: Optional[str] = None
    pickup_hours: Optional[str] = None
    postal_message: Optional[str] = None
    pay_per_day: Optional[str] = None
    invoice_tt: Optional[str] = None
    invoice_et: Optional[str] = None
    invoice_etransfer: Optional[str] = None
    other_payment_terms: Optional[str] = None
    payment_notes: Optional[str] = None
    api_key: Optional[str] = None
    api_secret: Optional[str] = None
    api_endpoint: Optional[str] = None
    api_notes: Optional[str] = None


def _op_dict(x: CarrierOperationInfo) -> dict:
    return {
        "id": str(x.id), "partner_id": str(x.partner_id),
        "operation_times": x.operation_times, "timezone": x.timezone,
        "default_trip_type": x.default_trip_type, "default_rate_type": x.default_rate_type,
        "load_hours": x.load_hours, "shift_type": x.shift_type, "pickup_hours": x.pickup_hours,
        "postal_message": x.postal_message, "pay_per_day": x.pay_per_day,
        "invoice_tt": x.invoice_tt, "invoice_et": x.invoice_et, "invoice_etransfer": x.invoice_etransfer,
        "other_payment_terms": x.other_payment_terms, "payment_notes": x.payment_notes,
        "api_key": x.api_key, "api_secret": x.api_secret, "api_endpoint": x.api_endpoint, "api_notes": x.api_notes,
    }


@router.get("/{partner_id}/operation-info")
def get_operation_info(partner_id: str, db: Session = Depends(get_db)):
    item = db.query(CarrierOperationInfo).filter(CarrierOperationInfo.partner_id == uuid.UUID(partner_id)).first()
    return _op_dict(item) if item else {}


@router.put("/{partner_id}/operation-info")
def upsert_operation_info(partner_id: str, body: OperationInfoIn, db: Session = Depends(get_db)):
    item = db.query(CarrierOperationInfo).filter(CarrierOperationInfo.partner_id == uuid.UUID(partner_id)).first()
    if not item:
        item = CarrierOperationInfo(partner_id=uuid.UUID(partner_id))
        db.add(item)
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(item, k, v)
    db.commit(); db.refresh(item)
    return _op_dict(item)


# ────────────────────────── Location Sub-resources ───────────────────
class LocStaffIn(BaseModel):
    name: str
    tag: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = True


@router.get("/locations/{loc_id}/staff")
def list_loc_staff(loc_id: str, db: Session = Depends(get_db)):
    items = db.query(LocationStaff).filter(LocationStaff.location_id == uuid.UUID(loc_id)).all()
    return [{"id": str(x.id), "name": x.name, "tag": x.tag, "email": x.email, "phone": x.phone, "is_active": x.is_active} for x in items]


@router.post("/locations/{loc_id}/staff", status_code=201)
def create_loc_staff(loc_id: str, body: LocStaffIn, db: Session = Depends(get_db)):
    item = LocationStaff(location_id=uuid.UUID(loc_id), **body.model_dump())
    db.add(item); db.commit(); db.refresh(item)
    return {"id": str(item.id), "name": item.name, "tag": item.tag, "email": item.email, "phone": item.phone, "is_active": item.is_active}


@router.delete("/locations/{loc_id}/staff/{staff_id}", status_code=204)
def delete_loc_staff(loc_id: str, staff_id: str, db: Session = Depends(get_db)):
    item = db.query(LocationStaff).filter(LocationStaff.id == uuid.UUID(staff_id)).first()
    if item:
        db.delete(item); db.commit()


class LocContactIn(BaseModel):
    name: str
    department: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None


@router.get("/locations/{loc_id}/contacts")
def list_loc_contacts(loc_id: str, db: Session = Depends(get_db)):
    items = db.query(LocationContact).filter(LocationContact.location_id == uuid.UUID(loc_id)).all()
    return [{"id": str(x.id), "name": x.name, "department": x.department, "phone": x.phone, "email": x.email} for x in items]


@router.post("/locations/{loc_id}/contacts", status_code=201)
def create_loc_contact(loc_id: str, body: LocContactIn, db: Session = Depends(get_db)):
    item = LocationContact(location_id=uuid.UUID(loc_id), **body.model_dump())
    db.add(item); db.commit(); db.refresh(item)
    return {"id": str(item.id), "name": item.name, "department": item.department, "phone": item.phone, "email": item.email}


@router.delete("/locations/{loc_id}/contacts/{contact_id}", status_code=204)
def delete_loc_contact(loc_id: str, contact_id: str, db: Session = Depends(get_db)):
    item = db.query(LocationContact).filter(LocationContact.id == uuid.UUID(contact_id)).first()
    if item:
        db.delete(item); db.commit()


class LocEquipmentIn(BaseModel):
    name: str
    equipment_type: Optional[str] = None
    notes: Optional[str] = None


@router.get("/locations/{loc_id}/equipment")
def list_loc_equipment(loc_id: str, db: Session = Depends(get_db)):
    items = db.query(LocationEquipment).filter(LocationEquipment.location_id == uuid.UUID(loc_id)).all()
    return [{"id": str(x.id), "name": x.name, "equipment_type": x.equipment_type, "notes": x.notes} for x in items]


@router.post("/locations/{loc_id}/equipment", status_code=201)
def create_loc_equipment(loc_id: str, body: LocEquipmentIn, db: Session = Depends(get_db)):
    item = LocationEquipment(location_id=uuid.UUID(loc_id), **body.model_dump())
    db.add(item); db.commit(); db.refresh(item)
    return {"id": str(item.id), "name": item.name, "equipment_type": item.equipment_type, "notes": item.notes}


@router.delete("/locations/{loc_id}/equipment/{eq_id}", status_code=204)
def delete_loc_equipment(loc_id: str, eq_id: str, db: Session = Depends(get_db)):
    item = db.query(LocationEquipment).filter(LocationEquipment.id == uuid.UUID(eq_id)).first()
    if item:
        db.delete(item); db.commit()
