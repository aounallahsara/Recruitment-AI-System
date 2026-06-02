from django.urls import path
from . import views

urlpatterns = [
    # ── Analyse liée à une candidature existante ────────────────────────────
    path('candidatures/<int:pk>/lettre/',         views.analyze_lettre,      name='ai-analyze-lettre'),
    path('candidatures/<int:pk>/lettre/result/',  views.get_analyse_lettre,  name='ai-lettre-result'),
    path('candidatures/<int:pk>/cv/',             views.analyze_cv_view,     name='ai-analyze-cv'),
    path('candidatures/<int:pk>/cv/result/',      views.get_analyse_cv,      name='ai-cv-result'),

    # ── Score CV ─────────────────────────────────────────────────────────────
    path('candidatures/<int:pk>/score/',          views.compute_score_cv,    name='ai-compute-score'),
    path('candidatures/<int:pk>/score/result/',   views.get_score_cv,        name='ai-score-result'),

    # ── Classement ───────────────────────────────────────────────────────────
    path('classement/',                           views.classement_view,     name='ai-classement'),

    # ── Analyse rapide (upload direct, pas de sauvegarde) ───────────────────
    path('analyser/lettre/', views.quick_analyze_lettre, name='ai-quick-lettre'),
    path('analyser/cv/',     views.quick_analyze_cv,     name='ai-quick-cv'),
]
