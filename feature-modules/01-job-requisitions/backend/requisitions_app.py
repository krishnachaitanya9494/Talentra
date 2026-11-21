import sys
from pathlib import Path
_MOD_ROOT = str(Path(__file__).resolve().parent.parent)
if _MOD_ROOT not in sys.path:
    sys.path.insert(0, _MOD_ROOT)

"""
Independently runnable FastAPI microservice for Module 01: Job Requisitions.
Run standalone with:
    uvicorn feature-modules.01-job-requisitions.backend.standalone_app:app --port 8011 --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.requisitions_router import router

app = FastAPI(
    title="Talentra - Job Requisitions Standalone Service",
    version="1.0.0",
    description="Independent service managing job requisitions, 10-section canonical parsing, and quality validation."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1/job-requisitions", tags=["Job Requisitions"])

@app.get("/health")
def health_check():
    return {"status": "ok", "module": "01-job-requisitions"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("standalone_app:app", host="0.0.0.0", port=8011, reload=True)
