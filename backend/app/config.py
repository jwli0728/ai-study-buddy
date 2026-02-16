from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://studybuddy:studybuddy_password@localhost:5432/studybuddy"
    DATABASE_URL_SYNC: str = "postgresql://studybuddy:studybuddy_password@localhost:5432/studybuddy"

    # JWT
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = 60

    # Google AI
    GOOGLE_API_KEY: str = ""

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    # File uploads
    UPLOAD_DIR: str = "uploads/documents"
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB

    # Embedding settings
    EMBEDDING_MODEL: str = "models/text-embedding-004"
    EMBEDDING_DIMENSION: int = 768
    CHUNK_SIZE: int = 512
    CHUNK_OVERLAP: int = 50

    # LLM settings
    LLM_MODEL: str = "gemini-2.0-flash"

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
