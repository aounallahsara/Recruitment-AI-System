"""
Génération du dataset synthétique de CVs par domaine professionnel.

9 domaines x 150 echantillons = 1 350 echantillons au total.
Format JSON : chaque entree contient text, skills, degree, domain, source.

Usage :
    python generate_domain_dataset.py
    -> cv_domain_dataset.json  (a enrichir avec de vraies donnees)

Structure pour l'entrainement futur :
    - "text"       : texte libre combinant diplome + competences + mots-cles
    - "skills"     : liste des competences extraites
    - "degree"     : diplome detecte
    - "university" : etablissement
    - "keywords"   : mots-cles metier
    - "domain"     : label (9 classes)
    - "source"     : "synthetique" | "reel"
"""

import json
import random
import os
import sys

# ─────────────────────────────────────────────────────────────────────────────
# DOMAINES VALIDES
# ─────────────────────────────────────────────────────────────────────────────

DOMAINES_VALIDES = {
    "Genie Civil",
    "Informatique et Technologies",
    "Genie Mecanique",
    "Genie Electrique",
    "Architecture",
    "Finance et Comptabilite",
    "Ressources Humaines et Management",
    "Geologie et Geotechnique",
    "Logistique et Supply Chain",
}

SOURCES_VALIDES = {"synthetique", "reel"}

CHAMPS_REQUIS = ["text", "degree", "university", "skills", "keywords", "domain", "source"]

LONGUEUR_TEXTE_MIN  = 30
LONGUEUR_TEXTE_MAX  = 1000
NB_COMPETENCES_MIN  = 1
NB_COMPETENCES_MAX  = 20
NB_MOTS_CLES_MIN    = 1
NB_MOTS_CLES_MAX    = 10


# ─────────────────────────────────────────────────────────────────────────────
# CONFIGURATION PAR DOMAINE
# ─────────────────────────────────────────────────────────────────────────────

