"""
Account API: ItemType / Expense (+Detail) / DebitCredit
"""
from uuid import UUID
from typing import Optional
from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.account import ItemType, Expense, ExpenseDetail, DebitCredit

router = APIRouter()


# ── 스키마 ────────────────────────────────────────────────────────────

class ItemTypeCreate(BaseModel):
    code: Optional[str] = None
    type_name: str
    lvl1: Optional[str] = None
    lvl2: Optional[str] = None
    dividers: Optional[str] = None
    uom: Optional[str] = None
    rc: Optional[bool] = False
    rebate: Optional[bool] = False
    account_type: Optional[str] = None
    is_active: Optional[bool] = True


class ItemTypeResponse(ItemTypeCreate):
    id: UUID
    created_at: Optional[datetime] = None
    class Config: from_attributes = True


class ExpenseDetailCreate(BaseModel):
    entry_number: Optional[str] = None
    general_account: Optional[str] = None
    entry_type: Optional[str] = None
    status: Optional[str] = None
    accountability: Optional[str] = None
    vendor: Optional[str] = None
    amount: Optional[float] = None


class ExpenseDetailResponse(ExpenseDetailCreate):
    id: UUID
    expense_id: UUID
    created_at: Optional[datetime] = None
    class Config: from_attributes = True


class ExpenseCreate(BaseModel):
    ref_no: Optional[str] = None
    item_type_id: Optional[UUID] = None
    bill_to: Optional[str] = None
    po_no: Optional[str] = None
    memo: Optional[str] = None
    expense_date: Optional[date] = None
    amount: Optional[float] = 0
    tax_amount: Optional[float] = 0
    account: Optional[str] = None
    vendor: Optional[str] = None
    status: Optional[str] = "pending"
    created_by: Optional[str] = None


class ExpenseResponse(ExpenseCreate):
    id: UUID
    created_at: Optional[datetime] = None
    details: list[ExpenseDetailResponse] = []
    class Config: from_attributes = True


class DebitCreditCreate(BaseModel):
    entry_type: str           # 'debit' | 'credit'
    reason: Optional[str] = None
    debit_amount: Optional[float] = 0
    credit_amount: Optional[float] = 0
    customer_code: Optional[str] = None
    tax_number: Optional[str] = None
    email: Optional[str] = None
    note: Optional[str] = None
    attachment_url: Optional[str] = None
    status: Optional[str] = "pending"


class DebitCreditResponse(DebitCreditCreate):
    id: UUID
    created_at: Optional[datetime] = None
    class Config: from_attributes = True


# ══════════════════════════════════════════════════════════
#  ITEM TYPE
# ══════════════════════════════════════════════════════════

