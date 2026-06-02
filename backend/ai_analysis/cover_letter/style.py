"""
Détection du style d'une lettre de motivation : humain / ia / hybride / suspicion_ia.

Architecture :
  1. Règles déterministes  — signal rapide basé sur les scores linguistiques
  2. ML v2                 — RandomForest entraîné sur de vraies lettres LLM (F1=0.93)

Décision finale (decision_finale) :
  - Accord règles + ML v2  → label commun, confiance haute
  - Règles disent IA       → IA, confiance moyenne (règles prioritaires sur l'IA)
  - ML v2 > 75% IA mais pas les règles → suspicion_ia, confiance moyenne
  - Désaccord sans signal fort → règles, confiance standard
"""

import re
import os
import pickle
import logging
import numpy as np

from .scoring import TRANSITIONS, CLICHES, _SPECIFIC_INDICATORS
from .features_detection import extraire_features_signal

logger = logging.getLogger(__name__)

_MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")

LABELS_FR = {
    "humain":       "Humain",
    "ia":           "Généré par IA",
    "hybride":      "Hybride (humain + IA)",
    "suspicion_ia": "Suspicion IA",
}

DESCRIPTIONS = {
    "humain": (
        "Le style est caractéristique d'une lettre rédigée par un humain : "
        "registre variable, formulations naturelles ou imparfaites, "
        "structure moins mécanique qu'une IA."
    ),
    "ia": (
        "Le style est caractéristique d'une lettre générée par IA : "
        "très formel, structure rigide, motivation formulaïque, "
        "peu de clichés mais peu de profondeur personnelle."
    ),
    "hybride": (
        "La lettre combine des éléments humains et IA : "
        "structure claire et bien organisée (contribution IA), "
        "avec une motivation explicite et une personnalisation réelle (contribution humaine). "
        "Typique d'une lettre améliorée par un outil IA."
    ),
    "suspicion_ia": (
        "Les règles n'ont pas détecté de signal IA franc, mais ML v2 "
        "(entraîné sur de vraies lettres LLM) détecte une probabilité IA élevée. "
        "La lettre mérite une relecture attentive."
    ),
}


# ── Décision finale ───────────────────────────────────────────────────────────

def decision_finale(score_regles, label_regles, label_v2, proba_v2):
    """
    Combine règles déterministes et ML v2.
    proba_v2 = probabilité IA selon ML v2 (float 0-1).
    """
    if label_regles == label_v2:
        return label_regles, "haute"
    if label_regles == "ia":
        return "ia", "moyenne"
    if label_v2 == "ia" and proba_v2 > 0.75:
        return "suspicion_ia", "moyenne"
    return label_regles, "standard"


# ── Helpers textuels ──────────────────────────────────────────────────────────

def _extra_features(text):
    t         = text.lower()
    sentences = [s.strip() for s in re.split(r"[.!?]+", text) if len(s.strip()) > 5]
    paras     = [p.strip() for p in re.split(r"\n\n+", text) if len(p.strip()) > 10]
    avg_sent  = sum(len(s.split()) for s in sentences) / len(sentences) if sentences else 0
    n_trans   = sum(1 for tr in TRANSITIONS          if tr in t)
    n_cliches = sum(1 for c  in CLICHES              if c  in t)
    n_specific = sum(1 for s  in _SPECIFIC_INDICATORS if s  in t)
    return avg_sent, len(paras), n_trans, n_cliches, n_specific


# ── ML v2 ─────────────────────────────────────────────────────────────────────

_ml_v2_pipeline  = None
_ml_v2_le        = None
_ml_v2_available = None

_ML_V2_FEATURE_NAMES = [
    "burstiness", "repetition_ngram_3", "ratio_ponctuation",
    "avg_word_len", "ttr", "ratio_majuscules",
    "longueur_mots", "n_phrases", "perplexite",
]


def _load_ml_v2():
    global _ml_v2_pipeline, _ml_v2_le, _ml_v2_available
    if _ml_v2_available is not None:
        return _ml_v2_available
    path = os.path.join(_MODELS_DIR, "style_classifier_v2.pkl")
    try:
        with open(path, "rb") as f:
            art = pickle.load(f)
        _ml_v2_pipeline  = art["pipeline"]
        _ml_v2_le        = art["label_encoder"]
        _ml_v2_available = True
        logger.info(
            "style: ML_v2 chargé (%s, F1=%.4f, source_ia=%s)",
            art.get("model_name", "?"), art.get("f1_test", 0), art.get("source_ia", "?")
        )
    except Exception as exc:
        _ml_v2_available = False
        logger.warning("style: ML_v2 indisponible — %s", exc)
    return _ml_v2_available


def _predict_ml_v2(text):
    feats     = extraire_features_signal(text)
    X         = np.array([[feats[n] for n in _ML_V2_FEATURE_NAMES]], dtype=float)
    proba_arr = _ml_v2_pipeline.predict_proba(X)[0]
    classes   = [str(c) for c in _ml_v2_le.classes_]
    proba     = {cls: round(float(p), 3) for cls, p in zip(classes, proba_arr)}
    pred      = classes[int(np.argmax(proba_arr))]
    return pred, proba


# ── Règles déterministes ──────────────────────────────────────────────────────

