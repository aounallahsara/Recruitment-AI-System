"""
Entraînement du classificateur ML de style de lettre de motivation.

Approche : features numériques (scores linguistiques + métriques textuelles).
Pas de texte brut → pas de distribution shift entre données synthétiques et
lettres réelles (ChatGPT, humaines).

Dataset : ultimate_dataset.json — 1 657 lettres annotées humain/ia/hybride
Features : 6 scores pré-calculés dans le dataset + métriques extraites du texte
Sortie   : models/style_classifier.pkl

Usage :
    cd backend
    python ai_analysis/cover_letter/train_style_classifier.py
"""

import json, os, sys, pickle, warnings
warnings.filterwarnings("ignore")

import numpy as np
from sklearn.ensemble          import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model      import LogisticRegression
from sklearn.preprocessing     import LabelEncoder, StandardScaler
from sklearn.pipeline          import Pipeline
from sklearn.model_selection   import cross_val_score, StratifiedKFold, train_test_split
from sklearn.metrics           import classification_report, f1_score

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
from ai_analysis.cover_letter.scoring import score_all
from ai_analysis.cover_letter.style   import _extra_features

DS_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "..",
                       "ultimate_dataset_enriched.json")
DS_PATH = os.path.normpath(DS_PATH)

# Fallback sur le dataset original si l'enrichi n'existe pas
if not os.path.exists(DS_PATH):
    DS_PATH = r"c:\Users\zbook\Downloads\ProjetHasnaoui\ProjetHasnaoui\project\cleaned_data\ultimate_dataset.json"
    print(f"Dataset enrichi non trouvé — utilisation du dataset original")

LABEL_MAP = {
    "human": "humain", "human_scraped": "humain",
    "ai": "ia", "hybrid": "hybride",
    "humain": "humain", "ia": "ia", "hybride": "hybride",
}

FEATURE_NAMES = [
    "clarity", "motivation", "personalization", "formality",
    "lexical_richness", "genericity",
    "word_count", "avg_sent_len", "n_paragraphes", "n_transitions",
    "n_cliches", "n_specific",
]


def build_features(item):
    """
    Calcule les features avec notre scoring.py (pas les valeurs pré-calculées du dataset).
    Garantit que training features == inference features.
    """
    text   = item.get("text", "")
    scores = score_all(text)          # notre scoring.py
    avg_sent, n_paras, n_trans, n_cliches, n_specific = _extra_features(text)
    return [
        scores["clarity_score"],
        scores["motivation_score"],
        scores["personalization_score"],
        scores["formality_score"],
        scores["lexical_richness_score"],
        scores["genericity_score"],
        len(text.split()),
        avg_sent,
        n_paras,
        n_trans,
        n_cliches,
        n_specific,
    ]


def main():
    print(f"Chargement du dataset...")
    with open(DS_PATH, encoding="utf-8") as f:
        data = json.load(f)
    print(f"  {len(data)} entrées")

    X, y = [], []
    for item in data:
        label = LABEL_MAP.get(item.get("source_type", ""), "")
        if not label:
            continue
        texte = item.get("text", "")
        if len(texte.split()) < 20:
            continue
        X.append(build_features(item))
        y.append(label)

    X = np.array(X, dtype=float)
    print(f"  Après filtrage : {len(y)} échantillons")
    from collections import Counter
    print(f"  Distribution : {Counter(y)}\n")

    le = LabelEncoder()
    y  = le.fit_transform(y)
    print(f"  Classes : {list(le.classes_)}\n")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, stratify=y, random_state=42
    )

    # ── Comparaison de modèles ────────────────────────────────────────────────
    modeles = {
        "LogisticRegression": Pipeline([
            ("scaler", StandardScaler()),
            ("clf",    LogisticRegression(max_iter=1000, class_weight="balanced",
                                          C=1.0, random_state=42)),
        ]),
        "RandomForest (depth=6)": Pipeline([
            ("scaler", StandardScaler()),
            ("clf",    RandomForestClassifier(n_estimators=300, max_depth=6,
                                              class_weight="balanced",
                                              random_state=42, n_jobs=-1)),
        ]),
        "GradientBoosting": Pipeline([
            ("scaler", StandardScaler()),
            ("clf",    GradientBoostingClassifier(n_estimators=200, max_depth=4,
                                                  learning_rate=0.05,
                                                  random_state=42)),
        ]),
    }

    cv     = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    scores = {}

    print("Validation croisée (5 folds) :")
    for nom, modele in modeles.items():
        cv_f1 = cross_val_score(modele, X_train, y_train,
                                cv=cv, scoring="f1_macro", n_jobs=-1)
        scores[nom] = cv_f1.mean()
        print(f"  {nom:<30}  F1-macro = {cv_f1.mean():.4f} ± {cv_f1.std():.4f}")

    # ── Meilleur modèle ───────────────────────────────────────────────────────
    meilleur_nom    = max(scores, key=scores.get)
    meilleur_modele = modeles[meilleur_nom]

    print(f"\nMeilleur : {meilleur_nom}  (CV F1={scores[meilleur_nom]:.4f})")
    print("Entraînement final...")
    meilleur_modele.fit(X_train, y_train)

    y_pred  = meilleur_modele.predict(X_test)
    f1_test = f1_score(y_test, y_pred, average="macro")
    print(f"\nF1-macro test : {f1_test:.4f}")
    print(classification_report(y_test, y_pred, target_names=le.classes_))

    # ── Importance des features ───────────────────────────────────────────────
    clf = meilleur_modele.named_steps["clf"]
    if hasattr(clf, "feature_importances_"):
        importances = clf.feature_importances_
    elif hasattr(clf, "coef_"):
        importances = np.abs(clf.coef_).mean(axis=0)
    else:
        importances = None

    if importances is not None:
        ranked = sorted(zip(FEATURE_NAMES, importances), key=lambda x: -x[1])
        print("\nImportance des features :")
        for fname, imp in ranked:
            bar = "#" * int(imp / max(importances) * 30)
            print(f"  {fname:<22} {bar:<30} {imp:.4f}")

    # ── Sauvegarde ────────────────────────────────────────────────────────────
    output_dir = os.path.join(os.path.dirname(__file__), "models")
    os.makedirs(output_dir, exist_ok=True)

    artefacts = {
        "pipeline":      meilleur_modele,
        "label_encoder": le,
        "feature_names": FEATURE_NAMES,
        "model_name":    meilleur_nom,
        "f1_cv":         round(scores[meilleur_nom], 4),
        "f1_test":       round(f1_test, 4),
    }

    out_path = os.path.join(output_dir, "style_classifier.pkl")
    with open(out_path, "wb") as f:
        pickle.dump(artefacts, f)

    print(f"\nModèle sauvegardé : {out_path}")
    print(f"  Modèle         : {meilleur_nom}")
    print(f"  F1 CV          : {scores[meilleur_nom]:.4f}")
    print(f"  F1 test        : {f1_test:.4f}")
    print(f"  Features       : {len(FEATURE_NAMES)} dimensions")
    print(f"  Train samples  : {len(X_train)}")
    print(f"  Test  samples  : {len(X_test)}")


if __name__ == "__main__":
    main()
