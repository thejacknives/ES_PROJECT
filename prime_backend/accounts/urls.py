from django.urls import path
from .views import register, login_with_credentials, login_with_face

urlpatterns = [
    path('register/', register),
    path('login/credentials/', login_with_credentials),
    path('login/face/', login_with_face),
]
