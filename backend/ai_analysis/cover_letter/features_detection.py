"""
Features de détection IA indépendantes du système de scoring.

Ce module expose extraire_features_signal(texte) -> dict avec des features
qui ne fuient pas : aucune ne provient de scoring.py ni des labels du dataset.

Features implémentées :
  1. burstiness          — variance normalisée des longueurs de phrases
  2. repetition_ngram_3  — taux de trigrammes répétés
  3. ratio_ponctuation   — ponctuation / nombre de mots
  4. avg_word_len        — longueur moyenne des mots (hors stopwords)
  5. ttr                 — Type-Token Ratio (diversité lexicale)
  6. ratio_majuscules    — majuscules / total caractères alpha
  7. longueur_mots       — nombre de mots total (signal de longueur brute)
  8. n_phrases           — nombre de phrases
  9. perplexite          — perplexité via un petit LM FR (chargement paresseux)

Le modèle de langue est chargé une seule fois (singleton) au premier appel
de perplexite(). Il peut être désactivé via DISABLE_PERPLEXITE=1 pour les
environnements sans GPU ni transformers (la feature sera mise à -1.0).
"""

import re
import os
import math
import logging
from collections import Counter
from typing import Dict

logger = logging.getLogger(__name__)

# ── Variables globales pour le chargement paresseux du modèle ─────────────────
_lm_model      = None
_lm_tokenizer  = None
_lm_loaded     = None  # None = pas encore tenté, True/False = résultat


# ── Chargement paresseux du modèle de langue FR ───────────────────────────────

def _charger_modele_langue() -> bool:
    """
    Charge un petit modèle de langue français (GPT-2 fr ou équivalent).
    Retourne True si le chargement réussit, False sinon.
    Le chargement est tenté une seule fois.
    """
    global _lm_model, _lm_tokenizer, _lm_loaded

    if _lm_loaded is not None:
        return _lm_loaded

    # Désactivation explicite via variable d'environnement
    if os.environ.get("DISABLE_PERPLEXITE", "0") == "1":
        logger.info("features_detection: perplexité désactivée (DISABLE_PERPLEXITE=1)")
        _lm_loaded = False
        return False

    try:
        from transformers import AutoTokenizer, AutoModelForCausalLM
        import torch

        # Petit modèle GPT-2 français (~500 Mo) — remplaçable par tout autre LM FR
        # listant des probabilités de tokens.
        NOM_MODELE = "asi/gpt-fr-cased-small"

        logger.info("features_detection: chargement du modèle '%s'...", NOM_MODELE)
        _lm_tokenizer = AutoTokenizer.from_pretrained(NOM_MODELE)
        _lm_model     = AutoModelForCausalLM.from_pretrained(NOM_MODELE)
        _lm_model.eval()
        logger.info("features_detection: modèle '%s' chargé.", NOM_MODELE)
        _lm_loaded = True

    except Exception as exc:
        logger.warning(
            "features_detection: modèle de langue indisponible (%s). "
            "La feature perplexité sera -1.0.",
            exc
        )
        _lm_loaded = False

    return _lm_loaded


# ── Feature 1 : perplexité ─────────────────────────────────────────────────────

def perplexite(texte: str) -> float:
    """
    Perplexité du texte sous le modèle de langue FR.
    Un texte IA typique a une perplexité PLUS BASSE qu'un texte humain
    (le LLM génère des tokens très probables).

    Retourne -1.0 si le modèle n'est pas disponible.
    """
    if not _charger_modele_langue():
        return -1.0

    try:
        import torch

        # On tronque à 512 tokens pour les textes longs
        tokens = _lm_tokenizer(
            texte,
            return_tensors="pt",
            truncation=True,
            max_length=512
        )
        input_ids = tokens["input_ids"]

        with torch.no_grad():
            outputs = _lm_model(input_ids, labels=input_ids)
            # outputs.loss = NLL moyen par token
            nll = outputs.loss.item()

        return round(math.exp(nll), 4)

    except Exception as exc:
        logger.warning("features_detection: erreur perplexité — %s", exc)
        return -1.0


# ── Feature 2 : burstiness ─────────────────────────────────────────────────────

def burstiness(texte: str) -> float:
    """
    Variance normalisée des longueurs de phrases (en mots).
    Formule : (std / mean) si mean > 0, sinon 0.

    Un texte IA a tendance à avoir des phrases de longueur régulière (burstiness faible).
    Un texte humain est plus irrégulier (burstiness plus élevé).
    """
    phrases = [p.strip() for p in re.split(r"[.!?]+", texte) if len(p.strip()) > 3]
    if len(phrases) < 2:
        return 0.0

    longueurs = [len(p.split()) for p in phrases]
    moyenne   = sum(longueurs) / len(longueurs)
    if moyenne == 0:
        return 0.0

    variance  = sum((l - moyenne) ** 2 for l in longueurs) / len(longueurs)
    ecart_type = math.sqrt(variance)
    return round(ecart_type / moyenne, 4)


# ── Feature 3 : répétition de n-grammes ───────────────────────────────────────

def repetition_ngram(texte: str, n: int = 3) -> float:
    """
    Taux de n-grammes répétés = nb de n-grammes dupliqués / nb total de n-grammes.
    Un texte IA répète souvent les mêmes formules (taux plus élevé).

    Retourne 0.0 si le texte est trop court.
    """
    mots = re.findall(r"\b\w+\b", texte.lower())
    if len(mots) < n:
        return 0.0

    ngrams = [tuple(mots[i: i + n]) for i in range(len(mots) - n + 1)]
    compteur = Counter(ngrams)
    total    = len(ngrams)

    # n-grammes qui apparaissent plus d'une fois
    repetes = sum(count - 1 for count in compteur.values() if count > 1)
    return round(repetes / total, 4)


