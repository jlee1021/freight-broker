"""
Account 모듈 모델: ItemType, Expense, ExpenseDetail, DebitCredit
참조 솔루션 clone 대상 — Account 탭의 4개 하위 기능
"""
from sqlalchemy import Column, String, Text, Boolean, Date, DateTime, Integer, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from app.core.database import Base


class ItemType(Base):
    """아이템 유형 마스터 — Account > Item Type List."""
    __tablename__ = "item_types"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(50), nullable=True, index=True)           # 코드
    type_name = Column(String(255), nullable=False)                 # 유형명
    lvl1 = Column(String(100), nullable=True)                      # Level 1 분류
    lvl2 = Column(String(100), nullable=True)                      # Level 2 분류
    dividers = Column(String(100), nullable=True)                   # 구분자
    uom = Column(String(50), nullable=True)                        # 단위 (Unit of Measure)
    rc = Column(Boolean, default=False)                            # RC 여부
    rebate = Column(Boolean, default=False)                        # Rebate 여부
    account_type = Column(String(100), nullable=True)              # 계정 유형 필터
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # 연결된 Expense 목록
    expenses = relationship("Expense", back_populates="item_type_rel")


class Expense(Base):
    """비용 항목 — Account > Expense."""
    __tablename__ = "expenses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ref_no = Column(String(100), nullable=True)                    # 참조 번호
    item_type_id = Column(UUID(as_uuid=True), ForeignKey("item_types.id", ondelete="SET NULL"), nullable=True)
    bill_to = Column(String(255), nullable=True)                   # 청구 대상
    po_no = Column(String(100), nullable=True)                     # 구매 주문 번호
    memo = Column(Text, nullable=True)
    expense_date = Column(Date, nullable=True)
    amount = Column(Numeric(12, 2), nullable=True, default=0)
    tax_amount = Column(Numeric(12, 2), nullable=True, default=0)
    account = Column(String(255), nullable=True)                   # 계정 코드
    vendor = Column(String(255), nullable=True)                    # 공급업체
    status = Column(String(50), nullable=True, default="pending")  # pending, approved, paid
    created_by = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    item_type_rel = relationship("ItemType", back_populates="expenses")
    details = relationship("ExpenseDetail", back_populates="expense", cascade="all, delete-orphan")


class ExpenseDetail(Base):
    """비용 상세 — Account > Expense Detail."""
    __tablename__ = "expense_details"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    expense_id = Column(UUID(as_uuid=True), ForeignKey("expenses.id", ondelete="CASCADE"), nullable=False)
    entry_number = Column(String(100), nullable=True)              # Entry #
    general_account = Column(String(255), nullable=True)           # 일반 계정
    entry_type = Column(String(100), nullable=True)                # 분개 유형
    status = Column(String(50), nullable=True)
    accountability = Column(String(255), nullable=True)
    vendor = Column(String(255), nullable=True)
    amount = Column(Numeric(12, 2), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    expense = relationship("Expense", back_populates="details")


class DebitCredit(Base):
    """차변/대변 — Account > Debit/Credit."""
    __tablename__ = "debit_credits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entry_type = Column(String(20), nullable=False)                # 'debit' | 'credit'
    reason = Column(Text, nullable=True)
    debit_amount = Column(Numeric(12, 2), nullable=True, default=0)
    credit_amount = Column(Numeric(12, 2), nullable=True, default=0)
    customer_code = Column(String(100), nullable=True)
    tax_number = Column(String(100), nullable=True)
    email = Column(String(255), nullable=True)
    note = Column(Text, nullable=True)
    attachment_url = Column(String(512), nullable=True)
    status = Column(String(50), nullable=True, default="pending")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
