"""
Sync existing files in data/jds and data/resumes into the document repository.
"""
from pathlib import Path
from backend.app.database.session import SessionLocal
from backend.app.services.document_storage import store_document

def sync_existing():
    db = SessionLocal()
    jds_dir = Path("data/jds")
    resumes_dir = Path("data/resumes")

    jd_synced = 0
    jd_dupes = 0
    jd_errors = 0

    if jds_dir.exists():
        for path in jds_dir.glob("*"):
            if path.is_file() and not path.name.startswith("."):
                try:
                    content = path.read_bytes()
                    doc, is_dup, _ = store_document(
                        content=content,
                        original_filename=path.name,
                        doc_type="jd",
                        db=db,
                    )
                    if is_dup:
                        jd_dupes += 1
                    else:
                        jd_synced += 1
                except Exception as e:
                    print(f"Error syncing JD {path.name}: {e}")
                    jd_errors += 1

    print(f"JDs - New: {jd_synced}, Duplicates: {jd_dupes}, Errors: {jd_errors}")

    res_synced = 0
    res_dupes = 0
    res_errors = 0

    if resumes_dir.exists():
        for path in resumes_dir.glob("*"):
            if path.is_file() and not path.name.startswith("."):
                try:
                    content = path.read_bytes()
                    doc, is_dup, _ = store_document(
                        content=content,
                        original_filename=path.name,
                        doc_type="resume",
                        db=db,
                    )
                    if is_dup:
                        res_dupes += 1
                    else:
                        res_synced += 1
                except Exception as e:
                    print(f"Error syncing Resume {path.name}: {e}")
                    res_errors += 1

    print(f"Resumes - New: {res_synced}, Duplicates: {res_dupes}, Errors: {res_errors}")
    db.close()

if __name__ == "__main__":
    sync_existing()
