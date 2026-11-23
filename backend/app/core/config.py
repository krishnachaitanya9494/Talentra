"""
Application Configuration Module for TALENTRA.

Centralizes environment variables and configuration settings using Pydantic Settings,
ensuring consistent typing, default fallbacks, and validation across the platform.
"""

from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

# Locate the project root directory (two levels up from backend/app/core)
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
ENV_FILE_PATH = BASE_DIR / ".env"


class Settings(BaseSettings):
    """
    Central settings class loading environment configurations.
    Priority: environment variables > .env file > default fallback values.
    """
    PROJECT_NAME: str = "TALENTRA - Talent Intelligence Platform"
    ENVIRONMENT: str = "development"
    VERSION: str = "0.1.0"
    
    # Server network bindings
    BACKEND_HOST: str = "127.0.0.1"
    BACKEND_PORT: int = 8000
    
    # Database URL: defaults to local isolated SQLite in data/ directory
    DATABASE_URL: str = f"sqlite:///{BASE_DIR / 'data' / 'talentra_dev.db'}"
    
    # Permitted origins for Cross-Origin Resource Sharing (CORS)
    # Allows the React Vite / Next.js frontend to communicate with FastAPI
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    # OpenRouter Free AI Configuration
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENROUTER_LLM_MODEL: str = "nvidia/nemotron-3.5-super-vl:free"
    OPENROUTER_CHAT_MODEL: str = "nvidia/nemotron-3.5-super-vl:free"
    OPENROUTER_EMBEDDING_MODEL: str = "nvidia/nemotron-3-embed-1b:free"

    model_config = SettingsConfigDict(
        # Point to the root .env file if it exists, but don't fail if absent
        env_file=str(ENV_FILE_PATH),
        env_file_encoding="utf-8",
        extra="ignore",
    )


# Instantiate a singleton settings instance for import across backend modules
settings = Settings()
