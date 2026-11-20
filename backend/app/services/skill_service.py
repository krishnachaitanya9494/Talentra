"""
Conventional Skill Management & Classification Engine for TALENTRA.

Deterministic rule-based skill normalization, alias resolution, and categorization.
NO AI / NO LLMS - pure dictionary-based exact matching and taxonomy trees.
"""

import re
from typing import Dict, List, Any, Optional, Tuple, Set

# 11 Canonical Skill Categories
SKILL_CATEGORIES = [
    "Programming Languages",
    "Frameworks",
    "Databases",
    "Cloud Platforms",
    "DevOps",
    "Testing and Automation",
    "Data Engineering",
    "AI/ML Technologies",
    "Enterprise Applications",
    "Domain-Specific Skills",
    "Soft Skills",
]

# Aliases to Canonical Name mapping
SKILL_ALIASES: Dict[str, str] = {
    # Programming Languages
    "js": "JavaScript",
    "javascript": "JavaScript",
    "ts": "TypeScript",
    "typescript": "TypeScript",
    "py": "Python",
    "python": "Python",
    "java": "Java",
    "c++": "C++",
    "cpp": "C++",
    "c#": "C#",
    "csharp": "C#",
    "c": "C",
    "golang": "Go",
    "go": "Go",
    "rust": "Rust",
    "ruby": "Ruby",
    "php": "PHP",
    "sql": "SQL",
    "pl/sql": "PL/SQL",
    "plsql": "PL/SQL",
    "t-sql": "T-SQL",
    "bash": "Bash / Shell",
    "shell": "Bash / Shell",
    "powershell": "PowerShell",
    "groovy": "Groovy",

    # Frameworks
    "react": "React",
    "reactjs": "React",
    "react js": "React",
    "nextjs": "Next.js",
    "next.js": "Next.js",
    "angular": "Angular",
    "angularjs": "Angular",
    "vue": "Vue.js",
    "vuejs": "Vue.js",
    "nodejs": "Node.js",
    "node.js": "Node.js",
    "node": "Node.js",
    "spring": "Spring Boot",
    "springboot": "Spring Boot",
    "spring boot": "Spring Boot",
    "django": "Django",
    "fastapi": "FastAPI",
    "flask": "Flask",
    "express": "Express.js",
    "expressjs": "Express.js",
    ".net": ".NET Core",
    "dotnet": ".NET Core",
    ".net core": ".NET Core",

    # Databases
    "postgres": "PostgreSQL",
    "postgresql": "PostgreSQL",
    "mysql": "MySQL",
    "oracle db": "Oracle Database",
    "oracle database": "Oracle Database",
    "mssql": "SQL Server",
    "sql server": "SQL Server",
    "mongo": "MongoDB",
    "mongodb": "MongoDB",
    "redis": "Redis",
    "cassandra": "Apache Cassandra",
    "elastic": "Elasticsearch",
    "elasticsearch": "Elasticsearch",
    "dynamodb": "Amazon DynamoDB",
    "dynamo": "Amazon DynamoDB",
    "snowflake": "Snowflake",

    # Cloud Platforms
    "aws": "AWS",
    "amazon web services": "AWS",
    "azure": "Microsoft Azure",
    "ms azure": "Microsoft Azure",
    "gcp": "Google Cloud Platform (GCP)",
    "google cloud": "Google Cloud Platform (GCP)",
    "oci": "Oracle Cloud Infrastructure (OCI)",
    "oracle cloud": "Oracle Cloud Infrastructure (OCI)",

    # DevOps
    "docker": "Docker",
    "k8s": "Kubernetes",
    "kubernetes": "Kubernetes",
    "terraform": "Terraform",
    "ansible": "Ansible",
    "jenkins": "Jenkins",
    "git": "Git",
    "github actions": "GitHub Actions",
    "gitlab ci": "GitLab CI/CD",
    "ci/cd": "CI/CD Pipelines",
    "cicd": "CI/CD Pipelines",
    "helm": "Helm",
    "prometheus": "Prometheus",
    "grafana": "Grafana",

    # Testing & Automation
    "selenium": "Selenium",
    "cypress": "Cypress",
    "playwright": "Playwright",
    "junit": "JUnit",
    "pytest": "PyTest",
    "testng": "TestNG",
    "postman": "Postman",
    "jmeter": "Apache JMeter",
    "cucumber": "Cucumber",

    # Data Engineering
    "spark": "Apache Spark",
    "apache spark": "Apache Spark",
    "kafka": "Apache Kafka",
    "apache kafka": "Apache Kafka",
    "airflow": "Apache Airflow",
    "hadoop": "Apache Hadoop",
    "dbt": "dbt",
    "databricks": "Databricks",
    "flink": "Apache Flink",

    # AI/ML Technologies (conventional technical keywords)
    "scikit-learn": "Scikit-Learn",
    "sklearn": "Scikit-Learn",
    "tensorflow": "TensorFlow",
    "pytorch": "PyTorch",
    "pandas": "Pandas",
    "numpy": "NumPy",
    "keras": "Keras",
    "opencv": "OpenCV",
    "nlp": "Natural Language Processing (NLP)",

    # Enterprise Applications
    "pbcs": "Oracle PBCS / EPM Cloud",
    "epm cloud": "Oracle PBCS / EPM Cloud",
    "oracle epm": "Oracle EPM / Hyperion",
    "hyperion": "Oracle EPM / Hyperion",
    "essbase": "Oracle Essbase",
    "fdmee": "FDMEE / Data Management",
    "data management": "FDMEE / Data Management",
    "fccs": "Oracle FCCS",
    "hfm": "Hyperion Financial Management (HFM)",
    "teamcenter": "Siemens Teamcenter PLM",
    "siemens teamcenter": "Siemens Teamcenter PLM",
    "bmide": "Teamcenter BMIDE",
    "itk": "Teamcenter ITK",
    "sap ps": "SAP Project Systems (PS)",
    "sap cpi": "SAP Cloud Platform Integration (CPI)",
    "sap pi/po": "SAP PI/PO",
    "sap s/4hana": "SAP S/4HANA",
    "s/4hana": "SAP S/4HANA",
    "sap fiori": "SAP Fiori",
    "fiori": "SAP Fiori",
    "sap grc": "SAP GRC / Security",
    "grc": "SAP GRC / Security",
    "calc manager": "Calculation Manager",
    "epm automate": "EPM Automate",
    "lcm": "Oracle LCM (Lifecycle Management)",
    "smart view": "Oracle Smart View",

    # Domain-Specific Skills
    "financial consolidation": "Financial Consolidation",
    "cad integration": "CAD / BOM Integration",
    "wbs costing": "WBS Budgeting & Costing",
    "sod analysis": "Segregation of Duties (SOD)",
    "rtos": "RTOS (Real-Time OS)",
    "firmware": "Embedded Firmware Development",
    "i2c": "I2C / SPI / CAN Bus",
    "spi": "I2C / SPI / CAN Bus",
    "can bus": "I2C / SPI / CAN Bus",
    "microcontrollers": "Microcontrollers (ARM/STM32)",

    # Soft Skills
    "stakeholder management": "Stakeholder Management",
    "technical leadership": "Technical Leadership",
    "agile": "Agile / Scrum",
    "scrum": "Agile / Scrum",
    "communication": "Executive Communication",
    "problem solving": "Analytical Problem Solving",
    "mentoring": "Team Mentoring",
}

