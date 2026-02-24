from pydantic import BaseModel, field_serializer
from typing import Optional, List, Any, Union
from datetime import date, time as dt_time
from decimal import Decimal
from uuid import UUID


# --- Nested models for Load ---
class ShipperStopBase(BaseModel):
    sequence: Optional[int] = 1
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    province: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    type: Optional[str] = None
    pickup_date: Optional[date] = None
    time_start: Optional[str] = None  # "HH:MM"
    time_end: Optional[str] = None
    pallet_info: Optional[dict] = None
    notes: Optional[str] = None


class ShipperStopCreate(ShipperStopBase):
    pass


class ShipperStopResponse(ShipperStopBase):
    id: UUID
    load_id: UUID
    time_start: Optional[Union[str, dt_time]] = None
    time_end: Optional[Union[str, dt_time]] = None

    @field_serializer("time_start", "time_end", when_used="always")
    @staticmethod
    def _serialize_time(v):
        if v is None:
            return None
        if hasattr(v, "strftime"):
            return v.strftime("%H:%M")
        return str(v)

    class Config:
        from_attributes = True


class ConsigneeStopBase(BaseModel):
    sequence: Optional[int] = 1
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    province: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    type: Optional[str] = None
    due_date: Optional[date] = None
    time_start: Optional[str] = None
    time_end: Optional[str] = None
    pallet_info: Optional[dict] = None
    notes: Optional[str] = None


class ConsigneeStopCreate(ConsigneeStopBase):
    pass


class ConsigneeStopResponse(ConsigneeStopBase):
    id: UUID
    load_id: UUID
    time_start: Optional[Union[str, dt_time]] = None
    time_end: Optional[Union[str, dt_time]] = None

    @field_serializer("time_start", "time_end", when_used="always")
    @staticmethod
    def _serialize_time(v):
        if v is None:
            return None
        if hasattr(v, "strftime"):
            return v.strftime("%H:%M")
        return str(v)

    class Config:
        from_attributes = True


class CarrierSegmentBase(BaseModel):
    carrier_id: Optional[UUID] = None
    carrier_invoice_number: Optional[str] = None
    invoice_date: Optional[date] = None
    rate: Optional[Decimal] = None
    fsc_percent: Optional[Decimal] = None
    lc_number: Optional[str] = None
    tax_code: Optional[str] = None
    total: Optional[Decimal] = None
    load_status: Optional[str] = None
    rating: Optional[int] = None  # 1-5
    on_time: Optional[bool] = None


class CarrierSegmentCreate(CarrierSegmentBase):
    pass


class CarrierSegmentResponse(CarrierSegmentBase):
    id: UUID
    load_id: UUID
    class Config:
        from_attributes = True


class ReferenceBase(BaseModel):
    reference_number: Optional[str] = None
    reference_type: Optional[str] = None
    special_instructions: Optional[str] = None
    internal_notes: Optional[str] = None


class ReferenceCreate(ReferenceBase):
    pass


class ReferenceResponse(ReferenceBase):
    id: UUID
    load_id: UUID
    class Config:
        from_attributes = True


# --- Load main ---
class LoadBase(BaseModel):
    load_number: str
    status: Optional[str] = "pending"
    customer_id: Optional[UUID] = None
    dispatcher_id: Optional[UUID] = None
    sales_rep_id: Optional[UUID] = None
    billing_rep_id: Optional[UUID] = None
    rate: Optional[Decimal] = None
    fsc_percent: Optional[Decimal] = None
    tax_code: Optional[str] = None
    other_charges: Optional[Decimal] = 0
    auto_rate: Optional[bool] = False
    equipment_type: Optional[str] = None
    weight: Optional[Decimal] = None
    weight_unit: Optional[str] = "lbs"
    commodity: Optional[str] = None
    po_number: Optional[str] = None


class LoadCreate(LoadBase):
    pass


class LoadUpdate(BaseModel):
    status: Optional[str] = None
    customer_id: Optional[UUID] = None
    dispatcher_id: Optional[UUID] = None
    sales_rep_id: Optional[UUID] = None
    billing_rep_id: Optional[UUID] = None
    rate: Optional[Decimal] = None
    fsc_percent: Optional[Decimal] = None
    tax_code: Optional[str] = None
    other_charges: Optional[Decimal] = None
    auto_rate: Optional[bool] = None
    equipment_type: Optional[str] = None
    weight: Optional[Decimal] = None
    weight_unit: Optional[str] = None
    commodity: Optional[str] = None
    po_number: Optional[str] = None


class LoadResponse(LoadBase):
    id: UUID
    revenue: Optional[Decimal] = None
    cost: Optional[Decimal] = None
    profit_pct: Optional[Decimal] = None
    gst: Optional[Decimal] = None
    total_with_gst: Optional[Decimal] = None
    created_at: Optional[date] = None

    class Config:
        from_attributes = True


class LoadDetailResponse(LoadResponse):
    customer_name: Optional[str] = None
    dispatcher_name: Optional[str] = None
    shipper_stops: List[ShipperStopResponse] = []
    consignee_stops: List[ConsigneeStopResponse] = []
    carrier_segments: List[CarrierSegmentResponse] = []
    references: List[ReferenceResponse] = []


class LoadUpdateFull(BaseModel):
    """Full update including nested lists (replace-all)."""
    status: Optional[str] = None
    customer_id: Optional[UUID] = None
    dispatcher_id: Optional[UUID] = None
    sales_rep_id: Optional[UUID] = None
    billing_rep_id: Optional[UUID] = None
    rate: Optional[Decimal] = None
    fsc_percent: Optional[Decimal] = None
    tax_code: Optional[str] = None
    other_charges: Optional[Decimal] = None
    auto_rate: Optional[bool] = None
    equipment_type: Optional[str] = None
    weight: Optional[Decimal] = None
    weight_unit: Optional[str] = None
    commodity: Optional[str] = None
    po_number: Optional[str] = None
    shipper_stops: Optional[List[ShipperStopCreate]] = None
    consignee_stops: Optional[List[ConsigneeStopCreate]] = None
    carrier_segments: Optional[List[CarrierSegmentCreate]] = None
    references: Optional[List[ReferenceCreate]] = None


class LoadListResponse(BaseModel):
    total: int
    items: List[LoadResponse]
