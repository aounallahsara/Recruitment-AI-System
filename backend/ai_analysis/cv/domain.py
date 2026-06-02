"""
Classification du domaine professionnel.
Stratégie hybride :
  1. Score par mots-clés (instantané, hors-ligne) — si confiance >= 0.50, on s'arrête
  2. Sinon, NLI cross-encoder (~90 Mo, lazy-loaded) sur texte enrichi (diplôme + compétences + extrait)
"""

CANDIDATE_DOMAINS = [
    "Computer Science and IT",
    "Civil Engineering",
    "Mechanical Engineering",
    "Electrical Engineering",
    "Architecture",
    "Finance and Accounting",
    "Human Resources and Management",
    "Geology and Geotechnics",
    "Logistics and Supply Chain",
]

# Indices de domaine par compétence — ordre = force du signal (1er = plus fort)
_SKILL_DOMAIN_HINTS = {
    # Génie civil (signal fort)
    "AutoCAD":    ["Civil Engineering", "Architecture", "Mechanical Engineering"],
    "Civil 3D":   ["Civil Engineering"],
    "SAP2000":    ["Civil Engineering"],
    "Abaqus":     ["Civil Engineering", "Mechanical Engineering"],
    "BIM":        ["Civil Engineering", "Architecture"],
    # Architecture
    "Revit":      ["Architecture", "Civil Engineering"],
    "ArchiCAD":   ["Architecture"],
    "SketchUp":   ["Architecture"],
    # Génie mécanique
    "SolidWorks": ["Mechanical Engineering"],
    "CATIA":      ["Mechanical Engineering"],
    "ANSYS":      ["Mechanical Engineering", "Civil Engineering"],
    # Électrique / Électronique
    "VHDL":       ["Electrical Engineering"],
    "Cisco":      ["Electrical Engineering", "Computer Science and IT"],
    # Informatique
    "Python":     ["Computer Science and IT"],
    "Java":       ["Computer Science and IT"],
    "JavaScript": ["Computer Science and IT"],
    "TypeScript": ["Computer Science and IT"],
    "React":      ["Computer Science and IT"],
    "Angular":    ["Computer Science and IT"],
    "Django":     ["Computer Science and IT"],
    "Flask":      ["Computer Science and IT"],
    "FastAPI":    ["Computer Science and IT"],
    "Docker":     ["Computer Science and IT"],
    "Kubernetes": ["Computer Science and IT"],
    "TensorFlow": ["Computer Science and IT"],
    "PyTorch":    ["Computer Science and IT"],
    "AWS":        ["Computer Science and IT"],
    "Azure":      ["Computer Science and IT"],
    "Linux":      ["Computer Science and IT"],
    "Node.js":    ["Computer Science and IT"],
    # Finance / Comptabilité
    "Bloomberg":  ["Finance and Accounting"],
    "Sage":       ["Finance and Accounting"],
    "QuickBooks": ["Finance and Accounting"],
    "VBA":        ["Finance and Accounting", "Computer Science and IT"],
    "SAP":        ["Finance and Accounting", "Human Resources and Management"],
    # RH / Gestion
    "Salesforce": ["Human Resources and Management"],
    "HubSpot":    ["Human Resources and Management"],
}

# Mots-clés dans le texte brut → signal de domaine direct (expressions métier)
_TEXT_DOMAIN_KEYWORDS = {
    "Civil Engineering":                ["génie civil", "travaux publics", "btp", "chantier", "béton", "structure", "terrassement", "voirie", "ouvrage d'art"],
    "Mechanical Engineering":           ["génie mécanique", "mécanique", "thermodynamique", "turbine", "fabrication", "usinage"],
    "Electrical Engineering":           ["génie électrique", "électrotechnique", "électronique", "automatisme", "câblage"],
    "Architecture":                     ["architecte", "architecture", "urbanisme", "plan architectural", "conception architecturale"],
    "Computer Science and IT":          ["développeur", "software", "informatique", "programmeur", "data scientist", "devops"],
    "Finance and Accounting":           ["comptabilité", "finance", "audit", "trésorerie", "bilan", "expert-comptable"],
    "Human Resources and Management":   ["ressources humaines", "rh", "recrutement", "management", "gestion des équipes"],
    "Geology and Geotechnics":          ["géologie", "géotechnique", "sol", "forage", "sismique"],
    "Logistics and Supply Chain":       ["logistique", "supply chain", "transport", "stock", "entreposage"],
}

_CONFIDENCE_THRESHOLD = 0.50

_classifier = None


def _get_classifier():
    global _classifier
    if _classifier is None:
        from transformers import pipeline
        _classifier = pipeline(
            "zero-shot-classification",
            model="cross-encoder/nli-MiniLM2-L6-H768",
        )
    return _classifier


def _rule_based_score(skills, text=""):
    """Vote pondéré sur les compétences + mots-clés textuels."""
    scores = {}

    # Votes par compétences
    for skill in (skills or []):
        for rank, domain in enumerate(_SKILL_DOMAIN_HINTS.get(skill, [])):
            w = 1.0 / (rank + 1)
            scores[domain] = scores.get(domain, 0) + w

    # Bonus fort si le texte contient des expressions métier directes
    text_lower = text.lower()
    for domain, keywords in _TEXT_DOMAIN_KEYWORDS.items():
        for kw in keywords:
            if kw in text_lower:
                scores[domain] = scores.get(domain, 0) + 2.0
                break  # un seul bonus par domaine

    if not scores:
        return None, 0.0

    total      = sum(scores.values())
    best       = max(scores, key=scores.get)
    confidence = scores[best] / total
    return best, round(confidence, 3)


def classify_domain(skills, text="", fields=None, **kwargs):
    """
    Retourne (domain, confidence).
    1. Détection règle : vote sur compétences + mots-clés texte.
    2. Si confiance < seuil : NLI transformer avec contexte enrichi.
    """
    skills_list = skills if isinstance(skills, list) else []

    # ── Étape 1 : règles ─────────────────────────────────────────────────────
    domain_rule, conf_rule = _rule_based_score(skills_list, text)
    print(f"[TRACE DOMAINE] Règles : {domain_rule} (confiance={conf_rule:.2f}, seuil={_CONFIDENCE_THRESHOLD})")
    if domain_rule and conf_rule >= _CONFIDENCE_THRESHOLD:
        print(f"[TRACE DOMAINE] → Seuil atteint : DÉCISION par règles seules (pas de NLI)")
        return domain_rule, conf_rule
    print(f"[TRACE DOMAINE] → Seuil non atteint : activation du NLI cross-encoder")

    # ── Étape 2 : NLI transformer avec texte enrichi ──────────────────────────
    parts = []
    if fields:
        if fields.get("degree"):
            parts.append(f"Diplôme: {fields['degree']}")
        if fields.get("university"):
            parts.append(f"Université: {fields['university']}")
    if skills_list:
        parts.append(f"Compétences: {', '.join(skills_list)}")
    if text:
        parts.append(text[:600])

    input_text = ". ".join(parts) if parts else ", ".join(skills_list) or "unknown"

    try:
        classifier = _get_classifier()
        result     = classifier(input_text, candidate_labels=CANDIDATE_DOMAINS)
        return result["labels"][0], round(result["scores"][0], 3)
    except Exception:
        return domain_rule or "Unknown", conf_rule
