"""
Interview Timetable & Multi-Interviewer Scheduling API Router for TALENTRA.
Integrated with Module 06 (Advanced Interview Scheduling & Coordination System).
"""
import sys
import importlib.util
from pathlib import Path

_mod_dir = (Path(__file__).resolve().parents[3] / "feature-modules" / "06-interview-scheduling").resolve()
_router_path = _mod_dir / "backend" / "api" / "interview_router.py"

if str(_mod_dir) not in sys.path:
    sys.path.insert(0, str(_mod_dir))

_spec = importlib.util.spec_from_file_location("module_06_interview_router", str(_router_path))
_mod = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_mod)

router = _mod.router
get_db = getattr(_mod, "get_db", None)
