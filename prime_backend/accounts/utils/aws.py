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
                        region_name=os.getenv('AWS_REGION_NAME'))

def upload_image_to_s3(file_obj, filename):
    print("Uploading to S3...")
    print(f"Bucket: {bucket}")
    s3_client.upload_file(Filename=filename, Bucket=bucket, Key=filename)
    print(f"Filename: {filename}")
    s3_client.upload_fileobj(file_obj, bucket, filename)
    return filename

