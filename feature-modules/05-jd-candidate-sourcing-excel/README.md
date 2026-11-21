# MODULE 05 — JD-Based Candidate Sourcing & Excel Engine

> **Status**: Production-Ready, Completely Decoupled, Portable Feature Package.  
> **Source**: TALENTRA Incubation Repository (`feature-modules/05-jd-candidate-sourcing-excel/`).

---

## 1. Module Overview
This package delivers automated candidate sourcing across internal repositories and export:
- Search internal candidate profiles and resumes via Boolean keywords (`AND`, `OR`, `NOT`).
- **Strict Sourcing Rule**: Internal sources only. Zero unauthorized external scrapers (no LinkedIn/Naukri scraping).
- Match ranking and scoring with contact info from authentic internal records.
- 4-worksheet Excel workbook generation using openpyxl (Matched Candidates, Candidate Details, Match Analysis, JD Requirements).
- Export history logging and direct workbook download.

---

## 2. Directory Layout
```
05-jd-candidate-sourcing-excel/
├── frontend/               # React components (SourcingExcelModule, SourcingPage, api.js)
├── backend/                # Standalone FastAPI router, service, Excel generation, and standalone_app.py
├── contracts/              # Pydantic schemas (schemas.py)
├── tests/                  # Independent pytest test suite (test_sourcing_excel.py)
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
   cp -r feature-modules/05-jd-candidate-sourcing-excel/frontend src/features/sourcing
   ```
2. Mount in your layout:
   ```jsx
   import { SourcingExcelModule } from './features/sourcing';

   <SourcingExcelModule apiBaseUrl="/api/v1/sourcing" />
   ```

### Backend Integration (FastAPI)
1. Copy `backend/` and `contracts/`:
   ```bash
   cp -r feature-modules/05-jd-candidate-sourcing-excel/backend app/modules/sourcing
   ```
2. Mount router:
   ```python
   from app.modules.sourcing.router import router as sourcing_router
   app.include_router(sourcing_router, prefix="/api/v1/sourcing", tags=["Sourcing & Excel"])
   ```

---

## 4. Independent Testing
```bash
pytest feature-modules/05-jd-candidate-sourcing-excel/tests/
```
