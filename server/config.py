"""Centralized, environment-aware application configuration."""

from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")


def _as_bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _as_list(value: str | None, default: tuple[str, ...]) -> tuple[str, ...]:
    if not value:
        return default
    return tuple(item.strip().rstrip("/") for item in value.split(",") if item.strip())


@dataclass(frozen=True)
class Settings:
    environment: str
    debug: bool
    host: str
    port: int
    database_url: str
    redis_url: str
    jwt_secret: str
    jwt_algorithm: str
    frontend_url: str
    cors_origins: tuple[str, ...]
    gemini_api_key: str
    gemini_model: str
    embedding_model: str
    max_upload_bytes: int
    max_pdf_pages: int
    pdf_processing_timeout_seconds: int
    db_pool_min: int
    db_pool_max: int
    initialize_database: bool
    allow_public_hiring_manager_signup: bool
    log_level: str
    rate_limit_storage_uri: str
    cloudinary_cloud_name: str
    cloudinary_api_key: str
    cloudinary_api_secret: str
    smtp_host: str
    smtp_port: int
    smtp_user: str
    smtp_password: str

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def socket_redis_url(self) -> str:
        if self.redis_url.startswith("rediss://") and "ssl_cert_reqs" not in self.redis_url:
            separator = "&" if "?" in self.redis_url else "?"
            return f"{self.redis_url}{separator}ssl_cert_reqs=none"
        return self.redis_url

    @property
    def celery_redis_url(self) -> str:
        if self.redis_url.startswith("rediss://") and "ssl_cert_reqs" not in self.redis_url:
            separator = "&" if "?" in self.redis_url else "?"
            return f"{self.redis_url}{separator}ssl_cert_reqs=CERT_NONE"
        return self.redis_url

    def validate(self) -> None:
        missing = [
            name
            for name, value in (
                ("DATABASE_URL", self.database_url),
                ("JWT_SECRET", self.jwt_secret),
            )
            if not value
        ]
        if missing:
            raise RuntimeError(f"Missing required environment variables: {', '.join(missing)}")
        if self.is_production and len(self.jwt_secret) < 32:
            raise RuntimeError("JWT_SECRET must contain at least 32 characters in production")
        if self.is_production and not self.gemini_api_key:
            raise RuntimeError("GEMINI_API_KEY is required in production")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    environment = os.getenv("APP_ENV", "development").strip().lower()
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
    default_origins = (frontend_url,)
    if environment != "production":
        default_origins += (
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5174",
        )
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    default_rate_store = redis_url if environment == "production" else "memory://"

    settings = Settings(
        environment=environment,
        debug=_as_bool(os.getenv("DEBUG"), default=environment == "development"),
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "5000")),
        database_url=os.getenv("DATABASE_URL", ""),
        redis_url=redis_url,
        jwt_secret=os.getenv("JWT_SECRET", ""),
        jwt_algorithm=os.getenv("JWT_ALGORITHM", "HS256"),
        frontend_url=frontend_url,
        cors_origins=_as_list(os.getenv("CORS_ORIGINS"), default_origins),
        gemini_api_key=os.getenv("GEMINI_API_KEY", ""),
        gemini_model=os.getenv("GEMINI_MODEL", "gemini-flash-latest"),
        embedding_model=os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2"),
        max_upload_bytes=int(os.getenv("MAX_UPLOAD_MB", "10")) * 1024 * 1024,
        max_pdf_pages=int(os.getenv("MAX_PDF_PAGES", "50")),
        pdf_processing_timeout_seconds=int(os.getenv("PDF_PROCESSING_TIMEOUT_SECONDS", "20")),
        db_pool_min=int(os.getenv("DB_POOL_MIN", "1")),
        db_pool_max=int(os.getenv("DB_POOL_MAX", "20")),
        initialize_database=_as_bool(os.getenv("INITIALIZE_DATABASE"), default=True),
        allow_public_hiring_manager_signup=_as_bool(
            os.getenv("ALLOW_PUBLIC_HIRING_MANAGER_SIGNUP"), default=False
        ),
        log_level=os.getenv("LOG_LEVEL", "INFO").upper(),
        rate_limit_storage_uri=os.getenv("RATE_LIMIT_STORAGE_URI", default_rate_store),
        cloudinary_cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME", ""),
        cloudinary_api_key=os.getenv("CLOUDINARY_API_KEY", ""),
        cloudinary_api_secret=os.getenv("CLOUDINARY_API_SECRET", ""),
        smtp_host=os.getenv("SMTP_HOST", "smtp.gmail.com"),
        smtp_port=int(os.getenv("SMTP_PORT", "465")),
        smtp_user=os.getenv("SMTP_USER", ""),
        smtp_password=os.getenv("SMTP_PASSWORD", ""),
    )
    settings.validate()
    return settings


settings = get_settings()
