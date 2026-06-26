"""
Évaluation complète du modèle v2 sur données réelles.

Métriques calculées :
  - F1-macro, Accuracy, Precision, Recall par classe
  - Cohen's Kappa (κ) — accord corrigé pour le hasard
  - MCC — Matthews Correlation Coefficient (meilleure métrique pour classes déséquilibrées)
  - AUC-ROC par classe (one-vs-rest)
  - Matrice de confusion
  - Courbe d'apprentissage (F1 vs taille du dataset)
  - Ablation study (impact de chaque feature)
  - Analyse de confiance (erreurs vs confiance)

Prérequis :
  - test_set_reel.json       → python build_test_set.py
  - style_classifier_v2.pkl  → python train_style_classifier_v2.py

Usage :
    cd backend
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
    f1_score, classification_report, confusion_matrix,
    accuracy_score, cohen_kappa_score, matthews_corrcoef,
    roc_auc_score, roc_curve, precision_score, recall_score,
    log_loss, brier_score_loss,
)
from sklearn.model_selection import learning_curve, StratifiedKFold
from sklearn.preprocessing import label_binarize

sys.path.insert(0, os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..")))
from ai_analysis.cover_letter.features_detection import extraire_features_signal

_RACINE     = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
_MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")

TEST_SET_PATH = os.path.join(_RACINE, "test_set_reel.json")
MODEL_V2_PATH = os.path.join(_MODELS_DIR, "style_classifier_v2.pkl")
REPORT_PATH   = os.path.join(_MODELS_DIR, "evaluation_report_v2.json")

FEATURE_NAMES = [
    "burstiness", "repetition_ngram_3", "ratio_ponctuation",
    "avg_word_len", "ttr", "ratio_majuscules",
    "longueur_mots", "n_phrases",
]

V1_REF = {
    "RandomForest_cv_f1": 0.9979,
    "GradientBoosting_cv_f1": 0.9986,
    "note": "CV sur données synthétiques + fuite features — pas généralisable.",
}


def charger_modele():
    if not os.path.exists(MODEL_V2_PATH):
        logger.error("Modèle v2 introuvable. Lancez train_style_classifier_v2.py d'abord.")
        sys.exit(1)
    with open(MODEL_V2_PATH, "rb") as f:
        art = pickle.load(f)
    logger.info("Modèle : %s  F1-cv=%.4f  F1-test=%.4f  source_ia=%s",
                art["model_name"], art["f1_cv"], art["f1_test"], art.get("source_ia","?"))
    return art["pipeline"], art["label_encoder"], art


def charger_test_set():
    if not os.path.exists(TEST_SET_PATH):
        logger.error("Test set introuvable. Lancez build_test_set.py d'abord.")
        sys.exit(1)
    with open(TEST_SET_PATH, encoding="utf-8") as f:
        data = json.load(f)
    logger.info("Test set : %d entrées", len(data))
    return data


def vectoriser(textes):
    X = []
    for idx, t in enumerate(textes):
        if idx % 50 == 0:
            logger.info("  Vectorisation %d/%d...", idx, len(textes))
        feats = extraire_features_signal(t)
        X.append([feats[n] for n in FEATURE_NAMES])
    return np.array(X, dtype=float)


def afficher_section(titre):
    print("\n" + "─" * 65)
    print(f"  {titre}")
    print("─" * 65)


# ── Courbe d'apprentissage ────────────────────────────────────────────────────

def courbe_apprentissage(pipeline, X_train, y_train):
    """Calcule le F1-macro en fonction de la taille du dataset."""
    afficher_section("COURBE D'APPRENTISSAGE")
    cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)
    sizes = np.linspace(0.20, 1.0, 6)
    train_sizes, train_scores, val_scores = learning_curve(
        pipeline, X_train, y_train,
        train_sizes=sizes, cv=cv,
        scoring="f1_macro", n_jobs=-1
    )
    print(f"\n  {'Taille train':<15} {'F1 train':<15} {'F1 validation'}")
    for sz, tr, va in zip(train_sizes, train_scores.mean(1), val_scores.mean(1)):
        ecart = '⚠️ Overfitting' if tr - va > 0.08 else ''
        print(f"  {int(sz):<15} {tr:<15.4f} {va:.4f}  {ecart}")
    return {
        "train_sizes": train_sizes.tolist(),
        "train_f1":    train_scores.mean(1).tolist(),
        "val_f1":      val_scores.mean(1).tolist(),
    }


# ── Ablation study ────────────────────────────────────────────────────────────

def ablation_study(pipeline, X_train, y_train, X_test, y_test):
    """Retire chaque feature une par une et mesure la chute de F1."""
    afficher_section("ABLATION STUDY — Impact de chaque feature")

    from sklearn.base import clone
    baseline = f1_score(y_test, pipeline.predict(X_test), average="macro")
    print(f"\n  Baseline (toutes features) : F1 = {baseline:.4f}")
    print(f"  {'Feature retirée':<25} {'F1 sans elle':<15} {'Chute':<10} Importance")

    resultats = []
    for i, feat in enumerate(FEATURE_NAMES):
        X_tr_abla = np.delete(X_train, i, axis=1)
        X_te_abla = np.delete(X_test,  i, axis=1)

        from sklearn.pipeline import Pipeline
        from sklearn.preprocessing import StandardScaler
        from sklearn.ensemble import RandomForestClassifier

        modele_clone = Pipeline([
            ("scaler", StandardScaler()),
            ("clf",    RandomForestClassifier(
                n_estimators=100, max_depth=8,
                class_weight="balanced", random_state=42, n_jobs=-1
            )),
        ])
        modele_clone.fit(X_tr_abla, y_train)
        f1_sans = f1_score(y_test, modele_clone.predict(X_te_abla), average="macro")
        chute   = baseline - f1_sans
        barre   = "#" * int(abs(chute) * 200)
        print(f"  {feat:<25} {f1_sans:<15.4f} {chute:+.4f}    {barre}")
        resultats.append({"feature": feat, "f1_sans": round(f1_sans, 4),
                           "chute": round(float(chute), 4)})

    return sorted(resultats, key=lambda x: -x["chute"])


# ── Analyse de confiance ──────────────────────────────────────────────────────

def analyse_confiance(pipeline, X_test, y_test, classes):
    """Quand le modèle se trompe, était-il confiant ?"""
    afficher_section("ANALYSE DE CONFIANCE")
    probas    = pipeline.predict_proba(X_test)
    y_pred    = pipeline.predict(X_test)
    max_proba = probas.max(axis=1)

    correct   = (y_pred == y_test)
    erreurs   = ~correct

    conf_correct = max_proba[correct].mean()
    conf_erreur  = max_proba[erreurs].mean()

    print(f"\n  Confiance moyenne — prédictions CORRECTES : {conf_correct:.3f} ({conf_correct*100:.1f}%)")
    print(f"  Confiance moyenne — prédictions INCORRECTES: {conf_erreur:.3f} ({conf_erreur*100:.1f}%)")

    seuils = [0.50, 0.60, 0.70, 0.80, 0.90]
    print(f"\n  {'Seuil confiance':<18} {'Couverture':<12} {'F1 sur couverts'}")
    for seuil in seuils:
        masque = max_proba >= seuil
        if masque.sum() == 0:
            continue
        couverture = masque.mean()
        f1_filtre  = f1_score(y_test[masque], y_pred[masque], average="macro")
        print(f"  ≥ {seuil:.0%}           {couverture:.1%}       {f1_filtre:.4f}")

    return {
        "conf_correcte":  round(float(conf_correct), 4),
        "conf_incorrecte": round(float(conf_erreur), 4),
    }


# ── AUC-ROC ───────────────────────────────────────────────────────────────────

def calculer_auc(pipeline, X_test, y_test, classes):
    """AUC-ROC one-vs-rest pour chaque classe."""
    afficher_section("AUC-ROC PAR CLASSE (one-vs-rest)")
    probas  = pipeline.predict_proba(X_test)
    y_bin   = label_binarize(y_test, classes=list(range(len(classes))))
    resultats = {}

    print()
    for i, cls in enumerate(classes):
        if y_bin.shape[1] == 1:
            continue
        auc = roc_auc_score(y_bin[:, i], probas[:, i])
        barre = "#" * int(auc * 30)
        print(f"  {cls:<12} AUC = {auc:.4f}  {barre}")
        resultats[cls] = round(auc, 4)

    try:
        auc_macro = roc_auc_score(y_bin, probas, average="macro", multi_class="ovr")
        print(f"\n  AUC-macro  = {auc_macro:.4f}")
        resultats["macro"] = round(auc_macro, 4)
    except Exception:
        pass

    return resultats


# ── Point d'entrée ────────────────────────────────────────────────────────────

def main():
    pipeline, le, art = charger_modele()
    test_data         = charger_test_set()

    textes = [d["text"]  for d in test_data]
    labels = [d["label"] for d in test_data]
    dist   = Counter(labels)
    classes = list(le.classes_)

    logger.info("Distribution test set : %s", dict(dist))
    logger.info("Vectorisation...")
    X_test = vectoriser(textes)

    try:
        y_true = le.transform(labels)
    except ValueError as e:
        logger.error("Label inconnu : %s", e); sys.exit(1)

    y_pred   = pipeline.predict(X_test)
    probas   = pipeline.predict_proba(X_test)

    # ── Métriques principales ─────────────────────────────────────────────────
    f1_macro  = float(f1_score(y_true, y_pred, average="macro"))
    acc       = float(accuracy_score(y_true, y_pred))
    kappa     = float(cohen_kappa_score(y_true, y_pred))
    mcc       = float(matthews_corrcoef(y_true, y_pred))
    logloss   = float(log_loss(y_true, probas))
    mat       = confusion_matrix(y_true, y_pred)
    f1_cls    = f1_score(y_true, y_pred, average=None, labels=list(range(len(classes))))
    prec_cls  = precision_score(y_true, y_pred, average=None, labels=list(range(len(classes))))
    rec_cls   = recall_score(y_true, y_pred, average=None, labels=list(range(len(classes))))

    # ── Affichage principal ───────────────────────────────────────────────────
    print("\n" + "=" * 65)
    print("  ÉVALUATION COMPLÈTE — MODÈLE v2 — DONNÉES RÉELLES")
    print("=" * 65)

    print(f"\n  F1-macro    : {f1_macro:.4f}")
    print(f"  Accuracy    : {acc:.4f}")
    print(f"  Cohen's κ   : {kappa:.4f}   {'Excellent (>0.80)' if kappa>0.80 else 'Bon (>0.60)' if kappa>0.60 else 'Modéré'}")
    print(f"  MCC         : {mcc:.4f}   {'Excellent (>0.80)' if mcc>0.80 else 'Bon (>0.60)' if mcc>0.60 else 'Modéré'}")
    print(f"  Log-loss    : {logloss:.4f}   (plus faible = mieux calibré)")

    print(f"\n  ┌── Comparaison v1 (DATA LEAKAGE + SYNTHÉTIQUE) ──────────┐")
    print(f"  │  RF v1  CV F1 : {V1_REF['RandomForest_cv_f1']:.4f}  ← MIRAGE                   │")
    print(f"  │  GB v1  CV F1 : {V1_REF['GradientBoosting_cv_f1']:.4f}  ← MIRAGE                   │")
    print(f"  │  RF v2  test  : {f1_macro:.4f}  ← HONNÊTE (données réelles) │")
    print(f"  └──────────────────────────────────────────────────────────┘")

    afficher_section("RAPPORT DÉTAILLÉ PAR CLASSE")
    print()
    print(classification_report(y_true, y_pred, target_names=classes))

    print(f"\n  {'Classe':<12} {'Precision':<12} {'Recall':<12} {'F1':<12}")
    for cls, p, r, f in zip(classes, prec_cls, rec_cls, f1_cls):
        print(f"  {cls:<12} {p:<12.4f} {r:<12.4f} {f:<12.4f}")

    afficher_section("MATRICE DE CONFUSION")
    print(f"\n  Lignes = vrai   |   Colonnes = prédit   |   Classes : {classes}")
    w = max(len(c) for c in classes) + 2
    print("  " + "  ".join(f"{c:>{w}}" for c in classes) + "   ← PRÉDIT")
    for i, cls in enumerate(classes):
        print("  " + "  ".join(f"{mat[i,j]:>{w}}" for j in range(len(classes))) + f"   {cls}")

    # ── AUC-ROC ───────────────────────────────────────────────────────────────
    auc_scores = calculer_auc(pipeline, X_test, y_true, classes)

    # ── Analyse de confiance ──────────────────────────────────────────────────
    conf_analyse = analyse_confiance(pipeline, X_test, y_true, classes)

    # ── Courbe d'apprentissage + ablation (nécessitent les données de training) ──
    train_data = None
    real_ai_path = os.path.join(_RACINE, "real_ai_letters_merged.json")
    if not os.path.exists(real_ai_path):
        real_ai_path = os.path.join(_RACINE, "real_ai_letters_claude.json")

    learning_res = None
    ablation_res = None

    if os.path.exists(real_ai_path):
        logger.info("Chargement des données d'entraînement pour courbe + ablation...")
        from ai_analysis.cover_letter.train_style_classifier_v2 import (
            charger_donnees_humain_hybride, charger_vraies_lettres_ia
        )
        try:
            tx_hh, lb_hh = charger_donnees_humain_hybride(max_humain=300)
            tx_ia, lb_ia = charger_vraies_lettres_ia(real_ai_path)
            tous = tx_hh + tx_ia
            tous_lbl = lb_hh + lb_ia
            logger.info("Vectorisation du training set (%d exemples)...", len(tous))
            X_tr = vectoriser(tous)
            y_tr = le.transform(tous_lbl)
            learning_res = courbe_apprentissage(pipeline, X_tr, y_tr)
            ablation_res = ablation_study(pipeline, X_tr, y_tr, X_test, y_true)
        except Exception as e:
            logger.warning("Courbe/ablation impossibles : %s", e)

    # ── Erreurs par style prompt ──────────────────────────────────────────────
    afficher_section("ERREURS IA PAR STYLE DE PROMPT")
    styles = {}
    ia_idx = list(classes).index("ia") if "ia" in classes else -1
    for i, item in enumerate(test_data):
        if item.get("label") != "ia":
            continue
        style = item.get("style", "?")
        correct = (y_pred[i] == y_true[i])
        if style not in styles:
            styles[style] = {"correct": 0, "total": 0}
        styles[style]["total"] += 1
        if correct:
            styles[style]["correct"] += 1
    print()
    for style, st in sorted(styles.items()):
        pct = 100 * st["correct"] / st["total"] if st["total"] else 0
        barre = "#" * int(pct / 100 * 20)
        print(f"  {style:<22} {barre:<20}  {st['correct']}/{st['total']}  ({pct:.0f}% corrects)")

    # ── Sauvegarde JSON ───────────────────────────────────────────────────────
    rapport = {
        "modele":           "style_classifier_v2",
        "n_test":           len(labels),
        "distribution":     {k: int(v) for k, v in dist.items()},
        "f1_macro":         round(f1_macro, 4),
        "accuracy":         round(acc, 4),
        "cohen_kappa":      round(kappa, 4),
        "mcc":              round(mcc, 4),
        "log_loss":         round(logloss, 4),
        "auc_roc":          auc_scores,
        "f1_par_classe":    {cls: round(float(f), 4) for cls, f in zip(classes, f1_cls)},
        "precision_par_classe": {cls: round(float(p), 4) for cls, p in zip(classes, prec_cls)},
        "recall_par_classe":    {cls: round(float(r), 4) for cls, r in zip(classes, rec_cls)},
        "confusion_matrix": {"labels": classes, "matrix": mat.tolist()},
        "confiance":        conf_analyse,
        "ablation":         ablation_res or [],
        "courbe_apprentissage": learning_res or {},
        "comparaison_v1":   V1_REF,
    }

    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(rapport, f, ensure_ascii=False, indent=2)

    print(f"\n  Rapport JSON : {REPORT_PATH}")
    print("=" * 65 + "\n")


if __name__ == "__main__":
    main()
