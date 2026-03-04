import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import get_settings

settings = get_settings()

# Railway 등: DATABASE_URL이 없으면 localhost 기본값인데, 이러면 연결 실패함. 바로 안내 후 종료
if "localhost" in settings.database_url or "127.0.0.1" in settings.database_url:
    if os.environ.get("RAILWAY_ENVIRONMENT") or os.environ.get("PORT"):
        msg = (
            "DATABASE_URL is missing or points to localhost. "
            "In Railway: open your app service -> Variables -> Add variable: "
            "Name = DATABASE_URL, Value = Reference from Postgres -> DATABASE_URL "
            "(or ${{Postgres.DATABASE_URL}}). Then Redeploy."
        )
        raise RuntimeError(msg)

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    echo=settings.debug,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
