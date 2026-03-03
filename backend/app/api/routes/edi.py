"""
EDI API: EdiConfig (설정 CRUD) + EdiRecord (전송 기록 CRUD)
"""
from uuid import UUID
from typing import Optional
from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.edi import EdiConfig, EdiRecord

router = APIRouter()


# ── 스키마 ────────────────────────────────────────────────────────────

class EdiConfigCreate(BaseModel):
    name: str
    edi_type: Optional[str] = None
    mode: Optional[str] = "Test"
    tid: Optional[str] = None
    tsi: Optional[str] = None
    remarks: Optional[str] = None
    is_active: Optional[bool] = True


class EdiConfigResponse(EdiConfigCreate):
    id: UUID
    created_at: Optional[datetime] = None
    class Config: from_attributes = True


class EdiRecordCreate(BaseModel):
    edi_config_id: Optional[UUID] = None
    company: Optional[str] = None
    report_date: Optional[date] = None
    report_type: Optional[str] = None
    client: Optional[str] = None
    invoice_number: Optional[str] = None
    bol_number: Optional[str] = None
    po_number: Optional[str] = None
    tracking_number: Optional[str] = None
    ap_date: Optional[date] = None
    sent_by: Optional[str] = None
    sent_at: Optional[datetime] = None
    status: Optional[str] = "pending"
    tp_number: Optional[str] = None
    tp_name: Optional[str] = None


class EdiRecordResponse(EdiRecordCreate):
    id: UUID
    created_at: Optional[datetime] = None
    class Config: from_attributes = True


# ══════════════════════════════════════════════════════════
#  EDI CONFIG
# ══════════════════════════════════════════════════════════

@router.get("/configs", response_model=list[EdiConfigResponse])
def list_configs(
    active_only: bool = True,
    db: Session = Depends(get_db),
):
    query = db.query(EdiConfig)
    if active_only:
        query = query.filter(EdiConfig.is_active == True)
    return query.order_by(EdiConfig.name).all()


@router.post("/configs", response_model=EdiConfigResponse, status_code=201)
def create_config(payload: EdiConfigCreate, db: Session = Depends(get_db)):
    cfg = EdiConfig(**payload.model_dump())
    db.add(cfg)
    db.commit()
    db.refresh(cfg)
    return cfg


@router.patch("/configs/{cfg_id}", response_model=EdiConfigResponse)
def update_config(cfg_id: UUID, payload: EdiConfigCreate, db: Session = Depends(get_db)):
    cfg = db.query(EdiConfig).filter(EdiConfig.id == cfg_id).first()
    if not cfg:
        raise HTTPException(status_code=404, detail="EdiConfig not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(cfg, k, v)
    db.commit()
    db.refresh(cfg)
    return cfg


@router.delete("/configs/{cfg_id}", status_code=204)
def delete_config(cfg_id: UUID, db: Session = Depends(get_db)):
    cfg = db.query(EdiConfig).filter(EdiConfig.id == cfg_id).first()
    if not cfg:
        raise HTTPException(status_code=404, detail="EdiConfig not found")
    db.delete(cfg)
    db.commit()


# ══════════════════════════════════════════════════════════
#  EDI RECORDS
# ══════════════════════════════════════════════════════════

@router.get("/records", response_model=list[EdiRecordResponse])
def list_records(
    company: Optional[str] = None,
    report_type: Optional[str] = None,
    status: Optional[str] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    db: Session = Depends(get_db),
):
    query = db.query(EdiRecord)
    if company:
        query = query.filter(EdiRecord.company.ilike(f"%{company}%"))
    if report_type:
        query = query.filter(EdiRecord.report_type == report_type)
    if status:
        query = query.filter(EdiRecord.status == status)
    if from_date:
        query = query.filter(EdiRecord.report_date >= from_date)
    if to_date:
        query = query.filter(EdiRecord.report_date <= to_date)
    return query.order_by(EdiRecord.created_at.desc()).all()


@router.post("/records", response_model=EdiRecordResponse, status_code=201)
def create_record(payload: EdiRecordCreate, db: Session = Depends(get_db)):
    r = EdiRecord(**payload.model_dump())
    db.add(r)
    db.commit()
    db.refresh(r)
    return r


@router.patch("/records/{rec_id}", response_model=EdiRecordResponse)
def update_record(rec_id: UUID, payload: EdiRecordCreate, db: Session = Depends(get_db)):
    r = db.query(EdiRecord).filter(EdiRecord.id == rec_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="EdiRecord not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(r, k, v)
    db.commit()
    db.refresh(r)
    return r


@router.delete("/records/{rec_id}", status_code=204)
def delete_record(rec_id: UUID, db: Session = Depends(get_db)):
    r = db.query(EdiRecord).filter(EdiRecord.id == rec_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="EdiRecord not found")
    db.delete(r)
    db.commit()
