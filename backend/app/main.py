import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .core.config import get_settings
from .core.database import SessionLocal
from .core.security import hash_password
from .api import router as api_router
from .models.user import User

logger = logging.getLogger("freight_broker")
settings = get_settings()

# 운영 환경에서 취약한 SECRET_KEY 경고
if settings.is_secret_key_insecure:
    logger.warning(
        "⚠️  SECRET_KEY is insecure or not set. "
        "Set a strong SECRET_KEY in your .env file before deploying to production."
    )

try:
    from apscheduler.schedulers.background import BackgroundScheduler
    _scheduler = BackgroundScheduler()
    _APScheduler_available = True
except ImportError:
    _scheduler = None
    _APScheduler_available = False


app = FastAPI(
    title=settings.app_name,
    openapi_url=f"{settings.api_v1_prefix}/openapi.json",
    docs_url="/docs",
)

_cors_list = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_list or ["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.on_event("startup")
def start_scheduler():
    if _APScheduler_available and _scheduler:
        from .services.reminder import run_reminder_job
        _scheduler.add_job(run_reminder_job, "cron", hour=8, minute=0, id="ar_reminder")
        _scheduler.start()
        logger.info("APScheduler started — AR reminder job runs daily at 08:00")
    else:
        logger.warning("APScheduler not installed — AR reminder job disabled. Run: pip install apscheduler")


@app.on_event("shutdown")
def stop_scheduler():
    if _APScheduler_available and _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)


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
            logger.info("Default admin account created: admin@local — change the password immediately.")
    except Exception as e:
        logger.warning("Startup seed failed: %s", e)
    finally:
        db.close()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/")
def root():
    return {"message": "Freight Broker API", "docs": "/docs"}
