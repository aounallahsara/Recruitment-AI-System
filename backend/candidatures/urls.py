from django.urls import path
from . import views
from authentification.views import send_acceptance_email, send_rejection_email


urlpatterns = [
    path('candidatures/', views.create_candidature, name='candidature-create'),
    path('candidatures/list/', views.list_candidatures, name='candidature-list'),
    path('candidatures/<int:pk>/', views.detail_candidature, name='candidature-detail'),
    path('candidatures/<int:pk>/statut/', views.update_statut, name='candidature-statut'),
    path('dashboard/stats/', views.dashboard_stats, name='dashboard-stats'),
    path('candidatures/<int:pk>/evaluation/', views.create_update_evaluation, name='evaluation'),
    path('candidatures/<int:pk>/evaluation/get/', views.get_evaluation, name='get-evaluation'),
    path('candidatures/<int:candidature_id>/send-acceptance/',
     send_acceptance_email, name='send-acceptance'),
path('candidatures/<int:candidature_id>/send-rejection/',
     send_rejection_email, name='send-rejection'),
]