"""
Standalone Application Runner for Module 06 — Interview Scheduling & Timetable.

Allows running this feature module completely isolated from the parent TALENTRA shell.
Usage:
    python feature-modules/06-interview-scheduling/backend/interview_app.py
"""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from .models.interview_models import Base
from .api.interview_router import router as interview_router

# Standalone SQLite engine
STANDALONE_DB_URL = "sqlite:///./interview_standalone.db"
engine = create_engine(STANDALONE_DB_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Module 06 — Interview Scheduling & Multi-Interviewer Timetable",
    version="1.0.0",
    description="Standalone Enterprise Recruitment Timetable and Calendar Coordination Engine.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(interview_router)


@app.get("/")
def root():
    return {
        "module": "06-interview-scheduling",
        "status": "operational",
        "description": "Enterprise Interview Scheduling & Timetable Microservice",
        "endpoints": [
            "/api/v1/interviews",
            "/api/v1/interviews/calendar",
            "/api/v1/interviews/availability",
            "/api/v1/interviews/interviewers",
        ],
    }


if __name__ == "__main__":
    uvicorn.run("interview_app:app", host="127.0.0.1", port=8006, reload=True)
