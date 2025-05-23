from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import RegisterSerializer, ServiceSerializer , AppointmentSerializer
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
import boto3
import os

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
        # Return token, message, and user_id
        return Response({
            'token': token,
            'user_id': user.id,
            'message': f'Welcome back, {user.username}!'
        }, status=200)

    return Response({'error': 'Invalid email or password'}, status=403)


@api_view(['POST'])
def login_with_face(request):
    face_image = request.FILES.get('face_image')
    if not face_image:
        return Response({'error': 'No face image uploaded'}, status=400)

    temp_key = f'faces/{uuid.uuid4()}.jpg'
    upload_image_to_s3(face_image, temp_key)

    face_id = search_face_s3(temp_key)
    if not face_id:
        s3_client.delete_object(Bucket=bucket, Key=temp_key)
        return Response({'error': 'Face not recognized'}, status=403)

    try:
        user = User.objects.get(face_id=face_id)
        s3_client.delete_object(Bucket=bucket, Key=temp_key)

        token = generate_jwt(user)
        # Return token, message, and user_id
        return Response({
            'token': token,
            'user_id': user.id,
            'message': f'Welcome back, {user.username}!'
        }, status=200)
    except User.DoesNotExist:
        s3_client.delete_object(Bucket=bucket, Key=temp_key)
        return Response({'error': 'User not found for face ID'}, status=404)
    
#FOR TEST ONLY ---- IGNORE
@api_view(["POST"])
@csrf_exempt
def test_start_workflow(request):
    data = request.data
    result = start_repair_workflow(data)
    return Response(result)

#for the start of the workflow

#@permission_classes([IsAuthenticated])
@api_view(['POST'])
def submit_repair_request(request):
    user_id = request.data.get("user_id")
    urgency = request.data.get("urgency", False)
    appointment_datetime = request.data.get("appointment_datetime")


    if Appointment.objects.filter(datetime=appointment_datetime).exists():
        return Response({"error": "Time slot already booked"}, status=409)

    # Save appointment
    Appointment.objects.create(
        user_id=user_id,
        datetime=appointment_datetime,
        urgency=urgency
    )

    input_data = {
        "user_id": user_id,
        "urgency": urgency,
        "appointment_datetime": appointment_datetime,
        "customer_showed_up": True  # for testing
    }

    response = start_repair_workflow(input_data)
    return Response({"workflow_execution": response})



#for the approval callback
# This is the callback that will be invoked by the Step Function 
# when the customer approves or rejects the repair request.
# It will be called from the Step Function
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
#will do the pickup and final payment logic.
@api_view(['POST'])
def submit_pickup(request):
    token = request.data.get('task_token')
    picked = request.data.get('picked_up', False)
    

    result = invoke_lambda("HandlePickupCallback", {
        "taskToken": token,
        "picked_up": picked
    })
    return Response(result)




#@permission_classes([IsAuthenticated])
@api_view(["GET"])
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
@api_view(['POST'])
def repair_started(request):
    token = request.data.get('task_token')
    started = request.data.get('repair_started', False)

    result = invoke_lambda("RepairInProgressFunction", {
        "taskToken": token,
        "repair_started": started
    })

    return Response(result)

@api_view(['POST'])
def repair_completed(request):
    token = request.data.get('task_token')
    completed = request.data.get('repair_completed', False)

    result = invoke_lambda("RepairEndedFunction", {
        "taskToken": token,
        "repair_completed": completed
    })

    return Response(result)

@api_view(['GET'])
def list_appointments(request):
    appointments = Appointment.objects.all()
    serializer = AppointmentSerializer(appointments, many=True)
    return Response(serializer.data)



@api_view(['GET'])
def list_started_appointments(request):

    appointments = Appointment.objects.filter(state='started').order_by('datetime')
    serializer = AppointmentSerializer(appointments, many=True)
    return Response(serializer.data)


@api_view(['POST'])
def mark_appointment_ongoing(request):

    appointment_id = request.data.get('appointment_id')

    try:
        appointment = Appointment.objects.get(id=appointment_id)
        if appointment.state != 'started':
            return Response({"error": "Appointment is not in 'started' state."}, status=400)

        appointment.state = 'ongoing'
        appointment.save()
        return Response({"message": "Appointment marked as ongoing."})
    except Appointment.DoesNotExist:
        return Response({"error": "Appointment not found."}, status=404)


@api_view(['GET'])
def list_ongoing_appointments(request):

    appointments = Appointment.objects.filter(state='ongoing').order_by('datetime')
    serializer = AppointmentSerializer(appointments, many=True)
    return Response(serializer.data)




dynamodb = boto3.resource('dynamodb',aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
                            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
                            aws_session_token=os.getenv("aws_session_token"),
                            region_name=os.getenv('AWS_REGION_NAME'))  
table = dynamodb.Table('Tokens') 


stepfunctions_client = boto3.client('stepfunctions',aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
                            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
                            aws_session_token=os.getenv("aws_session_token"),
                            region_name=os.getenv('AWS_REGION_NAME'))




@api_view(['POST'])
def customer_showed_up(request):
    appointment_id = request.data.get('appointment_id')
    showed_up = request.data.get('customer_showed_up', False)

    if not appointment_id:
        return Response({"error": "appointment_id is required."}, status=400)

    try:
        # Fetch task token from DynamoDB
        response = table.get_item(Key={'appointment_id': appointment_id})
        item = response.get('Item')
        if not item or 'task_token' not in item:
            return Response({"error": "Task token not found for this appointment."}, status=404)

        token = item['task_token']

        # Send the callback to Step Functions
        
        stepfunctions_client.send_task_success(
            taskToken=token,
            output=json.dumps({"customer_showed_up": showed_up})
        )

        return Response({"message": "Step Function callback sent successfully."})
    
    except Exception as e:
        return Response({"error": str(e)}, status=500)