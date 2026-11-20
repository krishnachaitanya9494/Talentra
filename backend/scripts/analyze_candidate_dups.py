import re
from backend.app.database.session import SessionLocal
from backend.app.models.candidate import Candidate
from backend.app.models.candidate_intelligence import CandidateResumeLink
from collections import defaultdict

db = SessionLocal()
candidates = db.query(Candidate).order_by(Candidate.id).all()
print(f"Total candidates in DB: {len(candidates)}")

# Clean phone
def clean_phone(p):
    if not p:
        return ""
    digits = re.sub(r"\D", "", p)
    return digits[-10:] if len(digits) >= 10 else ""

# Clean name
def clean_name(c):
    full = f"{c.first_name} {c.last_name}".lower().strip()
    # remove common titles/junk
    full = re.sub(r"\b(mr|ms|mrs|dr|lead|engineer|architect|manager|senior|jr|sr|consultant|developer)\b", "", full)
    full = re.sub(r"\s+", " ", full).strip()
    return full

# Clean email
def clean_email(e):
    if not e:
        return ""
    e = e.strip().lower()
    # check if prefixed with candidate_\d+_ or profile_doc-res-...
    m = re.search(r"candidate_\d+_(.+@.+)", e)
    if m:
        return m.group(1)
    m2 = re.search(r"profile_doc-res-[0-9a-f]+@.+", e)
    if m2:
        return ""
    return e

phone_groups = defaultdict(list)
for c in candidates:
    p = clean_phone(c.phone)
    if p:
        phone_groups[p].append(c)

dup_phones = {k: v for k, v in phone_groups.items() if len(v) > 1}
print(f"Phone duplicate groups: {len(dup_phones)} (total duplicate candidates: {sum(len(v)-1 for v in dup_phones.values())})")

email_groups = defaultdict(list)
for c in candidates:
    ce = clean_email(c.email)
    if ce:
        email_groups[ce].append(c)

dup_emails = {k: v for k, v in email_groups.items() if len(v) > 1}
print(f"Email duplicate groups: {len(dup_emails)} (total duplicate candidates: {sum(len(v)-1 for v in dup_emails.values())})")

name_groups = defaultdict(list)
for c in candidates:
    cn = clean_name(c)
    if len(cn) > 3:
        name_groups[cn].append(c)

dup_names = {k: v for k, v in name_groups.items() if len(v) > 1}
print(f"Name duplicate groups: {len(dup_names)}")

# Show overlap
print("\nSample Duplicate Clusters:")
visited = set()
clusters = []
for p, group in dup_phones.items():
    ids = set(c.id for c in group)
    clusters.append(group)
    visited.update(ids)

for e, group in dup_emails.items():
    ids = set(c.id for c in group)
    if not ids.issubset(visited):
        clusters.append(group)
        visited.update(ids)

print(f"Total candidate duplicate clusters identified: {len(clusters)}")
for idx, cluster in enumerate(clusters[:8], 1):
    print(f"\nCluster {idx}:")
    for c in cluster:
        print(f"  ID: {c.id} | Code: {c.candidate_code} | Name: {c.first_name} {c.last_name} | Email: {c.email} | Phone: {c.phone} | Exp: {c.total_experience_years}")

db.close()
