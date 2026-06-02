"""
Entraînement v2 du classificateur de style — sans fuite de features.

Corrections vs v1 :
  1. Classe "ia" synthétique remplacée par de vraies lettres LLM.
     Ordre de priorité pour le fichier source :
       1) real_ai_letters_merged.json  (Claude + Ollama fusionnés)
       2) real_ai_letters_claude.json  (Claude seul, fallback)
  2. Features : celles de features_detection.py uniquement.
     Les 6 scores de scoring.py sont exclus (fuite de features).
  3. hybrid/hybride fusionnés en une seule classe "hybride".

Sorties :
  backend/ai_analysis/cover_letter/models/style_classifier_v2.pkl
  backend/ai_analysis/cover_letter/models/training_report_v2.json

Usage :
    cd backend
    python ai_analysis/cover_letter/train_style_classifier_v2.py

    # Sans perplexité (rapide, pas besoin de transformers/GPU) :
    set DISABLE_PERPLEXITE=1
    python ai_analysis/cover_letter/train_style_classifier_v2.py
"""

import json
import os
import sys
import pickle
import warnings
import logging
import argparse
import random
from collections import Counter

warnings.filterwarnings("ignore")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

import numpy as np
from sklearn.ensemble        import RandomForestClassifier
from sklearn.linear_model    import LogisticRegression
from sklearn.preprocessing   import LabelEncoder, StandardScaler
from sklearn.pipeline        import Pipeline
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.metrics         import classification_report, f1_score, confusion_matrix

sys.path.insert(0, os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..")))
from ai_analysis.cover_letter.features_detection import extraire_features_signal

# ── Chemins ───────────────────────────────────────────────────────────────────

_RACINE = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))

DATASET_ENRICHI    = os.path.join(_RACINE, "ultimate_dataset_enriched.json")
REAL_AI_MERGED     = os.path.join(_RACINE, "real_ai_letters_merged.json")
REAL_AI_CLAUDE     = os.path.join(_RACINE, "real_ai_letters_claude.json")
OUTPUT_DIR         = os.path.join(os.path.dirname(__file__), "models")
MODEL_OUTPUT_PATH  = os.path.join(OUTPUT_DIR, "style_classifier_v2.pkl")
REPORT_OUTPUT_PATH = os.path.join(OUTPUT_DIR, "training_report_v2.json")

# ── Correspondance source_type → label normalisé ─────────────────────────────

LABEL_MAP = {
    "human":         "humain",
    "human_scraped": "humain",
    "humain":        "humain",
    "hybrid":        "hybride",
    "hybride":       "hybride",
    # "ia" synthétique du dataset enrichi : EXCLU
}

FEATURE_NAMES = [
    "burstiness",
    "repetition_ngram_3",
    "ratio_ponctuation",
    "avg_word_len",
    "ttr",
    "ratio_majuscules",
    "longueur_mots",
    "n_phrases",
    "perplexite",
]


# ── Chargement des données ────────────────────────────────────────────────────

def _choisir_fichier_ia() -> str:
    """
    Retourne le chemin du fichier de vraies lettres IA à utiliser.
    Priorité : merged > claude.
    """
    if os.path.exists(REAL_AI_MERGED):
        logger.info("Lettres IA : fichier fusionné '%s'", REAL_AI_MERGED)
        return REAL_AI_MERGED
    if os.path.exists(REAL_AI_CLAUDE):
        logger.info("Lettres IA : fichier Claude seul '%s' (merged non trouvé)", REAL_AI_CLAUDE)
        return REAL_AI_CLAUDE
    logger.error(
        "Aucun fichier de vraies lettres IA trouvé.\n"
        "  Attendus :\n"
        "    %s\n"
        "    %s\n"
        "  Copiez real_ai_letters_claude.json à la racine du projet "
        "ou lancez merge_ai_letters.py après generate_ollama_letters.py.",
        REAL_AI_MERGED, REAL_AI_CLAUDE
    )
    sys.exit(1)


