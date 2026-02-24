from fastapi import APIRouter, Depends
from .routes import auth, loads, load_attachments, load_notes, partners, users, stats, documents, settings, inventory, invoices
from .deps import get_current_user

router = APIRouter()
router.include_router(auth.router, prefix="/auth", tags=["auth"])

protected = APIRouter(dependencies=[Depends(get_current_user)])
protected.include_router(load_attachments.router, prefix="/loads", tags=["loads"])
protected.include_router(load_notes.router, prefix="/loads", tags=["loads"])
protected.include_router(loads.router, prefix="/loads", tags=["loads"])
protected.include_router(partners.router, prefix="/partners", tags=["partners"])
protected.include_router(users.router, prefix="/users", tags=["users"])
protected.include_router(stats.router, prefix="/stats", tags=["stats"])
protected.include_router(documents.router, prefix="/documents", tags=["documents"])
protected.include_router(settings.router)
protected.include_router(inventory.router, prefix="/inventory", tags=["inventory"])
protected.include_router(invoices.router)
router.include_router(protected)
