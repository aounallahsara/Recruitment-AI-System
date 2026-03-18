from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


def upload_cv(instance, filename):
    return f'cv/{instance.id}_{filename}'

def upload_lettre(instance, filename):
    return f'lettres/{instance.id}_{filename}'

def upload_releve(instance, filename):
    return f'releves/{instance.id}_{filename}'


class Candidature(models.Model):

    class Statut(models.TextChoices):
        EN_ATTENTE  = 'Pending',  'En attente'
        SELECTIONNE = 'Selected', 'Sélectionné'
        REJETE      = 'Rejected', 'Rejeté'
        PRESELECTIONNE = 'Preselected', 'Présélectionné'

    class Genre(models.TextChoices):
        MASCULIN = 'Masculin', 'Masculin'
        FEMININ  = 'Féminin',  'Féminin'

    class Niveau(models.TextChoices):
        L1 = 'Licence 1',   'Licence 1'
        L2 = 'Licence 2',   'Licence 2'
        L3 = 'Licence 3',   'Licence 3'
        M1 = 'Master 1',    'Master 1'
        M2 = 'Master 2',    'Master 2'
        DOC = 'Doctorat',   'Doctorat'
        ING1 = 'Ingénieur 1', 'Ingénieur 1'
        ING2 = 'Ingénieur 2', 'Ingénieur 2'
        ING3 = 'Ingénieur 3', 'Ingénieur 3'
        ING4 = 'Ingénieur 4', 'Ingénieur 4'
        ING5 = 'Ingénieur 5', 'Ingénieur 5'

    # ── Informations personnelles ─────────────────────
    prenom         = models.CharField(max_length=100)
    nom            = models.CharField(max_length=100)
    date_naissance = models.CharField(max_length=20)
    wilaya         = models.CharField(max_length=100)
    genre          = models.CharField(max_length=10, choices=Genre.choices)
    email          = models.EmailField(unique=True)
    telephone      = models.CharField(max_length=20)
    direction      = models.TextField()  # ← remplace 'adresse'

    # ── Informations académiques ──────────────────────
    universite = models.CharField(max_length=200)
    domaine    = models.CharField(max_length=200)
    niveau     = models.CharField(max_length=20, choices=Niveau.choices)
    moyenne    = models.DecimalField(
        max_digits=4, decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(20)]
    )

    # ── Détails du stage ──────────────────────────────
    duree                  = models.CharField(max_length=50)
    date_debut             = models.CharField(max_length=20)
    date_fin               = models.CharField(max_length=20)
    encadrant              = models.CharField(max_length=200, blank=True, null=True)
    theme                  = models.TextField()
    lettre_motivation_text = models.TextField()

    # ── Fichiers PDF ──────────────────────────────────
    cv                = models.FileField(upload_to=upload_cv)
    lettre_motivation = models.FileField(upload_to=upload_lettre)
    releve_notes      = models.FileField(upload_to=upload_releve)

    # ── Métadonnées ───────────────────────────────────
    statut          = models.CharField(
        max_length=20,
        choices=Statut.choices,
        default=Statut.EN_ATTENTE
    )
    date_soumission = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_soumission']

    def __str__(self):
        return f"{self.prenom} {self.nom} - {self.statut}"