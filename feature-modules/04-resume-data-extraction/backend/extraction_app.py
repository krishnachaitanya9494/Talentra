import sys
from pathlib import Path
_MOD_ROOT = str(Path(__file__).resolve().parent.parent)
if _MOD_ROOT not in sys.path:
    sys.path.insert(0, _MOD_ROOT)

"""
Independently runnable FastAPI microservice for Module 04: Resume Data Extraction.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.extraction_router import router

app = FastAPI(
    title="Talentra - Resume Data Extraction Standalone Service",
    version="1.0.0",
    description="Deterministic resume extraction service with provenance and CSV/Excel export."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1/scraper", tags=["Resume Extraction"])

@app.get("/health")
def health_check():
    return {"status": "ok", "module": "04-resume-data-extraction"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("standalone_app:app", host="0.0.0.0", port=8014, reload=True)