DOMAINES = {
    "Genie Civil": {
        "diplomes": [
            "Ingenieur en Genie Civil",
            "Master Genie Civil",
            "Licence Genie Civil",
            "Ingenieur d'Etat en Genie Civil",
            "Master Structures et Materiaux",
            "Master BTP et Geotechnique",
            "Diplome d'Ingenieur Genie Civil",
        ],
        "universites": [
            "Universite Djilali Liabes de Sidi Bel Abbes",
            "Ecole Nationale des Travaux Publics de Boumerdes",
            "Ecole Nationale Polytechnique d'Alger",
            "Universite des Sciences et de la Technologie d'Oran",
            "Universite Abou Bekr Belkaid de Tlemcen",
            "Universite des Freres Mentouri de Constantine",
            "Universite Mouloud Mammeri de Tizi Ouzou",
        ],
        "competences_principales": [
            "AutoCAD", "Revit", "SAP2000", "ETABS", "Civil 3D", "BIM",
            "Robot Structural Analysis", "ArchiCAD", "Abaqus", "Plaxis",
            "Tekla Structures", "HEC-RAS", "Primavera P6",
        ],
        "competences_secondaires": [
            "MS Project", "Excel", "AutoCAD Civil 3D", "SketchUp",
            "MATLAB", "Surfer", "GeoStudio",
        ],
        "mots_cles": [
            "beton arme", "calcul de structure", "chantier de construction",
            "fondations profondes", "resistance des materiaux",
            "mecanique des sols", "hydraulique urbaine", "topographie",
            "ouvrages d'art", "batiment industriel", "pont et viaduc",
            "terrassement", "route et voirie", "barrage", "rehabilitation structurale",
        ],
        "postes": [
            "Ingenieur structure", "Chef de chantier", "Projeteur BIM",
            "Ingenieur travaux", "Responsable bureau d'etudes techniques",
            "Ingenieur geotechnicien", "Responsable QSE chantier",
        ],
        "phrases": [
            "Maitrise du calcul et du dimensionnement des structures en beton arme.",
            "Experience en suivi de chantier et gestion des travaux de gros oeuvre.",
            "Competences en modelisation BIM pour la conception de batiments.",
            "Expertise en mecanique des sols et fondations speciales.",
            "Pratique de la topographie et des releves de terrain.",
        ],
    },

    "Informatique et Technologies": {
        "diplomes": [
            "Licence en Informatique",
            "Master Informatique",
            "Ingenieur en Informatique",
            "Master Intelligence Artificielle",
            "Master Genie Logiciel",
            "Master Systemes Informatiques et Reseaux",
            "Master Science des Donnees",
        ],
        "universites": [
            "Universite Djilali Liabes de Sidi Bel Abbes",
            "USTHB Alger",
            "Universite des Sciences et de la Technologie d'Oran",
            "Ecole Superieure d'Informatique d'Alger",
            "Universite Abou Bekr Belkaid de Tlemcen",
            "Universite de Bejaia",
            "Universite Abderrahmane Mira de Bejaia",
        ],
        "competences_principales": [
            "Python", "Java", "JavaScript", "React", "Django", "Flask",
            "MySQL", "PostgreSQL", "Docker", "Git", "TensorFlow",
            "Node.js", "Spring Boot", "FastAPI", "TypeScript",
        ],
        "competences_secondaires": [
            "Linux", "AWS", "MongoDB", "Vue.js", "Kubernetes",
            "CI/CD", "REST API", "NLP", "PyTorch", "Scikit-learn",
        ],
        "mots_cles": [
            "developpement web full-stack", "algorithmes et structures de donnees",
            "intelligence artificielle", "apprentissage automatique",
            "base de donnees relationnelle", "microservices",
            "cloud computing", "cybersecurite", "data science",
            "traitement du langage naturel", "application mobile",
        ],
        "postes": [
            "Developpeur full-stack", "Data scientist",
            "Ingenieur DevOps", "Developpeur backend",
            "Ingenieur en intelligence artificielle", "Analyste programmeur",
        ],
        "phrases": [
            "Developpement d'applications web et mobiles avec les technologies modernes.",
            "Experience en conception et deploiement de modeles de machine learning.",
            "Maitrise des architectures microservices et des pratiques DevOps.",
            "Competences en analyse et visualisation de donnees.",
            "Pratique du developpement agile et des outils de versioning.",
        ],
    },

    "Genie Mecanique": {
        "diplomes": [
            "Ingenieur en Genie Mecanique",
            "Master Genie Mecanique",
            "Licence Genie Mecanique",
            "Master Construction Mecanique",
            "Master Energetique et Genie des Procedes",
            "Ingenieur d'Etat en Mecanique",
            "Master Maintenance Industrielle",
        ],
        "universites": [
            "Universite Djilali Liabes de Sidi Bel Abbes",
            "USTHB Alger",
            "Universite des Sciences et de la Technologie d'Oran",
            "Universite Abou Bekr Belkaid de Tlemcen",
            "Universite de Bejaia",
            "Universite Ferhat Abbas de Setif",
        ],
        "competences_principales": [
            "SolidWorks", "CATIA", "ANSYS", "AutoCAD", "MATLAB",
            "Abaqus", "Autodesk Inventor", "Pro/Engineer",
        ],
        "competences_secondaires": [
            "Simulink", "NX Siemens", "MSC Nastran",
            "HyperMesh", "Fusion 360", "Creo",
        ],
        "mots_cles": [
            "conception mecanique", "simulation par elements finis",
            "thermodynamique appliquee", "mecanique des fluides",
            "fabrication et usinage", "maintenance industrielle",
            "turbomachines", "resistance des materiaux",
            "conception assistee par ordinateur", "prototype et essais",
        ],
        "postes": [
            "Ingenieur conception mecanique", "Ingenieur simulation",
            "Technicien CAO/DAO", "Ingenieur maintenance industrielle",
            "Responsable bureau d'etudes mecanique",
        ],
        "phrases": [
            "Conception et simulation de pieces mecaniques sous SolidWorks et ANSYS.",
            "Experience en maintenance preventive et corrective des equipements industriels.",
            "Maitrise du calcul par elements finis et de l'optimisation structurale.",
            "Competences en thermodynamique et mecanique des fluides appliquees.",
            "Pratique de la CAO pour le prototypage et la fabrication.",
        ],
    },

    "Genie Electrique": {
        "diplomes": [
            "Ingenieur en Electrotechnique",
            "Master Electronique",
            "Licence Electrotechnique",
            "Master Automatique et Informatique Industrielle",
            "Master Genie Electrique",
            "Ingenieur en Electronique",
            "Master Energies Renouvelables",
        ],
        "universites": [
            "Universite Djilali Liabes de Sidi Bel Abbes",
            "USTHB Alger",
            "Universite des Sciences et de la Technologie d'Oran",
            "Universite Abou Bekr Belkaid de Tlemcen",
            "Universite de Bejaia",
            "Universite Saad Dahlab de Blida",
        ],
        "competences_principales": [
            "MATLAB", "Simulink", "AutoCAD Electrical", "PLC Siemens",
            "SCADA", "Proteus", "LabVIEW", "EPLAN",
        ],
        "competences_secondaires": [
            "Arduino", "Raspberry Pi", "Python", "VHDL",
            "ETAP", "Power Factory", "PSIM",
        ],
        "mots_cles": [
            "automatisme industriel", "electronique de puissance",
            "controle-commande", "energie renouvelable solaire",
            "moteur electrique et variateur", "instrumentation et mesure",
            "traitement du signal", "reseaux electriques",
            "programmation automates", "onduleur et convertisseur",
        ],
        "postes": [
            "Ingenieur automaticien", "Ingenieur electrotechnicien",
            "Technicien en instrumentation", "Ingenieur energie",
            "Responsable maintenance electrique",
        ],
        "phrases": [
            "Programmation d'automates Siemens et supervision SCADA.",
            "Experience en conception de systemes de controle-commande.",
            "Maitrise des installations electriques basse et haute tension.",
            "Competences en simulation de systemes electriques sous MATLAB/Simulink.",
            "Pratique de l'integration de systemes d'energies renouvelables.",
        ],
    },

    "Architecture": {
        "diplomes": [
            "Architecte DPLG",
            "Master Architecture",
            "Licence Architecture",
            "Architecte d'Etat",
            "Master Urbanisme et Amenagement",
            "Master Design Architectural et Urbain",
            "Diplome de Fin d'Etudes en Architecture",
        ],
        "universites": [
            "Ecole Polytechnique d'Architecture et d'Urbanisme d'Alger",
            "Universite Djilali Liabes de Sidi Bel Abbes",
            "Universite des Sciences et de la Technologie d'Oran",
            "Universite Abou Bekr Belkaid de Tlemcen",
            "Universite des Freres Mentouri de Constantine",
        ],
        "competences_principales": [
            "AutoCAD", "Revit", "SketchUp", "ArchiCAD", "3ds Max",
            "Adobe Photoshop", "Adobe Illustrator", "Lumion",
        ],
        "competences_secondaires": [
            "Rhino", "V-Ray", "Adobe InDesign", "BIM",
            "Blender", "Enscape", "Grasshopper",
        ],
        "mots_cles": [
            "conception architecturale", "urbanisme et planification",
            "plan masse et permis de construire", "facade et volumetrie",
            "amenagement interieur", "patrimoine architectural",
            "habitat durable et bioclimatique", "rendu architectural 3D",
            "suivi d'execution", "modelisation architecturale",
        ],
        "postes": [
            "Architecte chef de projet", "Architecte BIM",
            "Architecte d'interieur", "Urbaniste",
            "Dessinateur projeteur architecture",
        ],
        "phrases": [
            "Conception architecturale de logements collectifs et equipements publics.",
            "Maitrise de la modelisation 3D et du rendu photorealiste.",
            "Experience en suivi de chantier et coordination avec les corps d'etat.",
            "Competences en urbanisme et amenagement du territoire.",
            "Pratique de la demarche BIM pour la conception integree.",
        ],
    },

    "Finance et Comptabilite": {
        "diplomes": [
            "Licence Comptabilite et Finance",
            "Master Finance d'Entreprise",
            "Licence Sciences de Gestion",
            "Master Audit et Controle de Gestion",
            "Master Comptabilite et Fiscalite",
            "Licence Gestion des Entreprises",
            "Master Banque et Marches Financiers",
        ],
        "universites": [
            "Universite Djilali Liabes de Sidi Bel Abbes",
            "Universite des Sciences et de la Technologie d'Oran",
            "Universite Abou Bekr Belkaid de Tlemcen",
            "Universite d'Alger 3",
            "Universite de Bejaia",
            "Universite Ferhat Abbas de Setif",
        ],
        "competences_principales": [
            "Excel avance", "SAP FI/CO", "Sage Comptabilite",
            "Power BI", "ERP", "VBA Excel",
        ],
        "competences_secondaires": [
            "CIEL Comptabilite", "Tableau", "Bloomberg Terminal",
            "QuickBooks", "Odoo Comptabilite", "Python",
        ],
        "mots_cles": [
            "comptabilite generale et analytique", "audit interne et externe",
            "controle de gestion", "bilan et compte de resultat",
            "tresorerie et cash-flow", "fiscalite algerienne",
            "analyse financiere", "budget previsionnel et suivi",
            "reporting financier", "consolidation des comptes",
        ],
        "postes": [
            "Comptable principal", "Controleur de gestion",
            "Auditeur interne", "Analyste financier",
            "Responsable comptable et financier",
        ],
        "phrases": [
            "Tenue de la comptabilite generale et analytique selon les normes algeriennes.",
            "Experience en audit interne et controle de gestion.",
            "Maitrise de la fiscalite et des declarations fiscales.",
            "Competences en elaboration de bilans et etats financiers.",
            "Pratique du reporting et de l'analyse de la performance financiere.",
        ],
    },

    "Ressources Humaines et Management": {
        "diplomes": [
            "Master Ressources Humaines",
            "Licence Gestion des Ressources Humaines",
            "Master Management des Organisations",
            "Licence Management des Entreprises",
            "Master Droit Social et Relations de Travail",
            "Master Psychologie du Travail",
        ],
        "universites": [
            "Universite Djilali Liabes de Sidi Bel Abbes",
            "Universite des Sciences et de la Technologie d'Oran",
            "Universite Abou Bekr Belkaid de Tlemcen",
            "Universite d'Alger 3",
            "Universite Mouloud Mammeri de Tizi Ouzou",
        ],
        "competences_principales": [
            "Sage Paie et RH", "Excel", "Power BI",
            "MS Office", "SIRH",
        ],
        "competences_secondaires": [
            "SAP HR", "Odoo RH", "Monday.com",
            "Talend", "HubSpot", "JIRA",
        ],
        "mots_cles": [
            "recrutement et selection", "formation et developpement des competences",
            "gestion de la paie et des conges", "relations sociales et droit du travail",
            "GPEC et gestion previsionnelle", "evaluation des performances",
            "onboarding et integration", "gestion des talents",
            "politique salariale", "bien-etre au travail",
        ],
        "postes": [
            "Responsable des ressources humaines", "Charge de recrutement",
            "Gestionnaire de paie", "DRH",
            "Charge de formation", "Assistant RH",
        ],
        "phrases": [
            "Gestion complete du cycle de recrutement et de l'integration des nouveaux employes.",
            "Experience en gestion de la paie et administration du personnel.",
            "Maitrise du droit du travail algerien et des conventions collectives.",
            "Competences en elaboration et suivi des plans de formation.",
            "Pratique de la gestion previsionnelle des emplois et des competences.",
        ],
    },

    "Geologie et Geotechnique": {
        "diplomes": [
            "Ingenieur Geologue",
            "Master Geotechnique",
            "Licence Geologie",
            "Master Hydrogeologie",
            "Master Geologie Appliquee et Environnement",
            "Ingenieur en Geologie",
            "Master Risques Naturels",
        ],
        "universites": [
            "Universite Djilali Liabes de Sidi Bel Abbes",
            "Universite des Sciences et de la Technologie d'Oran",
            "USTHB Alger",
            "Universite Abou Bekr Belkaid de Tlemcen",
            "Universite de Bejaia",
            "Universite des Freres Mentouri de Constantine",
        ],
        "competences_principales": [
            "ArcGIS", "AutoCAD", "MATLAB", "Plaxis",
            "RocLab", "GeoStudio",
        ],
        "competences_secondaires": [
            "Surfer", "Petrel", "Python",
            "HEC-RAS", "FLAC", "SLIDE",
        ],
        "mots_cles": [
            "mecanique des sols et des roches", "sondage geotechnique",
            "essais de laboratoire geotechnique", "cartographie geologique",
            "hydrogeologie et nappe phreatique", "geophysique appliquee",
            "risque sismique et alea naturel", "fondations speciales",
            "stabilite des pentes", "etude geotechnique de site",
        ],
        "postes": [
            "Ingenieur geotechnicien", "Geologue de terrain",
            "Hydrogeologue", "Responsable etudes geotechniques",
            "Expert en risques naturels",
        ],
        "phrases": [
            "Realisation d'etudes geotechniques pour projets de construction.",
            "Experience en campagnes de sondage et essais in situ.",
            "Maitrise des analyses de stabilite des pentes et des fondations.",
            "Competences en cartographie geologique et SIG.",
            "Pratique des etudes d'impact et evaluation des risques naturels.",
        ],
    },

    "Logistique et Supply Chain": {
        "diplomes": [
            "Licence Logistique et Transport",
            "Master Supply Chain Management",
            "Licence Commerce International",
            "Master Logistique et Organisation",
            "Licence Transport et Logistique",
            "Master Management Logistique",
        ],
        "universites": [
            "Universite Djilali Liabes de Sidi Bel Abbes",
            "Universite des Sciences et de la Technologie d'Oran",
            "Universite Abou Bekr Belkaid de Tlemcen",
            "Universite d'Alger 3",
            "Universite de Bejaia",
        ],
        "competences_principales": [
            "SAP MM/SD", "Excel", "ERP", "Power BI", "MS Project",
        ],
        "competences_secondaires": [
            "Odoo", "WMS", "Oracle SCM",
            "Tableau", "Python", "Sage Gestion Commerciale",
        ],
        "mots_cles": [
            "gestion des stocks et inventaires", "approvisionnement fournisseurs",
            "chaine logistique et flux", "transport et distribution",
            "dedouanement et commerce international", "entreposage et manutention",
            "optimisation des couts logistiques", "gestion des fournisseurs",
            "planification de la production", "tracabilite et ERP",
        ],
        "postes": [
            "Responsable logistique", "Supply chain manager",
            "Gestionnaire des stocks", "Responsable approvisionnement",
            "Coordinateur transport", "Chef magasinier",
        ],
        "phrases": [
            "Gestion des flux entrants et sortants dans un entrepot logistique.",
            "Experience en negociation et suivi des fournisseurs et transporteurs.",
            "Maitrise des procedures douanieres et du commerce international.",
            "Competences en planification des approvisionnements et gestion des stocks.",
            "Pratique de l'optimisation des couts de transport et de distribution.",
        ],
    },
}


