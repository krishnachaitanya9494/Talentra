"""
Sourcing and Excel Automation API Router for TALENTRA.

Provides HTTP endpoints for:
- JD Parsing (file upload, direct paste, or repository JD selection)
- Internal Candidate Search & Deterministic 7-Dimension Matching
- Detailed Candidate Extraction & Provenance
- Enterprise Excel Workbook Generation (.xlsx)
- Export History & Secure Download
"""

import os
from pathlib import Path
from typing import Optional, List, Dict, Any
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    UploadFile,
    File,
    Form,
    status,
)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.models.sourcing import SourcingSearch, SourcingSearchResult, CandidateExport
from backend.app.services.sourcing.sourcing_service import SourcingService
from backend.app.services.sourcing.excel_export_service import ExcelExportService
from backend.app.services.extraction.pdf_extractor import extract_text_from_pdf
from backend.app.services.extraction.docx_extractor import extract_text_from_docx
from backend.app.services.extraction.txt_extractor import extract_text_from_txt

router = APIRouter(prefix="/api/v1/sourcing", tags=["Internal Sourcing & Excel Automation"])


@router.post("/parse-jd")
def parse_job_description(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
):
    """
    Parses a Job Description from raw text or repository selection via JSON payload.
    """
    try:
        jd_id = payload.get("existing_jd_id") or payload.get("jd_id")
        raw_text = payload.get("text")
        filename = payload.get("filename")

        parsed = SourcingService.parse_jd_input(
            db,
            text=raw_text,
            filename=filename,
            existing_jd_id=jd_id,
        )
        return {"status": "success", "requirements": parsed}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse Job Description: {str(e)}")


