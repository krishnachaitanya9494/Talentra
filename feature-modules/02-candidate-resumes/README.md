# MODULE 02 — Candidate Resumes

> **Status**: Production-Ready, Completely Decoupled, Portable Feature Package.  
> **Source**: TALENTRA Incubation Repository (`feature-modules/02-candidate-resumes/`).

---

## 1. Module Overview
This package encapsulates all responsibilities for Candidate Resume repository management:
- Individual and bulk resume document uploads (.pdf, .docx, .txt).
- SHA-256 cryptographic document deduplication.
- Candidate profiles with skill extraction, experience calculation, and contact indexing.
- Document preview, status tracking, and download handlers.

---

## 2. Directory Layout
```
02-candidate-resumes/
├── frontend/               # React components (CandidateResumesModule, CandidateDirectory, UploadResumeModal, api.js)
├── backend/                # Standalone FastAPI router, service, deduplication logic, and standalone_app.py
├── contracts/              # Pydantic schemas (schemas.py)
├── tests/                  # Independent pytest test suite (test_candidate_resumes.py)
├── docs/                   # API specification & schema documentation
├── integration/            # Host application integration snippets (FastAPI, React)
├── config/                 # Environment configuration (.env.example)
└── README.md               # Integration & developer guide
```

---

## 3. How to Copy and Integrate

### Frontend Integration (React)
1. Copy `frontend/` into your React project:
   ```bash
   cp -r feature-modules/02-candidate-resumes/frontend src/features/candidate-resumes
   ```
2. Mount in your layout:
   ```jsx
   import { CandidateResumesModule } from './features/candidate-resumes';

   <CandidateResumesModule apiBaseUrl="/api/v1/candidate-resumes" />
   ```

### Backend Integration (FastAPI)
1. Copy `backend/` and `contracts/` into your Python project:
   ```bash
   cp -r feature-modules/02-candidate-resumes/backend app/modules/candidate_resumes
   ```
2. Mount router:
   ```python
   from app.modules.candidate_resumes.router import router as resumes_router
   app.include_router(resumes_router, prefix="/api/v1/candidate-resumes", tags=["Candidate Resumes"])
   ```

---

## 4. Independent Testing
```bash
pytest feature-modules/02-candidate-resumes/tests/
```
