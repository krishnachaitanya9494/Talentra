# TALENTRA — FEATURE PORTABILITY & INTEGRATION MATRIX
## Enterprise Architectural Guide for Standalone Module Extraction

> **Purpose**: This document provides the definitive guide for copying and integrating any of the five TALENTRA feature modules into an external production application.

---

## 1. Executive Summary

TALENTRA functions as an incubation sandbox. The five features in `feature-modules/` have been architected with **clean boundaries, zero external AI vendor lock-in, and strict interface contracts** so that any single module can be copied into a separate company repository without requiring the entire TALENTRA application shell.

```
TALENTRA/
│
├── feature-modules/
│   ├── 01-job-requisitions/              # Module 01: Job Requisition Lifecycle & Specs
│   ├── 02-candidate-resumes/             # Module 02: Candidate Resumes & Ingestion
│   ├── 03-jd-resume-intelligence/        # Module 03: Intelligence Comparison Workspace
│   ├── 04-resume-data-extraction/        # Module 04: Deterministic Data Extraction & Export
│   ├── 05-jd-candidate-sourcing-excel/   # Module 05: Internal Sourcing & Excel Engine
│   └── 06-interview-scheduling/          # Module 06: Interview Timetable & Calendar Engine
│
├── shared/
│   ├── common-contracts/                # Canonical Pydantic Profile & Requisition Schemas
│   ├── common-utilities/                # 11-Category Skill Taxonomy & Normalizer
│   └── integration-interfaces/          # Candidate & JD Repository Abstract Adapters
│
└── PORTABILITY.md                        # This Portability Matrix
```

---

## 2. Portability Matrix by Module

| Module | What Can Be Copied Directly | Host Dependencies to Install | Host Interfaces to Supply | Standalone Test Command |
|---|---|---|---|---|
| **01 — Job Requisitions** | Entire `01-job-requisitions/` folder (`frontend/`, `backend/`, `contracts/`) | `lucide-react` (frontend)<br>`pydantic`, `fastapi`, `uvicorn` (backend) | Database session or repository adapter implementing `JobRequisitionRepositoryAdapter` | `pytest feature-modules/01-job-requisitions/tests/` |
| **02 — Candidate Resumes** | Entire `02-candidate-resumes/` folder | `lucide-react` (frontend)<br>`pydantic`, `python-multipart` (backend) | File storage adapter (`StorageAdapter` e.g. Local disk, S3, or Blob) | `pytest feature-modules/02-candidate-resumes/tests/` |
| **03 — JD & Resume Intelligence** | Entire `03-jd-resume-intelligence/` folder | `lucide-react`, `react-router-dom`<br>`fastapi`, `pydantic` | Candidate & Requisition data providers | `pytest feature-modules/03-jd-resume-intelligence/tests/` |
| **04 — Resume Data Extraction** | Entire `04-resume-data-extraction/` folder | `lucide-react`<br>`fastapi`, `python-multipart` | Optional custom regex dictionary | `pytest feature-modules/04-resume-data-extraction/tests/` |
| **05 — Sourcing & Excel Engine** | Entire `05-jd-candidate-sourcing-excel/` folder | `lucide-react`<br>`fastapi`, `openpyxl` | Internal candidate repository query adapter | `pytest feature-modules/05-jd-candidate-sourcing-excel/tests/` |
| **06 — Interview Scheduling** | Entire `06-interview-scheduling/` folder | `lucide-react`<br>`fastapi`, `sqlalchemy` | Candidate & Interviewer user repository adapters | `pytest feature-modules/06-interview-scheduling/tests/` |

---

## 3. What Host Interfaces Must Be Supplied

When integrating into your company's production website, the host application supplies adapters matching the abstract contracts defined in [`shared/integration-interfaces/adapters.py`](file:///c:/Users/Krishna%20Chaitanya/Desktop/Talentra/shared/integration-interfaces/adapters.py):

### A. Candidate Repository Adapter
```python
from shared.integration_interfaces.adapters import CandidateRepositoryAdapter
from shared.common_contracts.schemas import CandidateProfileContract

class CompanyPostgresCandidateAdapter(CandidateRepositoryAdapter):
    def __init__(self, db_session):
        self.db = db_session

    def get_candidate_by_id(self, candidate_id: int) -> CandidateProfileContract:
        # Query your company's real database
        user = self.db.query(YourUserTable).filter_by(id=candidate_id).first()
        return CandidateProfileContract(
            id=user.id,
            full_name=user.name,
            email=user.email,
            phone=user.phone,
            total_experience_years=user.exp_years,
            primary_skills=user.skills_list,
        )
```

