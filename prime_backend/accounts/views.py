from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import RegisterSerializer
from rest_framework.decorators import api_view

@api_view(['POST'])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    print(request.data)
    
    if serializer.is_valid():
        user = serializer.save()
        return Response({"message": "User registered successfully!"}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

