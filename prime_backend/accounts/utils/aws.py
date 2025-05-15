# accounts/utils/aws.py
import boto3
import os
from dotenv import load_dotenv

load_dotenv()

region = os.getenv('AWS_REGION_NAME')
bucket = os.getenv('AWS_S3_BUCKET')
collection = os.getenv('AWS_REKOGNITION_COLLECTION')

s3_client = boto3.client('s3',
                        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
                        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
                        aws_session_token=os.getenv("aws_session_token"),
                        region_name=os.getenv('AWS_REGION_NAME'))

def upload_image_to_s3(image_file, s3_key):
    print("Uploading to S3...")
    s3_client.upload_fileobj(
        Fileobj=image_file,
        Bucket=bucket,
        Key=s3_key,
        ExtraArgs={'ContentType': image_file.content_type}
    )


rekognition = boto3.client('rekognition', region_name='us-east-1')  # or your actual region
def index_face_s3(s3_key, external_id):
    response = rekognition.index_faces(
        CollectionId=collection,
        Image={'S3Object': {'Bucket': 'prime-tech-images', 'Name': s3_key}},
        ExternalImageId=external_id,
        DetectionAttributes=['DEFAULT']
    )
    face_id = response['FaceRecords'][0]['Face']['FaceId']
    return face_id


def search_face_s3(s3_key):
    response = rekognition.search_faces_by_image(
        CollectionId=collection,
        Image={'S3Object': {'Bucket': 'prime-tech-images', 'Name': s3_key}},
        MaxFaces=1,
        FaceMatchThreshold=95
    )
    if response['FaceMatches']:
        return response['FaceMatches'][0]['Face']['FaceId']
    return None
