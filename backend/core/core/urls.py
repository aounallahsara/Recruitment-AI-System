from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from authentification.views import send_acceptance_email
 
path('candidatures/<int:candidature_id>/send-email/',
     send_acceptance_email, name='send-email'),

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentification.urls')),
    path('api/', include('candidatures.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)