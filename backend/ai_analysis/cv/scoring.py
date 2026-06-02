"""
Moteur de scoring CV — adapté du notebook Étudiant 4.
Formule pondérée sur 100, décomposée par catégorie et pondérée par domaine.
"""

from typing import Any

# ── Pondérations par domaine ─────────────────────────────────────────────────
DOMAIN_WEIGHTS: dict[str, dict] = {
    "Computer Science and IT": {
        "skills_w": 0.40, "formation_w": 0.30,
        "experience_w": 0.20, "soft_w": 0.10,
        "cert_bonus": 5, "project_bonus": 3,
    },
    "Civil Engineering": {
        "skills_w": 0.35, "formation_w": 0.30,
        "experience_w": 0.25, "soft_w": 0.10,
        "cert_bonus": 3, "project_bonus": 4,
    },
    "Mechanical Engineering": {
        "skills_w": 0.38, "formation_w": 0.30,
        "experience_w": 0.22, "soft_w": 0.10,
        "cert_bonus": 3, "project_bonus": 3,
    },
    "Electrical Engineering": {
        "skills_w": 0.38, "formation_w": 0.30,
        "experience_w": 0.22, "soft_w": 0.10,
        "cert_bonus": 3, "project_bonus": 3,
    },
    "Architecture": {
        "skills_w": 0.35, "formation_w": 0.32,
        "experience_w": 0.23, "soft_w": 0.10,
        "cert_bonus": 3, "project_bonus": 4,
    },
    "Finance and Accounting": {
        "skills_w": 0.35, "formation_w": 0.35,
        "experience_w": 0.20, "soft_w": 0.10,
        "cert_bonus": 6, "project_bonus": 2,
    },
    "Human Resources and Management": {
        "skills_w": 0.30, "formation_w": 0.30,
        "experience_w": 0.20, "soft_w": 0.20,
        "cert_bonus": 3, "project_bonus": 2,
    },
    "Geology": {
        "skills_w": 0.37, "formation_w": 0.32,
        "experience_w": 0.21, "soft_w": 0.10,
        "cert_bonus": 3, "project_bonus": 3,
    },
    "Logistics and Supply Chain": {
        "skills_w": 0.35, "formation_w": 0.30,
        "experience_w": 0.25, "soft_w": 0.10,
        "cert_bonus": 4, "project_bonus": 3,
    },
    "default": {
        "skills_w": 0.40, "formation_w": 0.30,
        "experience_w": 0.20, "soft_w": 0.10,
        "cert_bonus": 3, "project_bonus": 2,
    },
}

# ── Barème diplômes ──────────────────────────────────────────────────────────
DEGREE_SCORE: dict[str, int] = {
    "phd": 100, "doctorate": 100, "doctorat": 100,
    "master": 85, "msc": 85, "m.sc": 85, "magister": 85,
    "engineer": 80, "engineering": 80, "ingénieur": 80, "state engineer": 80,
    "bachelor": 65, "licence": 65, "bsc": 65, "b.sc": 65,
    "bts": 45, "dut": 45, "baccalaureate": 40, "bac": 40,
}

# ── Compétences clés par domaine ─────────────────────────────────────────────
DOMAIN_KEY_SKILLS: dict[str, list] = {
    "Computer Science and IT": [
        "python", "java", "machine learning", "deep learning", "sql",
        "git", "docker", "react", "flutter", "tensorflow", "pytorch",
        "linux", "api", "cloud", "kubernetes",
    ],
    "Civil Engineering": [
        "autocad", "revit", "bim", "structural", "concrete",
        "geotechnics", "hydraulics", "project management",
    ],
    "Mechanical Engineering": [
        "solidworks", "catia", "autocad", "ansys", "cad", "cam",
        "thermodynamics", "mechanics", "matlab",
    ],
    "Electrical Engineering": [
        "matlab", "simulink", "plc", "scada", "power systems",
        "electronics", "pcb", "vhdl", "verilog",
    ],
    "Architecture": [
        "autocad", "revit", "archicad", "sketchup", "rendering",
        "urban planning", "bim", "3d modeling",
    ],
    "Finance and Accounting": [
        "excel", "accounting", "audit", "tax", "financial modeling",
        "bloomberg", "python", "sql", "power bi",
    ],
    "Human Resources and Management": [
        "recruitment", "hr", "payroll", "training", "leadership",
        "communication", "conflict resolution", "excel",
    ],
    "Geology": [
        "arcgis", "petrel", "geomap", "stratigraphy", "mineralogy",
        "mapping", "field work", "seismic",
    ],
    "Logistics and Supply Chain": [
        "erp", "sap", "supply chain", "inventory", "procurement",
        "logistics", "warehouse", "forecasting",
    ],
}

