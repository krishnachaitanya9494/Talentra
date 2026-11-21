# MODULE 04 — Resume Data Extraction

> **Status**: Production-Ready, Completely Decoupled, Portable Feature Package.  
> **Source**: TALENTRA Incubation Repository (`feature-modules/04-resume-data-extraction/`).

---

## 1. Module Overview
This package delivers high-accuracy deterministic resume data extraction:
- Bulk document parsing (.pdf, .docx, .txt).
- High-precision extraction of Name, Email, Phone, Role, Total Experience, Skills, Education, Certifications.
- **Strict Data Accuracy Rule**: If a field is not explicitly present in the document, it remains empty (`""` or `None`). Zero fabrication, zero AI hallucinations.
- Field-level provenance tracing linking every extracted value to its original source snippet.
- Dynamic review table with manual correction support and 1-click Excel/CSV export.

---

## 2. Directory Layout
```
04-resume-data-extraction/
├── frontend/               # React components (ResumeExtractionModule, ProfileScraperPage, api.js)
├── backend/                # Standalone FastAPI router, service with regex extractors, and standalone_app.py
├── contracts/              # Pydantic schemas (schemas.py)
├── tests/                  # Independent pytest test suite (test_resume_extraction.py)
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
   cp -r feature-modules/04-resume-data-extraction/frontend src/features/resume-extraction
   ```
2. Mount in your layout:
   ```jsx
   import { ResumeExtractionModule } from './features/resume-extraction';

   <ResumeExtractionModule apiBaseUrl="/api/v1/scraper" />
   ```

### Backend Integration (FastAPI)
1. Copy `backend/` and `contracts/`:
   ```bash
   cp -r feature-modules/04-resume-data-extraction/backend app/modules/resume_extraction
   ```
2. Mount router:
   ```python
   from app.modules.resume_extraction.router import router as extraction_router
   app.include_router(extraction_router, prefix="/api/v1/scraper", tags=["Resume Extraction"])
   ```

---

## 4. Independent Testing
```bash
pytest feature-modules/04-resume-data-extraction/tests/
```
