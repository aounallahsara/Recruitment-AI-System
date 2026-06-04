# Recruitment AI System

## Présentation
Recruitment AI System est une plateforme d'analyse intelligente pour les CV et lettres de motivation. Elle combine un backend Django/DRF, une interface frontend React/Vite et un wrapper Electron pour offrir une expérience complète de recrutement assisté par intelligence artificielle.

Le projet permet de :
- analyser et scorer automatiquement les lettres de motivation,
- extraire les compétences, le domaine, le résumé et les langues d'un CV,
- produire un score CV avec une évaluation par catégorie,
- proposer un chatbot pour assister les utilisateurs,
- visualiser des tableaux de bord par administrateur et RH.

## Architecture

- `backend/` : API Django REST Framework, modules d'analyse IA, modèles et gestion des candidatures.
- `backend_chatbot/` : application Django dédiée au chatbot et à la base de connaissances.
- `src/` : application frontend React avec Vite.
- `electron/` : wrapper Electron pour exécuter l'application en mode bureau.
- `public/`, `package.json`, `vite.config.js` : configuration et ressources du frontend.

## Principales fonctionnalités

- Analyse directe de lettres de motivation en texte et PDF
- Analyse de CV en PDF avec extraction de :
  - nom et formation
  - langues
  - projets
  - compétences
  - domaine professionnel
  - résumé extractif
- Score CV par niveau (junior/mid/senior)
- Affichage de signaux d'IA et scores détaillés
- API d'analyse rapide sans sauvegarde

## Prérequis

- Python 3.11+ (ou version compatible Django 6+)
- Node.js 18+ / npm
- Git
- Environnement Windows pris en charge

## Installation

### 1. Backend

```powershell
cd C:\projet_4\Recruitment-AI-System\backend
python -m venv .venv
.\.venv\Scripts\Activate
pip install -r requirements.txt
```

### 2. Frontend

```powershell
cd C:\projet_4\Recruitment-AI-System
npm install
```

### 3. Configuration

- Créez un fichier `.env` dans le dossier `backend/` avec les variables nécessaires :
  - `DJANGO_SECRET_KEY`
  - `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`
  - `CORS_ALLOWED_ORIGINS` ou équivalent
- Adaptez la configuration de base de données si vous utilisez SQL Server ou SQLite.

### 4. Migration de la base de données

```powershell
cd C:\projet_4\Recruitment-AI-System\backend
python manage.py migrate
```

### 5. Lancer le backend

```powershell
python manage.py runserver
```

### 6. Lancer le frontend

```powershell
cd C:\projet_4\Recruitment-AI-System
npm run dev
```

### 7. Lancer Electron (optionnel)

```powershell
npm run electron:dev
```

## Utilisation

- Ouvrez l'application dans le navigateur (ou via Electron).
- Connectez-vous / inscrivez-vous selon l'interface.
- Accédez à la page `Analyse IA`.
- Déposez un CV PDF ou une lettre de motivation pour lancer l'analyse.
- Consultez les résultats d'extraction, le domaine, les compétences et le résumé.

## Remarques spécifiques

- L'analyse CV complète utilise `use_bert=true` pour activer l'extraction avancée de domaine, résumé et compétences.
- Le premier appel BERT peut être long, car les modèles sont volumineux et peuvent être téléchargés au démarrage.
- Si vous rencontrez des erreurs d'analyse, vérifiez la disponibilité des modèles `transformers` et `torch` dans l'environnement backend.

## Débogage

- Frontend : ouvrez la console réseau pour vérifier les appels à `/api/ai_analysis/analyse-cv/`.
- Backend : vérifiez les logs Django et l'état du serveur.
- Si les champs `domain`, `skills` ou `summary` ne s'affichent pas, assurez-vous que la requête multipart contient `use_bert=true`.

## Structure de fichiers clés

- `backend/ai_analysis/views.py` : points d'entrée API pour l'analyse.
- `backend/ai_analysis/cv/analyzer.py` : logique d'extraction CV.
- `src/pages/AnalysePage.jsx` : interface d'analyse CV et lettre.
- `src/services/aiService.js` : intégration API frontend.

## Contributions

1. Créez une branche dédiée.
2. Ajoutez vos modifications.
3. Testez le backend et le frontend.
4. Ouvrez une Pull Request avec un descriptif clair.

## Licence

Ce projet est `private` et ne possède pas de licence publique explicite dans `package.json`.
