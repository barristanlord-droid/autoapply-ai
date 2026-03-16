"""S3 file storage service."""

import structlog
import boto3
from botocore.exceptions import ClientError

from app.core.config import get_settings

settings = get_settings()
logger = structlog.get_logger()


def _get_s3_client():
    return boto3.client(
        "s3",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION,
    )


async def upload_file(content: bytes, key: str, content_type: str) -> str:
    """Upload a file to S3 and return the URL."""
    s3 = _get_s3_client()
    try:
        s3.put_object(
            Bucket=settings.S3_BUCKET_NAME,
            Key=key,
            Body=content,
            ContentType=content_type,
        )
        url = f"https://{settings.S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{key}"
        logger.info("file_uploaded", key=key, size=len(content))
        return url
    except ClientError as e:
        logger.error("s3_upload_failed", key=key, error=str(e))
        raise


async def get_presigned_url(key: str, expires_in: int = 3600) -> str:
    """Generate a presigned URL for temporary access."""
    s3 = _get_s3_client()
    return s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.S3_BUCKET_NAME, "Key": key},
        ExpiresIn=expires_in,
    )
