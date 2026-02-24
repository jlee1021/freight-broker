import os
import uuid
from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.models.load import Load, LoadAttachment

router = APIRouter()
settings = get_settings()

# 20 MB
MAX_UPLOAD_BYTES = 20 * 1024 * 1024

ALLOWED_EXTENSIONS = {
    ".pdf", ".png", ".jpg", ".jpeg", ".gif", ".webp",
    ".doc", ".docx", ".xls", ".xlsx", ".csv", ".txt",
}

ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "image/png", "image/jpeg", "image/gif", "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv", "text/plain",
}


def _upload_dir() -> Path:
    d = Path(settings.upload_dir) / "load_attachments"
    d.mkdir(parents=True, exist_ok=True)
    return d


@router.get("/{load_id}/attachments")
def list_attachments(
    load_id: UUID,
    document_type: str | None = None,
    db: Session = Depends(get_db),
):
    load = db.query(Load).filter(Load.id == load_id).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    query = db.query(LoadAttachment).filter(LoadAttachment.load_id == load_id)
    if document_type and document_type.strip().lower() in ("pod", "bol", "rate_confirmation", "other"):
        query = query.filter(LoadAttachment.document_type == document_type.strip().lower())
    items = query.order_by(LoadAttachment.created_at.desc()).all()
    return {
        "items": [
            {
                "id": str(a.id),
                "original_filename": a.original_filename,
                "content_type": a.content_type,
                "document_type": a.document_type or "other",
                "created_at": a.created_at.isoformat() if a.created_at else None,
            }
            for a in items
        ]
    }


class AttachmentDocumentTypeUpdate(BaseModel):
    document_type: str | None = None  # pod, bol, rate_confirmation, other


@router.post("/{load_id}/attachments")
def upload_attachment(
    load_id: UUID,
    file: UploadFile = File(...),
    document_type: str | None = Form(None),
    db: Session = Depends(get_db),
):
    load = db.query(Load).filter(Load.id == load_id).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")

    # 파일 크기 제한
    contents = file.file.read()
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail=f"File too large. Maximum size is {MAX_UPLOAD_BYTES // (1024*1024)} MB.")

    # 파일 타입 검증
    safe_name = (file.filename or "file").replace("..", "").replace("/", "").replace("\\", "").strip() or "file"
    ext = Path(safe_name).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail=f"File type '{ext}' not allowed. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )
    ct = (file.content_type or "").split(";")[0].strip().lower()
    if ct and ct not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Content-Type '{ct}' not allowed.",
        )

    base_dir = _upload_dir()
    stored_name = f"{uuid.uuid4().hex}{ext}"
    stored_path = str(base_dir / stored_name)
    try:
        with open(stored_path, "wb") as f:
            f.write(contents)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {e}")

    rel_path = f"load_attachments/{stored_name}"
    doc_type = (document_type or "other").strip().lower() if document_type else "other"
    if doc_type not in ("pod", "bol", "rate_confirmation", "other"):
        doc_type = "other"
    att = LoadAttachment(
        load_id=load_id,
        original_filename=safe_name,
        stored_path=rel_path,
        content_type=file.content_type or None,
        document_type=doc_type,
    )
    db.add(att)
    db.commit()
    db.refresh(att)
    return {
        "id": str(att.id),
        "original_filename": att.original_filename,
        "content_type": att.content_type,
        "document_type": att.document_type or "other",
        "created_at": att.created_at.isoformat() if att.created_at else None,
    }


@router.patch("/{load_id}/attachments/{attachment_id}")
def update_attachment_type(
    load_id: UUID,
    attachment_id: UUID,
    body: AttachmentDocumentTypeUpdate,
    db: Session = Depends(get_db),
):
    att = (
        db.query(LoadAttachment)
        .filter(LoadAttachment.id == attachment_id, LoadAttachment.load_id == load_id)
        .first()
    )
    if not att:
        raise HTTPException(status_code=404, detail="Attachment not found")
    if body.document_type is not None:
        doc_type = body.document_type.strip().lower()
        att.document_type = doc_type if doc_type in ("pod", "bol", "rate_confirmation", "other") else "other"
    db.commit()
    db.refresh(att)
    return {
        "id": str(att.id),
        "document_type": att.document_type or "other",
    }


@router.get("/{load_id}/attachments/{attachment_id}")
def download_attachment(
    load_id: UUID,
    attachment_id: UUID,
    db: Session = Depends(get_db),
):
    att = (
        db.query(LoadAttachment)
        .filter(LoadAttachment.id == attachment_id, LoadAttachment.load_id == load_id)
        .first()
    )
    if not att:
        raise HTTPException(status_code=404, detail="Attachment not found")
    full_path = Path(settings.upload_dir) / att.stored_path
    if not full_path.is_file():
        raise HTTPException(status_code=404, detail="File not found on disk")
    return FileResponse(
        path=str(full_path),
        filename=att.original_filename,
        media_type=att.content_type or "application/octet-stream",
    )


@router.delete("/{load_id}/attachments/{attachment_id}")
def delete_attachment(
    load_id: UUID,
    attachment_id: UUID,
    db: Session = Depends(get_db),
):
    att = (
        db.query(LoadAttachment)
        .filter(LoadAttachment.id == attachment_id, LoadAttachment.load_id == load_id)
        .first()
    )
    if not att:
        raise HTTPException(status_code=404, detail="Attachment not found")
    full_path = Path(settings.upload_dir) / att.stored_path
    if full_path.is_file():
        try:
            os.remove(full_path)
        except OSError:
            pass
    db.delete(att)
    db.commit()
    return {"ok": True}
