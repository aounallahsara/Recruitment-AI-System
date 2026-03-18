from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Modèle User personnalisé.
    Étend le User Django standard avec un champ 'role'.
    """

    class Role(models.TextChoices):
        ADMIN = 'admin', 'Administrateur'
        RH    = 'rh',    'Ressources Humaines'

    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.RH,
        verbose_name='Rôle'
    )

    def __str__(self):
        return f"{self.username} ({self.role})"

    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN