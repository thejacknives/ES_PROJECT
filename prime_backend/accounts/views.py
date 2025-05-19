from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import RegisterSerializer
from rest_framework.decorators import api_view
import uuid
#get functions for /utils
from .utils.aws import upload_image_to_s3, search_face_s3
from .models import User
from django.contrib.auth import authenticate
from accounts.utils.auth import generate_jwt
from accounts.utils.aws import s3_client, bucket

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