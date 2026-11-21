# MODULE 01 — Job Requisitions

> **Status**: Production-Ready, Completely Decoupled, Portable Feature Package.  
> **Source**: TALENTRA Incubation Repository (`feature-modules/01-job-requisitions/`).

---

## 1. Module Overview
This package encapsulates all responsibilities for Job Requisition lifecycle management:
- Requisition creation, listing, search, and status lifecycle.
- 10-section canonical document structuring (Job Overview, Summary, Responsibilities, Technical Skills, Experience, Education, Certifications, Domain, Preferred Qualifications, Employment Info).
- Deterministic rule-based JD Quality & Completeness Validator (Critical, Warning, Suggestion tiers).
- Audit trail version history snapshot recording and diff engine.
- Interactive requirements management and technical screening Q&A manager.

---

## 2. Directory Layout
```
01-job-requisitions/
├── frontend/               # React components (JobRequisitionsModule, JobWorkspace, StructuredJDSpecs, api.js)
├── backend/                # Standalone FastAPI router, service, repository, and standalone_app.py
├── contracts/              # Pydantic schemas (schemas.py)
├── tests/                  # Independent pytest test suite (test_job_requisitions.py)
├── docs/                   # API specification & schema documentation
├── integration/            # Host application integration snippets (FastAPI, React)
├── config/                 # Environment configuration (.env.example, settings.py)
└── README.md               # Integration & developer guide
```

---

## 3. How to Copy and Integrate

### Frontend Integration (React)
1. Copy `frontend/` into your React project:
   ```bash
   cp -r feature-modules/01-job-requisitions/frontend src/features/job-requisitions
   ```
2. Mount in your layout:
   ```jsx
   import { JobRequisitionsModule } from './features/job-requisitions';

   <JobRequisitionsModule apiBaseUrl="/api/v1/job-requisitions" />
   ```

### Backend Integration (FastAPI)
1. Copy `backend/` and `contracts/` into your Python project:
   ```bash
   cp -r feature-modules/01-job-requisitions/backend app/modules/job_requisitions
   cp -r feature-modules/01-job-requisitions/contracts app/modules/job_requisitions/contracts
   ```
2. Mount router:
   ```python
   from app.modules.job_requisitions.router import router as req_router
   app.include_router(req_router, prefix="/api/v1/job-requisitions", tags=["Job Requisitions"])
   ```

---

## 4. Independent Testing
Run the isolated test suite without external dependencies:
```bash
pytest feature-modules/01-job-requisitions/tests/
```