KNOWN_SOFT_SKILLS = [
    "teamwork", "communication", "leadership", "problem solving",
    "creativity", "adaptability", "time management", "critical thinking",
    "collaboration", "initiative", "autonomy",
]

TOP_UNIVERSITIES = [
    "usthb", "esi", "enp", "polytechnique", "mit",
    "stanford", "harvard", "sorbonne", "epfl", "insa",
]


# ── Sous-scores ──────────────────────────────────────────────────────────────

def _score_skills(skills: list[str], domain: str) -> float:
    skills_lower = [s.lower() for s in skills]
    key_skills = DOMAIN_KEY_SKILLS.get(domain, [])
    qty_score = min(len(skills_lower), 15) * 5          # max 75
    if key_skills:
        matches = sum(1 for k in key_skills if any(k in s for s in skills_lower))
        relevance_score = round(matches / len(key_skills), 2) * 25  # max 25
    else:
        relevance_score = 12.5
    return round(min(qty_score + relevance_score, 100), 1)


def _score_formation(degree: str, university: str) -> float:
    base = 50
    dl = degree.lower()
    for key, val in DEGREE_SCORE.items():
        if key in dl:
            base = val
            break
    uni_bonus = 5 if any(u in university.lower() for u in TOP_UNIVERSITIES) else 0
    return round(min(base + uni_bonus, 100), 1)


def _score_experience(experience_years: int, projects: list) -> float:
    exp_score = min(experience_years * 12, 60)      # max 60
    project_score = min(len(projects) * 13, 40)     # max 40
    return round(min(exp_score + project_score, 100), 1)


def _score_soft_skills(soft_skills: list[str], languages: list[str]) -> float:
    soft_lower = [s.lower() for s in soft_skills]
    matches = sum(1 for k in KNOWN_SOFT_SKILLS if any(k in s for s in soft_lower))
    soft_score = min(matches * 10, 50)
    lang_bonus = min(len(languages) * 10, 30)
    return round(min(soft_score + lang_bonus + 20, 100), 1)


# ── Moteur principal ─────────────────────────────────────────────────────────

def compute_cv_score(profile: dict[str, Any]) -> dict[str, Any]:
    """
    Calcule le score CV complet depuis un profil candidat.

    Args:
        profile: dict avec les clés :
            name, domain, skills, degree, university,
            experience_years, projects, languages,
            certifications, soft_skills

    Returns:
        dict avec score_cv (0-100), level, breakdown, bonuses, name, domain
    """
    domain = profile.get("domain", "default")
    weights = DOMAIN_WEIGHTS.get(domain, DOMAIN_WEIGHTS["default"])

    s_skills = _score_skills(profile.get("skills", []), domain)
    s_form   = _score_formation(profile.get("degree", ""), profile.get("university", ""))
    s_exp    = _score_experience(
        profile.get("experience_years", 0),
        profile.get("projects", []),
    )
    s_soft   = _score_soft_skills(
        profile.get("soft_skills", []),
        profile.get("languages", []),
    )

    cert_bonus    = len(profile.get("certifications", [])) * weights["cert_bonus"]
    project_bonus = len(profile.get("projects", []))       * weights["project_bonus"]

    weighted = (
        s_skills * weights["skills_w"]     +
        s_form   * weights["formation_w"]  +
        s_exp    * weights["experience_w"] +
        s_soft   * weights["soft_w"]
    )
    score_cv = round(min(weighted + cert_bonus + project_bonus, 100), 1)
    level    = "senior" if score_cv >= 75 else ("mid" if score_cv >= 50 else "junior")

    return {
        "name":   profile.get("name", ""),
        "domain": domain,
        "breakdown": {
            "competences": s_skills,
            "formation":   s_form,
            "experience":  s_exp,
            "soft_skills": s_soft,
        },
        "bonuses": {
            "certifications": round(cert_bonus, 1),
            "projets":        round(project_bonus, 1),
        },
        "score_cv": score_cv,
        "level":    level,
    }


def rank_candidates(candidates: list[dict]) -> list[dict]:
    """
    Trie les candidats par domaine puis score CV décroissant.
    Ajoute le rang par domaine à chaque candidat.
    """
    ranked = sorted(candidates, key=lambda x: (x.get("domain", ""), -x.get("score_cv", 0)))
    domain_rank: dict[str, int] = {}
    for c in ranked:
        d = c.get("domain", "")
        domain_rank[d] = domain_rank.get(d, 0) + 1
        c["rank"] = domain_rank[d]
    return ranked
