from rest_framework.permissions import BasePermission


class IsAdminUser(BasePermission):
    message = 'Accès refusé : vous devez être administrateur.'

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'admin'
        )


class IsAdminOrRH(BasePermission):
    message = 'Accès refusé : vous devez être RH ou administrateur.'

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ['admin', 'rh']
        )