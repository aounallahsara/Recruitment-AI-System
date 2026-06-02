"""
Scoring des lettres de motivation françaises — 6 dimensions.

  1. Clarté         — compréhensible, fluide, structurée
  2. Motivation     — intérêt réel, projet professionnel, arguments
  3. Personnalisation — adaptée au destinataire avec éléments spécifiques
  4. Formalité      — codes professionnels, registre soutenu
  5. Richesse lexicale — diversité et variété du vocabulaire
  6. Généricité     — 0=très spécifique / 4=entièrement générique
"""

import re

# ─────────────────────────────────────────────────────────────────────────────
# 1. CLARTÉ
# ─────────────────────────────────────────────────────────────────────────────

TRANSITIONS = [
    "en outre", "de plus", "par ailleurs", "ainsi,", "c'est pourquoi",
    "en effet,", "notamment,", "cependant,", "toutefois,", "par conséquent",
    "d'une part", "d'autre part", "enfin,", "premièrement", "deuxièmement",
    "ensuite,", "d'abord,", "finalement,", "en revanche,", "or,",
    "c'est dans ce contexte", "fort de", "c'est ainsi", "à ce titre",
    "il m'a permis", "ce qui m'a permis", "ce faisant", "c'est fort de",
    "c'est pourquoi", "c'est dans cette optique",
]


def clarity_score(text):
    wc = len(text.split())
    if wc < 50:
        return 0

    sentences = [s.strip() for s in re.split(r'[.!?]+', text) if len(s.strip()) > 5]
    if not sentences:
        return 0

    avg_len = sum(len(s.split()) for s in sentences) / len(sentences)
    paras = [p.strip() for p in re.split(r'\n\n+', text) if len(p.strip()) > 20]
    t = text.lower()
    n_trans = sum(1 for tr in TRANSITIONS if tr in t)

    score = 0

    if len(paras) >= 4:
        score += 1
    elif len(paras) >= 3:
        score += 1

    if 10 <= avg_len <= 22:
        score += 1
    elif 7 <= avg_len <= 30:
        pass
    else:
        score -= 1

    if n_trans >= 3:
        score += 1
    elif n_trans >= 1:
        pass

    if wc >= 120:
        score += 1
    elif wc >= 80:
        pass

    return max(0, min(4, score))


# ─────────────────────────────────────────────────────────────────────────────
# 2. MOTIVATION
# ─────────────────────────────────────────────────────────────────────────────

_MOTIV_GENERIC = [
    "je suis motivé", "je suis très motivé", "suis motivée",
    "je suis enthousiaste", "très enthousiaste", "je suis passionné",
    "je suis passionnée", "vivement intéressé", "vivement intéressée",
    "je suis convaincu", "je suis convaincue", "je suis certain",
    "je suis certaine", "je suis très intéressé",
]

_MOTIV_SUBSTANTIVE = [
    "parce que", "car je", "car ma", "car mon", "c'est pourquoi",
    "afin de", "dans le but de", "me permettrait de", "me permettra de",
    "je souhaite développer", "je souhaite approfondir", "approfondir mes",
    "j'aspire à", "contribuer à", "m'épanouir", "poursuivre",
    "développer mes compétences en", "renforcer mes", "acquérir une expertise",
    "me spécialiser", "me former", "enrichir mes", "mettre en pratique",
    "je cherche à", "je vise à", "je désire", "je souhaite m'",
    "cela m'a conduit", "c'est ce qui m'a", "ce parcours m'a",
]

_MOTIV_PROJECT = [
    "mon projet", "mon objectif professionnel", "ma vocation",
    "mon mémoire", "mes recherches sur", "mes travaux sur",
    "lors de mon stage", "durant ma formation", "au cours de mon",
    "mon parcours en", "ma formation en", "mon expérience en",
    "m'intéresse particulièrement", "correspond à mon projet",
    "correspond à mes objectifs", "correspond à mon parcours",
    "s'inscrit dans", "dans la continuité de",
]


