# Rapport Backend - Recruitment AI System

## 1. Architecture générale du backend

Le backend est une application Django organisée en plusieurs apps :
- `authentification` : gère les utilisateurs, connexion, profil et sécurité JWT.
- `candidatures` : gère les candidatures, les documents attachés, les statuts et les évaluations.
- `ai_analysis` : gère l’analyse des CV et lettres de motivation (hors périmètre principal demandé, mais lié aux candidatures).
- `core` : contient la configuration principale du projet et le routage global.

La base de données configurée est SQL Server via `django-mssql`, et les fichiers uploadés (CV, lettres, photos) sont servis depuis `MEDIA_ROOT`.

---

## 2. Authentification

### 2.1 Modèle `User`
Fichier : `backend/authentification/models.py`

- Le projet utilise un modèle personnalisé `User` qui hérite de `AbstractUser`.
- Il ajoute un champ `role` avec deux valeurs possibles :
  - `admin`
  - `rh`
- Le modèle réutilise tous les champs standards de Django (`username`, `email`, `password`, `first_name`, etc.).

Création d'un user avec le shell : 
from authentification.models import User

rh2 = User.objects.create_user(
    username='rh_2',
    password='rh022026',
    email='rh@recrutementhas.dz',
    first_name='Équipe',
    last_name='RH',
    role='rh'
)
rh2.save()
print(f"✅ Compte RH créé : {rh2.username}")

for u in User.objects.all():
    print(f"  → {u.username} | {u.role} | {u.email}")

exit()
### 2.2 Vue de connexion
Fichier : `backend/authentification/views.py`
Route : `POST /api/auth/login/`

- Reçoit `username` et `password` dans `request.data`.
- Si l’un des deux manque, renvoie `400 Bad Request`.
- Utilise `authenticate(username=username, password=password)` de Django.
- Si l’authentification échoue, renvoie `401 Unauthorized` avec `{'error': 'Identifiants incorrects.'}`.
- Vérifie également que le compte est actif (`user.is_active`).
- Si la connexion réussit, génère un token JWT via `RefreshToken.for_user(user)`.
- Retourne :
  - `token` : token d’accès JWT
  - `user` : objet utilisateur contenant `id`, `username`, `email`, `role`

### 2.3 Routes accessibles après authentification
Fichier : `backend/authentification/urls.py`

- `GET /api/auth/me/` : récupère les informations du profil connecté.
- `PATCH /api/auth/profile/` : met à jour `prenom`, `nom`, `email` du profil.
- `POST /api/auth/change-password/` : change le mot de passe après validation du mot de passe actuel.

### 2.4 Sécurité JWT et permissions
Fichier : `backend/core/core/settings.py`

- Le backend utilise `rest_framework_simplejwt` pour l’authentification.
- `SIMPLE_JWT` configure :
  - `ACCESS_TOKEN_LIFETIME` = 24 heures
  - `REFRESH_TOKEN_LIFETIME` = 7 jours
  - `AUTH_HEADER_TYPES` = `('Bearer',)`
- Dans `REST_FRAMEWORK` :
  - `DEFAULT_AUTHENTICATION_CLASSES` = `JWTAuthentication`
  - `DEFAULT_PERMISSION_CLASSES` = `IsAuthenticated`

Cela signifie que, par défaut, toutes les routes API nécessitent un token JWT valide sauf celles explicitement marquées `AllowAny`.

---

## 3. Gestion des candidatures

### 3.1 Modèle `Candidature`
Fichier : `backend/candidatures/models.py`

- Modèle principal représentant un candidat et sa candidature.
- Champs importants :
  - `prenom`, `nom`, `date_naissance`, `genre`, `email`, `telephone`, `adresse`, `photo`
  - `universite`, `moyenne`
  - `duree`, `date_debut`, `date_fin`, `encadrant`, `theme`, `lettre_motivation_text`
  - `date_soumission`
  - `motif_refus`, `source`
- Relations :
  - `wilaya`, `niveau`, `domaine`, `statut` comme clés étrangères.
- `Statut` a trois valeurs possibles :
  - `Preselected`
  - `Selected`
  - `Rejected`

### 3.2 Documents associés
- `Document` stocke des fichiers liés à une candidature.
- Types de documents : `cv`, `lettre`, `releve`.
- Chaque document possède un chemin d’upload personnalisé `documents/{candidature.id}/{type}/{filename}`.
- Une candidature peut avoir plusieurs documents, mais un seul document de chaque type grâce à `unique_together`.

### 3.3 Évaluation
- `Evaluation` est un modèle `OneToOne` lié à `Candidature`.
- Il contient des notes par critère et calcule `note_globale` sur 20.
- Le calcul de `note_globale` est fait dans `save()`.

### 3.4 Serializers associés
Fichier : `backend/candidatures/serializers.py`

