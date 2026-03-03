"""
파트너 확장 API: Location / Staff / Carrier Contacts / Carrier Vehicles
파트너 기본 CRUD는 partners.py 유지, 확장 관계형 데이터만 여기서 처리
"""
from uuid import UUID
from typing import Optional
from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.partner import Partner
from app.models.partner_ext import PartnerLocation, PartnerStaff, CarrierContact, CarrierVehicle

router = APIRouter()


# ── Pydantic 스키마 (파일 분리 대신 라우터 내부 정의) ─────────────────

class LocationCreate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    tel: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    entry_date: Optional[date] = None
    notes: Optional[str] = None
    bill: Optional[str] = None
    description: Optional[str] = None
    billing_ship_to: Optional[str] = None
    comments: Optional[str] = None
    is_active: Optional[bool] = True


class LocationResponse(LocationCreate):
    id: UUID
    partner_id: UUID
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class StaffCreate(BaseModel):
    full_name: str
    department: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    title: Optional[str] = None
    is_active: Optional[bool] = True


class StaffResponse(StaffCreate):
    id: UUID
    partner_id: UUID
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ContactCreate(BaseModel):
    name: str
    department: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    is_primary: Optional[bool] = False


class ContactResponse(ContactCreate):
    id: UUID
    partner_id: UUID

    class Config:
        from_attributes = True


class VehicleCreate(BaseModel):
    vehicle_type: Optional[str] = None
    vehicle_number: Optional[str] = None
    model: Optional[str] = None
    price: Optional[float] = None


class VehicleResponse(VehicleCreate):
    id: UUID
    partner_id: UUID

    class Config:
        from_attributes = True


# ══════════════════════════════════════════════════════════
#  PARTNER LOCATION
# ══════════════════════════════════════════════════════════

def _check_partner(partner_id: UUID, db: Session):
    if not db.query(Partner).filter(Partner.id == partner_id).first():
        raise HTTPException(status_code=404, detail="Partner not found")


@router.get("/{partner_id}/locations", response_model=list[LocationResponse])
def list_locations(partner_id: UUID, db: Session = Depends(get_db)):
    _check_partner(partner_id, db)
    return db.query(PartnerLocation).filter(PartnerLocation.partner_id == partner_id).order_by(PartnerLocation.created_at).all()


@router.post("/{partner_id}/locations", response_model=LocationResponse, status_code=201)
def create_location(partner_id: UUID, payload: LocationCreate, db: Session = Depends(get_db)):
    _check_partner(partner_id, db)
    loc = PartnerLocation(partner_id=partner_id, **payload.model_dump())
    db.add(loc)
    db.commit()
    db.refresh(loc)
    return loc


@router.patch("/{partner_id}/locations/{loc_id}", response_model=LocationResponse)
def update_location(partner_id: UUID, loc_id: UUID, payload: LocationCreate, db: Session = Depends(get_db)):
    loc = db.query(PartnerLocation).filter(PartnerLocation.id == loc_id, PartnerLocation.partner_id == partner_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(loc, k, v)
    db.commit()
    db.refresh(loc)
    return loc


@router.delete("/{partner_id}/locations/{loc_id}", status_code=204)
def delete_location(partner_id: UUID, loc_id: UUID, db: Session = Depends(get_db)):
    loc = db.query(PartnerLocation).filter(PartnerLocation.id == loc_id, PartnerLocation.partner_id == partner_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")
    db.delete(loc)
    db.commit()


# ══════════════════════════════════════════════════════════
#  PARTNER STAFF
# ══════════════════════════════════════════════════════════

@router.get("/{partner_id}/staff", response_model=list[StaffResponse])
def list_staff(partner_id: UUID, db: Session = Depends(get_db)):
    _check_partner(partner_id, db)
    return db.query(PartnerStaff).filter(PartnerStaff.partner_id == partner_id).all()


@router.post("/{partner_id}/staff", response_model=StaffResponse, status_code=201)
def create_staff(partner_id: UUID, payload: StaffCreate, db: Session = Depends(get_db)):
    _check_partner(partner_id, db)
    s = PartnerStaff(partner_id=partner_id, **payload.model_dump())
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


@router.patch("/{partner_id}/staff/{staff_id}", response_model=StaffResponse)
def update_staff(partner_id: UUID, staff_id: UUID, payload: StaffCreate, db: Session = Depends(get_db)):
    s = db.query(PartnerStaff).filter(PartnerStaff.id == staff_id, PartnerStaff.partner_id == partner_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Staff not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(s, k, v)
    db.commit()
    db.refresh(s)
    return s


@router.delete("/{partner_id}/staff/{staff_id}", status_code=204)
def delete_staff(partner_id: UUID, staff_id: UUID, db: Session = Depends(get_db)):
    s = db.query(PartnerStaff).filter(PartnerStaff.id == staff_id, PartnerStaff.partner_id == partner_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Staff not found")
    db.delete(s)
    db.commit()


# ══════════════════════════════════════════════════════════
#  CARRIER CONTACTS
# ══════════════════════════════════════════════════════════

@router.get("/{partner_id}/contacts", response_model=list[ContactResponse])
def list_contacts(partner_id: UUID, db: Session = Depends(get_db)):
    return db.query(CarrierContact).filter(CarrierContact.partner_id == partner_id).all()


@router.post("/{partner_id}/contacts", response_model=ContactResponse, status_code=201)
def create_contact(partner_id: UUID, payload: ContactCreate, db: Session = Depends(get_db)):
    _check_partner(partner_id, db)
    c = CarrierContact(partner_id=partner_id, **payload.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@router.delete("/{partner_id}/contacts/{contact_id}", status_code=204)
def delete_contact(partner_id: UUID, contact_id: UUID, db: Session = Depends(get_db)):
    c = db.query(CarrierContact).filter(CarrierContact.id == contact_id, CarrierContact.partner_id == partner_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Contact not found")
    db.delete(c)
    db.commit()


# ══════════════════════════════════════════════════════════
#  CARRIER VEHICLES
# ══════════════════════════════════════════════════════════

@router.get("/{partner_id}/vehicles", response_model=list[VehicleResponse])
def list_vehicles(partner_id: UUID, db: Session = Depends(get_db)):
    return db.query(CarrierVehicle).filter(CarrierVehicle.partner_id == partner_id).all()


@router.post("/{partner_id}/vehicles", response_model=VehicleResponse, status_code=201)
def create_vehicle(partner_id: UUID, payload: VehicleCreate, db: Session = Depends(get_db)):
    _check_partner(partner_id, db)
    v = CarrierVehicle(partner_id=partner_id, **payload.model_dump())
    db.add(v)
    db.commit()
    db.refresh(v)
    return v


@router.patch("/{partner_id}/vehicles/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(partner_id: UUID, vehicle_id: UUID, payload: VehicleCreate, db: Session = Depends(get_db)):
    v = db.query(CarrierVehicle).filter(CarrierVehicle.id == vehicle_id, CarrierVehicle.partner_id == partner_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    for k, v2 in payload.model_dump(exclude_unset=True).items():
        setattr(v, k, v2)
    db.commit()
    db.refresh(v)
    return v


@router.delete("/{partner_id}/vehicles/{vehicle_id}", status_code=204)
def delete_vehicle(partner_id: UUID, vehicle_id: UUID, db: Session = Depends(get_db)):
    v = db.query(CarrierVehicle).filter(CarrierVehicle.id == vehicle_id, CarrierVehicle.partner_id == partner_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    db.delete(v)
    db.commit()
