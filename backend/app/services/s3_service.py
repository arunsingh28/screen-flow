import boto3
from botocore.exceptions import ClientError
from botocore.config import Config
from typing import BinaryIO, Optional
from datetime import datetime
import uuid
from pathlib import Path

from app.core.config import settings


class S3Service:
    """Service for handling AWS S3 operations"""

    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION,
            config=Config(signature_version='s3v4')
        )
        self.bucket_name = settings.S3_BUCKET_NAME

    def generate_s3_key(self, user_id: str, file_type: str, original_filename: str, batch_id: Optional[str] = None) -> str:
        """
        Generate S3 key following best practices
        Format: users/{user_id}/batches/{batch_id}/{file_type}/{uuid}_{filename}
        Or: users/{user_id}/{file_type}/{uuid}_{filename} (without batch)
        """
        # Generate UUID for uniqueness
        file_uuid = str(uuid.uuid4())

        # Clean filename - remove any path components and special characters
        clean_filename = Path(original_filename).name
        file_ext = Path(clean_filename).suffix
        file_stem = Path(clean_filename).stem

        # Create safe filename with UUID prefix
        safe_filename = f"{file_uuid}_{file_stem}{file_ext}"

        # Build S3 key path
        if batch_id:
            s3_key = f"users/{user_id}/batches/{batch_id}/{file_type}/{safe_filename}"
        else:
            s3_key = f"users/{user_id}/{file_type}/{safe_filename}"

        return s3_key

    def upload_file(
        self,
        file_obj: BinaryIO,
        s3_key: str,
        content_type: str = "application/octet-stream",
        metadata: Optional[dict] = None
    ) -> dict:
        """
        Upload file to S3

        Returns:
            dict with s3_key, bucket_name, file_size
        """
        try:
            # Get file size
            file_obj.seek(0, 2)  # Seek to end
            file_size = file_obj.tell()
            file_obj.seek(0)  # Reset to beginning

            # Prepare extra args
            extra_args = {
                'ContentType': content_type,
            }

            if metadata:
                extra_args['Metadata'] = metadata

            # Upload file
            self.s3_client.upload_fileobj(
                file_obj,
                self.bucket_name,
                s3_key,
                ExtraArgs=extra_args
            )

            return {
                's3_key': s3_key,
                'bucket_name': self.bucket_name,
                'file_size': file_size,
            }

        except ClientError as e:
            raise Exception(f"Failed to upload file to S3: {str(e)}")

    def generate_presigned_url(
        self,
        s3_key: str,
        expiration: Optional[int] = None,
        filename: Optional[str] = None
    ) -> str:
        """
        Generate presigned URL for downloading file

        Args:
            s3_key: S3 object key
            expiration: URL expiration in seconds (default from settings)
            filename: Optional filename for Content-Disposition header
        """
        try:
            expiration = expiration or settings.S3_PRESIGNED_URL_EXPIRATION

            params = {
                'Bucket': self.bucket_name,
                'Key': s3_key,
            }

            # Add Content-Disposition if filename provided
            if filename:
                params['ResponseContentDisposition'] = f'inline; filename="{filename}"'

            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params=params,
                ExpiresIn=expiration
            )

            return url

        except ClientError as e:
            raise Exception(f"Failed to generate presigned URL: {str(e)}")

    def delete_file(self, s3_key: str) -> bool:
        """Delete file from S3"""
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            return True
        except ClientError as e:
            raise Exception(f"Failed to delete file from S3: {str(e)}")

    def delete_files(self, s3_keys: list[str]) -> dict:
        """
        Delete multiple files from S3

        Returns:
            dict with deleted count and errors
        """
        if not s3_keys:
            return {'deleted': 0, 'errors': []}

        try:
            # Prepare objects for deletion
            objects = [{'Key': key} for key in s3_keys]

            response = self.s3_client.delete_objects(
                Bucket=self.bucket_name,
                Delete={'Objects': objects}
            )

            deleted = len(response.get('Deleted', []))
            errors = response.get('Errors', [])

            return {
                'deleted': deleted,
                'errors': errors
            }

        except ClientError as e:
            raise Exception(f"Failed to delete files from S3: {str(e)}")

    def file_exists(self, s3_key: str) -> bool:
        """Check if file exists in S3"""
        try:
            self.s3_client.head_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            return True
        except ClientError:
            return False

    def get_file_metadata(self, s3_key: str) -> dict:
        """Get file metadata from S3"""
        try:
            response = self.s3_client.head_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )

            return {
                'content_type': response.get('ContentType'),
                'content_length': response.get('ContentLength'),
                'last_modified': response.get('LastModified'),
                'metadata': response.get('Metadata', {}),
            }

        except ClientError as e:
            raise Exception(f"Failed to get file metadata: {str(e)}")


# Singleton instance
s3_service = S3Service()