@router.get("/item-types", response_model=list[ItemTypeResponse])
def list_item_types(
    q: Optional[str] = None,
    account_type: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(ItemType)
    if q:
        query = query.filter(ItemType.type_name.ilike(f"%{q}%") | ItemType.code.ilike(f"%{q}%"))
    if account_type:
        query = query.filter(ItemType.account_type == account_type)
    return query.order_by(ItemType.type_name).all()


@router.post("/item-types", response_model=ItemTypeResponse, status_code=201)
def create_item_type(payload: ItemTypeCreate, db: Session = Depends(get_db)):
    item = ItemType(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/item-types/{item_id}", response_model=ItemTypeResponse)
def update_item_type(item_id: UUID, payload: ItemTypeCreate, db: Session = Depends(get_db)):
    item = db.query(ItemType).filter(ItemType.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="ItemType not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(item, k, v)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/item-types/{item_id}", status_code=204)
def delete_item_type(item_id: UUID, db: Session = Depends(get_db)):
    item = db.query(ItemType).filter(ItemType.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="ItemType not found")
    db.delete(item)
    db.commit()


# ══════════════════════════════════════════════════════════
#  EXPENSE
# ══════════════════════════════════════════════════════════

@router.get("/expenses", response_model=list[ExpenseResponse])
def list_expenses(
    status: Optional[str] = None,
    vendor: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Expense)
    if status:
        query = query.filter(Expense.status == status)
    if vendor:
        query = query.filter(Expense.vendor.ilike(f"%{vendor}%"))
    return query.order_by(Expense.created_at.desc()).all()


@router.get("/expenses/{expense_id}", response_model=ExpenseResponse)
def get_expense(expense_id: UUID, db: Session = Depends(get_db)):
    e = db.query(Expense).filter(Expense.id == expense_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Expense not found")
    return e


@router.post("/expenses", response_model=ExpenseResponse, status_code=201)
def create_expense(payload: ExpenseCreate, db: Session = Depends(get_db)):
    e = Expense(**payload.model_dump())
    db.add(e)
    db.commit()
    db.refresh(e)
    return e


@router.patch("/expenses/{expense_id}", response_model=ExpenseResponse)
def update_expense(expense_id: UUID, payload: ExpenseCreate, db: Session = Depends(get_db)):
    e = db.query(Expense).filter(Expense.id == expense_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Expense not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(e, k, v)
    db.commit()
    db.refresh(e)
    return e


@router.delete("/expenses/{expense_id}", status_code=204)
def delete_expense(expense_id: UUID, db: Session = Depends(get_db)):
    e = db.query(Expense).filter(Expense.id == expense_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(e)
    db.commit()


# ExpenseDetail CRUD
@router.post("/expenses/{expense_id}/details", response_model=ExpenseDetailResponse, status_code=201)
def add_expense_detail(expense_id: UUID, payload: ExpenseDetailCreate, db: Session = Depends(get_db)):
    if not db.query(Expense).filter(Expense.id == expense_id).first():
        raise HTTPException(status_code=404, detail="Expense not found")
    d = ExpenseDetail(expense_id=expense_id, **payload.model_dump())
    db.add(d)
    db.commit()
    db.refresh(d)
    return d


@router.delete("/expenses/details/{detail_id}", status_code=204)
def delete_expense_detail(detail_id: UUID, db: Session = Depends(get_db)):
    d = db.query(ExpenseDetail).filter(ExpenseDetail.id == detail_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="ExpenseDetail not found")
    db.delete(d)
    db.commit()


# ══════════════════════════════════════════════════════════
#  DEBIT / CREDIT
# ══════════════════════════════════════════════════════════

@router.get("/debit-credits", response_model=list[DebitCreditResponse])
def list_debit_credits(
    entry_type: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(DebitCredit)
    if entry_type:
        query = query.filter(DebitCredit.entry_type == entry_type)
    if status:
        query = query.filter(DebitCredit.status == status)
    return query.order_by(DebitCredit.created_at.desc()).all()


@router.get("/debit-credits/{dc_id}", response_model=DebitCreditResponse)
def get_debit_credit(dc_id: UUID, db: Session = Depends(get_db)):
    dc = db.query(DebitCredit).filter(DebitCredit.id == dc_id).first()
    if not dc:
        raise HTTPException(status_code=404, detail="DebitCredit not found")
    return dc


@router.post("/debit-credits", response_model=DebitCreditResponse, status_code=201)
def create_debit_credit(payload: DebitCreditCreate, db: Session = Depends(get_db)):
    dc = DebitCredit(**payload.model_dump())
    db.add(dc)
    db.commit()
    db.refresh(dc)
    return dc


@router.patch("/debit-credits/{dc_id}", response_model=DebitCreditResponse)
def update_debit_credit(dc_id: UUID, payload: DebitCreditCreate, db: Session = Depends(get_db)):
    dc = db.query(DebitCredit).filter(DebitCredit.id == dc_id).first()
    if not dc:
        raise HTTPException(status_code=404, detail="DebitCredit not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(dc, k, v)
    db.commit()
    db.refresh(dc)
    return dc


@router.delete("/debit-credits/{dc_id}", status_code=204)
def delete_debit_credit(dc_id: UUID, db: Session = Depends(get_db)):
    dc = db.query(DebitCredit).filter(DebitCredit.id == dc_id).first()
    if not dc:
        raise HTTPException(status_code=404, detail="DebitCredit not found")
    db.delete(dc)
    db.commit()
