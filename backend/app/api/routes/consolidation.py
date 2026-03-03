"""
Consolidation API: 통합 로드 CRUD + Shipper/Consignee 항목 관리
"""
from uuid import UUID
from typing import Optional
from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.consolidation import Consolidation, ConsolidationShipper, ConsolidationConsignee

router = APIRouter()


# ── 스키마 ────────────────────────────────────────────────────────────

class ShipperItemCreate(BaseModel):
    partner_id: Optional[UUID] = None
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    contact: Optional[str] = None
    pickup_date: Optional[date] = None
    pallet_count: Optional[int] = None
    weight: Optional[float] = None
    notes: Optional[str] = None
    sequence: Optional[int] = 1


class ShipperItemResponse(ShipperItemCreate):
    id: UUID
    consolidation_id: UUID
    class Config: from_attributes = True


class ConsigneeItemCreate(BaseModel):
    partner_id: Optional[UUID] = None
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    contact: Optional[str] = None
    delivery_date: Optional[date] = None
    pallet_count: Optional[int] = None
    weight: Optional[float] = None
    notes: Optional[str] = None
    sequence: Optional[int] = 1


class ConsigneeItemResponse(ConsigneeItemCreate):
    id: UUID
    consolidation_id: UUID
    class Config: from_attributes = True


class ConsolidationCreate(BaseModel):
    consolidation_number: str
    status: Optional[str] = "pending"
    description: Optional[str] = None
    equipment_type: Optional[str] = None
    total_weight: Optional[float] = None
    weight_unit: Optional[str] = "lbs"
    created_by: Optional[str] = None


class ConsolidationUpdate(BaseModel):
    consolidation_number: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None
    equipment_type: Optional[str] = None
    total_weight: Optional[float] = None
    weight_unit: Optional[str] = None
    last_modified_by: Optional[str] = None


class ConsolidationResponse(BaseModel):
    id: UUID
    consolidation_number: str
    status: Optional[str] = None
    description: Optional[str] = None
    equipment_type: Optional[str] = None
    total_weight: Optional[float] = None
    weight_unit: Optional[str] = None
    is_active: bool
    created_by: Optional[str] = None
    last_modified_by: Optional[str] = None
    created_at: Optional[datetime] = None
    customer_shippers: list[ShipperItemResponse] = []
    carrier_consignees: list[ConsigneeItemResponse] = []

    class Config: from_attributes = True


# ══════════════════════════════════════════════════════════
#  CONSOLIDATION CRUD
# ══════════════════════════════════════════════════════════

@router.get("", response_model=list[ConsolidationResponse])
def list_consolidations(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Consolidation).filter(Consolidation.is_active == True)
    if status:
        query = query.filter(Consolidation.status == status)
    return query.order_by(Consolidation.created_at.desc()).all()


@router.get("/{con_id}", response_model=ConsolidationResponse)
def get_consolidation(con_id: UUID, db: Session = Depends(get_db)):
    c = db.query(Consolidation).filter(Consolidation.id == con_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Consolidation not found")
    return c


@router.post("", response_model=ConsolidationResponse, status_code=201)
def create_consolidation(payload: ConsolidationCreate, db: Session = Depends(get_db)):
    if db.query(Consolidation).filter(Consolidation.consolidation_number == payload.consolidation_number).first():
        raise HTTPException(status_code=409, detail="Consolidation number already exists")
    c = Consolidation(**payload.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@router.patch("/{con_id}", response_model=ConsolidationResponse)
def update_consolidation(con_id: UUID, payload: ConsolidationUpdate, db: Session = Depends(get_db)):
    c = db.query(Consolidation).filter(Consolidation.id == con_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Consolidation not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(c, k, v)
    c.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(c)
    return c


@router.delete("/{con_id}", status_code=204)
def delete_consolidation(con_id: UUID, db: Session = Depends(get_db)):
    c = db.query(Consolidation).filter(Consolidation.id == con_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Consolidation not found")
    db.delete(c)
    db.commit()


# ── Shipper 항목 ──────────────────────────────────────────────────────

@router.post("/{con_id}/shippers", response_model=ShipperItemResponse, status_code=201)
def add_shipper(con_id: UUID, payload: ShipperItemCreate, db: Session = Depends(get_db)):
    if not db.query(Consolidation).filter(Consolidation.id == con_id).first():
        raise HTTPException(status_code=404, detail="Consolidation not found")
    s = ConsolidationShipper(consolidation_id=con_id, **payload.model_dump())
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


@router.patch("/{con_id}/shippers/{s_id}", response_model=ShipperItemResponse)
def update_shipper(con_id: UUID, s_id: UUID, payload: ShipperItemCreate, db: Session = Depends(get_db)):
    s = db.query(ConsolidationShipper).filter(ConsolidationShipper.id == s_id, ConsolidationShipper.consolidation_id == con_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Shipper not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(s, k, v)
    db.commit()
    db.refresh(s)
    return s


@router.delete("/{con_id}/shippers/{s_id}", status_code=204)
def delete_shipper(con_id: UUID, s_id: UUID, db: Session = Depends(get_db)):
    s = db.query(ConsolidationShipper).filter(ConsolidationShipper.id == s_id, ConsolidationShipper.consolidation_id == con_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Shipper not found")
    db.delete(s)
    db.commit()


# ── Consignee 항목 ────────────────────────────────────────────────────

@router.post("/{con_id}/consignees", response_model=ConsigneeItemResponse, status_code=201)
def add_consignee(con_id: UUID, payload: ConsigneeItemCreate, db: Session = Depends(get_db)):
    if not db.query(Consolidation).filter(Consolidation.id == con_id).first():
        raise HTTPException(status_code=404, detail="Consolidation not found")
    c = ConsolidationConsignee(consolidation_id=con_id, **payload.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@router.patch("/{con_id}/consignees/{c_id}", response_model=ConsigneeItemResponse)
def update_consignee(con_id: UUID, c_id: UUID, payload: ConsigneeItemCreate, db: Session = Depends(get_db)):
    c = db.query(ConsolidationConsignee).filter(ConsolidationConsignee.id == c_id, ConsolidationConsignee.consolidation_id == con_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Consignee not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(c, k, v)
    db.commit()
    db.refresh(c)
    return c


@router.delete("/{con_id}/consignees/{c_id}", status_code=204)
def delete_consignee(con_id: UUID, c_id: UUID, db: Session = Depends(get_db)):
    c = db.query(ConsolidationConsignee).filter(ConsolidationConsignee.id == c_id, ConsolidationConsignee.consolidation_id == con_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Consignee not found")
    db.delete(c)
    db.commit()