### B. Document Storage Adapter
```python
from shared.integration_interfaces.adapters import StorageAdapter

class CompanyS3StorageAdapter(StorageAdapter):
    def save_file(self, filename: str, content: bytes) -> str:
        # Upload directly to your company S3 bucket
        return s3_client.upload(filename, content)
```

---

## 4. Frontend Mounting Contract (React)

Every module exports a top-level `<FeatureModule />` mount component that can be rendered inside **any** host page or layout without requiring TALENTRA's sidebar:

```jsx
import { JobRequisitionsModule } from './feature-modules/01-job-requisitions/frontend';
import { CandidateResumesModule } from './feature-modules/02-candidate-resumes/frontend';
import { JDResumeIntelligenceModule } from './feature-modules/03-jd-resume-intelligence/frontend';
import { ResumeExtractionModule } from './feature-modules/04-resume-data-extraction/frontend';
import { SourcingExcelModule } from './feature-modules/05-jd-candidate-sourcing-excel/frontend';

// Usage inside any corporate layout:
<JobRequisitionsModule apiBaseUrl="https://api.yourcompany.com/v1/job-requisitions" />
```

---

## 5. Backend Mounting Contract (FastAPI)

Every module contains an independent `router.py` mountable in one line:

```python
from fastapi import FastAPI
from feature_modules.job_requisitions.backend.router import router as req_router
from feature_modules.candidate_resumes.backend.router import router as res_router
from feature_modules.jd_resume_intelligence.backend.router import router as comp_router
from feature_modules.resume_data_extraction.backend.router import router as ext_router
from feature_modules.jd_candidate_sourcing_excel.backend.router import router as src_router

app = FastAPI()

app.include_router(req_router, prefix="/api/v1/job-requisitions")
app.include_router(res_router, prefix="/api/v1/candidate-resumes")
app.include_router(comp_router, prefix="/api/v1/jd-resume-intelligence")
app.include_router(ext_router, prefix="/api/v1/scraper")
app.include_router(src_router, prefix="/api/v1/sourcing")
```

---

## 6. What Cannot Be Copied Independently (And Why)
1. **The TALENTRA Shell Navigation**: The global left sidebar (`Sidebar.jsx`) and top header (`Header.jsx`) belong to the demonstration sandbox. They should **not** be copied to your production website; your main website already has its own navigation header and layout.
2. **SQLite Dev Database (`talentra_dev.db`)**: This database contains sandbox testing data. Your production application should connect the modules to your production database (PostgreSQL, MySQL, SQL Server) via the provided repository interfaces.

---

## 7. Future Feature Standard Operating Procedure (Feature 06+)

**Rule for Future Development**:
Whenever any new feature is developed in TALENTRA, it must be created as an independent module inside `feature-modules/` starting with **`06-<feature-name>/`** (and sequential numbering `07-...`, `08-...` thereafter).

### Mandatory Directory Layout for Any New Feature (`06-<name>/`):
```
feature-modules/06-<feature-name>/
├── frontend/
│   ├── index.js                     # Public export barrel
│   ├── api.js                       # Decoupled API client
│   └── <FeatureName>Module.jsx       # Mountable container component
├── backend/
│   ├── <name>_router.py             # FastAPI APIRouter
│   ├── <name>_service.py            # Business logic (deterministic, no external AI lock-in)
│   └── <name>_app.py                # Standalone FastAPI uvicorn runner for isolated testing
├── contracts/
│   ├── <name>_schemas.py            # Pydantic request / response schemas
│   └── schemas.py                   # Re-exports
├── integration/
│   ├── FastAPIIntegration.py        # Copy-paste snippet for host FastAPI app
│   └── ReactIntegration.jsx         # Copy-paste snippet for host React app
├── config/
│   └── .env.example                 # Environment variables required by this module
├── tests/
│   └── test_<name>.py               # Pytest suite running against the standalone app
└── README.md                        # Self-contained integration guide for the main company project
```

### Development Protocol:
1. **Develop & Test in Isolation**: Build the feature within `feature-modules/06-<feature-name>/` so it has zero undeclared dependencies on other modules.
2. **Mount in Sandbox for Testing**: Wire the feature into TALENTRA's sidebar (`Sidebar.jsx`) and routes (`App.jsx` / `backend.app.main`) only for visual testing and demonstration.
3. **Verify Portability**: Verify that the module can run standalone (`pytest feature-modules/06-<name>/tests/`) and be copied directly to the main production website.

