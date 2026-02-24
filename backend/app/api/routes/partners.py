from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.database import get_db
from app.models.partner import Partner
from app.schemas.partner import PartnerCreate, PartnerUpdate, PartnerResponse

router = APIRouter()


@router.get("", response_model=list[PartnerResponse])
def list_partners(db: Session = Depends(get_db)):
    return db.query(Partner).filter(Partner.is_active == True).all()


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
