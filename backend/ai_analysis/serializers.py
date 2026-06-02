from rest_framework import serializers
from .models import AnalyseLettreMotivation, AnalyseCV, ScoreCV


class AnalyseLettreMotivationSerializer(serializers.ModelSerializer):
    class Meta:
        model  = AnalyseLettreMotivation
        fields = [
            'id', 'candidature',
            'clarity_score', 'motivation_score', 'personalization_score',
            'formality_score', 'lexical_richness_score', 'genericity_score',
            'note_globale', 'mention',
            'style_prediction', 'style_prediction_fr', 'style_confidence',
            'style_spectre', 'style_description', 'style_signaux',
            'word_count', 'ttr', 'ameliorations',
            'date_analyse',
        ]
        read_only_fields = fields


class AnalyseCVSerializer(serializers.ModelSerializer):
    class Meta:
        model  = AnalyseCV
        fields = [
            'id', 'candidature',
            'nom_detecte', 'diplome', 'universite_detectee',
            'education', 'langues', 'projets',
            'competences', 'domaine_detecte', 'domaine_confiance',
            'resume',
            'date_analyse',
        ]
        read_only_fields = fields


class ScoreCVSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ScoreCV
        fields = [
            'id', 'candidature',
            'score_cv', 'level', 'domaine',
            'score_competences', 'score_formation',
            'score_experience', 'score_soft_skills',
            'bonus_certifications', 'bonus_projets',
            'date_calcul',
        ]
        read_only_fields = fields