- `DocumentSerializer` expose l’URL du fichier via `get_fichier_url`.
- `EvaluationSerializer` expose les critères et la note globale.
- `CandidatureListSerializer` inclut les champs de la candidature, les champs relationnels sous forme de texte et les documents/evaluation.
- `CandidatureCreateSerializer` gère la création de candidature via formulaire :
  - attend `wilaya_nom`, `niveau_nom`, `domaine_nom` en entrée
  - accepte des uploads `cv`, `lettre_motivation`, `releve_notes`, `photo`
  - réalise des validations de contenu et taille pour les fichiers
  - crée ou récupère `Wilaya`, `Niveau`, `Domaine`, `Statut`
  - crée la candidature et stocke les documents associés
- `CandidatureUpdateStatutSerializer` met à jour le statut via `statut_nom`.
- `EvaluationCreateSerializer` applique des validations de plage sur chaque note.

### 3.5 Routes candidature
Fichier : `backend/candidatures/urls.py`

- `POST /api/candidatures/` : créer une candidature
- `GET /api/candidatures/list/` : lister les candidatures
- `GET /api/candidatures/<pk>/` : détails d’une candidature
- `PATCH /api/candidatures/<pk>/statut/` : mettre à jour le statut
- `GET /api/dashboard/stats/` : statistiques globales
- `POST|PUT /api/candidatures/<pk>/evaluation/` : créer ou mettre à jour l’évaluation
- `GET /api/candidatures/<pk>/evaluation/get/` : récupérer l’évaluation
- `POST /api/candidatures/<id>/send-acceptance/` : envoyer un email d’acceptation
- `POST /api/candidatures/<id>/send-rejection/` : envoyer un email de refus

### 3.6 Comportement des vues
Fichier : `backend/candidatures/views.py`

- `create_candidature` : publique (`AllowAny`) et accepte les fichiers multipart forms.
- `list_candidatures` : nécessite authentification.
  - prend en entrée `statut` et `search` comme filtres de recherche.
- `detail_candidature` : nécessite authentification.
- `update_statut` : nécessite authentification et rôle admin (`IsAdminUser`).
  - peut aussi enregistrer `motif_refus` si le statut devient `Rejected`.
- `dashboard_stats` : retourne le total, les candidatures par statut et celles du mois courant.
- `create_update_evaluation` : seulement pour admin.
  - crée ou mets à jour une évaluation liée à une candidature.
- `get_evaluation` : récupère l’évaluation d’une candidature existante.

### 3.7 Permissions personnalisées
- Le projet définit un permission class `IsAdminUser` dans `backend/candidatures/permissions.py`.
- Ce permission class est utilisé pour les actions sensibles comme la modification de statut ou l’évaluation.

---

## 4. Structure API et routage

### 4.1 Routes globales
Fichier : `backend/core/core/urls.py`

- `api/auth/` → routes d’authentification
- `api/` → routes des candidatures
- `api/ai_analysis/` → routes pour l’analyse IA (CV et lettre)

### 4.2 Comportement des permissions
- Par défaut, toutes les routes API exigent `IsAuthenticated` grâce à `REST_FRAMEWORK` dans `settings.py`.
- Seules les routes explicitement marquées `AllowAny` sont ouvertes sans JWT.
- Exemple : `POST /api/auth/login/` et `POST /api/candidatures/`.

### 4.3 Authentification et usage JWT
- Le frontend doit envoyer l’en-tête HTTP :
  - `Authorization: Bearer <token>`
- Ce token est reçu après connexion et utilisé pour les appels authentifiés (`/api/auth/me/`, `/api/candidatures/list/`, etc.).

### 4.4 Gestion des fichiers uploadés
- Les fichiers sont stockés dans `backend/media/`.
- Les URLs de fichiers sont exposées par les serializers via `request.build_absolute_uri(...)`.

## 4.5 Analyse IA (`ai_analysis`)

Fichier : `backend/ai_analysis/urls.py` et `backend/ai_analysis/views.py`

- `api/ai_analysis/candidatures/<pk>/lettre/` :
  - `POST` : analyse la lettre de motivation enregistrée pour une candidature existante.
  - `GET` : récupère les résultats de l’analyse.
- `api/ai_analysis/candidatures/<pk>/cv/` :
  - `POST` : analyse le PDF du CV attaché à la candidature.
  - `GET` : récupère l’analyse CV stockée.
- `api/ai_analysis/candidatures/<pk>/score/` :
  - `POST` : calcule ou recalcule le score CV depuis l’analyse existante.
  - `GET` : récupère le score CV sauvegardé.
- `api/ai_analysis/classement/` :
  - `GET` : retourne un classement des candidats par score.
- `api/ai_analysis/analyser/lettre/` et `api/ai_analysis/analyser/cv/` :
  - `POST` : analyse rapide sans créer de candidature, utile pour tests ou pré-évaluation.

