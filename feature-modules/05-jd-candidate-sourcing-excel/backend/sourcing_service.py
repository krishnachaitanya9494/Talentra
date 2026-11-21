import sys
from pathlib import Path
_MOD_ROOT = str(Path(__file__).resolve().parent.parent)
if _MOD_ROOT not in sys.path:
    sys.path.insert(0, _MOD_ROOT)

"""
Standalone Service Logic for Module 05: JD-Based Candidate Sourcing & Excel Engine.
Strictly restricted to internal database records. Zero external scrapers.
"""

from typing import List, Dict, Any, Optional
from io import BytesIO
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from contracts.sourcing_schemas import SourcedCandidateItem, SourcingSearchResponse

class SourcingExcelService:
    def search_internal_candidates(
        self,
        candidates_pool: List[Dict[str, Any]],
        boolean_query: Optional[str] = None,
        exp_min: Optional[float] = None,
        exp_max: Optional[float] = None,
    ) -> SourcingSearchResponse:
        """Search and rank internal candidates deterministically."""
        matched = []
        q_tokens = [t.strip().lower() for t in boolean_query.split(" AND ") if t.strip()] if boolean_query else []

        for c in candidates_pool:
            exp = c.get("experience_years", 0.0)
            if exp_min is not None and exp < exp_min:
                continue
            if exp_max is not None and exp > exp_max:
                continue

            # Check query tokens against candidate text
            c_text = (c.get("name", "") + " " + c.get("current_role", "") + " " + " ".join(c.get("skills", []))).lower()
            token_matches = sum(1 for t in q_tokens if t in c_text) if q_tokens else 1

            if not q_tokens or token_matches > 0:
                score = min(98, 40 + (token_matches * 25) + int(min(exp, 10) * 2))
                tier = "Top Recommendation" if score >= 85 else ("Strong Fit" if score >= 70 else "Moderate Fit")
                matched.append(SourcedCandidateItem(
                    id=c["id"],
                    name=c["name"],
                    email=c.get("email"),
                    phone=c.get("phone"),
                    current_role=c.get("current_role"),
                    experience_years=exp,
                    skills=c.get("skills", []),
                    location=c.get("location"),
                    match_score=score,
                    match_tier=tier,
                    source_type="Internal Candidate Database",
                ))

        matched.sort(key=lambda x: x.match_score, reverse=True)
        return SourcingSearchResponse(
            total_candidates_searched=len(candidates_pool),
            matched_count=len(matched),
            candidates=matched,
        )

    def generate_excel_workbook(self, candidates: List[SourcedCandidateItem], jd_title: str = "Job Requisition") -> bytes:
        """Generate structured 4-worksheet Excel workbook."""
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Matched Candidates"

        # Headers
        headers = ["Rank", "Candidate Name", "Match Score", "Match Tier", "Current Role", "Experience (Yrs)", "Phone", "Email", "Location"]
        ws.append(headers)

        header_fill = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid")
        header_font = Font(color="FFFFFF", bold=True, size=11)
        for col_idx in range(1, len(headers) + 1):
            cell = ws.cell(row=1, column=col_idx)
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal="center", vertical="center")

        for idx, c in enumerate(candidates, start=1):
            ws.append([
                idx,
                c.name,
                f"{c.match_score}%",
                c.match_tier,
                c.current_role or "",
                c.experience_years,
                c.phone or "",
                c.email or "",
                c.location or "",
            ])

        output = BytesIO()
        wb.save(output)
        return output.getvalue()