# ── Feature 4 : ratio de ponctuation ──────────────────────────────────────────

def ratio_ponctuation(texte: str) -> float:
    """
    Nombre de signes de ponctuation divisé par le nombre de mots.
    Les textes IA utilisent souvent une ponctuation très formelle et abondante.
    """
    mots = texte.split()
    if not mots:
        return 0.0

    ponctuations = re.findall(r"[.,;:!?()«»\-–—\[\]{}\"']", texte)
    return round(len(ponctuations) / len(mots), 4)


# ── Feature 5 : longueur moyenne des mots (hors stopwords) ────────────────────

# Petite liste de stopwords FR pour ne pas biaiser avg_word_len
_STOPWORDS_FR = {
    "le", "la", "les", "de", "du", "des", "un", "une", "et", "en", "à", "au",
    "aux", "est", "que", "qui", "pour", "par", "sur", "dans", "je", "il", "elle",
    "nous", "vous", "ils", "elles", "me", "ma", "mon", "mes", "ce", "se", "sa",
    "son", "ses", "ou", "si", "ne", "pas", "plus", "mais", "car", "donc",
    "avec", "tout", "très", "bien", "comme", "lui", "leur", "leurs",
}


def avg_word_len(texte: str) -> float:
    """
    Longueur moyenne des mots (en caractères), hors stopwords et chiffres.
    Les textes IA utilisent souvent un vocabulaire plus soutenu (mots plus longs).
    """
    mots = [
        m.lower() for m in re.findall(r"\b[a-zA-ZÀ-ÿ]{3,}\b", texte)
        if m.lower() not in _STOPWORDS_FR
    ]
    if not mots:
        return 0.0
    return round(sum(len(m) for m in mots) / len(mots), 4)


# ── Feature 6 : Type-Token Ratio (diversité lexicale) ─────────────────────────

def ttr(texte: str) -> float:
    """
    Type-Token Ratio = nb de mots uniques / nb de mots total.
    Mesure la diversité lexicale.
    Les textes IA ont souvent un TTR plus élevé (vocabulaire varié mais générique).
    Les textes très courts ont un TTR artificiellement élevé — on l'ignore si < 30 mots.
    """
    mots = re.findall(r"\b[a-zA-ZÀ-ÿ]+\b", texte.lower())
    if len(mots) < 30:
        return 0.0
    return round(len(set(mots)) / len(mots), 4)


# ── Feature 7 : ratio de majuscules ───────────────────────────────────────────

def ratio_majuscules(texte: str) -> float:
    """
    Proportion de lettres majuscules parmi tous les caractères alphabétiques.
    Les débuts de phrase / noms propres générent des majuscules.
    Un taux anormalement élevé peut signaler des titres ou une structure IA.
    """
    alpha = [c for c in texte if c.isalpha()]
    if not alpha:
        return 0.0
    majs = [c for c in alpha if c.isupper()]
    return round(len(majs) / len(alpha), 4)


# ── Fonction principale ────────────────────────────────────────────────────────

def extraire_features_signal(texte: str) -> Dict[str, float]:
    """
    Extrait toutes les features de détection IA et retourne un dictionnaire.

    Les features sont indépendantes du système de scoring.py — elles n'utilisent
    ni clarity_score, ni motivation_score, ni aucun autre score du pipeline existant.

    Retour :
        {
          "burstiness":          float,   # variance normalisée des longueurs de phrases
          "repetition_ngram_3":  float,   # taux de trigrammes répétés
          "ratio_ponctuation":   float,   # ponctuation / mots
          "avg_word_len":        float,   # longueur moyenne des mots substantiels
          "ttr":                 float,   # diversité lexicale
          "ratio_majuscules":    float,   # proportion de majuscules
          "longueur_mots":       int,     # nb de mots
          "n_phrases":           int,     # nb de phrases
          "perplexite":          float,   # perplexité LM (-1.0 si indisponible)
        }
    """
    mots    = texte.split()
    phrases = [p.strip() for p in re.split(r"[.!?]+", texte) if len(p.strip()) > 3]

    return {
        "burstiness":         burstiness(texte),
        "repetition_ngram_3": repetition_ngram(texte, n=3),
        "ratio_ponctuation":  ratio_ponctuation(texte),
        "avg_word_len":       avg_word_len(texte),
        "ttr":                ttr(texte),
        "ratio_majuscules":   ratio_majuscules(texte),
        "longueur_mots":      len(mots),
        "n_phrases":          len(phrases),
        "perplexite":         perplexite(texte),
    }


# ── Test rapide ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    TEXTE_TEST = (
        "Madame, Monsieur,\n\n"
        "Passionné par l'informatique depuis mon plus jeune âge, j'ai naturellement "
        "orienté mes études vers le génie logiciel. Après un master à l'université "
        "de Lyon, j'ai travaillé deux ans chez une startup où j'ai appris à gérer "
        "des projets de A à Z.\n\n"
        "Votre entreprise m'attire particulièrement pour ses valeurs d'innovation. "
        "Je suis convaincu de pouvoir apporter une contribution significative.\n\n"
        "Je reste à votre disposition pour tout entretien.\n"
        "Cordialement."
    )
    features = extraire_features_signal(TEXTE_TEST)
    print("Features extraites :")
    for nom, valeur in features.items():
        print(f"  {nom:<25} = {valeur}")
