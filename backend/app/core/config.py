import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    PROJECT_NAME: str = "AI Job Search & Application Assistant"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"

    # Security
    JWT_SECRET: str = "default-insecure-secret-key-change-in-production-12345678"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30  # 30 days

    # CORS
    CORS_ORIGINS: Union[List[str], str] = ["*"]

    @field_validator("CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, str) and v.startswith("["):
            import json
            try:
                return json.loads(v)
            except Exception:
                return ["*"]
        return v or ["*"]

    # Neon PostgreSQL Database
    DATABASE_URL: str = "sqlite:///./profile_search.db"

    @field_validator("DATABASE_URL", mode="before")
    def fix_database_url(cls, v: str) -> str:
        if not v:
            return "sqlite:///./profile_search.db"
        # Neon connection strings often start with postgres:// or postgresql://
        # With psycopg v3, map to postgresql+psycopg:// so SQLAlchemy connects without needing psycopg2
        if v.startswith("postgres://"):
            v = v.replace("postgres://", "postgresql+psycopg://", 1)
        elif v.startswith("postgresql://") and not v.startswith("postgresql+"):
            v = v.replace("postgresql://", "postgresql+psycopg://", 1)
        return v

    # LLM Providers (Gemini Free Tier & Grok)
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"
    GROK_API_KEY: str = ""
    GROK_MODEL: str = "grok-beta"
    ACTIVE_LLM: str = "gemini" # "gemini" or "grok"

    # Storage
    STORAGE_MODE: str = "local" # "local" or "s3"
    UPLOAD_DIR: str = "./uploads"

    # S3 (optional)
    S3_BUCKET_NAME: str = ""
    S3_ACCESS_KEY: str = ""
    S3_SECRET_KEY: str = ""
    S3_REGION: str = "us-east-1"
    S3_ENDPOINT_URL: str = ""

settings = Settings()
