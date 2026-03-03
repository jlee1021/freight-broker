from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import date, datetime
from decimal import Decimal


class CustomerInvoiceCreate(BaseModel):
    load_id: UUID
    invoice_number: Optional[str] = None  # auto if not provided
    due_date: Optional[date] = None


class CustomerInvoiceUpdate(BaseModel):
    status: Optional[str] = None
    paid_at: Optional[datetime] = None


class CustomerInvoiceResponse(BaseModel):
    id: UUID
    load_id: UUID
    customer_id: Optional[UUID] = None
    invoice_number: str
    amount: Decimal
    status: str
    due_date: Optional[date] = None
    sent_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    load_number: Optional[str] = None
    customer_name: Optional[str] = None
    last_reminder_sent_at: Optional[datetime] = None
    reminder_sent_count: int = 0

    class Config:
        from_attributes = True


class CarrierPayableCreate(BaseModel):
    carrier_segment_id: UUID
    invoice_number: Optional[str] = None


class CarrierPayableUpdate(BaseModel):
    status: Optional[str] = None
    paid_at: Optional[datetime] = None


class CarrierPayableResponse(BaseModel):
    id: UUID
    carrier_segment_id: UUID
    amount: Decimal
    invoice_number: Optional[str] = None
    status: str
    paid_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    load_number: Optional[str] = None
    carrier_name: Optional[str] = None

    class Config:
        from_attributes = True