def motivation_score(text):
    t = text.lower()

    n_gen  = sum(1 for p in _MOTIV_GENERIC      if p in t)
    n_sub  = sum(1 for p in _MOTIV_SUBSTANTIVE  if p in t)
    n_proj = sum(1 for p in _MOTIV_PROJECT       if p in t)

    if n_gen == 0 and n_sub == 0 and n_proj == 0:
        return 0
    if n_gen > 0 and n_sub == 0 and n_proj == 0:
        return 1
    if n_sub >= 1 and n_proj == 0:
        return 2
    if n_sub >= 1 and n_proj >= 1:
        if n_sub + n_proj >= 4:
            return 4
        return 3

    return min(4, n_sub + n_proj)


# ─────────────────────────────────────────────────────────────────────────────
# 3. PERSONNALISATION
# ─────────────────────────────────────────────────────────────────────────────

_GENERIC_REFS = [
    "votre entreprise", "votre société", "votre groupe", "votre organisation",
    "votre établissement", "votre institution", "votre cabinet",
    "votre structure", "votre compagnie",
]

_SPECIFIC_MARKERS = [
    "votre master", "votre licence", "votre programme",
    "votre laboratoire", "votre département", "votre équipe de",
    "votre cursus", "cette formation", "ce master", "ce programme",
    "le poste de", "cette mission", "ce stage",
    "correspond à mon projet", "correspond à mon parcours",
    "correspond à mes objectifs", "s'inscrit dans",
    "en lien avec", "en adéquation avec", "cohérent avec",
    "fait écho à", "rejoint mes", "prolonge mes",
    "dans la continuité de", "pour approfondir",
    "vos projets de", "votre projet de", "vos travaux sur",
    "votre approche de", "votre recherche en", "vos publications",
    "lors de", "grâce à", "fort de", "suite à",
    "à l'issue de", "à la suite de",
]