def _predict_rules(scores, text):
    cl = scores["clarity_score"]
    mo = scores["motivation_score"]
    pe = scores["personalization_score"]
    fo = scores["formality_score"]
    le = scores["lexical_richness_score"]
    ge = scores["genericity_score"]
    avg_sent, n_paras, n_trans, n_cliches, n_specific = _extra_features(text)
    word_count = len(text.split())

    ai = 0.0
    if fo >= 3:                    ai += 0.30
    if le >= 3 and cl >= 2:        ai += 0.25
    if mo <= 1:                    ai += 0.20
    if n_cliches == 0 and cl >= 2: ai += 0.15
    if pe <= 1 and cl >= 2:        ai += 0.10
    ai = min(1.0, ai)

    hybrid = 0.0
    if cl >= 3:      hybrid += 0.30
    if mo >= 2:      hybrid += 0.30
    if n_trans >= 2: hybrid += 0.20
    if pe >= 2:      hybrid += 0.20
    hybrid = min(1.0, hybrid)

    human = 0.0
    if fo <= 2:         human += 0.20
    if ge >= 2:         human += 0.20
    if n_cliches >= 2:  human += 0.20
    if cl <= 1:         human += 0.25
    if le <= 1:         human += 0.15
    if word_count < 80: human += 0.20
    human = min(1.0, human)

    total = ai + hybrid + human
    if total < 0.01:
        proba = {"humain": 0.34, "ia": 0.33, "hybride": 0.33}
    else:
        proba = {
            "humain":  round(human  / total, 3),
            "ia":      round(ai     / total, 3),
            "hybride": round(hybrid / total, 3),
        }

    if fo <= 1 and cl <= 1:
        proba = {"humain": 0.87, "ia": 0.07, "hybride": 0.06}
    elif fo >= 3 and le >= 3 and mo <= 1 and n_cliches == 0 and cl >= 2:
        proba = {"humain": 0.08, "ia": 0.85, "hybride": 0.07}
    elif fo >= 2 and mo <= 1 and pe <= 1 and cl >= 2 and le >= 2 and word_count >= 80:
        proba = {"humain": 0.15, "ia": 0.75, "hybride": 0.10}
    elif cl >= 3 and mo >= 2 and n_trans >= 2:
        proba = {"humain": 0.15, "ia": 0.10, "hybride": 0.75}
    elif fo <= 1 and ge >= 2 and n_cliches >= 2:
        proba = {"humain": 0.85, "ia": 0.08, "hybride": 0.07}

    return max(proba, key=proba.get), proba


# ── Point d'entrée principal ──────────────────────────────────────────────────

def analyze_style(scores, text):
    avg_sent, n_paras, n_trans, n_cliches, n_specific = _extra_features(text)
    fo = scores["formality_score"]
    mo = scores["motivation_score"]
    cl = scores["clarity_score"]
    ge = scores["genericity_score"]
    pe = scores["personalization_score"]

    ml_v2_ok = _load_ml_v2()

    label_regles, proba = _predict_rules(scores, text)
    opinions = {}

    ml_v2_pred, ml_v2_proba = None, {}
    if ml_v2_ok:
        ml_v2_pred, ml_v2_proba = _predict_ml_v2(text)
        opinions["ml_v2"] = {"prediction": ml_v2_pred, "proba": ml_v2_proba}
        logger.info(
            "style ML_v2: %s (humain=%.2f ia=%.2f hybride=%.2f)",
            ml_v2_pred,
            ml_v2_proba.get("humain", 0),
            ml_v2_proba.get("ia", 0),
            ml_v2_proba.get("hybride", 0),
        )

    if ml_v2_pred is not None:
        prediction, niveau_confiance = decision_finale(
            proba, label_regles, ml_v2_pred,
            float(ml_v2_proba.get("ia", 0)),
        )
    else:
        prediction     = label_regles
        niveau_confiance = "standard"

    logger.info(
        "style décision: %s (confiance=%s, règles=%s, ml_v2=%s)",
        prediction, niveau_confiance, label_regles, ml_v2_pred
    )

    signals = []
    if fo >= 3:        signals.append(f"Formalité élevée ({fo}/4) → signal IA")
    if fo <= 1:        signals.append(f"Registre informel ({fo}/4) → signal humain")
    if mo >= 3:        signals.append(f"Motivation forte ({mo}/4) → signal hybride/humain")
    if mo <= 1:        signals.append(f"Motivation faible ({mo}/4) → signal IA")
    if cl >= 3:        signals.append(f"Clarté élevée ({cl}/4) → signal hybride")
    if ge >= 3:        signals.append(f"Beaucoup de clichés ({ge}/4) → signal humain")
    if n_cliches == 0: signals.append("Aucun cliché détecté → signal IA")
    if n_trans >= 2:   signals.append(f"Transitions logiques présentes ({n_trans}) → signal hybride")
    if pe >= 3:        signals.append(f"Bonne personnalisation ({pe}/4) → signal hybride/humain")

    opinions_safe = {
        nom: {
            "prediction": str(avis["prediction"]),
            "proba":      {str(k): round(float(v), 3) for k, v in avis["proba"].items()},
        }
        for nom, avis in opinions.items()
    }

    return {
        "prediction":       str(prediction),
        "prediction_fr":    LABELS_FR.get(prediction, prediction),
        "niveau_confiance": niveau_confiance,
        "confidence":       round(float(proba.get(label_regles, 0)), 3),
        "spectre":          {str(k): round(float(v), 3) for k, v in proba.items()},
        "description":      DESCRIPTIONS.get(prediction, ""),
        "signaux":          signals,
        "method":           "Règles + ML_v2" if ml_v2_ok else "Règles",
        "opinions":         opinions_safe,
        "features": {
            "n_transitions": int(n_trans),
            "n_cliches":     int(n_cliches),
            "n_specific":    int(n_specific),
            "n_paragraphes": int(n_paras),
        },
    }