@router.post("/upload-jd")
async def upload_job_description_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Uploads and parses a Job Description file (PDF, DOCX, TXT).
    """
    try:
        filename = file.filename or "uploaded_jd.txt"
        ext = os.path.splitext(filename)[1].lower()
        content = await file.read()

        if ext == ".pdf":
            text = extract_text_from_pdf(content)
        elif ext == ".docx":
            text = extract_text_from_docx(content)
        else:
            text = extract_text_from_txt(content)

        parsed = SourcingService.parse_jd_input(db, text=text, filename=filename)
        return {"status": "success", "requirements": parsed}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload Job Description: {str(e)}")


@router.post("/search")
def run_internal_sourcing_search(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
):
    """
    Executes internal candidate search and matching across internal resumes, candidate profiles, and CRM records.
    """
    requirements = payload.get("requirements")
    if not requirements or not isinstance(requirements, dict):
        raise HTTPException(status_code=400, detail="Missing required 'requirements' object in payload.")

    filters = payload.get("filters", {})
    input_source = payload.get("input_source", "paste")

    try:
        results = SourcingService.run_sourcing_search(
            db=db,
            requirements=requirements,
            filters=filters,
            user_id=1,
            input_source=input_source,
        )
        return {"status": "success", "data": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sourcing search failed: {str(e)}")


@router.get("/search/{search_id}")
def get_sourcing_search(search_id: int, db: Session = Depends(get_db)):
    """
    Retrieves previous sourcing search results.
    """
    search = db.query(SourcingSearch).filter(SourcingSearch.id == search_id).first()
    if not search:
        raise HTTPException(status_code=404, detail="Sourcing search session not found.")

    results = (
        db.query(SourcingSearchResult)
        .filter(SourcingSearchResult.search_id == search_id)
        .order_by(SourcingSearchResult.rank.asc())
        .all()
    )

    candidates_data = []
    for r in results:
        c = r.candidate
        candidates_data.append({
            "rank": r.rank,
            "candidate_id": c.id,
            "candidate_code": c.candidate_code,
            "candidate_name": f"{c.first_name} {c.last_name or ''}".strip(),
            "email": c.email or "",
            "phone": c.phone or "",
            "current_designation": c.current_title or "Not Available",
            "current_company": c.current_company or "Not Available",
            "total_experience": float(c.total_experience_years) if c.total_experience_years is not None else 0.0,
            "location": c.location or "Not Specified",
            "technical_skills": c.skills or "",
            "match_score": r.match_score,
            "match_segment": r.match_segment,
            "matched_skills": r.matched_skills or "",
            "missing_skills": r.missing_skills or "",
            "experience_compatibility": r.experience_compatibility,
            "match_explanation": r.match_explanation,
            "has_critical_mismatch": r.has_critical_mismatch,
            "profile_completeness": r.profile_completeness_percent,
            "is_duplicate": r.is_duplicate,
            "duplicate_of_id": r.duplicate_of_id,
            "duplicate_reason": r.duplicate_reason,
            "source_type": getattr(c, "source_type", None) or "Resume Ingestion",
        })

    return {
        "status": "success",
        "data": {
            "search_id": search.id,
            "search_code": search.search_code,
            "jd_title": search.jd_title,
            "created_at": search.created_at.isoformat(),
            "summary": {
                "total_candidates_searched": search.total_candidates_searched,
                "total_candidates_found": search.total_matches_found,
                "strong_matches": search.strong_matches_count,
                "potential_matches": search.potential_matches_count,
                "partial_matches": search.partial_matches_count,
                "not_suitable": search.not_suitable_count,
                "duplicates_identified": search.duplicates_identified_count,
            },
            "candidates": candidates_data,
        },
    }


@router.get("/candidate/{candidate_id}")
def get_candidate_details(candidate_id: int, db: Session = Depends(get_db)):
    """
    Retrieves full extracted candidate details, employment history, and source resume reference.
    """
    try:
        cand_data = SourcingService.get_candidate_details(db, candidate_id)
        return {"status": "success", "candidate": cand_data}
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/export")
def generate_excel_export(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
):
    """
    Generates a professional 4-worksheet Excel workbook (.xlsx) using openpyxl.
    """
    search_id = payload.get("search_id")
    candidate_ids = payload.get("candidate_ids")
    custom_folder = payload.get("custom_folder_name")

    if not search_id:
        raise HTTPException(status_code=400, detail="Missing required 'search_id'.")

    try:
        export_info = ExcelExportService.generate_sourcing_workbook(
            db=db,
            search_id=search_id,
            candidate_ids=candidate_ids,
            custom_folder_name=custom_folder,
        )
        return {"status": "success", "export": export_info}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Excel generation failed: {str(e)}")


@router.get("/exports")
def list_exports(db: Session = Depends(get_db)):
    """
    Returns export audit history.
    """
    exports = ExcelExportService.get_export_history(db)
    return {"status": "success", "items": exports, "total": len(exports)}


@router.get("/exports/{export_id}/download")
def download_export_file(export_id: int, db: Session = Depends(get_db)):
    """
    Securely serves the generated Excel workbook (.xlsx).
    Guards against path traversal and ensures file exists.
    """
    exp = db.query(CandidateExport).filter(CandidateExport.id == export_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Export record not found.")

    file_path = Path(exp.file_path).resolve()
    base_dir = ExcelExportService.EXPORTS_BASE_DIR.resolve()

    # Prevent path traversal
    if not str(file_path).startswith(str(base_dir)):
        raise HTTPException(status_code=403, detail="Access to specified file path is forbidden.")

    if not file_path.is_file():
        raise HTTPException(status_code=404, detail="Export file does not exist on disk.")

    return FileResponse(
        path=str(file_path),
        filename=exp.export_filename,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


@router.delete("/exports/{export_id}")
def delete_export(export_id: int, db: Session = Depends(get_db)):
    """
    Deletes an export record and file without altering candidate or JD records.
    """
    exp = db.query(CandidateExport).filter(CandidateExport.id == export_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Export record not found.")

    # Remove file if exists
    try:
        p = Path(exp.file_path)
        if p.is_file():
            os.remove(p)
    except Exception:
        pass

    db.delete(exp)
    db.commit()
    return {"status": "success", "message": f"Export '{exp.export_code}' deleted."}


@router.post("/boolean-search")
def boolean_search_candidates(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
):
    """
    Executes a safe Boolean query against internal candidate profiles in SQLite.
    Syntax: AND, OR, NOT, parentheses e.g. '(DevOps OR SRE) AND Kubernetes AND Terraform'.
    Zero external scraping, zero fabricated records.
    """
    from backend.app.models.candidate import Candidate
    from backend.app.services.matching.boolean_search import parse_boolean_query, evaluate_candidate_boolean

    raw_query = payload.get("query", "").strip()
    exp_min = payload.get("experience_min")
    exp_max = payload.get("experience_max")
    location_filter = payload.get("location")
    limit = payload.get("limit", 50)

    if not raw_query:
        raise HTTPException(status_code=400, detail="Search query cannot be empty.")

    ast = parse_boolean_query(raw_query)
    if not ast:
        raise HTTPException(status_code=400, detail="Invalid Boolean query syntax. Ensure matching parentheses and valid terms.")

    q = db.query(Candidate)
    if exp_min is not None:
        try:
            q = q.filter(Candidate.total_experience_years >= float(exp_min))
        except ValueError:
            pass
    if exp_max is not None:
        try:
            q = q.filter(Candidate.total_experience_years <= float(exp_max))
        except ValueError:
            pass
    if location_filter:
        q = q.filter(Candidate.location.ilike(f"%{location_filter}%"))

    all_candidates = q.all()
    total_pool = len(all_candidates)

    matches = []
    for cand in all_candidates:
        cand_skills = [s.strip() for s in (cand.skills or "").split(",") if s.strip()]
        cand_dict = {
            "id": cand.id,
            "candidate_code": cand.candidate_code,
            "full_name": cand.full_name,
            "current_title": cand.current_title,
            "current_company": cand.current_company,
            "location": cand.location,
            "total_experience_years": cand.total_experience_years,
            "skills_list": cand_skills,
            "raw_text": f"{cand.current_title or ''} {cand.current_company or ''} {cand.skills or ''}",
        }
        is_match, matched_keywords, evidence = evaluate_candidate_boolean(cand_dict, ast)
        if is_match:
            matches.append({
                "id": cand.id,
                "candidate_code": cand.candidate_code,
                "full_name": cand.full_name,
                "current_title": cand.current_title,
                "current_company": cand.current_company,
                "total_experience_years": cand.total_experience_years,
                "location": cand.location,
                "skills_list": cand_skills,
                "matched_keywords": matched_keywords,
                "evidence_snippet": evidence,
                "status": cand.status or "active",
            })
            if len(matches) >= limit:
                break

    return {
        "status": "success",
        "query": raw_query,
        "total_internal_pool": total_pool,
        "matched_count": len(matches),
        "candidates": matches,
    }