def personalization_score(text):
    t = text.lower()

    n_generic  = sum(1 for p in _GENERIC_REFS     if p in t)
    n_specific = sum(1 for p in _SPECIFIC_MARKERS if p in t)

    cap_entities = re.findall(
        r'(?<=[a-zéèêàâùûîôç,]\s)[A-Z][a-zA-Zéèêàâùûîôç\-]{2,}'
        r'(?:\s+[A-Z][a-zA-Zéèêàâùûîôç\-]{2,}){0,3}',
        text
    )
    stopwords = {"Madame", "Monsieur", "Je", "En", "Au", "La", "Le", "Les",
                 "Mon", "Ma", "Mes", "Ce", "Dans", "Sur", "Pour", "Par",
                 "Avec", "Votre", "Vos", "Notre", "Nos"}
    n_entities = len({e for e in cap_entities if e not in stopwords})

    if n_specific == 0 and n_entities == 0:
        return 0

    score = 0

    if n_generic > 0 and n_specific == 0 and n_entities == 0:
        score = 1
    elif n_specific >= 1:
        score = 1 + min(2, n_specific // 2)

    if n_entities >= 3:
        score += 1
    elif n_entities >= 1:
        score += 1 if score < 3 else 0

    return min(4, max(0, score))


# ─────────────────────────────────────────────────────────────────────────────
# 4. FORMALITÉ
# ─────────────────────────────────────────────────────────────────────────────

_FORMAL_OPENINGS = [
    "madame, monsieur", "madame,", "monsieur,",
    "à l'attention de", "à l'attention de madame", "à l'attention de monsieur",
]

_FORMAL_CLOSINGS = [
    "veuillez agréer", "veuillez recevoir",
    "salutations distinguées", "salutations respectueuses",
    "cordialement,", "bien cordialement",
    "sincères salutations", "respectueuses salutations",
    "l'expression de mes", "l'assurance de mes",
    "mes sincères salutations", "mes respectueuses salutations",
]

_FORMAL_REGISTER = [
    "je me permets", "je vous adresse", "je vous soumets",
    "permettez-moi", "je vous prie", "à votre disposition",
    "à votre convenance", "dans l'attente", "je reste disponible",
    "dans l'espoir", "je vous serais reconnaissant",
    "je vous sollicite", "je me tiens", "je vous adresser",
]

_INFORMAL_MARKERS = [
    "bonjour,", "salut,", "bonne journée", "merci d'avance",
    "à bientôt", "c'est super", "vraiment cool", "trop bien",
    "pas de problème", "nickel", "svp ",
    "!!!",
]


def formality_score(text):
    t = text.lower()

    has_opening = any(p in t for p in _FORMAL_OPENINGS)
    n_closing   = sum(1 for p in _FORMAL_CLOSINGS  if p in t)
    n_register  = sum(1 for p in _FORMAL_REGISTER  if p in t)
    n_informal  = sum(1 for p in _INFORMAL_MARKERS if p in t)

    score = 0
    if has_opening:
        score += 1
    if n_closing >= 2:
        score += 2
    elif n_closing == 1:
        score += 1
    if n_register >= 2:
        score += 1

    score -= n_informal * 2

    return max(0, min(4, score))


# ─────────────────────────────────────────────────────────────────────────────
# 5. RICHESSE LEXICALE
# ─────────────────────────────────────────────────────────────────────────────

def lexical_richness_score(text):
    words = re.findall(r'\b[a-zàâçéèêëîïôûùüÿñæœ]{3,}\b', text.lower())
    if len(words) < 10:
        return 0

    ttr = len(set(words)) / len(words)

    counts = {}
    for w in words:
        counts[w] = counts.get(w, 0) + 1
    heavy_reps = sum(1 for c in counts.values() if c >= 4)
    penalty = min(2, heavy_reps // 2)

    if ttr > 0.80:
        base = 4
    elif ttr > 0.65:
        base = 3
    elif ttr > 0.50:
        base = 2
    elif ttr > 0.35:
        base = 1
    else:
        base = 0

    return max(0, min(4, base - penalty))


# ─────────────────────────────────────────────────────────────────────────────
# 6. GÉNÉRICITÉ
# ─────────────────────────────────────────────────────────────────────────────

CLICHES = [
    "je suis motivé", "je suis très motivé", "suis motivée",
    "je suis sérieux", "je suis sérieuse",
    "je suis rigoureux", "je suis rigoureuse",
    "je suis dynamique",
    "je suis polyvalent", "je suis polyvalente",
    "je suis autonome",
    "travail en équipe",
    "sens du travail en équipe",
    "esprit d'équipe",
    "votre entreprise correspond à mes attentes",
    "votre entreprise m'intéresse",
    "je souhaite mettre mes compétences à votre service",
    "mettre mes compétences à votre service",
    "je pense correspondre au profil",
    "je saurai m'adapter",
    "j'apprends vite",
    "j'aime les défis",
    "je suis force de proposition",
    "sens des responsabilités",
    "sens du relationnel",
    "bonne présentation",
    "capacité d'adaptation",
    "motivé et sérieux", "sérieux et rigoureux", "rigoureux et dynamique",
    "n'hésitez pas à me contacter",
    "dans l'attente de votre réponse",
    "dans l'attente d'un entretien",
    "j'espère avoir retenu votre attention",
    "je reste à votre disposition",
    "personne de confiance",
    "qualités humaines",
    "j'ai le sens du",
]

_SPECIFIC_INDICATORS = [
    "notamment", "en particulier", "spécifiquement",
    "à titre d'exemple", "par exemple,",
    "lors de", "au cours de", "grâce à", "fort de",
    "j'ai réalisé", "j'ai développé", "j'ai piloté",
    "j'ai contribué", "j'ai conçu", "j'ai analysé",
    "j'ai mis en place", "j'ai optimisé", "j'ai coordonné",
    "mon projet de", "mes travaux sur", "mes recherches sur",
    "ce qui m'a permis", "m'a appris", "j'ai appris à",
    "résultats", "objectifs atteints", "amélioration de",
    "%", "données réelles",
]


def genericity_score(text):
    t = text.lower()

    n_cliches  = sum(1 for c in CLICHES             if c in t)
    n_specific = sum(1 for s in _SPECIFIC_INDICATORS if s in t)

    raw = n_cliches - n_specific

    if raw <= -3:
        return 0
    elif raw <= 0:
        return 1
    elif raw <= 2:
        return 2
    elif raw <= 5:
        return 3
    else:
        return 4


# ─────────────────────────────────────────────────────────────────────────────
# ANNOTATEUR COMPOSITE
# ─────────────────────────────────────────────────────────────────────────────

def score_all(text):
    """Retourne les 6 scores pour un texte donné."""
    return {
        "clarity_score":          clarity_score(text),
        "motivation_score":       motivation_score(text),
        "personalization_score":  personalization_score(text),
        "formality_score":        formality_score(text),
        "lexical_richness_score": lexical_richness_score(text),
        "genericity_score":       genericity_score(text),
    }
