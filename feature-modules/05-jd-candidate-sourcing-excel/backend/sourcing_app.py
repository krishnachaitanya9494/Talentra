import sys
from pathlib import Path
_MOD_ROOT = str(Path(__file__).resolve().parent.parent)
if _MOD_ROOT not in sys.path:
    sys.path.insert(0, _MOD_ROOT)

"""
Independently runnable FastAPI microservice for Module 05: JD-Based Candidate Sourcing & Excel Engine.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.sourcing_router import router

app = FastAPI(
    title="Talentra - JD-Based Candidate Sourcing Standalone Service",
    version="1.0.0",
    description="Internal candidate sourcing, Boolean filtering, and multi-worksheet Excel generation."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1/sourcing", tags=["Sourcing & Excel"])

@app.get("/health")
def health_check():
    return {"status": "ok", "module": "05-jd-candidate-sourcing-excel"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("standalone_app:app", host="0.0.0.0", port=8015, reload=True)
