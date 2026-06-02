# Guide d'installation — Mise à jour du projet RecrutIA

> Ce guide est destiné à la collaboratrice qui possède déjà le projet fonctionnel.
> Il couvre uniquement les nouveautés ajoutées : modules IA, app desktop Electron.

---

## Prérequis (déjà installés)
- Python 3.10+
- Node.js 18+
- Git
- Le projet cloné et la base de données SQL Server configurée

---

## Étape 1 — Récupérer les nouveautés

```bash
git pull
```

---

## Étape 2 — Configurer l'environnement backend

Copier le fichier de configuration :

```bash
copy backend\.env.example backend\.env
```

Ouvrir `backend\.env` et remplir les valeurs (les mêmes que ton installation actuelle) :

```
SECRET_KEY=ta_clé_secrète
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DB_NAME=nom_de_ta_base
DB_USER=ton_utilisateur
DB_PASSWORD=ton_mot_de_passe
DB_HOST=adresse_du_serveur
DB_PORT=1433

EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
```

---

## Étape 3 — Installer les nouvelles dépendances Python

```bash
cd backend
pip install -r requirements.txt
```

Cela installe les modules IA :
- `pdfplumber` et `PyMuPDF` — extraction de texte PDF
- `transformers` et `torch` — modèles BERT pour l'analyse CV
- `sentence-transformers` — résumé extractif du CV

> ⚠️ Le premier lancement peut télécharger ~700 Mo de modèles BERT automatiquement depuis HuggingFace.

---

## Étape 4 — Créer les nouvelles tables en base de données

```bash
python manage.py migrate
```

Cela crée 3 nouvelles tables dans ta base SQL Server :
- `AnalyseLettreMotivation`
- `AnalyseCV`
- `ScoreCV`

---

## Étape 5 — Vérifier le backend

```bash
set DISABLE_PERPLEXITE=1
python manage.py runserver
```

Le serveur doit démarrer sans erreur sur `http://127.0.0.1:8000`.

Dans les logs, tu dois voir :
```
style: ML_v2 chargé (RandomForest, F1=0.9291, source_ia=real_ai_letters_merged.json)
```

---

## Étape 6 — Installer les nouvelles dépendances frontend

```bash
cd ..
npm install
```

---

## Étape 7 — Configurer l'URL du backend (frontend)

Copier le fichier de configuration frontend :

```bash
copy .env.example .env
```

Le fichier `.env` contient par défaut :
```
VITE_API_URL=http://127.0.0.1:8000/api
```

Si ton backend tourne sur une autre adresse, modifie cette ligne.

---

## Étape 8 — Tester le frontend (navigateur)

```bash
npm run dev
```

Ouvre `http://localhost:5173` dans le navigateur.
- La page d'accueil est le **formulaire candidat** (accessible sans connexion)
- Pour le dashboard, va sur `http://localhost:5173/#/login`

---

## Étape 9 — App desktop Electron (Dashboard uniquement)

### 9a — Convertir le logo en icône

```bash
python -c "from PIL import Image; img = Image.open('src/components/shared/LogoBTPH.png'); img.save('electron/icon.ico')"
```

### 9b — Lancer l'app desktop

Dans un terminal, lance Django (si pas déjà fait) :
```bash
cd backend
set DISABLE_PERPLEXITE=1
python manage.py runserver
```

Dans un autre terminal, lance Electron :
```bash
cd ..
npm run electron
```

La fenêtre **RecrutIA** s'ouvre directement sur la page de connexion du dashboard.

---

## Résumé — Comment lancer le projet au quotidien

### Démarrage normal (2 terminaux)

**Terminal 1 — Backend**
```bash
cd backend
set DISABLE_PERPLEXITE=1
python manage.py runserver
```

**Terminal 2 — App desktop**
```bash
npm run electron
```

### Si tu veux aussi le formulaire candidat (navigateur)

**Terminal 2 — Formulaire candidat**
```bash
npm run dev
```
Puis ouvre `http://localhost:5173`

---

## Structure des modules IA ajoutés

```
backend/ai_analysis/
├── cover_letter/
│   ├── style.py              — détection humain/IA/hybride
│   ├── scoring.py            — 6 dimensions d'analyse
│   ├── report.py             — note globale /20
│   ├── features_detection.py — features ML sans biais
│   └── models/
│       ├── style_classifier_v2.pkl   — modèle ML v2 (F1=0.93)
│       └── camembert/                — modèle deep learning style
└── cv/
    ├── analyzer.py           — orchestrateur analyse CV
    ├── scoring.py            — score CV 0-100
    ├── skills.py             — extraction compétences (BERT)
    ├── domain.py             — classification domaine (BERT)
    └── summary.py            — résumé extractif (BERT)
```

---

## En cas de problème

### "ML_v2 indisponible" dans les logs
Le fichier `real_ai_letters_merged.json` est manquant à la racine.
Il est normalement dans le git. Si absent, demander à la collaboratrice principale.

### Erreur 401 sur le login
Le token JWT a expiré. Vider le localStorage :
```
F12 → Console → localStorage.clear() → Recharger la page
```

### Premier lancement lent (analyse CV)
Normal — les modèles BERT se téléchargent automatiquement (~700 Mo, une seule fois).

### Electron écran blanc
Vérifier que Django est bien lancé sur le port 8000 avant d'ouvrir Electron.
