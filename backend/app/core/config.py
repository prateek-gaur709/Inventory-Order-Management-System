"""Application configuration sourced from environment variables."""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Settings loaded from environment / .env file. No hardcoded secrets."""

    # SQLAlchemy database URL, e.g. postgresql+psycopg2://user:pass@host:5432/db
    DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@db:5432/inventory"

    # Comma-separated list of allowed CORS origins for the frontend.
    BACKEND_CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # Whether to auto-create tables on startup (handy for the assessment / demo).
    AUTO_CREATE_TABLES: bool = True

    # Whether to seed demo data on startup.
    SEED_ON_STARTUP: bool = False

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.BACKEND_CORS_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
