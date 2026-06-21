from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from authentification.views import send_acceptance_email
 

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentification.urls')),
    path('api/', include('candidatures.urls')),
    path('api/ai_analysis/', include('ai_analysis.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)