# Categorization rules based on canonical name
CANONICAL_CATEGORY_MAP: Dict[str, str] = {
    # Programming Languages
    "JavaScript": "Programming Languages",
    "TypeScript": "Programming Languages",
    "Python": "Programming Languages",
    "Java": "Programming Languages",
    "C++": "Programming Languages",
    "C#": "Programming Languages",
    "C": "Programming Languages",
    "Go": "Programming Languages",
    "Rust": "Programming Languages",
    "Ruby": "Programming Languages",
    "PHP": "Programming Languages",
    "SQL": "Programming Languages",
    "PL/SQL": "Programming Languages",
    "T-SQL": "Programming Languages",
    "Bash / Shell": "Programming Languages",
    "PowerShell": "Programming Languages",
    "Groovy": "Programming Languages",

    # Frameworks
    "React": "Frameworks",
    "Next.js": "Frameworks",
    "Angular": "Frameworks",
    "Vue.js": "Frameworks",
    "Node.js": "Frameworks",
    "Spring Boot": "Frameworks",
    "Django": "Frameworks",
    "FastAPI": "Frameworks",
    "Flask": "Frameworks",
    "Express.js": "Frameworks",
    ".NET Core": "Frameworks",

    # Databases
    "PostgreSQL": "Databases",
    "MySQL": "Databases",
    "Oracle Database": "Databases",
    "SQL Server": "Databases",
    "MongoDB": "Databases",
    "Redis": "Databases",
    "Apache Cassandra": "Databases",
    "Elasticsearch": "Databases",
    "Amazon DynamoDB": "Databases",
    "Snowflake": "Databases",

    # Cloud Platforms
    "AWS": "Cloud Platforms",
    "Microsoft Azure": "Cloud Platforms",
    "Google Cloud Platform (GCP)": "Cloud Platforms",
    "Oracle Cloud Infrastructure (OCI)": "Cloud Platforms",

    # DevOps
    "Docker": "DevOps",
    "Kubernetes": "DevOps",
    "Terraform": "DevOps",
    "Ansible": "DevOps",
    "Jenkins": "DevOps",
    "Git": "DevOps",
    "GitHub Actions": "DevOps",
    "GitLab CI/CD": "DevOps",
    "CI/CD Pipelines": "DevOps",
    "Helm": "DevOps",
    "Prometheus": "DevOps",
    "Grafana": "DevOps",

    # Testing & Automation
    "Selenium": "Testing and Automation",
    "Cypress": "Testing and Automation",
    "Playwright": "Testing and Automation",
    "JUnit": "Testing and Automation",
    "PyTest": "Testing and Automation",
    "TestNG": "Testing and Automation",
    "Postman": "Testing and Automation",
    "Apache JMeter": "Testing and Automation",
    "Cucumber": "Testing and Automation",

    # Data Engineering
    "Apache Spark": "Data Engineering",
    "Apache Kafka": "Data Engineering",
    "Apache Airflow": "Data Engineering",
    "Apache Hadoop": "Data Engineering",
    "dbt": "Data Engineering",
    "Databricks": "Data Engineering",
    "Apache Flink": "Data Engineering",

    # AI/ML Technologies
    "Scikit-Learn": "AI/ML Technologies",
    "TensorFlow": "AI/ML Technologies",
    "PyTorch": "AI/ML Technologies",
    "Pandas": "AI/ML Technologies",
    "NumPy": "AI/ML Technologies",
    "Keras": "AI/ML Technologies",
    "OpenCV": "AI/ML Technologies",
    "Natural Language Processing (NLP)": "AI/ML Technologies",

    # Enterprise Applications
    "Oracle PBCS / EPM Cloud": "Enterprise Applications",
    "Oracle EPM / Hyperion": "Enterprise Applications",
    "Oracle Essbase": "Enterprise Applications",
    "FDMEE / Data Management": "Enterprise Applications",
    "Oracle FCCS": "Enterprise Applications",
    "Hyperion Financial Management (HFM)": "Enterprise Applications",
    "Siemens Teamcenter PLM": "Enterprise Applications",
    "Teamcenter BMIDE": "Enterprise Applications",
    "Teamcenter ITK": "Enterprise Applications",
    "SAP Project Systems (PS)": "Enterprise Applications",
    "SAP Cloud Platform Integration (CPI)": "Enterprise Applications",
    "SAP PI/PO": "Enterprise Applications",
    "SAP S/4HANA": "Enterprise Applications",
    "SAP Fiori": "Enterprise Applications",
    "SAP GRC / Security": "Enterprise Applications",
    "Calculation Manager": "Enterprise Applications",
    "EPM Automate": "Enterprise Applications",
    "Oracle LCM (Lifecycle Management)": "Enterprise Applications",
    "Oracle Smart View": "Enterprise Applications",

    # Domain-Specific Skills
    "Financial Consolidation": "Domain-Specific Skills",
    "CAD / BOM Integration": "Domain-Specific Skills",
    "WBS Budgeting & Costing": "Domain-Specific Skills",
    "Segregation of Duties (SOD)": "Domain-Specific Skills",
    "RTOS (Real-Time OS)": "Domain-Specific Skills",
    "Embedded Firmware Development": "Domain-Specific Skills",
    "I2C / SPI / CAN Bus": "Domain-Specific Skills",
    "Microcontrollers (ARM/STM32)": "Domain-Specific Skills",

    # Soft Skills
    "Stakeholder Management": "Soft Skills",
    "Technical Leadership": "Soft Skills",
    "Agile / Scrum": "Soft Skills",
    "Executive Communication": "Soft Skills",
    "Analytical Problem Solving": "Soft Skills",
    "Team Mentoring": "Soft Skills",
}


