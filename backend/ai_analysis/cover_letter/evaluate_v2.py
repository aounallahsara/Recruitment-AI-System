"""
Évaluation honnête du modèle v2 sur le jeu de test RÉEL.

Compare explicitement les métriques v2 (vraies lettres IA, features sans fuite)
avec les chiffres v1 (RandomForest=0.9979, GradientBoosting=0.9986 en CV
sur données synthétiques avec fuite de features).

Prérequis (dans l'ordre) :
  1. real_ai_letters_claude.json  (ou merged) à la racine du projet
  2. python build_test_set.py          → test_set_reel.json
  3. python train_style_classifier_v2.py  → models/style_classifier_v2.pkl

Usage :
    cd backend
    python ai_analysis/cover_letter/evaluate_v2.py

    # Sans perplexité :
    set DISABLE_PERPLEXITE=1
    python ai_analysis/cover_letter/evaluate_v2.py
"""

import os
import sys
import json
import pickle
import logging
from collections import Counter

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

import numpy as np
from sklearn.metrics import (
    f1_score, classification_report,
    confusion_matrix, accuracy_score,
)

sys.path.insert(0, os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..")))
from ai_analysis.cover_letter.features_detection import extraire_features_signal

_RACINE     = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
_MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")

TEST_SET_PATH = os.path.join(_RACINE, "test_set_reel.json")
MODEL_V2_PATH = os.path.join(_MODELS_DIR, "style_classifier_v2.pkl")
REPORT_PATH   = os.path.join(_MODELS_DIR, "evaluation_report_v2.json")

# Métriques v1 pour la comparaison directe
V1 = {
    "RandomForest_cv_f1":     0.9979,
    "GradientBoosting_cv_f1": 0.9986,
    "note": (
        "CV sur données synthétiques + fuite de features "
        "(scoring.py == étiqueteur == features d'entrée). Pas généralisable."
    ),
}

FEATURE_NAMES = [
    "burstiness", "repetition_ngram_3", "ratio_ponctuation",
    "avg_word_len", "ttr", "ratio_majuscules",
    "longueur_mots", "n_phrases", "perplexite",
]


# ── Helpers ───────────────────────────────────────────────────────────────────

def charger_modele():
    if not os.path.exists(MODEL_V2_PATH):
        logger.error(
            "Modèle v2 introuvable : %s\n"
            "  Lancez d'abord : python train_style_classifier_v2.py",
            MODEL_V2_PATH
        )
        sys.exit(1)
    with open(MODEL_V2_PATH, "rb") as f:
        art = pickle.load(f)
    logger.info(
        "Modèle v2 chargé : %s  (F1-cv=%.4f, F1-test-train=%.4f, source_ia=%s)",
        art["model_name"], art["f1_cv"], art["f1_test"], art.get("source_ia", "?")
    )
    return art["pipeline"], art["label_encoder"]


def charger_test_set():
    if not os.path.exists(TEST_SET_PATH):
        logger.error(
            "Jeu de test introuvable : %s\n"
            "  Lancez d'abord : python build_test_set.py",
            TEST_SET_PATH
        )
        sys.exit(1)
    with open(TEST_SET_PATH, encoding="utf-8") as f:
        data = json.load(f)
    logger.info("Test set chargé : %d entrées.", len(data))
    return data


def vectoriser(textes):
    X = []
    for idx, texte in enumerate(textes):
        if idx % 50 == 0:
            logger.info("  Vectorisation %d/%d...", idx, len(textes))
        feats = extraire_features_signal(texte)
        X.append([feats[nom] for nom in FEATURE_NAMES])
    return np.array(X, dtype=float)


def afficher_matrice(mat, classes):
    w = max(len(c) for c in classes) + 2
    print("  " + "  ".join(f"{c:>{w}}" for c in classes) + "   ← PRÉDIT")
    for i, cls in enumerate(classes):
        print("  " + "  ".join(f"{mat[i,j]:>{w}}" for j in range(len(classes))) + f"   {cls}")


# ── Analyse des erreurs par sous-groupe ──────────────────────────────────────

def analyser_erreurs_ia(test_data, y_true, y_pred, le):
    """Détail des erreurs sur la classe IA par style de prompt."""
    ia_idx   = list(le.classes_).index("ia") if "ia" in le.classes_ else -1
    if ia_idx == -1:
        return

    print("\n── Erreurs sur la classe IA par style de prompt ──")
    styles = {}
    for i, item in enumerate(test_data):
        if item.get("label") != "ia":
            continue
        style    = item.get("style", "?")
        correct  = (y_pred[i] == y_true[i])
        if style not in styles:
            styles[style] = {"correct": 0, "total": 0}
        styles[style]["total"] += 1
        if correct:
            styles[style]["correct"] += 1

    for style, stats in sorted(styles.items()):
        pct = 100 * stats["correct"] / stats["total"] if stats["total"] else 0
        bar = "#" * int(pct / 100 * 20)
        print(f"  {style:<20} {bar:<20}  {stats['correct']}/{stats['total']}  ({pct:.0f}% corrects)")


# ── Point d'entrée ────────────────────────────────────────────────────────────

def main():
    pipeline, le = charger_modele()
    test_data    = charger_test_set()

    textes = [item["text"]  for item in test_data]
    labels = [item["label"] for item in test_data]

    dist = Counter(labels)
    logger.info("Distribution test set : %s", dict(dist))

    logger.info("=== Vectorisation ===")
    X_test = vectoriser(textes)

    try:
        y_true = le.transform(labels)
    except ValueError as exc:
        logger.error("Label inconnu dans le test set : %s", exc)
        sys.exit(1)

    y_pred   = pipeline.predict(X_test)
    classes  = list(le.classes_)

    f1_macro    = float(f1_score(y_true, y_pred, average="macro"))
    f1_classes  = f1_score(y_true, y_pred, average=None, labels=list(range(len(classes))))
    acc         = float(accuracy_score(y_true, y_pred))
    mat         = confusion_matrix(y_true, y_pred)

    erreurs = [i for i in range(len(labels)) if y_true[i] != y_pred[i]]

    # ── Affichage ─────────────────────────────────────────────────────────────
    print("\n" + "=" * 70)
    print("  ÉVALUATION HONNÊTE — MODÈLE v2 — DONNÉES RÉELLES")
    print("=" * 70)

    print(f"\n  F1-macro  (v2 données réelles) : {f1_macro:.4f}")
    print(f"  Accuracy  (v2 données réelles) : {acc:.4f}")

    print()
    print("  ┌─── Comparaison v1 (données synthétiques + fuite features) ────┐")
    print(f"  │  RandomForest     v1  CV F1 : {V1['RandomForest_cv_f1']:.4f}   ← MIRAGE     │")
    print(f"  │  GradientBoosting v1  CV F1 : {V1['GradientBoosting_cv_f1']:.4f}   ← MIRAGE     │")
    print(f"  │  Modèle v2        test F1   : {f1_macro:.4f}   ← HONNÊTE     │")
    delta = f1_macro - V1["RandomForest_cv_f1"]
    print(f"  │  Écart réel                 : {delta:+.4f}                    │")
    print("  └────────────────────────────────────────────────────────────────┘")

    print("\n── Rapport par classe ──")
    print(classification_report(y_true, y_pred, target_names=classes))

    print("── Matrice de confusion ──")
    print(f"  Classes : {classes}   (lignes = vrai, colonnes = prédit)")
    afficher_matrice(mat, classes)

    print("\n── F1 par classe ──")
    for cls, f1 in zip(classes, f1_classes):
        barre = "#" * int(f1 * 30)
        print(f"  {cls:<10} {barre:<30} {f1:.4f}")

    print(f"\n── Erreurs : {len(erreurs)}/{len(labels)} ({100*len(erreurs)/len(labels):.1f}%) ──")
    if erreurs:
        types_err = Counter(f"{labels[i]}→{classes[y_pred[i]]}" for i in erreurs)
        for err_type, cnt in types_err.most_common():
            print(f"  {err_type:<25} : {cnt}")

        print("\n  Exemples (5 premiers) :")
        for i in erreurs[:5]:
            extrait = textes[i][:100].replace("\n", " ")
            print(f"  [vrai={labels[i]:>7} | prédit={classes[y_pred[i]]:>7}]  {extrait!r}")

    analyser_erreurs_ia(test_data, y_true, y_pred, le)

    # ── Sauvegarde ────────────────────────────────────────────────────────────
    rapport = {
        "modele":       "style_classifier_v2",
        "n_test":       int(len(labels)),
        "distribution": {k: int(v) for k, v in dist.items()},
        "f1_macro":     round(f1_macro, 4),
        "accuracy":     round(acc, 4),
        "f1_par_classe": {cls: round(float(f1), 4) for cls, f1 in zip(classes, f1_classes)},
        "confusion_matrix": {
            "labels": classes,
            "matrix": mat.tolist(),
        },
        "n_erreurs":     len(erreurs),
        "taux_erreur":   round(len(erreurs) / len(labels), 4),
        "comparaison_v1": V1,
    }

    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(rapport, f, ensure_ascii=False, indent=2)

    print(f"\n  Rapport JSON : {REPORT_PATH}")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    main()
