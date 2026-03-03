from pydantic import BaseModel
from typing import Optional


class SettingUpdate(BaseModel):
    tax_code_default: Optional[str] = None
    default_fsc_percent: Optional[str] = None
    company_name: Optional[str] = None
    company_address: Optional[str] = None
    company_mc: Optional[str] = None
    company_dot: Optional[str] = None
    default_equipment_types: Optional[str] = None
    company_logo_url: Optional[str] = None
    ar_reminder_days: Optional[str] = None
    ar_reminder_repeat_days: Optional[str] = None


class SettingResponse(BaseModel):
    tax_code_default: str
    default_fsc_percent: str
    company_name: str
    company_address: str
    company_mc: str
    company_dot: str
    default_equipment_types: str
    company_logo_url: str
    ar_reminder_days: str = "0"
    ar_reminder_repeat_days: str = "0"
