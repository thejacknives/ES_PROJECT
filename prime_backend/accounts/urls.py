from django.urls import path
from .views import register

urlpatterns = [
    path('log/', view= register),
]
