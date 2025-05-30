from django.urls import path
from .views import register, login_with_credentials, login_with_face ,submit_approval, submit_payment, submit_pickup, submit_repair_request, test_start_workflow, list_services, available_slots, repair_started, repair_completed, list_appointments, list_started_appointments, list_ongoing_appointments, mark_appointment_ongoing, customer_showed_up, submit_payment

urlpatterns = [
    path('register/', register),
    path('login/credentials/', login_with_credentials),
    path('login/face/', login_with_face),
    path('workflow/approval/', submit_approval),
    path('workflow/pickup/', submit_pickup),
    path('start-repair/', submit_repair_request),
    path("test/start-workflow/", test_start_workflow),
    path('services/', list_services),
    path('available-slots/', available_slots),
    path('workflow/repair-started/', repair_started),
    path('workflow/repair-completed/', repair_completed),
    path('list-appointments/', list_appointments),
    path('workflow/check-ongoing/', mark_appointment_ongoing),
    path('workflow/customer-showup/', customer_showed_up),
    path('workflow/submit-payment/', submit_payment),
]