class SkillClassificationService:
    """
    Deterministic rule-based skill normalization and classification.
    """

    @classmethod
    def normalize_skill(cls, raw_skill: str) -> Dict[str, Any]:
        """
        Takes raw string representation of a skill, performs deterministic alias resolution,
        canonical mapping, and returns structured classification metadata.
        """
        cleaned = raw_skill.strip()
        lower_key = cleaned.lower()

        # Direct alias dictionary lookup
        canonical = SKILL_ALIASES.get(lower_key)
        alias_matched = bool(canonical and canonical.lower() != lower_key)

        if not canonical:
            # Case-preserving title format for uncataloged skills
            canonical = cleaned.title()
            category = "Domain-Specific Skills"
        else:
            category = CANONICAL_CATEGORY_MAP.get(canonical, "Domain-Specific Skills")

        return {
            "raw_name": raw_skill,
            "canonical_name": canonical,
            "category": category,
            "is_alias": alias_matched,
            "normalized": canonical != raw_skill,
        }

    @classmethod
    def process_jd_skills(
        cls,
        required_skills_text: str,
        preferred_skills_text: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Parses, deduplicates, normalizes, and groups JD skills into mandatory vs preferred
        and categorizes them across the 11 enterprise taxonomy categories.
        """
        raw_mandatory = [s.strip() for s in re.split(r"[,;\n•\|/]+", str(required_skills_text or "")) if s.strip()]
        raw_preferred = [s.strip() for s in re.split(r"[,;\n•\|/]+", str(preferred_skills_text or "")) if s.strip()]

        seen_canonical: Set[str] = set()
        duplicates_detected: List[str] = []
        mandatory_list: List[Dict[str, Any]] = []
        preferred_list: List[Dict[str, Any]] = []
        categorized: Dict[str, List[Dict[str, Any]]] = {cat: [] for cat in SKILL_CATEGORIES}

        # Process Mandatory Skills
        for raw in raw_mandatory:
            norm = cls.normalize_skill(raw)
            c_name = norm["canonical_name"]
            if c_name in seen_canonical:
                duplicates_detected.append(c_name)
                continue
            seen_canonical.add(c_name)

            item = {
                "id": f"sk-{len(seen_canonical)}",
                "name": c_name,
                "raw": raw,
                "category": norm["category"],
                "type": "mandatory",
                "priority": "High" if len(mandatory_list) < 3 else "Medium",
                "is_alias": norm["is_alias"],
            }
            mandatory_list.append(item)
            categorized[norm["category"]].append(item)

        # Process Preferred Skills
        for raw in raw_preferred:
            norm = cls.normalize_skill(raw)
            c_name = norm["canonical_name"]
            if c_name in seen_canonical:
                duplicates_detected.append(c_name)
                continue
            seen_canonical.add(c_name)

            item = {
                "id": f"sk-{len(seen_canonical)}",
                "name": c_name,
                "raw": raw,
                "category": norm["category"],
                "type": "preferred",
                "priority": "Low",
                "is_alias": norm["is_alias"],
            }
            preferred_list.append(item)
            categorized[norm["category"]].append(item)

        return {
            "mandatory_skills": mandatory_list,
            "preferred_skills": preferred_list,
            "total_skills_count": len(seen_canonical),
            "duplicates_detected": list(set(duplicates_detected)),
            "categorized_breakdown": {k: v for k, v in categorized.items() if v},
            "all_categories": SKILL_CATEGORIES,
        }


# Module-level convenience functions
def normalize_skill(raw_skill: str) -> Dict[str, Any]:
    return SkillClassificationService.normalize_skill(raw_skill)


def process_jd_skills(required_skills_text: str, preferred_skills_text: Optional[str] = None) -> Dict[str, Any]:
    return SkillClassificationService.process_jd_skills(required_skills_text, preferred_skills_text)


def categorize_skills_list(skills_list: List[str], default_mandatory: bool = True) -> Dict[str, List[Dict[str, Any]]]:
    categorized: Dict[str, List[Dict[str, Any]]] = {cat: [] for cat in SKILL_CATEGORIES}
    seen = set()
    for s in skills_list:
        if not s or not s.strip():
            continue
        norm = normalize_skill(s)
        c_name = norm["canonical_name"]
        if c_name in seen:
            continue
        seen.add(c_name)
        item = {
            "raw_name": s,
            "canonical_name": c_name,
            "category": norm["category"],
            "is_mandatory": default_mandatory,
            "is_alias": norm["is_alias"],
        }
        categorized[norm["category"]].append(item)
    return {k: v for k, v in categorized.items() if v}


def detect_duplicate_skills(skills_list: List[str]) -> List[str]:
    seen = set()
    duplicates = set()
    for s in skills_list:
        if not s or not s.strip():
            continue
        norm = normalize_skill(s)
        c_name = norm["canonical_name"]
        if c_name in seen:
            duplicates.add(c_name)
        else:
            seen.add(c_name)
    return list(duplicates)

