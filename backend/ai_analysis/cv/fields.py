"""
Extraction heuristique des champs structurés d'un CV (nom, diplôme,
université, projets, langues) à partir du texte nettoyé.
"""

import re


def extract_cv_fields(clean_text):
    """
    Retourne un dict avec :
      name, degree, university, education, languages, projects
    """
    text = clean_text.replace("\n", " ")

    # ── Nom ──────────────────────────────────────────────────────────────────
    name_match = re.match(
        r'^([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+){1,2})',
        clean_text.strip()
    )
    if not name_match:
        name_match = re.search(
            r'\b([A-Z][a-z]+(?:\s[A-Z][a-z]+){1,3})\b',
            text
        )
    name = name_match.group(1) if name_match else "Unknown"

    # ── Diplôme ───────────────────────────────────────────────────────────────
    degree_patterns = [
        r'(PhD|Doctorate|Doctorat)[^\.,;]{0,80}',
        r'(Master[\'s]*\s+(?:of|in|degree)?[^\n.]{0,50})',
        r'(Engineer(?:ing)?\s+(?:Degree|Student)?[^\n.]{0,50})',
        r'(Bachelor[\'s]*\s+(?:of|in)?[^\n.]{0,50})',
        r'(Licence\s+[^\n.]{0,50})',
        r'\b(MSc|M\.Sc)[^\.,;]{0,80}',
        r'\b(BSc|B\.Sc)[^\.,;]{0,80}',
    ]
    degree = "Not specified"
    for pattern in degree_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            degree = match.group(0).strip()[:80]
            break

    # ── Université ────────────────────────────────────────────────────────────
    uni_match = re.search(
        r'(University|Université|Institut|École|College|School)[^\.,;]{0,88}',
        text,
        re.IGNORECASE
    )
    university = uni_match.group(0).strip() if uni_match else "Not specified"

    # ── Section formation (fallback sur université) ───────────────────────────
    edu_match = re.search(
        r'(Education|Formation|Academic Background)\s*[:\-]?\s*(.*?)'
        r'(?=(Experience|Projects|Skills|Languages|$))',
        text,
        re.IGNORECASE
    )
    education = edu_match.group(2).strip() if edu_match else university

    # ── Langues ───────────────────────────────────────────────────────────────
    lang_match = re.search(
        r'(Languages?|Langues?)\s*[:\-]?\s*(.*?)'
        r'(?=(Skills|Education|Experience|Projects|$))',
        text,
        re.IGNORECASE
    )
    if lang_match:
        raw_langs = lang_match.group(2)
        languages = list(set([
            l.capitalize()
            for l in re.findall(
                r'\b(English|French|Arabic|Spanish|German|Italian|Chinese|Japanese)\b',
                raw_langs,
                re.IGNORECASE
            )
        ]))
    else:
        languages = []

    # ── Projets ───────────────────────────────────────────────────────────────
    proj_match = re.search(
        r'(?:Projects?|Projets?)\s*[:\-]?\s*(.*?)(?=\n[A-Z][a-z]+|\Z)',
        clean_text,
        re.IGNORECASE | re.DOTALL
    )
    if proj_match:
        proj_text   = proj_match.group(1).strip()
        proj_titles = re.findall(r'(?:^|\n)([A-Z][^\n]{5,90})', proj_text)
        projects    = proj_titles[:3] if proj_titles else [proj_text[:100]]
    else:
        projects = []

    return {
        "name":       name,
        "degree":     degree,
        "university": university,
        "education":  education,
        "languages":  languages,
        "projects":   projects,
    }
