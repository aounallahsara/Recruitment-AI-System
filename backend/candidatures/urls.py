from django.urls import path
from . import views

urlpatterns = [
    path('candidatures/', views.create_candidature, name='candidature-create'),
    path('candidatures/list/', views.list_candidatures, name='candidature-list'),
    path('candidatures/<int:pk>/', views.detail_candidature, name='candidature-detail'),
    path('candidatures/<int:pk>/statut/', views.update_statut, name='candidature-statut'),
    path('dashboard/stats/', views.dashboard_stats, name='dashboard-stats'),
]