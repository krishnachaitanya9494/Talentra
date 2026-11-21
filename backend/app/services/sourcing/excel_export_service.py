"""
Excel Generation Engine for TALENTRA JD-to-Candidate Sourcing.

Generates real, styled .xlsx workbooks using openpyxl with 4 comprehensive worksheets:
1. Matched Candidates: Ranked summary with contact, experience, skills, score, and segment.
2. Candidate Details: Detailed employment and education histories.
3. Match Analysis: 7-dimension scoring breakdown and human-readable evidence.
4. JD Requirements: Job requisition specifications and evaluation metadata.

Adheres strictly to the requested folder structure:
TALENTRA/exports/{JD_Title}/matched_candidates.xlsx
"""

import os
import re
import json
import uuid
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional

import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from sqlalchemy.orm import Session

from backend.app.models.sourcing import SourcingSearch, SourcingSearchResult, CandidateExport
from backend.app.models.candidate import Candidate
from backend.app.models.candidate_intelligence import (
    CandidateEmployer,
    CandidateEducation,
    CandidateResumeLink,
)


class ExcelExportService:
    """
    Engine to generate enterprise-grade recruitment Excel workbooks.
    """

    # Base export directory relative to project root
    WORKSPACE_ROOT = Path(__file__).resolve().parent.parent.parent.parent.parent
    EXPORTS_BASE_DIR = WORKSPACE_ROOT / "exports"

    # Color palette
    NAVY_HEADER = "0F172A"
    EMERALD_ACCENT = "059669"
    WHITE = "FFFFFF"
    BORDER_COLOR = "CBD5E1"
    ZEBRA_ROW = "F8FAFC"

    # Segment color fills
    SEGMENT_COLORS = {
        "Strong Match": {"fill": "D1FAE5", "font": "065F46"},     # Emerald
        "Potential Match": {"fill": "DBEAFE", "font": "1E40AF"},  # Blue
        "Partial Match": {"fill": "FEF3C7", "font": "92400E"},    # Amber
        "Not Suitable": {"fill": "FFE4E6", "font": "9F1239"},     # Rose
    }

    @classmethod
    def sanitize_folder_name(cls, name: str) -> str:
        """
        Transforms JD titles into clean, safe directory names.
        e.g. 'Senior Java / AWS Developer (Remote)' -> 'Senior_Java_AWS_Developer_Remote'
        """
        clean = re.sub(r"[^\w\s-]", "", name).strip()
        clean = re.sub(r"[-\s]+", "_", clean)
        return clean[:60] if clean else "Requisition_Export"

    @classmethod
    def generate_sourcing_workbook(
        cls,
        db: Session,
        search_id: int,
        candidate_ids: Optional[List[int]] = None,
        user_id: Optional[int] = None,
        custom_folder_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generates the 4-worksheet matched_candidates.xlsx workbook and stores audit history.
        """
        search = db.query(SourcingSearch).filter(SourcingSearch.id == search_id).first()
        if not search:
            raise ValueError(f"Sourcing search #{search_id} not found.")

        # Query search results
        query = db.query(SourcingSearchResult).filter(
            SourcingSearchResult.search_id == search_id
        )
        if candidate_ids:
            query = query.filter(SourcingSearchResult.candidate_id.in_(candidate_ids))

        results: List[SourcingSearchResult] = query.order_by(SourcingSearchResult.rank.asc()).all()
        if not results:
            raise ValueError("No matching candidates selected for export.")

        # Create target export directory
        folder_slug = custom_folder_name or cls.sanitize_folder_name(search.jd_title)
        export_folder = cls.EXPORTS_BASE_DIR / folder_slug
        os.makedirs(export_folder, exist_ok=True)

        # Unique or standard filename
        timestamp_str = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        export_filename = "matched_candidates.xlsx"
        target_path = export_folder / export_filename

        # If already exists, generate timestamped version to avoid data destruction
        if target_path.exists():
            export_filename = f"matched_candidates_{timestamp_str}.xlsx"
            target_path = export_folder / export_filename

        # Initialize OpenPyXL Workbook
        wb = openpyxl.Workbook()

        # Styles
        header_font = Font(name="Calibri", size=11, bold=True, color=cls.WHITE)
        header_fill = PatternFill(start_color=cls.NAVY_HEADER, end_color=cls.NAVY_HEADER, fill_type="solid")
        title_font = Font(name="Calibri", size=13, bold=True, color=cls.WHITE)
        title_fill = PatternFill(start_color=cls.EMERALD_ACCENT, end_color=cls.EMERALD_ACCENT, fill_type="solid")
        regular_font = Font(name="Calibri", size=10)
        bold_font = Font(name="Calibri", size=10, bold=True)
        thin_border = Border(
            left=Side(style="thin", color=cls.BORDER_COLOR),
            right=Side(style="thin", color=cls.BORDER_COLOR),
            top=Side(style="thin", color=cls.BORDER_COLOR),
            bottom=Side(style="thin", color=cls.BORDER_COLOR),
        )

        # ==========================================
        # SHEET 1: Matched Candidates
        # ==========================================
        ws1 = wb.active
        ws1.title = "Matched Candidates"

        sheet1_headers = [
            "Rank",
            "Candidate ID",
            "Candidate Name",
            "Email",
            "Phone Number",
            "Current Designation",
            "Current Company",
            "Total Exp (Yrs)",
            "Location",
            "Technical Skills",
            "Primary Education",
            "Certifications",
            "Match Score",
            "Match Segment",
            "Matched Skills",
            "Missing Skills",
            "Source Type",
            "Resume Filename",
            "Completeness %",
        ]
        ws1.append(sheet1_headers)

        for row_idx, r in enumerate(results, start=2):
            c = r.candidate
            # Check resume link
            rlink = db.query(CandidateResumeLink).filter(CandidateResumeLink.candidate_id == c.id).first()
            res_doc = getattr(rlink, "resume_document", None) if rlink else None
            resume_file = res_doc.original_filename if res_doc else (getattr(c, "resume_url", "").split("/")[-1].split("\\")[-1] or "CRM Profile")

            row_data = [
                r.rank,
                c.candidate_code or f"CAND-{c.id:04d}",
                f"{c.first_name} {c.last_name or ''}".strip(),
                c.email or "Not Available",
                c.phone or "Not Available",
                c.current_title or "Not Available",
                c.current_company or "Not Available",
                float(c.total_experience_years) if c.total_experience_years is not None else 0.0,
                c.location or "Not Specified",
                c.skills or "",
                getattr(c, "primary_education", None) or "Not Available",
                getattr(c, "certifications", None) or "None",
                round(r.match_score, 1),
                r.match_segment,
                r.matched_skills or "None",
                r.missing_skills or "None",
                getattr(c, "source_type", None) or "Resume Ingestion",
                resume_file,
                f"{r.profile_completeness_percent}%",
            ]
            ws1.append(row_data)

            # Style row cells
            is_zebra = (row_idx % 2 == 0)
            row_fill = PatternFill(start_color=cls.ZEBRA_ROW, end_color=cls.ZEBRA_ROW, fill_type="solid") if is_zebra else None

            for col_idx in range(1, len(sheet1_headers) + 1):
                cell = ws1.cell(row=row_idx, column=col_idx)
                cell.font = regular_font
                cell.border = thin_border
                if row_fill:
                    cell.fill = row_fill

                # Hyperlink for email
                if col_idx == 4 and c.email:
                    cell.hyperlink = f"mailto:{c.email}"
                    cell.font = Font(name="Calibri", size=10, color="0000EE", underline="single")

                # Segment Badge Styling
                if col_idx == 14:  # Match Segment
                    seg = r.match_segment
                    if seg in cls.SEGMENT_COLORS:
                        cell.fill = PatternFill(
                            start_color=cls.SEGMENT_COLORS[seg]["fill"],
                            end_color=cls.SEGMENT_COLORS[seg]["fill"],
                            fill_type="solid",
                        )
                        cell.font = Font(
                            name="Calibri",
                            size=10,
                            bold=True,
                            color=cls.SEGMENT_COLORS[seg]["font"],
                        )
                        cell.alignment = Alignment(horizontal="center")

                # Score styling
                if col_idx == 13:
                    cell.font = bold_font
                    cell.alignment = Alignment(horizontal="right")

        # ==========================================
        # SHEET 2: Candidate Details
        # ==========================================
        ws2 = wb.create_sheet(title="Candidate Details")
        sheet2_headers = [
            "Candidate ID",
            "Full Name",
            "Email",
            "Phone Number",
            "Current Company & Role",
            "Employment History",
            "Education Qualifications",
            "Certifications",
            "Technical Skills",
            "Location",
            "Source Reference",
        ]
        ws2.append(sheet2_headers)

        for row_idx, r in enumerate(results, start=2):
            c = r.candidate
            # Employment history
            employers = db.query(CandidateEmployer).filter(
                CandidateEmployer.candidate_id == c.id
            ).order_by(CandidateEmployer.is_current.desc(), CandidateEmployer.end_date.desc()).all()

            emp_str = "; ".join([
                f"{e.company_name} ({e.job_title or 'Role'}) [{e.start_date or ''} - {e.end_date or ('Present' if e.is_current else '')}]"
                for e in employers
            ]) if employers else "Not Detailed"

            # Education
            educations = db.query(CandidateEducation).filter(
                CandidateEducation.candidate_id == c.id
            ).all()
            edu_str = "; ".join([
                f"{ed.degree or 'Degree'} from {ed.institution or 'University'} ({ed.graduation_year or 'N/A'})"
                for ed in educations
            ]) if educations else (getattr(c, "primary_education", None) or "Not Available")

            rlink = db.query(CandidateResumeLink).filter(CandidateResumeLink.candidate_id == c.id).first()
            res_doc = getattr(rlink, "resume_document", None) if rlink else None
            resume_ref = res_doc.original_filename if res_doc else (getattr(c, "source_type", None) or "CRM Database")

            row_data = [
                c.candidate_code or f"CAND-{c.id:04d}",
                f"{c.first_name} {c.last_name or ''}".strip(),
                c.email or "Not Available",
                c.phone or "Not Available",
                f"{c.current_title or 'Specialist'} at {c.current_company or 'Independent'}",
                emp_str,
                edu_str,
                getattr(c, "certifications", None) or "None",
                c.skills or "",
                c.location or "Not Specified",
                resume_ref,
            ]
            ws2.append(row_data)

            for col_idx in range(1, len(sheet2_headers) + 1):
                cell = ws2.cell(row=row_idx, column=col_idx)
                cell.font = regular_font
                cell.border = thin_border
                if col_idx in [6, 7, 9]:
                    cell.alignment = Alignment(wrap_text=True)

        # ==========================================
        # SHEET 3: Match Analysis
        # ==========================================
        ws3 = wb.create_sheet(title="Match Analysis")
        sheet3_headers = [
            "Rank",
            "Candidate ID",
            "Candidate Name",
            "Match Score",
            "Match Segment",
            "Required Skills Evidence",
            "Preferred Skills Evidence",
            "Experience Compatibility",
            "Role Relevance Evidence",
            "Qualification Evidence",
            "Location Compatibility",
            "Critical Mismatch Status",
            "Overall Match Summary",
        ]
        ws3.append(sheet3_headers)

        for row_idx, r in enumerate(results, start=2):
            c = r.candidate
            evidence_list = json.loads(r.evidence_json) if r.evidence_json else []

            ev_map = {e.get("dimension"): e.get("evidence_text", "") for e in evidence_list}

            row_data = [
                r.rank,
                c.candidate_code or f"CAND-{c.id:04d}",
                f"{c.first_name} {c.last_name or ''}".strip(),
                round(r.match_score, 1),
                r.match_segment,
                ev_map.get("Required Skills", r.match_explanation or ""),
                ev_map.get("Preferred Skills", "N/A"),
                ev_map.get("Experience", r.experience_compatibility or ""),
                ev_map.get("Role Relevance", "N/A"),
                ev_map.get("Qualifications", "N/A"),
                ev_map.get("Location", "N/A"),
                "CRITICAL MISMATCH" if r.has_critical_mismatch else "PASSED",
                r.match_explanation or "Matched profile criteria",
            ]
            ws3.append(row_data)

            for col_idx in range(1, len(sheet3_headers) + 1):
                cell = ws3.cell(row=row_idx, column=col_idx)
                cell.font = regular_font
                cell.border = thin_border
                if col_idx in [6, 7, 8, 13]:
                    cell.alignment = Alignment(wrap_text=True)
                if col_idx == 12:
                    if r.has_critical_mismatch:
                        cell.font = Font(name="Calibri", size=10, bold=True, color="991B1B")
                        cell.fill = PatternFill(start_color="FEE2E2", end_color="FEE2E2", fill_type="solid")
                    else:
                        cell.font = Font(name="Calibri", size=10, bold=True, color="065F46")
                        cell.fill = PatternFill(start_color="D1FAE5", end_color="D1FAE5", fill_type="solid")
                    cell.alignment = Alignment(horizontal="center")

        # ==========================================
        # SHEET 4: JD Requirements
        # ==========================================
        ws4 = wb.create_sheet(title="JD Requirements")
        req_json = json.loads(search.parsed_requirements_json) if search.parsed_requirements_json else {}

        meta_rows = [
            ("JOB REQUISITION METADATA", ""),
            ("Target Job Title", req_json.get("job_title", search.jd_title)),
            ("Required Technical Skills", req_json.get("required_skills", "Not Specified")),
            ("Preferred Bonus Skills", req_json.get("preferred_skills", "Not Specified")),
            ("Minimum Experience", f"{req_json.get('min_experience', 0)} years"),
            ("Maximum Experience", f"{req_json.get('max_experience', 15)} years"),
            ("Required Educational Qualifications", req_json.get("qualifications", "Open / Any Degree")),
            ("Certifications Required", req_json.get("certifications", "Not Specified")),
            ("Target Job Location", req_json.get("location", "Open / Multiple")),
            ("Employment Mode", req_json.get("employment_type", "Full-time")),
            ("Mandatory Requirements", req_json.get("mandatory_requirements", "Standard profile match")),
            ("", ""),
            ("SOURCING SEARCH METRICS", ""),
            ("Search Reference ID", search.search_code),
            ("Search Executed Date (UTC)", search.created_at.strftime("%Y-%m-%d %H:%M:%S")),
            ("Total Internal Candidates Evaluated", search.total_candidates_searched),
            ("Total Matching Candidates", search.total_matches_found),
            ("Strong Match Candidates", search.strong_matches_count),
            ("Potential Match Candidates", search.potential_matches_count),
            ("Partial Match Candidates", search.partial_matches_count),
            ("Not Suitable Candidates", search.not_suitable_count),
            ("Duplicate Records Identified", search.duplicates_identified_count),
            ("Candidates in this Export", len(results)),
        ]

        for r_idx, (k, v) in enumerate(meta_rows, start=1):
            ws4.append([k, v])
            c1 = ws4.cell(row=r_idx, column=1)
            c2 = ws4.cell(row=r_idx, column=2)

            if "METADATA" in k or "METRICS" in k:
                c1.font = title_font
                c1.fill = title_fill
                c2.fill = title_fill
            else:
                c1.font = bold_font
                c1.border = thin_border
                c2.font = regular_font
                c2.border = thin_border

        # ==========================================
        # FORMATTING ALL SHEETS: Headers, Widths, Auto-Filter
        # ==========================================
        for sheet in [ws1, ws2, ws3]:
            # Style header row
            sheet.row_dimensions[1].height = 28
            for col_idx in range(1, sheet.max_column + 1):
                h_cell = sheet.cell(row=1, column=col_idx)
                h_cell.font = header_font
                h_cell.fill = header_fill
                h_cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
                h_cell.border = thin_border

            # Freeze top header row
            sheet.freeze_panes = "A2"

            # Auto filter
            sheet.auto_filter.ref = sheet.dimensions

            # Auto calculate column widths
            for col in sheet.columns:
                col_letter = get_column_letter(col[0].column)
                max_len = 0
                for cell in col:
                    val_str = str(cell.value or "")
                    if cell.row == 1:
                        max_len = max(max_len, len(val_str) + 4)
                    else:
                        first_line = val_str.split("\n")[0]
                        max_len = max(max_len, len(first_line))
                adjusted_width = min(max(max_len + 3, 12), 48)
                sheet.column_dimensions[col_letter].width = adjusted_width

        # Column widths for Sheet 4 (JD Requirements)
        ws4.column_dimensions["A"].width = 36
        ws4.column_dimensions["B"].width = 65

        # Save Workbook to disk
        wb.save(str(target_path))
        file_size = os.path.getsize(str(target_path))

        # Record in CandidateExport table
        unique_suffix = uuid.uuid4().hex[:6].upper()
        export_rec = CandidateExport(
            export_code=f"EXP-{timestamp_str}-{unique_suffix}",
            search_id=search.id,
            jd_id=search.jd_id,
            jd_title=search.jd_title,
            export_filename=export_filename,
            export_folder=str(export_folder),
            file_path=str(target_path),
            file_size_bytes=file_size,
            total_candidates_exported=len(results),
            selected_segments="Selected Candidates" if candidate_ids else "All Matches",
            created_by_user_id=user_id or 1,
            status="completed",
        )
        db.add(export_rec)
        db.commit()
        db.refresh(export_rec)

        return {
            "export_id": export_rec.id,
            "export_code": export_rec.export_code,
            "filename": export_filename,
            "folder": str(export_folder),
            "file_path": str(target_path),
            "file_size_bytes": file_size,
            "total_candidates": len(results),
            "created_at": export_rec.created_at.isoformat(),
        }

    @classmethod
    def get_export_history(cls, db: Session) -> List[Dict[str, Any]]:
        """
        Retrieves all past generated exports.
        """
        exports = db.query(CandidateExport).order_by(CandidateExport.created_at.desc()).all()
        return [
            {
                "id": exp.id,
                "export_code": exp.export_code,
                "search_id": exp.search_id,
                "jd_id": exp.jd_id,
                "jd_title": exp.jd_title,
                "filename": exp.export_filename,
                "folder": exp.export_folder,
                "file_path": exp.file_path,
                "file_size_bytes": exp.file_size_bytes,
                "total_candidates": exp.total_candidates_exported,
                "selected_segments": exp.selected_segments,
                "created_at": exp.created_at.isoformat(),
                "status": exp.status,
            }
            for exp in exports
        ]
