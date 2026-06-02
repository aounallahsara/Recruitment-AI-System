"""
Génération de vraies lettres IA via l'API Anthropic pour corriger le distribution shift.

Problème : la classe "ia" du dataset actuel contient des lettres générées par des
templates synthétiques, pas par de vrais LLM (ChatGPT/Claude). Les modèles ML entraînés
sur ces données ne généralisent pas à de vraies lettres IA.

Solution : générer ~300 lettres via Claude (API Anthropic) en variant les domaines,
les styles de prompt et les longueurs.

Usage :
    python generate_real_ai_letters.py [--n 300] [--output real_ai_letters.json]
"""

import os
import sys
import json
import time
import random
import argparse
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

# ── Configuration ──────────────────────────────────────────────────────────────

# 9 domaines du projet
DOMAINES = [
    "Informatique / Génie Logiciel",
    "Génie Civil",
    "Génie Mécanique",
    "Génie Électrique",
    "Architecture",
    "Finance / Comptabilité",
    "Ressources Humaines",
    "Géologie / Sciences de la Terre",
    "Logistique / Supply Chain",
]

# Postes par domaine pour varier les lettres
POSTES_PAR_DOMAINE = {
    "Informatique / Génie Logiciel": [
        "développeur full-stack", "ingénieur DevOps", "data scientist",
        "ingénieur en cybersécurité", "chef de projet IT",
    ],
    "Génie Civil": [
        "ingénieur structure", "conducteur de travaux", "ingénieur géotechnique",
        "chargé d'études VRD", "ingénieur BTP",
    ],
    "Génie Mécanique": [
        "ingénieur conception mécanique", "technicien bureau d'études",
        "ingénieur maintenance industrielle", "responsable qualité production",
    ],
    "Génie Électrique": [
        "ingénieur automaticien", "électricien industriel",
        "ingénieur en énergie renouvelable", "technicien en électrotechnique",
    ],
    "Architecture": [
        "architecte junior", "urbaniste", "dessinateur projeteur",
        "chargé de projet architecture", "maître d'œuvre",
    ],
    "Finance / Comptabilité": [
        "analyste financier", "contrôleur de gestion", "auditeur",
        "comptable", "responsable trésorerie",
    ],
    "Ressources Humaines": [
        "chargé de recrutement", "responsable formation",
        "gestionnaire de paie", "chargé des relations sociales",
    ],
    "Géologie / Sciences de la Terre": [
        "géologue de terrain", "hydrogéologue", "ingénieur environnement",
        "technicien en SIG", "géophysicien",
    ],
    "Logistique / Supply Chain": [
        "responsable logistique", "coordinateur supply chain",
        "gestionnaire d'entrepôt", "planificateur de production",
    ],
}

# 3 styles de prompt (neutre / naturel / anti-IA)
STYLES_PROMPT = [
    {
        "nom": "neutre",
        "instruction": (
            "Rédige une lettre de motivation professionnelle en français "
            "pour le poste de {poste} dans le domaine {domaine}."
        ),
    },
    {
        "nom": "naturel",
        "instruction": (
            "Rédige une lettre de motivation en français pour le poste de {poste} "
            "dans le domaine {domaine}. "
            "Rends-la naturelle et humaine : utilise un style personnel, évite les "
            "formules trop génériques, montre une vraie personnalité et des détails concrets."
        ),
    },
    {
        "nom": "anti_ia",
        "instruction": (
            "Rédige une lettre de motivation en français pour le poste de {poste} "
            "dans le domaine {domaine}. "
            "Évite absolument de sonner comme une IA : pas de structure rigide, "
            "pas de listes implicites, pas de tournures trop formelles ou robotiques. "
            "Écris comme un vrai candidat qui parle sincèrement de sa motivation."
        ),
    },
]

# Contraintes de longueur pour varier
LONGUEURS = [
    {"label": "courte",  "contrainte": "La lettre doit faire entre 100 et 150 mots."},
    {"label": "moyenne", "contrainte": "La lettre doit faire entre 200 et 280 mots."},
    {"label": "longue",  "contrainte": "La lettre doit faire entre 320 et 420 mots."},
]


def construire_prompt(domaine: str, poste: str, style: dict, longueur: dict) -> str:
    """Assemble le prompt complet envoyé à Claude."""
    instruction = style["instruction"].format(poste=poste, domaine=domaine)
    return (
        f"{instruction}\n\n"
        f"{longueur['contrainte']}\n\n"
        "Réponds uniquement avec le texte de la lettre, sans titre, "
        "sans 'Voici la lettre', sans commentaire explicatif."
    )


def generer_lettre(client, prompt: str, max_retries: int = 5) -> str:
    """
    Appelle l'API Anthropic avec retry exponentiel sur les erreurs de rate limit.
    Retourne le texte de la lettre ou lève une exception après les retries.
    """
    import anthropic

    delai = 5.0  # délai initial en secondes
    for tentative in range(max_retries):
        try:
            message = client.messages.create(
                model="claude-haiku-4-5-20251001",  # modèle rapide et économique
                max_tokens=600,
                messages=[{"role": "user", "content": prompt}],
            )
            return message.content[0].text.strip()

        except anthropic.RateLimitError as exc:
            if tentative == max_retries - 1:
                raise
            logger.warning(
                "Rate limit (tentative %d/%d) — attente %.0fs : %s",
                tentative + 1, max_retries, delai, exc
            )
            time.sleep(delai)
            delai = min(delai * 2, 60.0)  # backoff exponentiel, plafonné à 60s

        except anthropic.APIError as exc:
            if tentative == max_retries - 1:
                raise
            logger.warning(
                "Erreur API (tentative %d/%d) — attente %.0fs : %s",
                tentative + 1, max_retries, delai, exc
            )
            time.sleep(delai)
            delai = min(delai * 2, 60.0)