# ─────────────────────────────────────────────────────────────────────────────
# MODELES DE TEXTE (5 structures differentes)
# ─────────────────────────────────────────────────────────────────────────────

MODELES_TEXTE = [
    # Modele 1 : diplome + competences + experience
    lambda d, u, sk, kw, p, ph: (
        f"{d}, {u}. "
        f"Competences techniques : {', '.join(sk)}. "
        f"{ph} "
        f"Poste vise : {p}."
    ),
    # Modele 2 : profil centre competences
    lambda d, u, sk, kw, p, ph: (
        f"Titulaire d'un {d} (specialite {kw[0]}) obtenu a {u}. "
        f"Maitrise de {', '.join(sk[:4])} ainsi que {', '.join(sk[4:]) if len(sk) > 4 else sk[-1]}. "
        f"{ph}"
    ),
    # Modele 3 : profil synthetique
    lambda d, u, sk, kw, p, ph: (
        f"{p} -- {d}, {u}. "
        f"Outils : {', '.join(sk)}. "
        f"Domaines d'expertise : {kw[0]}, {kw[1] if len(kw) > 1 else kw[0]}."
    ),
    # Modele 4 : style narratif
    lambda d, u, sk, kw, p, ph: (
        f"Diplome(e) en {d} de {u}, specialise(e) en {kw[0]}. "
        f"{ph} "
        f"Maitrise de {', '.join(sk[:3])} et {', '.join(sk[3:]) if len(sk) > 3 else sk[-1]}."
    ),
    # Modele 5 : resume professionnel
    lambda d, u, sk, kw, p, ph: (
        f"Formation : {d} -- {u}. "
        f"Experience en {kw[0]} et {kw[1] if len(kw) > 1 else kw[0]}. "
        f"Logiciels : {', '.join(sk)}. "
        f"Objectif professionnel : {p}."
    ),
]


