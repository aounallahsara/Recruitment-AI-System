from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import User
from django.core.mail import send_mail
from django.conf import settings
from django.core.mail import send_mail
from django.conf import settings as django_settings


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response(
            {'error': 'Username et password sont requis.'},
            status=status.HTTP_400_BAD_REQUEST
        )


    user = authenticate(username=username, password=password)
    print(f"Tentative de connexion - Username: {username} | Password: {password}")
    if user is None:
        return Response(
            {'error': 'Identifiants incorrects.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if not user.is_active:
        return Response(
            {'error': 'Compte désactivé.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    # Générer le token JWT
    refresh = RefreshToken.for_user(user)

   
    return Response({
        'token': str(refresh.access_token),
        'user': {
            'id':       user.id,
            'username': user.username,
            'email':    user.email,
            'role':     user.role,
        }
    })
# GET /api/auth/me/
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    user = request.user
    return Response({
        'id':       user.id,
        'username': user.username,
        'email':    user.email,
        'prenom':   user.first_name,
        'nom':      user.last_name,
        'role':     user.role,
    })


# PATCH /api/auth/profile/
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    user = request.user
    user.first_name = request.data.get('prenom', user.first_name)
    user.last_name  = request.data.get('nom', user.last_name)
    user.email      = request.data.get('email', user.email)
    user.save()
    return Response({
        'message': 'Profil mis à jour !',
        'prenom':  user.first_name,
        'nom':     user.last_name,
        'email':   user.email,
    })


# POST /api/auth/change-password/
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    user = request.user
    current  = request.data.get('currentPassword')
    new_pass = request.data.get('newPassword')

    if not current or not new_pass:
        return Response(
            {'error': 'Les deux mots de passe sont requis.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not user.check_password(current):
        return Response(
            {'error': 'Mot de passe actuel incorrect.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if len(new_pass) < 8:
        return Response(
            {'error': 'Le mot de passe doit contenir au moins 8 caractères.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    user.set_password(new_pass)
    user.save()
    return Response({'message': 'Mot de passe changé avec succès !'})



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_acceptance_email(request, candidature_id):
    """Envoyer email d'acceptation au candidat sélectionné."""
    if request.user.role != 'admin':
        return Response({'error': 'Accès refusé'}, status=403)

    try:
        from candidatures.models import Candidature
        candidature = Candidature.objects.get(pk=candidature_id)
    except Candidature.DoesNotExist:
        return Response({'error': 'Candidature non trouvée'}, status=404)

    subject = '🎉 Félicitations ! Votre candidature de stage a été acceptée'
    message = f"""
Bonjour {candidature.prenom} {candidature.nom},

Nous avons le plaisir de vous informer que votre candidature de stage
a été officiellement sélectionnée.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  DÉTAILS DE VOTRE STAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Thème     : {candidature.theme}
  Durée     : {candidature.duree}
  Début     : {candidature.date_debut}
  Fin       : {candidature.date_fin}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Nous vous contacterons très prochainement pour vous communiquer
les informations pratiques concernant votre accueil.

En vous souhaitant la bienvenue dans notre équipe,

Cordialement,
L'équipe des Ressources Humaines
    """

    try:
        send_mail(
            subject, message,
            django_settings.DEFAULT_FROM_EMAIL,
            [candidature.email],
            fail_silently=False,
        )
        return Response({
            'message': f'✅ Email d\'acceptation envoyé à {candidature.email}'
        })
    except Exception as e:
        return Response({'error': f'Erreur envoi email : {str(e)}'}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_rejection_email(request, candidature_id):
    """Envoyer email de refus au candidat rejeté."""
    if request.user.role != 'admin':
        return Response({'error': 'Accès refusé'}, status=403)

    try:
        from candidatures.models import Candidature
        candidature = Candidature.objects.get(pk=candidature_id)
    except Candidature.DoesNotExist:
        return Response({'error': 'Candidature non trouvée'}, status=404)

    motif = candidature.motif_refus or "Votre profil ne correspond pas aux critères requis pour ce stage."

    subject = 'Réponse à votre candidature de stage'
    message = f"""
Bonjour {candidature.prenom} {candidature.nom},

Nous vous remercions de l'intérêt que vous portez à notre entreprise
et du temps consacré à votre candidature de stage.

Après examen attentif de votre dossier, nous avons le regret de vous
informer que nous ne pouvons pas donner suite à votre candidature.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  MOTIF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  {motif}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Cette décision ne remet pas en cause vos qualités personnelles
et professionnelles. Nous vous encourageons à poursuivre vos
démarches et vous souhaitons pleine réussite dans votre parcours.

Cordialement,
L'équipe des Ressources Humaines
    """

    try:
        send_mail(
            subject, message,
            django_settings.DEFAULT_FROM_EMAIL,
            [candidature.email],
            fail_silently=False,
        )
        return Response({
            'message': f'✅ Email de refus envoyé à {candidature.email}'
        })
    except Exception as e:
        return Response({'error': f'Erreur envoi email : {str(e)}'}, status=500)