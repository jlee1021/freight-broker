from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.models.load import Load
from app.models.load_note import LoadNote

router = APIRouter()


class LoadNoteCreate(BaseModel):
    body: str


class LoadNoteResponse(BaseModel):
    id: UUID
    load_id: UUID
    user_id: UUID | None
    body: str
    created_at: str | None
    user_name: str | None

    class Config:
        from_attributes = True


@router.get("/{load_id}/notes", response_model=list[LoadNoteResponse])
def list_load_notes(load_id: UUID, db: Session = Depends(get_db)):
    if not db.query(Load).filter(Load.id == load_id).first():
        raise HTTPException(status_code=404, detail="Load not found")
    notes = db.query(LoadNote).options(joinedload(LoadNote.user)).filter(LoadNote.load_id == load_id).order_by(LoadNote.created_at.desc()).all()
    return [
        LoadNoteResponse(
            id=n.id,
            load_id=n.load_id,
            user_id=n.user_id,
            body=n.body,
            created_at=n.created_at.isoformat() if n.created_at else None,
            user_name=(n.user.full_name or n.user.email) if n.user else None,
        )
        for n in notes
    ]


@router.post("/{load_id}/notes", response_model=LoadNoteResponse)
def create_load_note(load_id: UUID, payload: LoadNoteCreate, db: Session = Depends(get_db)):
    if not db.query(Load).filter(Load.id == load_id).first():
        raise HTTPException(status_code=404, detail="Load not found")
    if not (payload.body or "").strip():
        raise HTTPException(status_code=400, detail="Body required")
    note = LoadNote(load_id=load_id, body=payload.body.strip())
    db.add(note)
    db.commit()
    db.refresh(note)
    note = db.query(LoadNote).options(joinedload(LoadNote.user)).filter(LoadNote.id == note.id).first()
    return LoadNoteResponse(
        id=note.id,
        load_id=note.load_id,
        user_id=note.user_id,
        body=note.body,
        created_at=note.created_at.isoformat() if note.created_at else None,
        user_name=note.user.full_name if note.user else None,
    )


@router.delete("/{load_id}/notes/{note_id}")
def delete_load_note(load_id: UUID, note_id: UUID, db: Session = Depends(get_db)):
    note = db.query(LoadNote).filter(LoadNote.id == note_id, LoadNote.load_id == load_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    db.delete(note)
    db.commit()
    return {"ok": True}
