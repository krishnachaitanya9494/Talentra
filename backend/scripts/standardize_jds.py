"""
Standardize Job Requirements in SQLite to match enterprise presentation.
"""

from backend.app.database.session import SessionLocal
from backend.app.models.job_requirement import JobRequirement

STANDARDIZED = {
    "JD-001": {
        "title": "Oracle EPM / Hyperion Planning Consultant",
        "department": "Engineering & Delivery",
        "location": "Hyderabad / Remote",
        "experience_level": "5 - 8 Years",
        "description": "Looking for an experienced Oracle EPM Consultant to implement, configure, and support Oracle Planning and Budgeting Cloud Service (PBCS) and on-premise Hyperion applications. The candidate will design complex calculation scripts, dimension hierarchies, and automated ETL workflows.",
    },
    "JD-002": {
        "title": "Siemens Teamcenter PLM Consultant / Engineer",
        "department": "PLM & Industrial Systems",
        "location": "Bangalore / Hybrid",
        "experience_level": "5 - 8 Years",
        "description": "Seeking a Siemens Teamcenter PLM specialist to manage enterprise CAD/BOM workflows, schema configuration, BMIDE extensions, and ITK customizations for global engineering operations.",
    },
    "JD-003": {
        "title": "PMO / Project Financial Management Consultant – SAP PS",
        "department": "Enterprise Applications",
        "location": "Pune / Hybrid",
        "experience_level": "6 - 10 Years",
        "description": "Lead enterprise project systems and financial controlling integration across SAP PS, WBS budgeting structures, revenue recognition, and cross-module costing lifecycles.",
    },
    "JD-004": {
        "title": "SAP CPI / Integration Suite & PI/PO Consultant",
        "department": "Cloud Integration & Middleware",
        "location": "Bangalore / Hybrid",
        "experience_level": "4 - 8 Years",
        "description": "Design and support modern B2B/A2A integrations on SAP Cloud Integration Suite (CPI) and on-premise SAP PI/PO with secure adapter architectures and Groovy scripting.",
    },
    "JD-005": {
        "title": "Java Production Support Engineer / Application Support Engineer",
        "department": "SRE & Core Banking Platforms",
        "location": "Chennai / Hybrid",
        "experience_level": "3 - 6 Years",
        "description": "Drive 24/7 mission-critical production stability, JVM diagnostics, Spring Boot microservices triage, Kafka event pipeline monitoring, and high-severity incident resolution.",
    },
    "JD-006": {
        "title": "SAP Security & GRC Consultant – S/4HANA / Fiori",
        "department": "Cybersecurity & Governance",
        "location": "Gurgaon / Hybrid",
        "experience_level": "5 - 9 Years",
        "description": "Architect role-based access governance, SOD analysis, Fiori catalog authorizations, and audit compliance protocols for global S/4HANA enterprise landscapes.",
    },
    "JD-007": {
        "title": "Oracle FCCS / HFM Consultant – Financial Consolidation",
        "department": "Corporate Financial Systems",
        "location": "Hyderabad / Hybrid",
        "experience_level": "5 - 8 Years",
        "description": "Deliver statutory financial consolidations, multi-currency translation matrices, intercompany eliminations, and ownership management across Oracle FCCS and Hyperion.",
    },
    "REQ-UP-0008": {
        "title": "Lead Cloud Architect (Enterprise)",
        "department": "Talent Operations",
        "location": "Bangalore / Hybrid",
        "experience_level": "8 - 12 Years",
        "description": "Lead multi-cloud enterprise architecture on AWS and Azure, driving zero-trust infrastructure, Kubernetes orchestration, and automated Terraform landing zones.",
    },
    "REQ-UP-0011": {
        "title": "Embedded Test Engineer",
        "department": "Hardware & Firmware Engineering",
        "location": "Bangalore / On-site",
        "experience_level": "4 - 7 Years",
        "description": "Execute firmware validation, HIL test benches, RTOS protocol testing, and microcontroller peripheral validation for automotive and industrial IoT hardware.",
    },
    "REQ-UP-0012": {
        "title": "Embedded Systems Engineer",
        "department": "Hardware & Firmware Engineering",
        "location": "Bangalore / On-site",
        "experience_level": "3 - 6 Years",
        "description": "Develop low-level C/C++ firmware, device drivers, I2C/SPI/CAN communications, and hardware abstraction layer components for embedded architectures.",
    },
}

def main():
    db = SessionLocal()
    jds = db.query(JobRequirement).all()
    for jd in jds:
        req = jd.req_code
        if req in STANDARDIZED:
            data = STANDARDIZED[req]
            jd.title = data["title"]
            jd.department = data["department"]
            jd.location = data["location"]
            jd.experience_level = data["experience_level"]
            jd.description = data["description"]
            print(f"Updated {req}: {jd.title}")
    db.commit()
    print("Database JobRequirements standardized successfully!")
    db.close()

if __name__ == "__main__":
    main()