def charger_donnees_humain_hybride(max_humain: int = 0) -> tuple:
    """
    Charge humain + hybride depuis ultimate_dataset_enriched.json.
    Les entrées "ia" synthétiques sont ignorées.
    """
    if not os.path.exists(DATASET_ENRICHI):
        logger.error("Dataset enrichi introuvable : %s", DATASET_ENRICHI)
        sys.exit(1)

    with open(DATASET_ENRICHI, encoding="utf-8") as f:
        data = json.load(f)

    textes, labels = [], []
    ignores = 0

    for item in data:
        src   = item.get("source_type", "")
        label = LABEL_MAP.get(src, "")
        if not label:
            ignores += 1
            continue
        texte = item.get("text", "")
        if len(texte.split()) < 20:
            continue
        textes.append(texte)
        labels.append(label)

    # Sous-échantillonnage des lettres humaines si demandé
    if max_humain > 0:
        indices_humain = [i for i, l in enumerate(labels) if l == "humain"]
        if len(indices_humain) > max_humain:
            random.seed(42)
            gardes = set(random.sample(indices_humain, max_humain))
            textes = [t for i, t in enumerate(textes) if labels[i] != "humain" or i in gardes]
            labels = [l for i, l in enumerate(labels) if l != "humain" or i in gardes]
            logger.info("Sous-échantillonnage humain : %d → %d", len(indices_humain), max_humain)

    logger.info(
        "Dataset enrichi : %d humain/hybride chargés, %d synthétiques ignorés.",
        len(textes), ignores
    )
    return textes, labels


def charger_vraies_lettres_ia(chemin: str) -> tuple:
    """
    Charge les vraies lettres IA depuis le fichier JSON choisi.
    Compatible avec les deux formats :
      - real_ai_letters_claude.json  → champ "domain"
      - real_ai_letters_merged.json  → champ "domain" + "generator"
    """
    with open(chemin, encoding="utf-8") as f:
        data = json.load(f)

    textes, labels = [], []
    for item in data:
        texte = item.get("text", "")
        if len(texte.split()) < 20:
            continue
        textes.append(texte)
        labels.append("ia")

    logger.info(
        "Vraies lettres IA (%s) : %d entrées chargées.",
        os.path.basename(chemin), len(textes)
    )
    return textes, labels


# ── Calcul des features ───────────────────────────────────────────────────────

def calculer_features(textes: list, labels: list) -> tuple:
    """
    Calcule le vecteur de features pour chaque texte.
    Les entrées en erreur sont ignorées avec un warning.
    """
    X, y_valide = [], []

    for idx, (texte, label) in enumerate(zip(textes, labels)):
        if idx % 100 == 0:
            logger.info("  Features : %d/%d...", idx, len(textes))
        try:
            feats = extraire_features_signal(texte)
            X.append([feats[nom] for nom in FEATURE_NAMES])
            y_valide.append(label)
        except Exception as exc:
            logger.warning("  Erreur features idx=%d, ignoré : %s", idx, exc)

    return np.array(X, dtype=float), y_valide


