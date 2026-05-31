from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator




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
    adresse = models.CharField(max_length=255, blank=True, null=True)
    photo = models.ImageField(upload_to='photos/', blank=True, null=True)
    def upload_photo(instance, filename):
        return f'photos/{instance.id}_{filename}'
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
    # Ajoute après 'date_soumission'
    motif_refus = models.TextField(blank=True, null=True)
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


# ── Nouveau modèle Evaluation ─────────────────────────────
class Evaluation(models.Model):
    candidature = models.OneToOneField(
        Candidature,
        on_delete=models.CASCADE,
        related_name='evaluation'
    )
    Comprehension_et_apprentissage           = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(20)]
    )
    Competences_techniques_de_base       = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(20)]
    )
    Capacite_adaptation  = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(15)]
    )
    Motivation_et_implication          = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(15)]
    )
     
    Esprit_analyse_et_reflexion   = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(10)]
    )
    Communication_et_comportement = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(10)]
    )
    Autonomie_et_initiative = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(10)]
    )
    commentaire         = models.TextField(blank=True, null=True)
    note_globale        = models.DecimalField(
        max_digits=5, decimal_places=2,
        editable=False, default=0
    )
    date_evaluation     = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        total = (
            self.Comprehension_et_apprentissage +   # max 20
            self.Competences_techniques_de_base +   # max 20
            self.Capacite_adaptation +              # max 15
            self.Motivation_et_implication +        # max 15
            self.Esprit_analyse_et_reflexion +      # max 10
            self.Communication_et_comportement +    # max 10
            self.Autonomie_et_initiative            # max 10
        )
    # Total max possible = 100, ramener sur 20
        self.note_globale = round((total / 100) * 20, 2)
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = 'Évaluation'

    def __str__(self):
        return f"Évaluation de {self.candidature}"


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