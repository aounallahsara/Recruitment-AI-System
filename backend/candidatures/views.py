import os
import datetime
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.db.models import Q
from .models import Candidature, Statut
from .serializers import (
    CandidatureCreateSerializer,
    CandidatureListSerializer,
    CandidatureUpdateStatutSerializer
)
from .permissions import IsAdminUser


@api_view(['POST'])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser, FormParser])
def create_candidature(request):
    serializer = CandidatureCreateSerializer(data=request.data)
    if serializer.is_valid():
        candidature = serializer.save()
        return Response(
            CandidatureListSerializer(
                candidature, context={'request': request}
            ).data,
            status=status.HTTP_201_CREATED
        )
    return Response(
        {'error': 'Données invalides', 'details': serializer.errors},
        status=status.HTTP_400_BAD_REQUEST
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_candidatures(request):
    candidatures = Candidature.objects.all()

    statut = request.query_params.get('statut')
    if statut:
        candidatures = candidatures.filter(statut__nom=statut)

    search = request.query_params.get('search')
    if search:
        candidatures = candidatures.filter(
            Q(nom__icontains=search) |
            Q(prenom__icontains=search) |
            Q(email__icontains=search)
        )

    serializer = CandidatureListSerializer(
        candidatures, many=True, context={'request': request}
    )
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def detail_candidature(request, pk):
    try:
        candidature = Candidature.objects.get(pk=pk)
    except Candidature.DoesNotExist:
        return Response(
            {'error': 'Candidature non trouvée'},
            status=status.HTTP_404_NOT_FOUND
        )
    serializer = CandidatureListSerializer(
        candidature, context={'request': request}
    )
    return Response(serializer.data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsAdminUser])
def update_statut(request, pk):
    try:
        candidature = Candidature.objects.get(pk=pk)
    except Candidature.DoesNotExist:
        return Response(
            {'error': 'Candidature non trouvée'},
            status=status.HTTP_404_NOT_FOUND
        )

    nouveau_statut = request.data.get('statut_nom')

    # ── Mise à jour du statut (sans suppression) ──────────
    serializer = CandidatureUpdateStatutSerializer(
        candidature, data=request.data, partial=True
    )
    if serializer.is_valid():
        serializer.save()
        return Response(
            CandidatureListSerializer(
                candidature, context={'request': request}
            ).data
        )
    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    mois = datetime.date.today().month
    annee = datetime.date.today().year
    return Response({
        'total':        Candidature.objects.count(),
        'en_attente':   Candidature.objects.filter(statut__nom='Preselected').count(),
        'selectionnes': Candidature.objects.filter(statut__nom='Selected').count(),
        'rejetes':      Candidature.objects.filter(statut__nom='Rejected').count(),
        'ce_mois':      Candidature.objects.filter(
            date_soumission__month=mois,
            date_soumission__year=annee
        ).count(),
    })