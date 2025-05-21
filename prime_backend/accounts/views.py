from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import RegisterSerializer, ServiceSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
import uuid
from .utils.aws import upload_image_to_s3, search_face_s3
from .models import User, Service, Appointment, Service
from django.contrib.auth import authenticate
from accounts.utils.auth import generate_jwt
from accounts.utils.aws import s3_client, bucket
from accounts.utils.aws import invoke_lambda
from accounts.utils.aws import start_repair_workflow  # You already have this
from django.views.decorators.csrf import csrf_exempt
import json
from datetime import datetime, timedelta, time


@api_view(['POST'])
def login_with_face(request):
    face_image = request.FILES['face_image']
    temp_key = f'faces/{uuid.uuid4()}.jpg'
    upload_image_to_s3(face_image, temp_key)

    match = search_face_s3(temp_key)
    if not match:
        s3_client.delete_object(Bucket=bucket, Key=temp_key)

        return Response({'error': 'No face match found'}, status=404)

    try:        
        s3_client.delete_object(Bucket=bucket, Key=temp_key)

        user = User.objects.get(face_id=match)
        return Response({'message': f'Welcome back, {user.username}!'})
    except User.DoesNotExist:
        s3_client.delete_object(Bucket=bucket, Key=temp_key)

        return Response({'error': 'Face ID not recognized'}, status=403)

@api_view(['POST'])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response({'message': 'User registered successfully!'}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def login_with_credentials(request):
    email = request.data.get('email')
    password = request.data.get('password')

    user = authenticate(request, email=email, password=password)
    if user:
        token = generate_jwt(user)
        #return token in reponse and message
        return Response({'token': token, 'message': f'Welcome back, {user.username}!'}, status=200)

    return Response({'error': 'Invalid email or password'}, status=403)

@api_view(['POST'])
def login_with_face(request):
    face_image = request.FILES.get('face_image')
    if not face_image:
        return Response({'error': 'No face image uploaded'}, status=400)

    # Upload to S3 with a temp key
    temp_key = f'faces/{uuid.uuid4()}.jpg'
    upload_image_to_s3(face_image, temp_key)

    # Rekognition: search by image
    face_id = search_face_s3(temp_key)
    if not face_id:
        s3_client.delete_object(Bucket=bucket, Key=temp_key)

        return Response({'error': 'Face not recognized'}, status=403)

    try:
        user = User.objects.get(face_id=face_id)
        s3_client.delete_object(Bucket=bucket, Key=temp_key)

        token = generate_jwt(user)
        return Response({'token':token, 'message': f'Welcome back, {user.username}!'}, status=200)
    except User.DoesNotExist:
        s3_client.delete_object(Bucket=bucket, Key=temp_key)

        return Response({'error': 'User not found for face ID'}, status=404)

@api_view(["POST"])
@csrf_exempt
def test_start_workflow(request):
    data = request.data
    result = start_repair_workflow(data)
    return Response(result)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_repair_request(request):
    user_id = request.data.get(request.user.id)
    urgency = request.data.get("urgency", False)
    appointment_datetime = request.data.get("appointment_datetime")
    service_id = request.data.get("service_id")

    try:
        service = Service.objects.get(id=service_id)
    except Service.DoesNotExist:
        return Response({"error": "Invalid service ID"}, status=400)

    if Appointment.objects.filter(datetime=appointment_datetime).exists():
        return Response({"error": "Time slot already booked"}, status=409)

    # Save appointment
    Appointment.objects.create(
        user_id=user_id,
        service=service,
        datetime=appointment_datetime
    )

    input_data = {
        "user_id": user_id,
        "urgency": urgency,
        "appointment_datetime": appointment_datetime,
        "service_id": service_id,
        "service_name": service.name,
        "base_price": float(service.base_price),
        "customer_showed_up": True  # for testing
    }

    response = start_repair_workflow(input_data)
    return Response({"workflow_execution": response})

@api_view(['POST'])
def submit_approval(request):
    token = request.data.get('task_token')
    approved = request.data.get('customer_approved', False)

    result = invoke_lambda("HandleApprovalCallback", {
        "taskToken": token,
        "customer_approved": approved
    })

    return Response(result)

#payment callback
@api_view(['POST'])
def submit_payment(request):
    token = request.data.get('task_token')
    paid = request.data.get('payment_received', False)

    result = invoke_lambda("HandlePaymentCallback", {
        "taskToken": token,
        "payment_received": paid
    })
    return Response(result)

#pickup callback
@api_view(['POST'])
def submit_pickup(request):
    token = request.data.get('task_token')
    picked = request.data.get('picked_up', False)
    final_payment = request.data.get('final_payment', 0)

    result = invoke_lambda("HandlePickupCallback", {
        "taskToken": token,
        "picked_up": picked,
        "final_payment": final_payment
    })
    return Response(result)



@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_available_slots(request):
    date_str = request.GET.get("date")  # expects 'YYYY-MM-DD'
    if not date_str:
        return Response({"error": "Missing date"}, status=400)

    try:
        date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return Response({"error": "Invalid date format"}, status=400)

    opening = time(9, 0)
    closing = time(17, 0)
    step = timedelta(minutes=30)

    slots = []
    current = datetime.combine(date, opening)
    end = datetime.combine(date, closing)

    existing = set(Appointment.objects.filter(
        datetime__date=date
    ).values_list("datetime", flat=True))

    while current <= end:
        if current not in existing:
            slots.append(current.isoformat())
        current += step

    return Response({"available_slots": slots})




@api_view(['GET'])
def list_services(request):
    services = Service.objects.all()
    serializer = ServiceSerializer(services, many=True)
    return Response(serializer.data)



@api_view(['GET'])
def available_slots(request):
    date_str = request.query_params.get('date')
    if not date_str:
        return Response({"error": "Missing date parameter. Format: YYYY-MM-DD"}, status=400)

    try:
        selected_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return Response({"error": "Invalid date format. Use YYYY-MM-DD."}, status=400)

    start_time = time(9, 0)
    end_time = time(18, 0)
    slot_duration = timedelta(minutes=30)

    # Start building all slots
    current_dt = datetime.combine(selected_date, start_time)
    end_dt = datetime.combine(selected_date, end_time)
    slots = []

    while current_dt < end_dt:
        slots.append(current_dt)
        current_dt += slot_duration

    # Get booked appointment times
    booked_times = Appointment.objects.filter(
        datetime__date=selected_date
    ).values_list('datetime', flat=True)

    # Filter out already booked slots
    available = [
        dt.strftime("%H:%M") for dt in slots if dt not in booked_times
    ]

    return Response({
        "date": selected_date.strftime("%Y-%m-%d"),
        "available_slots": available
    })