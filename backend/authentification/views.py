from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate


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