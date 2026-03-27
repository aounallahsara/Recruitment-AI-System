from django.urls import path
from . import views

urlpatterns = [
    path('candidatures/', views.create_candidature),
    path('candidatures/list/', views.list_candidatures),
    path('candidatures/<int:pk>/', views.detail_candidature),
    path('candidatures/<int:pk>/statut/', views.update_statut),
    path('dashboard/stats/', views.dashboard_stats),
]