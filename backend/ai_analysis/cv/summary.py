"""
Résumé extractif par embeddings de phrases — all-MiniLM-L6-v2 (~80 Mo).
Architecture transformer. Modèle déjà téléchargé avec sentence-transformers.
"""

import re

_sent_model = None


def _get_model():
    global _sent_model
    if _sent_model is None:
        from sentence_transformers import SentenceTransformer
        _sent_model = SentenceTransformer('all-MiniLM-L6-v2')
    return _sent_model


def extractive_summary(text, n=3, **kwargs):
    """
    Sélectionne les n phrases les plus représentatives du texte
    par similarité cosinus avec l'embedding du document entier.
    Modèle transformer (~80 Mo, lazy-loaded).
    """
    import numpy as np

    sentences = [s.strip() for s in re.split(r'[.!?\n]', text) if len(s.strip()) > 40]
    if len(sentences) < 2:
        return text[:300].strip()

    n = min(n, len(sentences))

    model         = _get_model()
    embeddings    = model.encode(sentences)
    doc_embedding = model.encode([text])[0]

    scores  = np.dot(embeddings, doc_embedding) / (
        np.linalg.norm(embeddings, axis=1) * np.linalg.norm(doc_embedding) + 1e-9
    )
    top_idx = sorted(np.argsort(scores)[-n:])
    return '. '.join(sentences[i] for i in top_idx) + '.'
