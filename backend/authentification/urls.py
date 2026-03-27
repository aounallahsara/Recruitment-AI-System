from django.urls import path
from . import views

urlpatterns = [
    path('login/',           views.login_view,      name='login'),
    path('me/',              views.me_view,          name='me'),
    path('profile/',         views.update_profile,   name='profile'),
    path('change-password/', views.change_password,  name='change-password'),
]