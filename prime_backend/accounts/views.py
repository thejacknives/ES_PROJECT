from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import RegisterSerializer
from rest_framework.decorators import api_view
import uuid
#get functions for /utils
from .utils.aws import upload_image_to_s3, search_face_s3
from .models import User

@api_view(['POST'])
def login_with_face(request):
    face_image = request.FILES['face_image']
    temp_key = f'temp_login/{uuid.uuid4()}.jpg'
    upload_image_to_s3(face_image, temp_key)

    match = search_face_s3(temp_key)
    if not match:
        return Response({'error': 'No face match found'}, status=404)

    try:
        user = User.objects.get(face_id=match)
        return Response({'message': f'Welcome back, {user.username}!'})
    except User.DoesNotExist:
        return Response({'error': 'Face ID not recognized'}, status=403)

@api_view(['POST'])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response({'message': 'User registered successfully!'}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
