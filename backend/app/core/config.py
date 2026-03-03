from pydantic_settings import BaseSettings
from functools import lru_cache

_INSECURE_SECRET = "change-me-in-production-use-env"


class Settings(BaseSettings):
    app_name: str = "Freight Broker API"
    debug: bool = False

    # Database
    database_url: str = "postgresql://postgres:postgres@localhost:5432/freight_broker"

    # API
    api_v1_prefix: str = "/api/v1"

    # CORS: credentials 사용 시 * 불가. .env에서 쉼표 구분 목록으로 설정
    # 예: CORS_ORIGINS=http://192.168.1.100:5173,https://app.yourcompany.com
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Uploads (POD, files)
    upload_dir: str = "./uploads"

    # Email (optional; leave empty to disable send)
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    from_email: str = ""

    # JWT
    secret_key: str = _INSECURE_SECRET
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 8  # 8시간 (운영 권장)

    class Config:
        env_file = (".env", "../.env")
        env_file_encoding = "utf-8"

    @property
    def is_secret_key_insecure(self) -> bool:
        return self.secret_key == _INSECURE_SECRET or len(self.secret_key) < 32


@lru_cache
def get_settings() -> Settings:
    return Settings()
