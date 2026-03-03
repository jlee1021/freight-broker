from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from uuid import UUID
from typing import Optional

from app.core.database import get_db
from app.models.partner import Partner
from app.models.partner_ext import PartnerLocation, PartnerStaff
from app.schemas.partner import PartnerCreate, PartnerUpdate, PartnerResponse

router = APIRouter()


@router.get("", response_model=list[PartnerResponse])
def list_partners(
    type: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Partner).filter(Partner.is_active == True)
    if type:
        query = query.filter(Partner.type == type)
    if q:
        query = query.filter(Partner.name.ilike(f"%{q}%"))
    return query.order_by(Partner.created_at.desc()).all()


@router.get("/all-locations")
def list_all_locations(q: Optional[str] = Query(None), db: Session = Depends(get_db)):
    query = db.query(PartnerLocation).options(joinedload(PartnerLocation.partner))
    if q:
        query = query.filter(PartnerLocation.name.ilike(f"%{q}%"))
    items = query.order_by(PartnerLocation.created_at.desc()).all()
    return [{
        "id": str(x.id),
        "partner_id": str(x.partner_id),
        "partner_name": x.partner.name if x.partner else None,
        "name": x.name,
        "address": x.address,
        "tel": x.tel,
        "city": x.city,
        "state": x.state,
        "zip_code": x.zip_code,
        "is_active": x.is_active,
        "created_at": x.created_at.isoformat() if x.created_at else None,
    } for x in items]


@router.get("/all-staff")
def list_all_staff(q: Optional[str] = Query(None), db: Session = Depends(get_db)):
    query = db.query(PartnerStaff).options(joinedload(PartnerStaff.partner))
    if q:
        query = query.filter(PartnerStaff.full_name.ilike(f"%{q}%"))
    items = query.order_by(PartnerStaff.created_at.desc()).all()
    return [{
        "id": str(x.id),
        "partner_id": str(x.partner_id),
        "partner_name": x.partner.name if x.partner else None,
        "full_name": x.full_name,
        "department": x.department,
        "email": x.email,
        "phone": x.phone,
        "title": x.title,
        "is_active": x.is_active,
        "created_at": x.created_at.isoformat() if x.created_at else None,
    } for x in items]


@router.get("/{partner_id}", response_model=PartnerResponse)
def get_partner(partner_id: UUID, db: Session = Depends(get_db)):
    p = db.query(Partner).filter(Partner.id == partner_id).first()
    if not p:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Partner not found")
    return p


@router.post("", response_model=PartnerResponse)
def create_partner(payload: PartnerCreate, db: Session = Depends(get_db)):
    partner = Partner(**payload.model_dump())
    db.add(partner)
    db.commit()
    db.refresh(partner)
    return partner


@router.patch("/{partner_id}", response_model=PartnerResponse)
def update_partner(partner_id: UUID, payload: PartnerUpdate, db: Session = Depends(get_db)):
    p = db.query(Partner).filter(Partner.id == partner_id).first()
    if not p:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Partner not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return p
