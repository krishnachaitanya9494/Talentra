"""
FastAPI Host Integration Snippet for Module 06 — Interview Scheduling & Timetable.

Copy this snippet into your production company FastAPI backend:
"""

from fastapi import FastAPI
from feature_modules.interview_scheduling.backend.api.interview_router import router as interview_router

app = FastAPI(title="Production Recruitment Platform")

# Mount the Interview Scheduling & Multi-Interviewer Timetable Router
app.include_router(interview_router, prefix="/api/v1")