### 4.5.1 Permissions et accès
- Toutes les routes d’analyse liées à une candidature exigent `IsAuthenticated`.
- Les routes de POST métiers (`analyse lettre`, `analyse CV`, `compute score`) exigent également le permission class `IsAdminUser`.
- Les endpoints d’analyse rapide exigent seulement `IsAuthenticated`.

### 4.5.2 Fonctionnement principal
- Analyse lettre : utilise `analyze_cover_letter()` pour extraire scores, mentions, style, métriques et recommandations.
- Analyse CV : utilise `analyze_cv()` sur le fichier PDF du CV et sauvegarde les données extraites.
- Score CV : utilise `compute_cv_score()` pour produire un score global, un niveau et un breakdown par compétence/formation/expérience.
- Classement : retourne les candidats déjà scorés, triés par domaine et score.

### 4.5.3 Usage pratique
- Pour un CV déjà uploadé : lancer `POST /api/ai_analysis/candidatures/<pk>/cv/`, puis `GET /api/ai_analysis/candidatures/<pk>/cv/`.
- Pour une lettre déjà stockée : lancer `POST /api/ai_analysis/candidatures/<pk>/lettre/`, puis `GET /api/ai_analysis/candidatures/<pk>/lettre/`.
- Pour tester un fichier sans candidature : utiliser `POST /api/ai_analysis/analyser/cv/` ou `POST /api/ai_analysis/analyser/lettre/`.

---

## 5. Points importants et conseils

### 5.1 Vérifier la requête de login
- L’API de connexion attend `username` et `password`.
- Si le frontend envoie `email` au lieu de `username`, l’authentification échouera et renverra `401`.

### 5.2 Validation des fichiers
- `cv` et `lettre_motivation` doivent être en PDF.
- `photo` doit être JPG ou PNG et < 2 MB.
- `releve_notes` est optionnel.

### 5.3 Statuts et flux de candidature
- Nouveau candidat reçoit automatiquement le statut `Preselected`.
- Un admin peut changer le statut en `Selected` ou `Rejected`.
- En cas de rejet, `motif_refus` peut être enregistré.

### 5.4 Emails d’acceptation/refus
- Les emails utilisent les paramètres SMTP définis dans `settings.py`.
- Le sender est `Recrutement AI System <recrutementhas.noreply@gmail.com>`.
- Les endpoints d’envoi sont protégés par `IsAuthenticated` mais l’autorisation admin est vérifiée dans la vue.

### 5.5 Protocole d’envoi SMTP détaillé
Fichiers : `backend/authentification/views.py`, `backend/core/core/settings.py`

- Django utilise la fonction `send_mail()` pour envoyer un email via SMTP.
- Le backend est configuré avec `EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'`.
- Les paramètres SMTP sont :
  - `EMAIL_HOST = 'smtp.gmail.com'`
  - `EMAIL_PORT = 587`
  - `EMAIL_USE_TLS = True`
  - `EMAIL_HOST_USER` et `EMAIL_HOST_PASSWORD` tirés du `.env`
- Le flux est le suivant :
  1. La vue `send_acceptance_email()` ou `send_rejection_email()` prépare le sujet et le message.
  2. Elle appelle `send_mail(subject, message, django_settings.DEFAULT_FROM_EMAIL, [candidature.email], fail_silently=False)`.
  3. Django crée une connexion SMTP à `smtp.gmail.com:587` avec TLS.
  4. Django s’authentifie avec l’email et le mot de passe configurés.
  5. Si l’envoi réussit, la vue renvoie un `Response` de succès.
  6. En cas d’erreur SMTP, l’exception est capturée et la vue renvoie `status=500`.
- Points importants :
  - Gmail impose souvent une vérification de sécurité, donc il faut activer les accès d’application ou utiliser un mot de passe d’application.
  - `DEFAULT_FROM_EMAIL` est utilisé comme expéditeur visible.
  - `fail_silently=False` force Django à lever des erreurs en cas de problème de connexion ou d’envoi.

---

## 6. Recommandations rapides

- Pour corriger un `401` sur `/api/auth/login/` : vérifier les champs envoyés par le frontend.
- Pour des erreurs de création de candidature : inspecter `serializer.errors` imprimés dans la console.
- Pour l’API candidate : bien utiliser le token JWT dans `Authorization`.
- Pour administrer les candidatures : utiliser les routes `PATCH /api/candidatures/<pk>/statut/` et `POST /api/candidatures/<pk>/evaluation/`.

---

## 7. Résumé

Le backend est construit autour de Django REST Framework avec JWT. L’authentification est centralisée dans `authentification/views.py` et protège la quasi-totalité des routes. La gestion des candidatures repose sur un modèle riche, la création via un serializer multipart/form-data, et des règles de permissions claires pour les actions admin.

Si tu veux, je peux aussi ajouter un diagramme simple des routes API ou une section spécifique sur la configuration des tokens JWT.
