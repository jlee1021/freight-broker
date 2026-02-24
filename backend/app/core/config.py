from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "Freight Broker API"
    debug: bool = False

    # Database
    database_url: str = "postgresql://postgres:postgres@localhost:5432/freight_broker"

    # API
    api_v1_prefix: str = "/api/v1"

    # CORS: credentials 사용 시 * 불가. 쉼표 구분 목록 (예: http://192.168.111.137:5173,http://localhost:5173)
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173,http://192.168.111.137:5173"

    # Uploads (POD, files)
    upload_dir: str = "./uploads"

    # Email (optional; leave empty to disable send)
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    from_email: str = ""

    # JWT
    secret_key: str = "change-me-in-production-use-env"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days

    class Config:
        # backend/.env 또는 프로젝트 루트 .env
        env_file = (".env", "../.env")
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()
