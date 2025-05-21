from django.urls import path
from .views import register, login_with_credentials, login_with_face ,submit_approval, submit_payment, submit_pickup, submit_repair_request, test_start_workflow, list_services, available_slots

urlpatterns = [
    path('register/', register),
    path('login/credentials/', login_with_credentials),
    path('login/face/', login_with_face),
    path('workflow/approval/', submit_approval),
    path('workflow/payment/', submit_payment),
    path('workflow/pickup/', submit_pickup),
    path('start-repair/', submit_repair_request),
    path("test/start-workflow/", test_start_workflow),
    path('services/', list_services),
    path('available-slots/', available_slots),


]
