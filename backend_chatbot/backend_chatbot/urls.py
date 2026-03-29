from django.contrib import admin
from django.urls import path
from chatbot.views import chatbot_ask

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/chatbot/ask/', chatbot_ask, name='chatbot_ask'),
]