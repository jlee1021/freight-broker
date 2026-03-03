"""
Settings 마스터 데이터 API: City / TypeMaster(+SubType) / Permission
모든 엔드포인트는 JWT 인증 필요 (호출 측에서 보호됨)
"""
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.models.master import City, TypeMaster, SubTypeMaster, Permission
from app.schemas.master import (
    CityCreate, CityUpdate, CityResponse,
    TypeMasterCreate, TypeMasterUpdate, TypeMasterResponse,
    SubTypeCreate, SubTypeResponse,
    PermissionCreate, PermissionUpdate, PermissionResponse,
)

router = APIRouter()


# ══════════════════════════════════════════════════════════
#  CITY
# ══════════════════════════════════════════════════════════

@router.get("/cities", response_model=list[CityResponse])
def list_cities(
    q: Optional[str] = None,
    active_only: bool = True,
    db: Session = Depends(get_db),
):
    """도시 목록 조회 (검색·활성 필터)."""
    query = db.query(City)
    if active_only:
        query = query.filter(City.is_active == True)
    if q:
        query = query.filter(
            City.name.ilike(f"%{q}%") | City.code.ilike(f"%{q}%")
        )
    return query.order_by(City.name).all()


@router.get("/cities/{city_id}", response_model=CityResponse)
def get_city(city_id: UUID, db: Session = Depends(get_db)):
    city = db.query(City).filter(City.id == city_id).first()
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
    return city


@router.post("/cities", response_model=CityResponse, status_code=201)
def create_city(payload: CityCreate, db: Session = Depends(get_db)):
    city = City(**payload.model_dump())
    db.add(city)
    db.commit()
    db.refresh(city)
    return city


@router.patch("/cities/{city_id}", response_model=CityResponse)
def update_city(city_id: UUID, payload: CityUpdate, db: Session = Depends(get_db)):
    city = db.query(City).filter(City.id == city_id).first()
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(city, k, v)
    db.commit()
    db.refresh(city)
    return city


@router.delete("/cities/{city_id}", status_code=204)
def delete_city(city_id: UUID, db: Session = Depends(get_db)):
    city = db.query(City).filter(City.id == city_id).first()
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
    db.delete(city)
    db.commit()


# ══════════════════════════════════════════════════════════
#  TYPE MASTER + SUBTYPE
# ══════════════════════════════════════════════════════════

@router.get("/types", response_model=list[TypeMasterResponse])
def list_types(
    q: Optional[str] = None,
    active_only: bool = True,
    db: Session = Depends(get_db),
):
    """유형 목록 (+ 서브타입 포함)."""
    query = db.query(TypeMaster)
    if active_only:
        query = query.filter(TypeMaster.is_active == True)
    if q:
        query = query.filter(TypeMaster.type_name.ilike(f"%{q}%"))
    return query.order_by(TypeMaster.type_name).all()


@router.get("/types/{type_id}", response_model=TypeMasterResponse)
def get_type(type_id: UUID, db: Session = Depends(get_db)):
    t = db.query(TypeMaster).filter(TypeMaster.id == type_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Type not found")
    return t


@router.post("/types", response_model=TypeMasterResponse, status_code=201)
def create_type(payload: TypeMasterCreate, db: Session = Depends(get_db)):
    """유형 생성 — 서브타입 동시 생성 가능."""
    data = payload.model_dump(exclude={"subtypes"})
    t = TypeMaster(**data)
    db.add(t)
    db.flush()  # id 획득
    # 서브타입 일괄 생성
    for st in (payload.subtypes or []):
        db.add(SubTypeMaster(parent_id=t.id, **st.model_dump()))
    db.commit()
    db.refresh(t)
    return t


@router.patch("/types/{type_id}", response_model=TypeMasterResponse)
def update_type(type_id: UUID, payload: TypeMasterUpdate, db: Session = Depends(get_db)):
    t = db.query(TypeMaster).filter(TypeMaster.id == type_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Type not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(t, k, v)
    db.commit()
    db.refresh(t)
    return t


@router.delete("/types/{type_id}", status_code=204)
def delete_type(type_id: UUID, db: Session = Depends(get_db)):
    t = db.query(TypeMaster).filter(TypeMaster.id == type_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Type not found")
    db.delete(t)
    db.commit()


# SubType CRUD (독립 엔드포인트)
@router.post("/types/{type_id}/subtypes", response_model=SubTypeResponse, status_code=201)
def add_subtype(type_id: UUID, payload: SubTypeCreate, db: Session = Depends(get_db)):
    if not db.query(TypeMaster).filter(TypeMaster.id == type_id).first():
        raise HTTPException(status_code=404, detail="Type not found")
    st = SubTypeMaster(parent_id=type_id, **payload.model_dump())
    db.add(st)
    db.commit()
    db.refresh(st)
    return st


@router.delete("/subtypes/{subtype_id}", status_code=204)
def delete_subtype(subtype_id: UUID, db: Session = Depends(get_db)):
    st = db.query(SubTypeMaster).filter(SubTypeMaster.id == subtype_id).first()
    if not st:
        raise HTTPException(status_code=404, detail="SubType not found")
    db.delete(st)
    db.commit()


# ══════════════════════════════════════════════════════════
#  PERMISSION
# ══════════════════════════════════════════════════════════

@router.get("/permissions", response_model=list[PermissionResponse])
def list_permissions(
    q: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Permission)
    if q:
        query = query.filter(Permission.name.ilike(f"%{q}%"))
    return query.order_by(Permission.name).all()


@router.get("/permissions/{perm_id}", response_model=PermissionResponse)
def get_permission(perm_id: UUID, db: Session = Depends(get_db)):
    p = db.query(Permission).filter(Permission.id == perm_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Permission not found")
    return p


@router.post("/permissions", response_model=PermissionResponse, status_code=201)
def create_permission(payload: PermissionCreate, db: Session = Depends(get_db)):
    # 이름 중복 체크
    if db.query(Permission).filter(Permission.name == payload.name).first():
        raise HTTPException(status_code=409, detail="Permission name already exists")
    p = Permission(**payload.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@router.patch("/permissions/{perm_id}", response_model=PermissionResponse)
def update_permission(perm_id: UUID, payload: PermissionUpdate, db: Session = Depends(get_db)):
    p = db.query(Permission).filter(Permission.id == perm_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Permission not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return p


@router.delete("/permissions/{perm_id}", status_code=204)
def delete_permission(perm_id: UUID, db: Session = Depends(get_db)):
    p = db.query(Permission).filter(Permission.id == perm_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Permission not found")
    db.delete(p)
    db.commit()
