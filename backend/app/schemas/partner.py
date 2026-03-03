from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import date, datetime


class PartnerBase(BaseModel):
    name: str
    type: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    province: Optional[str] = None
    country: Optional[str] = "CANADA"
    postal_code: Optional[str] = None
    mc_number: Optional[str] = None
    dot_number: Optional[str] = None
    insurance_expiry: Optional[date] = None
    payment_terms: Optional[str] = None
    notes: Optional[str] = None
    # 확장 필드 (캐리어·공통)
    code: Optional[str] = None
    legal_name: Optional[str] = None
    operating_status: Optional[str] = None
    carrier_type: Optional[str] = None
    service_hours: Optional[str] = None
    mc_status: Optional[str] = None
    hazmat_carrier: Optional[bool] = False
    w9_received: Optional[bool] = False
    default_tax_code: Optional[str] = None
    payment_days: Optional[int] = None
    payment_type: Optional[str] = None
    ach_eft_banking: Optional[str] = None
    factor_company_name: Optional[str] = None
    personal_message: Optional[str] = None
    bill_to: Optional[str] = None


class PartnerCreate(PartnerBase):
    pass


class PartnerUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    province: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    mc_number: Optional[str] = None
    dot_number: Optional[str] = None
    insurance_expiry: Optional[date] = None
    payment_terms: Optional[str] = None
    notes: Optional[str] = None
    code: Optional[str] = None
    legal_name: Optional[str] = None
    operating_status: Optional[str] = None
    carrier_type: Optional[str] = None
    service_hours: Optional[str] = None
    mc_status: Optional[str] = None
    hazmat_carrier: Optional[bool] = None
    w9_received: Optional[bool] = None
    default_tax_code: Optional[str] = None
    payment_days: Optional[int] = None
    payment_type: Optional[str] = None
    ach_eft_banking: Optional[str] = None
    factor_company_name: Optional[str] = None
    personal_message: Optional[str] = None
    bill_to: Optional[str] = None
    is_active: Optional[bool] = None


class PartnerResponse(PartnerBase):
    id: UUID
    is_active: bool = True
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
