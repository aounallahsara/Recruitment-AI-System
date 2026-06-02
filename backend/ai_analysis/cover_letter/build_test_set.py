"""
Construction du jeu de test RÉEL pour l'évaluation honnête du modèle v2.

Stratégie : séparer AVANT l'entraînement (même seed=42 que train_test_split
dans train_style_classifier_v2.py) pour garantir l'absence de fuite.

  Classe "humain"  : 20% des lettres human/human_scraped du dataset enrichi,
                     tirées après mélange (les 80% premiers vont au training).
  Classe "hybride" : même logique sur les lettres hybrid/hybride.
  Classe "ia"      : 20% des vraies lettres LLM, tirées après mélange
                     (les 80% premiers vont au training).

Le script écrit test_set_reel.json à la racine du projet.

Usage :
    cd backend
    python ai_analysis/cover_letter/build_test_set.py [--ratio 0.20]
"""

import os
import sys
import json
import argparse
import logging
import random
from collections import Counter

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

sys.path.insert(0, os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..")))

_RACINE = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))

DATASET_ENRICHI = os.path.join(_RACINE, "ultimate_dataset_enriched.json")
REAL_AI_MERGED  = os.path.join(_RACINE, "real_ai_letters_merged.json")
REAL_AI_CLAUDE  = os.path.join(_RACINE, "real_ai_letters_claude.json")
TEST_SET_OUTPUT = os.path.join(_RACINE, "test_set_reel.json")

LABEL_MAP = {
    "human":         "humain",
    "human_scraped": "humain",
    "humain":        "humain",
    "hybrid":        "hybride",
    "hybride":       "hybride",
}

SEED = 42


def _choisir_fichier_ia() -> str:
    if os.path.exists(REAL_AI_MERGED):
        logger.info("Lettres IA : fichier fusionné '%s'", REAL_AI_MERGED)
        return REAL_AI_MERGED
    if os.path.exists(REAL_AI_CLAUDE):
        logger.info("Lettres IA : fichier Claude seul '%s' (merged non trouvé)", REAL_AI_CLAUDE)
        return REAL_AI_CLAUDE
    logger.error(
        "Aucun fichier de vraies lettres IA trouvé.\n"
        "  Attendus : %s  ou  %s",
        REAL_AI_MERGED, REAL_AI_CLAUDE
    )
    sys.exit(1)


def main(ratio: float = 0.20) -> None:
    random.seed(SEED)

    # ── Chargement dataset enrichi (humain + hybride) ─────────────────────────
    if not os.path.exists(DATASET_ENRICHI):
        logger.error("Dataset enrichi introuvable : %s", DATASET_ENRICHI)
        sys.exit(1)

    with open(DATASET_ENRICHI, encoding="utf-8") as f:
        dataset = json.load(f)

    humains, hybrides = [], []

    for item in dataset:
        label = LABEL_MAP.get(item.get("source_type", ""), "")
        texte = item.get("text", "")
        if not label or len(texte.split()) < 20:
            continue
        entree = {"text": texte, "label": label, "source": "dataset_enrichi"}
        if label == "humain":
            humains.append(entree)
        else:
            hybrides.append(entree)

    logger.info("Dataset enrichi — humains : %d, hybrides : %d", len(humains), len(hybrides))

    # ── Chargement vraies lettres IA ──────────────────────────────────────────
    chemin_ia = _choisir_fichier_ia()
    with open(chemin_ia, encoding="utf-8") as f:
        raw_ia = json.load(f)

    ia_entries = [
        {
            "text":   item["text"],
            "label":  "ia",
            "source": os.path.basename(chemin_ia),
            "domain": item.get("domain", ""),
            "style":  item.get("style_prompt", ""),
        }
        for item in raw_ia
        if len(item.get("text", "").split()) >= 20
    ]
    logger.info("Vraies lettres IA : %d entrées", len(ia_entries))

    # ── Mélange reproductible (même seed que train_test_split v2) ─────────────
    random.shuffle(humains)
    random.shuffle(hybrides)
    random.shuffle(ia_entries)

    # Les 20% DERNIERS forment le test set — les 80% PREMIERS vont au training.
    # Cohérent avec train_test_split(..., test_size=0.20, random_state=42)
    # appliqué sur les données mélangées dans le même ordre.
    def split_test(lst):
        n = max(1, int(len(lst) * ratio))
        return lst[-n:], n

    test_humains,  n_h  = split_test(humains)
    test_hybrides, n_hy = split_test(hybrides)
    test_ia,       n_ia = split_test(ia_entries)

    test_set = test_humains + test_hybrides + test_ia
    random.shuffle(test_set)

    logger.info(
        "Test set — humain: %d, hybride: %d, ia: %d  → total: %d",
        n_h, n_hy, n_ia, len(test_set)
    )

    # Statistiques du domaine pour les lettres IA
    dom_count = Counter(e.get("domain", "?") for e in test_ia)
    sty_count = Counter(e.get("style", "?")  for e in test_ia)
    logger.info("  IA test — par domaine : %s", dict(dom_count))
    logger.info("  IA test — par style   : %s", dict(sty_count))

    with open(TEST_SET_OUTPUT, "w", encoding="utf-8") as f:
        json.dump(test_set, f, ensure_ascii=False, indent=2)

    print(f"\n=== JEU DE TEST RÉEL ===")
    print(f"  Humain      : {n_h}")
    print(f"  Hybride     : {n_hy}")
    print(f"  IA réelle   : {n_ia}  (source : {os.path.basename(chemin_ia)})")
    print(f"  TOTAL       : {len(test_set)}")
    print(f"  Fichier     : {TEST_SET_OUTPUT}")
    print(
        "\n  ⚠️  Ces entrées sont les 20% DERNIERS après mélange (seed=42).\n"
        "     train_style_classifier_v2.py utilise les 80% PREMIERS.\n"
        "     Les lettres IA du test set ne sont PAS vues à l'entraînement."
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Construit un jeu de test réel pour évaluation honnête."
    )
    parser.add_argument(
        "--ratio", type=float, default=0.20,
        help="Fraction réservée au test (défaut : 0.20)"
    )
    args = parser.parse_args()
    main(ratio=args.ratio)
