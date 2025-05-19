import jwt
from django.conf import settings
from accounts.models import User
from datetime import datetime, timedelta
from django.http import JsonResponse


def generate_jwt(user):
    payload = {
        "user_id": user.id,
        "exp": datetime.utcnow() + timedelta(hours=6),
        "iat": datetime.utcnow()
    }
    token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm='HS256')
    return token


def decode_jwt(token):
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=['HS256'])
        return User.objects.get(id=payload["user_id"])
    except (jwt.ExpiredSignatureError, jwt.DecodeError, User.DoesNotExist):
        return None


def jwt_required(view_func):
    def wrapper(request, *args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return JsonResponse({"error": "Missing or invalid token"}, status=401)

        token = auth_header.split(" ")[1]
        user = decode_jwt(token)
        if not user:
            return JsonResponse({"error": "Invalid or expired token"}, status=401)

        request.user = user
        return view_func(request, *args, **kwargs)
    return wrapper