# ─────────────────────────────────────────────────────────────────────────────
# CONTROLE DES CHAMPS
# ─────────────────────────────────────────────────────────────────────────────

def valider_echantillon(echantillon, index):
    """
    Valide un echantillon du dataset.
    Retourne une liste d'erreurs (vide si l'echantillon est valide).
    """
    erreurs = []

    # 1. Champs requis presents
    for champ in CHAMPS_REQUIS:
        if champ not in echantillon:
            erreurs.append(f"champ manquant : '{champ}'")

    if erreurs:
        return erreurs

    # 2. Texte : type, longueur
    texte = echantillon["text"]
    if not isinstance(texte, str):
        erreurs.append(f"'text' doit etre une chaine, recu : {type(texte).__name__}")
    elif len(texte.strip()) < LONGUEUR_TEXTE_MIN:
        erreurs.append(
            f"'text' trop court ({len(texte.strip())} car., minimum {LONGUEUR_TEXTE_MIN})"
        )
    elif len(texte) > LONGUEUR_TEXTE_MAX:
        erreurs.append(
            f"'text' trop long ({len(texte)} car., maximum {LONGUEUR_TEXTE_MAX})"
        )

    # 3. Diplome : chaine non vide
    diplome = echantillon["degree"]
    if not isinstance(diplome, str) or not diplome.strip():
        erreurs.append("'degree' doit etre une chaine non vide")

    # 4. Universite : chaine non vide
    universite = echantillon["university"]
    if not isinstance(universite, str) or not universite.strip():
        erreurs.append("'university' doit etre une chaine non vide")

    # 5. Competences : liste non vide, elements chaines
    competences = echantillon["skills"]
    if not isinstance(competences, list):
        erreurs.append(f"'skills' doit etre une liste, recu : {type(competences).__name__}")
    elif len(competences) < NB_COMPETENCES_MIN:
        erreurs.append(
            f"'skills' vide (minimum {NB_COMPETENCES_MIN} competence)"
        )
    elif len(competences) > NB_COMPETENCES_MAX:
        erreurs.append(
            f"trop de competences ({len(competences)}, maximum {NB_COMPETENCES_MAX})"
        )
    else:
        for i, c in enumerate(competences):
            if not isinstance(c, str) or not c.strip():
                erreurs.append(f"'skills[{i}]' doit etre une chaine non vide")

    # 6. Mots-cles : liste non vide
    mots_cles = echantillon["keywords"]
    if not isinstance(mots_cles, list):
        erreurs.append(f"'keywords' doit etre une liste, recu : {type(mots_cles).__name__}")
    elif len(mots_cles) < NB_MOTS_CLES_MIN:
        erreurs.append(f"'keywords' vide (minimum {NB_MOTS_CLES_MIN} mot-cle)")
    elif len(mots_cles) > NB_MOTS_CLES_MAX:
        erreurs.append(
            f"trop de mots-cles ({len(mots_cles)}, maximum {NB_MOTS_CLES_MAX})"
        )

    # 7. Domaine : valeur autorisee
    domaine = echantillon["domain"]
    if domaine not in DOMAINES_VALIDES:
        erreurs.append(
            f"domaine inconnu : '{domaine}'. "
            f"Valeurs autorisees : {sorted(DOMAINES_VALIDES)}"
        )

    # 8. Source : valeur autorisee
    source = echantillon["source"]
    if source not in SOURCES_VALIDES:
        erreurs.append(
            f"source inconnue : '{source}'. "
            f"Valeurs autorisees : {sorted(SOURCES_VALIDES)}"
        )

    return erreurs


