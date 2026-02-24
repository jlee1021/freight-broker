from pydantic import BaseModel
from typing import Optional
from uuid import UUID


class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: Optional[str] = None
    role: Optional[str] = None
    partner_id: Optional[UUID] = None
    partner_name: Optional[str] = None
    partner_type: Optional[str] = None

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None
    role: Optional[str] = None
    partner_id: Optional[UUID] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    password: Optional[str] = None
    partner_id: Optional[UUID] = None
