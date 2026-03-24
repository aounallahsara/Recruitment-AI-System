from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


# ── Tables de référence (3FN) ─────────────────────────────────────────────────

class Wilaya(models.Model):
    nom = models.CharField(max_length=100, unique=True)

    class Meta:
        ordering = ['nom']
        verbose_name = 'Wilaya'

    def __str__(self):
        return self.nom


class Niveau(models.Model):
    class Type(models.TextChoices):
        LICENCE   = 'Licence',   'Licence'
        MASTER    = 'Master',    'Master'
        INGENIEUR = 'Ingénieur', 'Ingénieur'
        DOCTORAT  = 'Doctorat',  'Doctorat'

    nom  = models.CharField(max_length=50, unique=True)
    type = models.CharField(max_length=20, choices=Type.choices)

    class Meta:
        ordering = ['nom']
        verbose_name = 'Niveau'

    def __str__(self):
        return self.nom


class Domaine(models.Model):
    nom = models.CharField(max_length=200, unique=True)

    class Meta:
        ordering = ['nom']
        verbose_name = 'Domaine'

    def __str__(self):
        return self.nom


class Statut(models.Model):
    class Nom(models.TextChoices):
        EN_ATTENTE  = 'Preselected',  'Préselectionné'
        SELECTIONNE = 'Selected', 'Sélectionné'
        REJETE      = 'Rejected', 'Rejeté'

    nom = models.CharField(
        max_length=20,
        choices=Nom.choices,
        unique=True
    )

    class Meta:
        verbose_name = 'Statut'

    def __str__(self):
        return self.nom


# ── Table principale ──────────────────────────────────────────────────────────

class Candidature(models.Model):
    class Genre(models.TextChoices):
        MASCULIN = 'Masculin', 'Masculin'
        FEMININ  = 'Féminin',  'Féminin'

    # Clés étrangères (3FN)
    wilaya  = models.ForeignKey(Wilaya,  on_delete=models.PROTECT)
    niveau  = models.ForeignKey(Niveau,  on_delete=models.PROTECT)
    domaine = models.ForeignKey(Domaine, on_delete=models.PROTECT)
    statut  = models.ForeignKey(Statut,  on_delete=models.PROTECT)

    # Informations personnelles
    prenom         = models.CharField(max_length=100)
    nom            = models.CharField(max_length=100)
    date_naissance = models.DateField()
    genre          = models.CharField(max_length=10, choices=Genre.choices)
    email          = models.EmailField(unique=True)
    telephone      = models.CharField(max_length=20)
    direction      = models.TextField()

    # Informations académiques
    universite = models.CharField(max_length=200)
    moyenne    = models.DecimalField(
        max_digits=4, decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(20)]
    )

    # Détails du stage
    duree                  = models.CharField(max_length=50)
    date_debut             = models.DateField()
    date_fin               = models.DateField()
    encadrant              = models.CharField(max_length=200, blank=True, null=True)
    theme                  = models.TextField()
    lettre_motivation_text = models.TextField()

    # Métadonnées
    date_soumission = models.DateTimeField(auto_now_add=True)
    source = models.CharField(
        max_length=20,
        choices=[
            ('formulaire', 'Formulaire public'),
            ('admin', 'Ajout manuel admin'),
        ],
        default='formulaire'
    )
    class Meta:
        ordering = ['-date_soumission']
        verbose_name = 'Candidature'

    def __str__(self):
        return f"{self.prenom} {self.nom} - {self.statut}"


# ── Table Documents (3FN) ─────────────────────────────────────────────────────

def upload_document(instance, filename):
    return f'documents/{instance.candidature.id}/{instance.type}/{filename}'


class Document(models.Model):
    class Type(models.TextChoices):
        CV      = 'cv',     'Curriculum Vitae'
        LETTRE  = 'lettre', 'Lettre de motivation'
        RELEVE  = 'releve', 'Relevé de notes'

    candidature = models.ForeignKey(
        Candidature,
        on_delete=models.CASCADE,
        related_name='documents'
    )
    type    = models.CharField(max_length=20, choices=Type.choices)
    fichier = models.FileField(upload_to=upload_document)
    date_upload = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Document'
        unique_together = ['candidature', 'type']

    def __str__(self):
        return f"{self.candidature} - {self.type}"