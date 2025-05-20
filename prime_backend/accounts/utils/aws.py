# accounts/utils/aws.py
import boto3
import os
from dotenv import load_dotenv
import json
from datetime import datetime
import uuid
load_dotenv()

region = os.getenv('AWS_REGION_NAME')
bucket = os.getenv('AWS_S3_BUCKET')
collection = os.getenv('AWS_REKOGNITION_COLLECTION')
rekognition = boto3.client('rekognition', aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
                        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
                        aws_session_token=os.getenv("aws_session_token"),
                        region_name=os.getenv('AWS_REGION_NAME'))

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


  # or your actual region
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
    try:
        response = rekognition.search_faces_by_image(
            CollectionId=collection,
            Image={'S3Object': {'Bucket': bucket, 'Name': s3_key}},
            MaxFaces=1,
            FaceMatchThreshold=90
        )
        if response['FaceMatches']:
            return response['FaceMatches'][0]['Face']['FaceId']
        return None
    except Exception as e:
        print("Error searching face:", e)
        return None
    
lambda_client = boto3.client('lambda', region_name=region,)

def invoke_lambda(function_name, payload):
    response = lambda_client.invoke(
        FunctionName=function_name,
        InvocationType='RequestResponse',
        Payload=json.dumps(payload)
    )
    return json.loads(response['Payload'].read())



# Initialize Step Functions client
stepfunctions_client = boto3.client('stepfunctions', region_name=os.getenv("AWS_REGION_NAME"))

def start_repair_workflow(input_data):
    """
    Starts a Step Functions execution for the repair workflow.
    :param input_data: dict containing user_id, urgency, appointment_datetime, etc.
    :return: execution ARN or error message
    """
    try:
        # Convert datetime string to ISO format if necessary
        if isinstance(input_data.get("appointment_datetime"), datetime):
            input_data["appointment_datetime"] = input_data["appointment_datetime"].isoformat()

        response = stepfunctions_client.start_execution(
            stateMachineArn=os.getenv("AWS_STEP_FUNCTION_ARN"),
            name=f"repair-{uuid.uuid4()}",
            input=json.dumps(input_data)
        )
        return response.get("executionArn")

    except Exception as e:
        return {"error": str(e)}