def valider_dataset(dataset):
    """
    Valide tous les echantillons du dataset.
    Affiche un rapport et retourne le nombre d'erreurs totales.
    """
    nb_erreurs  = 0
    nb_invalides = 0

    for i, echantillon in enumerate(dataset):
        erreurs = valider_echantillon(echantillon, i)
        if erreurs:
            nb_invalides += 1
            nb_erreurs   += len(erreurs)
            print(f"  Echantillon #{i} (domaine={echantillon.get('domain', '?')}) :")
            for err in erreurs:
                print(f"    - {err}")

    return nb_erreurs, nb_invalides


# ─────────────────────────────────────────────────────────────────────────────
# GENERATION
# ─────────────────────────────────────────────────────────────────────────────

def generer_echantillon(nom_domaine, config, rng):
    diplome    = rng.choice(config["diplomes"])
    universite = rng.choice(config["universites"])
    poste      = rng.choice(config["postes"])
    phrase     = rng.choice(config["phrases"])

    n_princ  = rng.randint(3, min(6, len(config["competences_principales"])))
    n_sec    = rng.randint(1, min(3, len(config["competences_secondaires"])))
    comp_p   = rng.sample(config["competences_principales"], n_princ)
    comp_s   = rng.sample(config["competences_secondaires"], min(n_sec, len(config["competences_secondaires"])))
    competences = list(dict.fromkeys(comp_p + comp_s))

    n_kw      = rng.randint(2, min(4, len(config["mots_cles"])))
    mots_cles = rng.sample(config["mots_cles"], n_kw)

    modele = rng.choice(MODELES_TEXTE)
    texte  = modele(diplome, universite, competences, mots_cles, poste, phrase)

    return {
        "text":       texte,
        "degree":     diplome,
        "university": universite,
        "skills":     competences,
        "keywords":   mots_cles,
        "domain":     nom_domaine,
        "source":     "synthetique",
    }


