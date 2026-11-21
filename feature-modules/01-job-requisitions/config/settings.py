"""
Environment settings for Module 01: Job Requisitions.
"""
import os
from pydantic import BaseSettings

class Settings(BaseSettings):
    MODULE_NAME: str = "01-job-requisitions"
    API_PREFIX: str = "/api/v1/job-requisitions"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./requisitions.db")
    STORAGE_DIR: str = os.getenv("STORAGE_DIR", "./data/requisitions")

settings = Settings()