def generer_lettres(n_total: int, output_path: str) -> None:
    """
    Génère n_total lettres IA réelles et les sauvegarde au format dataset.

    Chaque entrée JSON :
    {
        "text": "...",
        "source_type": "ia",
        "domaine": "...",
        "style_prompt": "neutre|naturel|anti_ia",
        "longueur_cible": "courte|moyenne|longue"
    }
    NOTE : pas de pré-calcul des 6 scores (ce sont les features qui fuient).
    """
    try:
        import anthropic
    except ImportError:
        logger.error(
            "Le package 'anthropic' n'est pas installé. "
            "Lancez : pip install anthropic"
        )
        sys.exit(1)

    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        logger.error(
            "Variable d'environnement ANTHROPIC_API_KEY non définie. "
            "Exportez-la avant de lancer le script."
        )
        sys.exit(1)

    client = anthropic.Anthropic(api_key=api_key)

    # Reprend depuis un fichier existant (reprise après interruption)
    lettres_existantes = []
    if os.path.exists(output_path):
        with open(output_path, encoding="utf-8") as f:
            lettres_existantes = json.load(f)
        logger.info(
            "Reprise : %d lettres déjà générées, %d restantes.",
            len(lettres_existantes), max(0, n_total - len(lettres_existantes))
        )

    lettres = list(lettres_existantes)
    deja_faits = len(lettres)

    if deja_faits >= n_total:
        logger.info("Objectif déjà atteint (%d/%d). Rien à faire.", deja_faits, n_total)
        return

    # Construction de la liste de toutes les combinaisons possibles,
    # mélangée aléatoirement, puis on en prend n_total - deja_faits.
    combinaisons = []
    for domaine, postes in POSTES_PAR_DOMAINE.items():
        for poste in postes:
            for style in STYLES_PROMPT:
                for longueur in LONGUEURS:
                    combinaisons.append((domaine, poste, style, longueur))

    random.shuffle(combinaisons)

    # Si on veut plus de lettres que de combinaisons uniques, on répète
    while len(combinaisons) < (n_total - deja_faits):
        extra = list(combinaisons)
        random.shuffle(extra)
        combinaisons.extend(extra)

    a_generer = combinaisons[: n_total - deja_faits]

    logger.info("Génération de %d nouvelles lettres...", len(a_generer))

    for idx, (domaine, poste, style, longueur) in enumerate(a_generer, start=1):
        prompt = construire_prompt(domaine, poste, style, longueur)

        logger.info(
            "[%d/%d] domaine='%s' poste='%s' style='%s' longueur='%s'",
            idx, len(a_generer), domaine, poste, style["nom"], longueur["label"]
        )

        try:
            texte = generer_lettre(client, prompt)
        except Exception as exc:
            logger.error("Échec définitif pour combinaison %d — ignorée : %s", idx, exc)
            continue

        entree = {
            "text":          texte,
            "source_type":   "ia",
            "domaine":       domaine,
            "style_prompt":  style["nom"],
            "longueur_cible": longueur["label"],
        }
        lettres.append(entree)

        # Sauvegarde incrémentale toutes les 10 lettres pour éviter les pertes
        if len(lettres) % 10 == 0:
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(lettres, f, ensure_ascii=False, indent=2)
            logger.info("Checkpoint : %d/%d lettres sauvegardées.", len(lettres), n_total)

        # Petite pause pour éviter le rate limiting
        time.sleep(0.5)

    # Sauvegarde finale
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(lettres, f, ensure_ascii=False, indent=2)

    logger.info(
        "Terminé. %d lettres sauvegardées dans : %s",
        len(lettres), output_path
    )

    # Résumé par style de prompt
    from collections import Counter
    styles_count = Counter(l["style_prompt"] for l in lettres)
    domaines_count = Counter(l["domaine"] for l in lettres)
    longueurs_count = Counter(l["longueur_cible"] for l in lettres)

    print("\n=== RÉSUMÉ ===")
    print(f"Total lettres : {len(lettres)}")
    print(f"Par style     : {dict(styles_count)}")
    print(f"Par longueur  : {dict(longueurs_count)}")
    print(f"Par domaine   :")
    for dom, cnt in sorted(domaines_count.items()):
        print(f"  {dom:<40} {cnt}")


# ── Point d'entrée ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Génère de vraies lettres IA via l'API Anthropic."
    )
    parser.add_argument(
        "--n", type=int, default=300,
        help="Nombre de lettres à générer (défaut : 300)"
    )
    parser.add_argument(
        "--output", type=str,
        default=os.path.join(os.path.dirname(__file__), "..", "..", "..",
                             "real_ai_letters.json"),
        help="Chemin du fichier de sortie JSON (défaut : real_ai_letters.json à la racine)"
    )
    args = parser.parse_args()

    output_path = os.path.normpath(args.output)
    logger.info("Fichier de sortie : %s", output_path)

    generer_lettres(n_total=args.n, output_path=output_path)
