"""
마스터 데이터 Pydantic 스키마: City, TypeMaster, SubType, Permission
"""
from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime


# ─── City ───────────────────────────────────────────────────────────────────

class CityCreate(BaseModel):
    code: Optional[str] = None
    name: str
    province: Optional[str] = None
    country: Optional[str] = "CANADA"
    zip_code: Optional[str] = None
    timezone: Optional[str] = None
    remarks: Optional[str] = None
    is_active: Optional[bool] = True


class CityUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    province: Optional[str] = None
    country: Optional[str] = None
    zip_code: Optional[str] = None
    timezone: Optional[str] = None
    remarks: Optional[str] = None
    is_active: Optional[bool] = None


class CityResponse(BaseModel):
    id: UUID
    code: Optional[str] = None
    name: str
    province: Optional[str] = None
    country: Optional[str] = None
    zip_code: Optional[str] = None
    timezone: Optional[str] = None
    remarks: Optional[str] = None
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─── SubType ────────────────────────────────────────────────────────────────

class SubTypeCreate(BaseModel):
    subtype_name: str
    is_active: Optional[bool] = True


class SubTypeResponse(BaseModel):
    id: UUID
    parent_id: UUID
    subtype_name: str
    is_active: bool

    class Config:
        from_attributes = True


# ─── TypeMaster ─────────────────────────────────────────────────────────────

class TypeMasterCreate(BaseModel):
    type_name: str
    use_subtype: Optional[bool] = False
    description: Optional[str] = None
    remark: Optional[str] = None
    is_active: Optional[bool] = True
    subtypes: Optional[List[SubTypeCreate]] = []


class TypeMasterUpdate(BaseModel):
    type_name: Optional[str] = None
    use_subtype: Optional[bool] = None
    description: Optional[str] = None
    remark: Optional[str] = None
    is_active: Optional[bool] = None


class TypeMasterResponse(BaseModel):
    id: UUID
    type_name: str
    use_subtype: bool
    description: Optional[str] = None
    remark: Optional[str] = None
    is_active: bool
    created_at: Optional[datetime] = None
    subtypes: List[SubTypeResponse] = []

    class Config:
        from_attributes = True


# ─── Permission ──────────────────────────────────────────────────────────────

class PermissionCreate(BaseModel):
    name: str
    description: Optional[str] = None
    resource: Optional[str] = None
    action: Optional[str] = None
    is_active: Optional[bool] = True


class PermissionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    resource: Optional[str] = None
    action: Optional[str] = None
    is_active: Optional[bool] = None


class PermissionResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    resource: Optional[str] = None
    action: Optional[str] = None
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
