from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_roles
from app.core.database import get_db
from app.core.security import hash_password
from sqlalchemy.orm import joinedload
from app.models.user import User
from app.models.partner import Partner
from app.schemas.user import UserResponse, UserCreate, UserUpdate

router = APIRouter()


def _user_to_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        partner_id=user.partner_id,
        partner_name=user.partner.name if user.partner else None,
        partner_type=user.partner.type if user.partner else None,
    )


@router.get("", response_model=list[UserResponse])
def list_users(db: Session = Depends(get_db), _user: User = Depends(require_roles(["admin"]))):
    users = db.query(User).options(joinedload(User.partner)).all()
    return [_user_to_response(u) for u in users]


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: UUID, db: Session = Depends(get_db), _user: User = Depends(require_roles(["admin"]))):
    user = db.query(User).options(joinedload(User.partner)).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return _user_to_response(user)


@router.post("", response_model=UserResponse)
def create_user(payload: UserCreate, db: Session = Depends(get_db), _user: User = Depends(require_roles(["admin"]))):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        role=payload.role,
        partner_id=payload.partner_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    user = db.query(User).options(joinedload(User.partner)).filter(User.id == user.id).first()
    return _user_to_response(user)


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(user_id: UUID, payload: UserUpdate, db: Session = Depends(get_db), _user: User = Depends(require_roles(["admin"]))):
    user = db.query(User).options(joinedload(User.partner)).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    data = payload.model_dump(exclude_unset=True)
    if "password" in data and data["password"]:
        data["hashed_password"] = hash_password(data.pop("password"))
    for k, v in data.items():
        if k != "hashed_password" and hasattr(user, k):
            setattr(user, k, v)
    db.commit()
    db.refresh(user)
    user = db.query(User).options(joinedload(User.partner)).filter(User.id == user_id).first()
    return _user_to_response(user)
