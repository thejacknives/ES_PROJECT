from rest_framework import serializers
from .models import User
from accounts.utils.aws import upload_image_to_s3


class RegisterSerializer(serializers.ModelSerializer):
    face_image = serializers.ImageField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'username', 'password', 'face_image']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        face_image = validated_data.pop('face_image')
        password = validated_data.pop('password')

        # Upload to S3
        image_key = f"faces/{validated_data['username']}.jpg"
        # I want to send 
        upload_image_to_s3(face_image, image_key)

        # Index in Rekognition
        #face_id = index_face_s3(image_key, validated_data['username'])

        # Save user
        user = User.objects.create(
            face_id=face_id,
            s3_image_key=image_key,
            **validated_data
        )
        user.set_password(password)
        user.save()
        return user
