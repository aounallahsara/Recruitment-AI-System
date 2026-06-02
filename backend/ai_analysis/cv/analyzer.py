"""
Orchestrateur de l'analyse d'un CV PDF.

Deux modes :
  - use_bert=False (défaut) : extraction heuristique instantanée
  - use_bert=True           : + compétences (mots-clés) + domaine NLI (~90 Mo)
                                + résumé transformer (~80 Mo)
                              Total téléchargement : ~170 Mo au lieu de ~2 Go
"""

from .extractor import extract_text_from_pdf, clean_cv_text
from .fields    import extract_cv_fields


def analyze_cv(pdf_path, use_bert=False):
    print("\n" + "="*60)
    print(f"[TRACE CV] Fichier : {pdf_path}")
    print(f"[TRACE CV] Mode    : {'BERT (NER + domaine NLI + résumé)' if use_bert else 'RAPIDE (heuristique uniquement)'}")

    raw_text   = extract_text_from_pdf(pdf_path)
    clean_text = clean_cv_text(raw_text)
    fields     = extract_cv_fields(clean_text)

    print(f"[TRACE CV] Étape 1 — Extraction heuristique (regex/patterns) :")
    print(f"  nom       : {fields.get('name','—')}")
    print(f"  diplôme   : {fields.get('degree','—')}")
    print(f"  université: {fields.get('university','—')}")
    print(f"  langues   : {fields.get('languages','—')}")
    print(f"  projets   : {len(fields.get('projects',[]))} détectés")

    result = {
        "fields":            fields,
        "skills":            [],
        "skills_method":     "none",
        "domain":            "",
        "domain_confidence": 0.0,
        "summary":           "",
        "bert_used":         False,
    }

    if not use_bert:
        print("[TRACE CV] BERT désactivé → arrêt après heuristique")
        print("="*60 + "\n")
        return result

    # ── Compétences — NER BERT + keyword matching ────────────────────────────
    try:
        from .skills import extract_skills
        skills, method           = extract_skills(clean_text)
        result["skills"]         = skills
        result["skills_method"]  = method
        print(f"[TRACE CV] Étape 2 — Compétences ({method}) : {skills[:5]}{'...' if len(skills)>5 else ''}")
    except Exception as e:
        result["skills_error"] = str(e)
        print(f"[TRACE CV] Étape 2 — Compétences ERREUR : {e}")

    # ── Domaine — règles + NLI léger cross-encoder (~90 Mo) ──────────────────
    try:
        from .domain import classify_domain
        domain, conf = classify_domain(
            result["skills"],
            text=clean_text,
            fields=fields,
        )
        result["domain"]            = domain
        result["domain_confidence"] = conf
        print(f"[TRACE CV] Étape 3 — Domaine : {domain} (confiance={conf:.2f})")
    except Exception as e:
        result["domain_error"] = str(e)
        print(f"[TRACE CV] Étape 3 — Domaine ERREUR : {e}")

    # ── Résumé — sentence-transformers all-MiniLM-L6-v2 (~80 Mo) ──────────
    try:
        from .summary import extractive_summary
        result["summary"] = extractive_summary(clean_text)
        print(f"[TRACE CV] Étape 4 — Résumé extractif : {result['summary'][:80]}...")
    except Exception as e:
        result["summary_error"] = str(e)
        print(f"[TRACE CV] Étape 4 — Résumé ERREUR : {e}")

    result["bert_used"] = True
    print("="*60 + "\n")
    return result
