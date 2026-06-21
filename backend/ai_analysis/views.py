import os
import tempfile
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from candidatures.models import Candidature, Document
from candidatures.permissions import IsAdminUser
from .models import AnalyseLettreMotivation, AnalyseCV, ScoreCV
from .serializers import AnalyseLettreMotivationSerializer, AnalyseCVSerializer, ScoreCVSerializer
from .cover_letter.report import analyze_cover_letter
from .cv.analyzer import analyze_cv
from .cv.scoring import compute_cv_score, rank_candidates


# ─────────────────────────────────────────────────────────────────────────────
# LETTRE DE MOTIVATION
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def analyze_lettre(request, pk):
    """
    Analyse la lettre de motivation stockée dans Candidature.lettre_motivation_text.
    Crée ou remplace l'analyse existante.

    POST /api/ai/candidatures/<pk>/lettre/
    """
    try:
        candidature = Candidature.objects.get(pk=pk)
    except Candidature.DoesNotExist:
        return Response({'error': 'Candidature non trouvée'}, status=404)

    text = (candidature.lettre_motivation_text or '').strip()
    if not text:
        return Response({'error': 'Aucun texte de lettre de motivation disponible'}, status=400)

    result = analyze_cover_letter(text)

    style  = result['style']
    scores = result['scores']

    obj, _ = AnalyseLettreMotivation.objects.update_or_create(
        candidature=candidature,
        defaults={
            'clarity_score':          scores['clarity_score'],
            'motivation_score':       scores['motivation_score'],
            'personalization_score':  scores['personalization_score'],
            'formality_score':        scores['formality_score'],
            'lexical_richness_score': scores['lexical_richness_score'],
            'genericity_score':       scores['genericity_score'],
            'note_globale':           result['note_globale'],
            'mention':                result['mention'],
            'style_prediction':       style['prediction'],
            'style_prediction_fr':    style['prediction_fr'],
            'style_confidence':       style['confidence'],
            'style_spectre':          style['spectre'],
            'style_description':      style['description'],
            'style_signaux':          style['signaux'],
            'word_count':             result['metriques']['word_count'],
            'ttr':                    result['metriques']['ttr'],
            'ameliorations':          result['ameliorations'],
        }
    )

    return Response(AnalyseLettreMotivationSerializer(obj).data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_analyse_lettre(request, pk):
    """
    Retourne l'analyse de lettre de motivation d'une candidature.

    GET /api/ai/candidatures/<pk>/lettre/
    """
    try:
        candidature = Candidature.objects.get(pk=pk)
        analyse     = candidature.analyse_lettre
        return Response(AnalyseLettreMotivationSerializer(analyse).data)
    except Candidature.DoesNotExist:
        return Response({'error': 'Candidature non trouvée'}, status=404)
    except AnalyseLettreMotivation.DoesNotExist:
        return Response({'error': 'Aucune analyse disponible — lancez POST d\'abord'}, status=404)


# ─────────────────────────────────────────────────────────────────────────────
# CV
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def analyze_cv_view(request, pk):
    """
    Analyse le CV PDF (Document.type='cv') lié à une candidature.
    Crée ou remplace l'analyse existante.

    POST /api/ai/candidatures/<pk>/cv/
    """
    try:
        candidature = Candidature.objects.get(pk=pk)
    except Candidature.DoesNotExist:
        return Response({'error': 'Candidature non trouvée'}, status=404)

    try:
        doc = candidature.documents.get(type=Document.Type.CV)
    except Document.DoesNotExist:
        return Response({'error': 'Aucun CV uploadé pour cette candidature'}, status=400)

    pdf_path = doc.fichier.path
    if not os.path.exists(pdf_path):
        return Response({'error': f'Fichier introuvable : {pdf_path}'}, status=400)

    try:
        result = analyze_cv(pdf_path, use_bert=True)
    except RuntimeError as e:
        return Response({'error': str(e)}, status=400)

    fields = result['fields']

    obj, _ = AnalyseCV.objects.update_or_create(
        candidature=candidature,
        defaults={
            'nom_detecte':         fields.get('name', ''),
            'diplome':             fields.get('degree', ''),
            'universite_detectee': fields.get('university', ''),
            'education':           fields.get('education', ''),
            'langues':             fields.get('languages', []),
            'projets':             fields.get('projects', []),
            'competences':         result['skills'],
            'domaine_detecte':     result['domain'],
            'domaine_confiance':   result['domain_confidence'],
            'resume':              result['summary'],
        }
    )

    # ── Scoring automatique depuis les données extraites ──────────────────────
    profile = {
        'name':             fields.get('name', f"{candidature.prenom} {candidature.nom}"),
        'domain':           result['domain'] or 'default',
        'skills':           result['skills'] or [],
        'degree':           fields.get('degree', ''),
        'university':       fields.get('university', ''),
        'experience_years': 0,
        'projects':         fields.get('projects', []),
        'languages':        fields.get('languages', []),
        'certifications':   [],
        'soft_skills':      [],
    }
    score_result = compute_cv_score(profile)
    bd = score_result['breakdown']
    bonuses = score_result['bonuses']
    score_obj, _ = ScoreCV.objects.update_or_create(
        candidature=candidature,
        defaults={
            'score_cv':            score_result['score_cv'],
            'level':               score_result['level'],
            'domaine':             score_result['domain'],
            'score_competences':   bd['competences'],
            'score_formation':     bd['formation'],
            'score_experience':    bd['experience'],
            'score_soft_skills':   bd['soft_skills'],
            'bonus_certifications': bonuses['certifications'],
            'bonus_projets':       bonuses['projets'],
        },
    )

    response_data = AnalyseCVSerializer(obj).data
    response_data['score_cv'] = ScoreCVSerializer(score_obj).data
    return Response(response_data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_analyse_cv(request, pk):
    """
    Retourne l'analyse CV d'une candidature.

    GET /api/ai/candidatures/<pk>/cv/
    """
    try:
        candidature = Candidature.objects.get(pk=pk)
        analyse     = candidature.analyse_cv
        return Response(AnalyseCVSerializer(analyse).data)
    except Candidature.DoesNotExist:
        return Response({'error': 'Candidature non trouvée'}, status=404)
    except AnalyseCV.DoesNotExist:
        return Response({'error': 'Aucune analyse disponible — lancez POST d\'abord'}, status=404)


# ─────────────────────────────────────────────────────────────────────────────
# ANALYSE RAPIDE — sans candidature, pas de sauvegarde en base
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([JSONParser, MultiPartParser, FormParser])
def quick_analyze_lettre(request):
    """
    Analyse rapide d'une lettre de motivation sans lien avec une candidature.

    Modes acceptés :
      • JSON  : {"text": "..."}
      • Multipart : fichier=<PDF>

    POST /api/ai/analyser/lettre/
    """
    text = None

    if 'fichier' in request.FILES:
        pdf_file = request.FILES['fichier']
        suffix   = os.path.splitext(pdf_file.name)[1] or '.pdf'
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            for chunk in pdf_file.chunks():
                tmp.write(chunk)
            tmp_path = tmp.name
        try:
            from .cv.extractor import extract_text_from_pdf
            text = extract_text_from_pdf(tmp_path)
        except Exception as e:
            return Response({'error': f'Extraction PDF échouée : {e}'}, status=400)
        finally:
            os.unlink(tmp_path)
    else:
        text = (request.data.get('text') or request.data.get('contenu') or '').strip()

    if not text or len(text) < 20:
        return Response({'error': 'Texte trop court ou vide (minimum 20 caractères)'}, status=400)

    result = analyze_cover_letter(text)
    return Response(result)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def quick_analyze_cv(request):
    """
    Analyse d'un CV PDF.

    POST /api/ai/analyser/cv/
    Body (multipart) :
      fichier  = PDF du CV
      use_bert = "true" | "false" (défaut : false)
                 false → extraction heuristique instantanée (nom, diplôme, projets…)
                 true  → + compétences NER + domaine + résumé
                          (lent au 1er appel : télécharge ~2 Go de modèles BERT)
    """
    if 'fichier' not in request.FILES:
        return Response({'error': 'Champ "fichier" manquant dans la requête multipart'}, status=400)

    use_bert = request.data.get('use_bert', 'false').lower() == 'true'

    pdf_file = request.FILES['fichier']
    suffix   = os.path.splitext(pdf_file.name)[1] or '.pdf'

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        for chunk in pdf_file.chunks():
            tmp.write(chunk)
        tmp_path = tmp.name

    try:
        result = analyze_cv(tmp_path, use_bert=use_bert)
    except RuntimeError as e:
        return Response({'error': str(e)}, status=400)
    except Exception as e:
        return Response({'error': f'Analyse échouée : {e}'}, status=500)
    finally:
        os.unlink(tmp_path)

    # Scoring automatique inclus dans la réponse rapide
    fields = result.get('fields', {})
    profile = {
        'name':             fields.get('name', ''),
        'domain':           result.get('domain') or 'default',
        'skills':           result.get('skills') or [],
        'degree':           fields.get('degree', ''),
        'university':       fields.get('university', ''),
        'experience_years': 0,
        'projects':         fields.get('projects', []),
        'languages':        fields.get('languages', []),
        'certifications':   [],
        'soft_skills':      [],
    }
    result['score_cv'] = compute_cv_score(profile)

    return Response(result)


# ─────────────────────────────────────────────────────────────────────────────
# SCORE CV
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def compute_score_cv(request, pk):
    """
    Calcule le score CV d'une candidature depuis les données de l'AnalyseCV.
    Crée ou remplace le score existant.

    Body JSON optionnel :
      {
        "experience_years": 2,
        "certifications":   ["AWS", "Scrum"],
        "soft_skills":      ["teamwork", "communication"]
      }

    POST /api/ai/candidatures/<pk>/score/
    """
    try:
        candidature = Candidature.objects.get(pk=pk)
    except Candidature.DoesNotExist:
        return Response({'error': 'Candidature non trouvée'}, status=404)

    try:
        analyse = candidature.analyse_cv
    except AnalyseCV.DoesNotExist:
        return Response(
            {'error': "Aucune analyse CV disponible — lancez d'abord POST /api/ai/candidatures/<pk>/cv/"},
            status=400,
        )

    experience_years = int(request.data.get('experience_years', 0))
    certifications   = request.data.get('certifications', [])
    soft_skills      = request.data.get('soft_skills', [])

    profile = {
        'name':             analyse.nom_detecte or f"{candidature.prenom} {candidature.nom}",
        'domain':           analyse.domaine_detecte or 'default',
        'skills':           analyse.competences or [],
        'degree':           analyse.diplome or '',
        'university':       analyse.universite_detectee or '',
        'experience_years': experience_years,
        'projects':         analyse.projets or [],
        'languages':        analyse.langues or [],
        'certifications':   certifications if isinstance(certifications, list) else [],
        'soft_skills':      soft_skills if isinstance(soft_skills, list) else [],
    }

    result = compute_cv_score(profile)
    bd     = result['breakdown']
    bonuses = result['bonuses']

    obj, _ = ScoreCV.objects.update_or_create(
        candidature=candidature,
        defaults={
            'score_cv':            result['score_cv'],
            'level':               result['level'],
            'domaine':             result['domain'],
            'score_competences':   bd['competences'],
            'score_formation':     bd['formation'],
            'score_experience':    bd['experience'],
            'score_soft_skills':   bd['soft_skills'],
            'bonus_certifications': bonuses['certifications'],
            'bonus_projets':       bonuses['projets'],
        },
    )

    return Response(ScoreCVSerializer(obj).data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_score_cv(request, pk):
    """
    Retourne le score CV d'une candidature.

    GET /api/ai/candidatures/<pk>/score/
    """
    try:
        candidature = Candidature.objects.get(pk=pk)
        score = candidature.score_cv
        return Response(ScoreCVSerializer(score).data)
    except Candidature.DoesNotExist:
        return Response({'error': 'Candidature non trouvée'}, status=404)
    except ScoreCV.DoesNotExist:
        return Response({'error': 'Aucun score calculé — lancez POST d\'abord'}, status=404)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def classement_view(request):
    """
    Retourne le classement des candidats ayant un score CV calculé.
    Trié par domaine puis score décroissant.

    GET /api/ai/classement/
    GET /api/ai/classement/?domaine=Computer+Science+and+IT
    """
    domaine_filter = request.query_params.get('domaine', None)

    scores_qs = ScoreCV.objects.select_related('candidature').all()
    if domaine_filter:
        scores_qs = scores_qs.filter(domaine=domaine_filter)

    candidates = [
        {
            'candidature_id': s.candidature.id,
            'nom':            f"{s.candidature.prenom} {s.candidature.nom}",
            'domain':         s.domaine,
            'score_cv':       float(s.score_cv),
            'level':          s.level,
            'breakdown': {
                'competences': float(s.score_competences),
                'formation':   float(s.score_formation),
                'experience':  float(s.score_experience),
                'soft_skills': float(s.score_soft_skills),
            },
        }
        for s in scores_qs
    ]

    ranked = rank_candidates(candidates)

    return Response({
        'total': len(ranked),
        'domaine_filtre': domaine_filter,
        'classement': ranked,
    })
