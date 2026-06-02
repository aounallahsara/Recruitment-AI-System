"""
Extraction de texte depuis un PDF de CV et nettoyage du contenu.
"""

import re


def extract_text_from_pdf(path):
    """
    Tente d'extraire le texte d'un PDF via pdfplumber puis PyMuPDF (fitz).
    Lève RuntimeError si les deux méthodes échouent.
    """
    try:
        import pdfplumber
        with pdfplumber.open(path) as pdf:
            text = "\n".join(p.extract_text() or "" for p in pdf.pages).strip()
        if len(text) > 50:
            return text
    except Exception:
        pass

    try:
        import fitz
        doc  = fitz.open(path)
        text = "\n".join(page.get_text() for page in doc).strip()
        if len(text) > 50:
            return text
    except Exception:
        pass

    raise RuntimeError(
        "Impossible d'extraire le texte. "
        "Vérifiez que le PDF contient du texte (pas une image scannée)."
    )


def clean_cv_text(text):
    """
    Supprime les artefacts PDF courants : emails, URLs, téléphones,
    caractères parasites, puis normalise les espaces.
    """
    # Artefacts pdfplumber
    text = re.sub(r'\(cid:\d+\)', " ", text)

    # Données personnelles identifiables (non utiles pour l'analyse ML)
    text = re.sub(r'\b[\w\.-]+@[\w\.-]+\.\w{2,}\b', '', text)
    text = re.sub(r'(https?://|www\.)\S+', '', text)
    text = re.sub(r'[a-zA-Z0-9.-]+\.(com|net|org|io|me|fr)\b(/\S*)?', '', text)
    text = re.sub(r'[\+\(]?[\d\s\-\(\)]{9,}', '', text)

    # Caractères non-alphanumériques inutiles
    text = re.sub(r'[^\w\s]', '', text)

    return re.sub(r'\s+', ' ', text).strip()
