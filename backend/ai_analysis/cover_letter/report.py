"""
Orchestrateur de l'analyse complète d'une lettre de motivation.
Combine scoring (6 dimensions), note globale pondérée et analyse de style.
"""

import re
from .scoring import score_all
from .style import analyze_style

SCORE_META = {
    "clarity_score": {
        "label": "Clarté",
        "description": "Compréhensible, fluide, structurée",
        "tips": {
            0: "Très difficile à comprendre.",
            1: "Nombreuses confusions — restructurez vos paragraphes.",
            2: "Compréhensible mais peu fluide — ajoutez des transitions.",
            3: "Claire et bien organisée.",
            4: "Très claire et parfaitement structurée.",
        },
    },
    "motivation_score": {
        "label": "Motivation",
        "description": "Intérêt réel, projet professionnel, arguments convaincants",
        "tips": {
            0: "Motivation absente — expliquez pourquoi vous postulez.",
            1: "Très faible — seulement 'je suis motivé', sans justification.",
            2: "Présente mais superficielle — développez votre projet professionnel.",
            3: "Convaincante — bonne argumentation.",
            4: "Forte et argumentée — excellent.",
        },
    },
    "personalization_score": {
        "label": "Personnalisation",
        "description": "Adapté au destinataire avec éléments spécifiques",
        "tips": {
            0: "Aucune personnalisation — la lettre pourrait être envoyée à n'importe qui.",
            1: "Très peu d'éléments spécifiques — nommez l'entreprise/école et le poste précis.",
            2: "Quelques références ciblées — ajoutez des liens avec votre parcours.",
            3: "Lettre clairement adaptée.",
            4: "Lettre fortement personnalisée — excellent.",
        },
    },
    "formality_score": {
        "label": "Formalité",
        "description": "Codes professionnels, registre soutenu, ton adapté",
        "tips": {
            0: "Très inapproprié — aucun code professionnel respecté.",
            1: "Plusieurs écarts — vérifiez les formules de politesse.",
            2: "Acceptable — quelques manques de formalité.",
            3: "Professionnel.",
            4: "Très professionnel.",
        },
    },
    "lexical_richness_score": {
        "label": "Richesse lexicale",
        "description": "Diversité et variété du vocabulaire",
        "tips": {
            0: "Vocabulaire très pauvre — diversifiez vos tournures.",
            1: "Peu varié — évitez les répétitions.",
            2: "Correct.",
            3: "Varié.",
            4: "Très riche — excellent.",
        },
    },
    "genericity_score": {
        "label": "Généricité",
        "description": "0 = très spécifique  /  4 = entièrement générique",
        "tips": {
            0: "Aucun cliché — contenu très spécifique.",
            1: "Quelques formulations génériques — acceptable.",
            2: "Mélange équilibré.",
            3: "Beaucoup de clichés — précisez davantage.",
            4: "Lettre presque entièrement générique — reformulez.",
        },
    },
}

WEIGHTS = {
    "clarity_score":          1.5,
    "motivation_score":       2.0,
    "personalization_score":  1.0,   # réduit : ne pénalise plus autant les lettres génériques
    "formality_score":        1.5,
    "lexical_richness_score": 1.0,
    "genericity_score":      -1.5,
}


def global_note(scores):
    raw     = sum(scores.get(k, 0) * w for k, w in WEIGHTS.items())
    # max: all positive-weight scores at 4, negative-weight scores at 0 (best = no clichés)
    max_raw = sum(4 * w for w in WEIGHTS.values() if w > 0)
    # min: positive-weight scores at 0, negative-weight scores at 4 (worst = all clichés)
    min_raw = sum(4 * w for w in WEIGHTS.values() if w < 0)
    norm    = (raw - min_raw) / (max_raw - min_raw) * 20 + 4.0
    return round(max(0.0, min(20.0, norm)), 1)


def mention(note):
    if note >= 14: return "Très bien"
    if note >= 11: return "Bien"
    if note >= 8:  return "Assez bien"
    if note >= 6:  return "Passable"
    return "Insuffisant"


def _ameliorations(scores):
    result = {}
    for key, meta in SCORE_META.items():
        s = scores.get(key, 0)
        if key != "genericity_score" and s <= 2:
            result[meta["label"]] = meta["tips"].get(s, "")
        elif key == "genericity_score" and s >= 3:
            result[meta["label"]] = meta["tips"].get(s, "")
    return result


def analyze_cover_letter(text):
    """
    Analyse complète d'une lettre de motivation.

    Retourne un dict sérialisable contenant :
      - scores détaillés (6 dimensions)
      - note globale /20 + mention
      - analyse de style (humain/IA/hybride)
      - points d'amélioration prioritaires
      - métriques textuelles brutes
    """
    words = re.findall(r'\b[a-zàâçéèêëîïôûùüÿñæœ]{3,}\b', text.lower())
    ttr   = round(len(set(words)) / len(words), 3) if words else 0.0

    scores    = score_all(text)
    note      = global_note(scores)
    men       = mention(note)
    style     = analyze_style(scores, text)
    amelios   = _ameliorations(scores)

    scores_detail = {}
    for key, val in scores.items():
        meta = SCORE_META[key]
        scores_detail[key] = {
            "valeur":      val,
            "label":       meta["label"],
            "description": meta["description"],
            "conseil":     meta["tips"].get(val, ""),
        }

    return {
        "scores":           scores,
        "scores_detail":    scores_detail,
        "note_globale":     note,
        "mention":          men,
        "style":            style,
        "ameliorations":    amelios,
        "metriques": {
            "word_count": len(text.split()),
            "ttr":        ttr,
        },
    }
