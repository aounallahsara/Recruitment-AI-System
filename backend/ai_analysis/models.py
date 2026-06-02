from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from candidatures.models import Candidature


class AnalyseLettreMotivation(models.Model):
    candidature = models.OneToOneField(
        Candidature,
        on_delete=models.CASCADE,
        related_name='analyse_lettre'
    )

    # ── Scores 6 dimensions (0-4) ──────────────────────────────────────────
    clarity_score          = models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(4)])
    motivation_score       = models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(4)])
    personalization_score  = models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(4)])
    formality_score        = models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(4)])
    lexical_richness_score = models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(4)])
    genericity_score       = models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(4)])

    # ── Note globale pondérée /20 ──────────────────────────────────────────
    note_globale = models.DecimalField(max_digits=4, decimal_places=1)
    mention      = models.CharField(max_length=20)

    # ── Analyse de style (humain / ia / hybride) ───────────────────────────
    style_prediction   = models.CharField(max_length=20)
    style_prediction_fr = models.CharField(max_length=40)
    style_confidence   = models.DecimalField(max_digits=4, decimal_places=3)
    style_spectre      = models.JSONField()
    style_description  = models.TextField(blank=True)
    style_signaux      = models.JSONField(default=list)

    # ── Métriques textuelles ───────────────────────────────────────────────
    word_count     = models.IntegerField(default=0)
    ttr            = models.DecimalField(max_digits=5, decimal_places=3, default=0)
    ameliorations  = models.JSONField(default=dict)

    date_analyse = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Analyse lettre de motivation"

    def __str__(self):
        return f"Analyse lettre — {self.candidature}"


class AnalyseCV(models.Model):
    candidature = models.OneToOneField(
        Candidature,
        on_delete=models.CASCADE,
        related_name='analyse_cv'
    )

    # ── Champs extraits ────────────────────────────────────────────────────
    nom_detecte        = models.CharField(max_length=200, blank=True)
    diplome            = models.CharField(max_length=200, blank=True)
    universite_detectee = models.CharField(max_length=300, blank=True)
    education          = models.TextField(blank=True)
    langues            = models.JSONField(default=list)
    projets            = models.JSONField(default=list)

    # ── Compétences & domaine ──────────────────────────────────────────────
    competences        = models.JSONField(default=list)
    domaine_detecte    = models.CharField(max_length=100, blank=True)
    domaine_confiance  = models.DecimalField(max_digits=4, decimal_places=3, default=0)

    # ── Résumé extractif ───────────────────────────────────────────────────
    resume = models.TextField(blank=True)

    date_analyse = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Analyse CV"

    def __str__(self):
        return f"Analyse CV — {self.candidature}"


class ScoreCV(models.Model):
    candidature = models.OneToOneField(
        Candidature,
        on_delete=models.CASCADE,
        related_name='score_cv'
    )

    # ── Score global ───────────────────────────────────────────────────────────
    score_cv = models.DecimalField(max_digits=5, decimal_places=1)
    level    = models.CharField(max_length=20)   # junior / mid / senior
    domaine  = models.CharField(max_length=100, blank=True)

    # ── Décomposition par catégorie (0-100) ────────────────────────────────────
    score_competences = models.DecimalField(max_digits=5, decimal_places=1)
    score_formation   = models.DecimalField(max_digits=5, decimal_places=1)
    score_experience  = models.DecimalField(max_digits=5, decimal_places=1)
    score_soft_skills = models.DecimalField(max_digits=5, decimal_places=1)

    # ── Bonus ──────────────────────────────────────────────────────────────────
    bonus_certifications = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    bonus_projets        = models.DecimalField(max_digits=4, decimal_places=1, default=0)

    date_calcul = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Score CV"

    def __str__(self):
        return f"Score CV — {self.candidature} ({self.score_cv}/100)"
