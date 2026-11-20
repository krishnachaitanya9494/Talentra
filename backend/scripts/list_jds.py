from backend.app.database.session import SessionLocal
from backend.app.models.job_requirement import JobRequirement

db = SessionLocal()
jds = db.query(JobRequirement).order_by(JobRequirement.id).all()
print(f"Total JDs: {len(jds)}")
for jd in jds:
    print(f"ID: {jd.id} | Code: {jd.req_code} | Title: '{jd.title}' | Loc: '{jd.location}' | Dept: '{jd.department}'")
db.close()