# ── Entraînement ──────────────────────────────────────────────────────────────

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    parser = argparse.ArgumentParser()
    parser.add_argument("--max_humain", type=int, default=0,
                        help="Limite les lettres humaines (0 = toutes). Ex: 300")
    args, _ = parser.parse_known_args()

    logger.info("=== ÉTAPE 1/4 : Chargement des données ===")

    chemin_ia = _choisir_fichier_ia()
    textes_hh, labels_hh = charger_donnees_humain_hybride(max_humain=args.max_humain)
    textes_ia, labels_ia  = charger_vraies_lettres_ia(chemin_ia)

    tous_textes = textes_hh + textes_ia
    tous_labels = labels_hh + labels_ia

    dist_brute = Counter(tous_labels)
    logger.info("Distribution brute : %s  (total : %d)", dict(dist_brute), len(tous_labels))

    logger.info("=== ÉTAPE 2/4 : Calcul des features (DISABLE_PERPLEXITE=%s) ===",
                os.environ.get("DISABLE_PERPLEXITE", "0"))
    X, y = calculer_features(tous_textes, tous_labels)

    dist_finale = Counter(y)
    logger.info("Distribution après filtrage : %s", dict(dist_finale))
    logger.info("Forme X : %s  |  Features : %s", X.shape, FEATURE_NAMES)

    le    = LabelEncoder()
    y_enc = le.fit_transform(y)
    logger.info("Classes encodées : %s", list(le.classes_))

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_enc, test_size=0.20, stratify=y_enc, random_state=42
    )
    logger.info("Split : train=%d  test=%d", len(X_train), len(X_test))

    logger.info("=== ÉTAPE 3/4 : Validation croisée (5 folds) ===")

    modeles = {
        "LogisticRegression": Pipeline([
            ("scaler", StandardScaler()),
            ("clf", LogisticRegression(
                max_iter=1000, class_weight="balanced", C=1.0, random_state=42
            )),
        ]),
        "RandomForest": Pipeline([
            ("scaler", StandardScaler()),
            ("clf", RandomForestClassifier(
                n_estimators=300, max_depth=8,
                class_weight="balanced", random_state=42, n_jobs=-1
            )),
        ]),
    }

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = {}

    for nom, modele in modeles.items():
        scores = cross_val_score(
            modele, X_train, y_train,
            cv=cv, scoring="f1_macro", n_jobs=-1
        )
        cv_scores[nom] = {"mean": float(scores.mean()), "std": float(scores.std())}
        logger.info("  %-22s  F1-macro CV = %.4f ± %.4f", nom, scores.mean(), scores.std())

    meilleur_nom = max(cv_scores, key=lambda n: cv_scores[n]["mean"])
    logger.info(
        "Meilleur modèle : %s  (CV F1=%.4f)",
        meilleur_nom, cv_scores[meilleur_nom]["mean"]
    )

    logger.info("=== ÉTAPE 4/4 : Entraînement final + évaluation ===")

    meilleur = modeles[meilleur_nom]
    meilleur.fit(X_train, y_train)

    y_pred  = meilleur.predict(X_test)
    f1_test = float(f1_score(y_test, y_pred, average="macro"))
    mat     = confusion_matrix(y_test, y_pred)

    print("\n" + "=" * 60)
    print(f"  F1-macro CV   : {cv_scores[meilleur_nom]['mean']:.4f} ± {cv_scores[meilleur_nom]['std']:.4f}")
    print(f"  F1-macro test : {f1_test:.4f}")
    print(f"\n  [Rappel v1] RandomForest=0.9979 / GradientBoosting=0.9986")
    print(f"  → Ces scores v1 étaient des mirages (fuite de features).")
    print("=" * 60)
    print()
    print(classification_report(y_test, y_pred, target_names=list(le.classes_)))

    print("Matrice de confusion :")
    classes = list(le.classes_)
    largeur = max(len(c) for c in classes) + 2
    print("  " + "  ".join(f"{c:>{largeur}}" for c in classes) + "  ← prédit")
    for i, cls in enumerate(classes):
        print(f"  " + "  ".join(f"{mat[i,j]:>{largeur}}" for j in range(len(classes))) + f"  {cls}")

    # Importance des features
    clf = meilleur.named_steps["clf"]
    if hasattr(clf, "feature_importances_"):
        importances = clf.feature_importances_
    elif hasattr(clf, "coef_"):
        importances = np.abs(clf.coef_).mean(axis=0)
    else:
        importances = None

    if importances is not None:
        ranked = sorted(zip(FEATURE_NAMES, importances), key=lambda x: -x[1])
        max_imp = max(v for _, v in ranked) or 1
        print("\nImportance des features :")
        for fname, imp in ranked:
            barre = "#" * int(imp / max_imp * 30)
            print(f"  {fname:<25} {barre:<30} {imp:.4f}")

    # Sauvegarde du modèle
    artefacts = {
        "pipeline":      meilleur,
        "label_encoder": le,
        "feature_names": FEATURE_NAMES,
        "model_name":    meilleur_nom,
        "f1_cv":         round(cv_scores[meilleur_nom]["mean"], 4),
        "f1_test":       round(f1_test, 4),
        "version":       "v2",
        "source_ia":     os.path.basename(chemin_ia),
    }

    with open(MODEL_OUTPUT_PATH, "wb") as f:
        pickle.dump(artefacts, f)
    logger.info("Modèle v2 sauvegardé : %s", MODEL_OUTPUT_PATH)

    # Rapport JSON
    rapport = {
        "version":      "v2",
        "best_model":   meilleur_nom,
        "source_ia":    os.path.basename(chemin_ia),
        "n_samples":    int(len(y)),
        "classes":      list(le.classes_),
        "class_dist":   {k: int(v) for k, v in dist_finale.items()},
        "feature_names": FEATURE_NAMES,
        "cv_results":   cv_scores,
        "f1_test":      round(f1_test, 4),
        "confusion_matrix": {
            "labels": list(le.classes_),
            "matrix": mat.tolist(),
        },
        "comparaison_v1": {
            "RandomForest_v1_cv_f1":     0.9979,
            "GradientBoosting_v1_cv_f1": 0.9986,
            "note": (
                "Scores v1 = artefacts de fuite (scoring.py == étiqueteur == features). "
                "Scores v2 = honnêtes (features indépendantes, données réelles)."
            ),
        },
    }

    with open(REPORT_OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(rapport, f, ensure_ascii=False, indent=2)
    logger.info("Rapport v2 sauvegardé : %s", REPORT_OUTPUT_PATH)


if __name__ == "__main__":
    main()