def main():
    rng            = random.Random(42)
    nb_par_domaine = 150
    dataset        = []

    print("Generation du dataset...")
    for nom_domaine, config in DOMAINES.items():
        for _ in range(nb_par_domaine):
            dataset.append(generer_echantillon(nom_domaine, config, rng))
    rng.shuffle(dataset)
    print(f"  {len(dataset)} echantillons generes ({len(DOMAINES)} domaines x {nb_par_domaine})\n")

    # ── Controle des champs ──────────────────────────────────────────────────
    print("Controle des champs...")
    nb_erreurs, nb_invalides = valider_dataset(dataset)

    if nb_erreurs == 0:
        print(f"  Aucune erreur detectee -- dataset valide.")
    else:
        print(f"  {nb_erreurs} erreur(s) dans {nb_invalides} echantillon(s).")
        print("  Correction necessaire avant utilisation.")
        sys.exit(1)

    # ── Statistiques ─────────────────────────────────────────────────────────
    print("\nRepartition par domaine :")
    compteur = {}
    for s in dataset:
        compteur[s["domain"]] = compteur.get(s["domain"], 0) + 1
    for domaine, nb in sorted(compteur.items()):
        print(f"  {nb:4d}  {domaine}")

    # ── Sauvegarde ───────────────────────────────────────────────────────────
    sortie = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cv_domain_dataset.json")
    with open(sortie, "w", encoding="utf-8") as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2)

    print(f"\nFichier sauvegarde : {sortie}")
    print("Pour enrichir      : ajouter de vraies entrees avec \"source\": \"reel\"")
    print("Pour entrainer     : python train_domain_classifier.py")


if __name__ == "__main__":
    main()
