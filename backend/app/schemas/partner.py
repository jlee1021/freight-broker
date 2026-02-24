from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import date


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


class PartnerResponse(PartnerBase):
    id: UUID

    class Config:
        from_attributes = True
