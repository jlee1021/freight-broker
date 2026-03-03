from fastapi import APIRouter, Depends
from .routes import (
    auth, loads, load_attachments, load_notes, partners, users,
    stats, documents, settings, inventory, invoices, tenders, master,
    partner_ext, account, consolidation, edi,
)
from .deps import get_current_user

router = APIRouter()
router.include_router(auth.router, prefix="/auth", tags=["auth"])

# Public routes (token-based — no JWT required)
router.include_router(tenders.public_router, prefix="/tenders", tags=["tenders"])

protected = APIRouter(dependencies=[Depends(get_current_user)])
protected.include_router(load_attachments.router, prefix="/loads", tags=["loads"])
protected.include_router(load_notes.router, prefix="/loads", tags=["loads"])
protected.include_router(loads.router, prefix="/loads", tags=["loads"])
protected.include_router(tenders.router, prefix="/loads", tags=["tenders"])
protected.include_router(partners.router, prefix="/partners", tags=["partners"])
protected.include_router(users.router, prefix="/users", tags=["users"])
protected.include_router(stats.router, prefix="/stats", tags=["stats"])
protected.include_router(documents.router, prefix="/documents", tags=["documents"])
protected.include_router(settings.router)
protected.include_router(inventory.router, prefix="/inventory", tags=["inventory"])
protected.include_router(invoices.router)
protected.include_router(master.router, prefix="/master", tags=["master"])
protected.include_router(partner_ext.router, prefix="/partners", tags=["partners"])
protected.include_router(account.router, prefix="/account", tags=["account"])
protected.include_router(consolidation.router, prefix="/consolidations", tags=["consolidation"])
protected.include_router(edi.router, prefix="/edi", tags=["edi"])
router.include_router(protected)
