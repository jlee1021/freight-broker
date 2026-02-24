from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import get_settings
from .core.database import SessionLocal
from .core.security import hash_password
from .api import router as api_router
from .models.user import User

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    openapi_url=f"{settings.api_v1_prefix}/openapi.json",
    docs_url="/docs",
)

# credentials=True 이면 allow_origins에 반드시 구체적인 origin 목록 사용 (* 불가)
_cors_list = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_list if _cors_list else ["http://localhost:5173", "http://127.0.0.1:5173", "http://192.168.111.137:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.on_event("startup")
def seed_user():
    db = SessionLocal()
    try:
        if db.query(User).first() is None:
            db.add(User(
                email="admin@local",
                hashed_password=hash_password("admin123"),
                full_name="Admin",
                role="admin",
            ))
            db.commit()
    except Exception:
        pass
    finally:
        db.close()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/")
def root():
    return {"message": "Freight Broker API", "docs": "/docs"}
