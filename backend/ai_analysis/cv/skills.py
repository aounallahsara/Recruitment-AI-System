"""
Extraction de compétences — deux stratégies combinées :

  1. NER BERT (priorité) — algiraldohe/lm-ner-linkedin-skills-recognition
     Détecte les compétences directement dans le texte brut, même hors liste.
     Même modèle que le notebook Colab ProjetHasnaoui.
     Téléchargement unique ~250 Mo, mis en cache automatiquement.

  2. Keyword matching (fallback / complément) — 150+ termes hors-ligne
     Fonctionne sans réseau, couvre les compétences que le NER pourrait manquer.

Résultat final : union des deux approches, dédupliquée et triée.
"""

import re
import logging

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# BASE DE MOTS-CLÉS (fallback offline)
# ─────────────────────────────────────────────────────────────────────────────

_SKILLS_DB = {
    # Langages
    "Python", "Java", "JavaScript", "TypeScript", "C", "C++", "C#", "Go",
    "Rust", "PHP", "Ruby", "Swift", "Kotlin", "Scala", "R", "MATLAB",
    "Dart", "Perl", "Bash", "Shell", "SQL", "PL/SQL", "VHDL", "Assembly",
    # Web frontend
    "React", "Angular", "Vue", "Vue.js", "Next.js", "Nuxt", "HTML", "CSS",
    "Tailwind", "Bootstrap", "SASS", "SCSS", "jQuery", "Redux", "GraphQL",
    "REST", "REST API", "Webpack", "Vite", "Node.js", "Express",
    # Web backend
    "Django", "Flask", "FastAPI", "Spring", "Spring Boot", "Laravel",
    "Rails", "ASP.NET", "NestJS",
    # Bases de données
    "MySQL", "PostgreSQL", "SQLite", "MongoDB", "Redis", "Cassandra",
    "Oracle", "SQL Server", "MariaDB", "Elasticsearch", "Firebase",
    "DynamoDB", "Neo4j",
    # IA / Machine Learning
    "TensorFlow", "PyTorch", "Keras", "Scikit-learn", "OpenCV", "NLTK",
    "spaCy", "Hugging Face", "Transformers", "BERT", "GPT", "LLM",
    "Machine Learning", "Deep Learning", "NLP", "Computer Vision",
    "Reinforcement Learning", "Neural Network", "CNN", "RNN", "LSTM",
    "Random Forest", "XGBoost", "Pandas", "NumPy", "Matplotlib", "Seaborn",
    # DevOps / Cloud
    "Docker", "Kubernetes", "Git", "GitHub", "GitLab", "CI/CD", "Jenkins",
    "AWS", "Azure", "GCP", "Google Cloud", "Terraform", "Ansible",
    "Linux", "Unix", "Nginx", "Apache",
    # Mobile
    "Android", "iOS", "Flutter", "React Native", "Xamarin",
    # Génie civil / Mécanique
    "AutoCAD", "SolidWorks", "CATIA", "Revit", "ANSYS",
    "Civil 3D", "ArchiCAD", "SketchUp", "BIM", "Abaqus", "SAP2000",
    "Primavera", "Robot Structural", "Etabs", "HEC-RAS", "ArcGIS",
    # Finance / Comptabilité
    "Excel", "Power BI", "Tableau", "SAP", "ERP", "Sage", "QuickBooks",
    "Bloomberg", "VBA",
    # Gestion / RH
    "Agile", "Scrum", "Kanban", "JIRA", "Trello", "MS Project",
    "Salesforce", "HubSpot",
    # Réseaux / Sécurité
    "Cisco", "TCP/IP", "Wireshark", "Firewall", "VPN", "Cybersecurity",
    "Penetration Testing", "OWASP",
}

_SKILLS_LOWER = {s.lower(): s for s in _SKILLS_DB}
_MULTI_WORD   = sorted([s for s in _SKILLS_DB if " " in s], key=len, reverse=True)


def _extract_by_keywords(text):
    """Matching hors-ligne insensible à la casse."""
    found = set()
    t = text.lower()
    for skill in _MULTI_WORD:
        if skill.lower() in t:
            found.add(_SKILLS_LOWER[skill.lower()])
    for skill_lower, skill_orig in _SKILLS_LOWER.items():
        if " " in skill_lower:
            continue
        if re.search(r'\b' + re.escape(skill_lower) + r'\b', t):
            found.add(skill_orig)
    return found


# ─────────────────────────────────────────────────────────────────────────────
# NER BERT (même modèle que le notebook ProjetHasnaoui)
# ─────────────────────────────────────────────────────────────────────────────

_ner_pipeline = None
_ner_available = None   # None = pas encore tenté


def _load_ner():
    global _ner_pipeline, _ner_available
    if _ner_available is not None:
        return _ner_available
    try:
        from transformers import pipeline as hf_pipeline
        _ner_pipeline = hf_pipeline(
            task="token-classification",
            model="algiraldohe/lm-ner-linkedin-skills-recognition",
            aggregation_strategy="simple",
        )
        _ner_available = True
        logger.info("skills: NER model loaded (algiraldohe/lm-ner-linkedin-skills-recognition)")
    except Exception as exc:
        _ner_available = False
        logger.warning("skills: NER model unavailable (%s) — falling back to keyword matching", exc)
    return _ner_available


def _extract_by_ner(text):
    """NER BERT — détecte les compétences librement dans le texte."""
    results = _ner_pipeline(text[:2000])
    return {
        r["word"].strip()
        for r in results
        if r["score"] > 0.8 and len(r["word"].strip()) > 2
    }


# ─────────────────────────────────────────────────────────────────────────────
# POINT D'ENTRÉE
# ─────────────────────────────────────────────────────────────────────────────

def extract_skills(text, use_ner=True, **kwargs):
    """
    Retourne (skills_list, method_used).

    Stratégie :
      - NER BERT (si disponible) : détection libre dans le texte brut
      - Keyword matching          : complément hors-ligne
      → union des deux, triée
    """
    keywords = _extract_by_keywords(text)

    if use_ner and _load_ner():
        ner_skills = _extract_by_ner(text)
        combined   = sorted(keywords | ner_skills)
        logger.info(
            "skills: NER=%d  keywords=%d  total=%d",
            len(ner_skills), len(keywords), len(combined),
        )
        return combined, "ner+keywords"

    logger.info("skills: keywords only, total=%d", len(keywords))
    return sorted(keywords), "keywords_only"
