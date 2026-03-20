"""
cloud/storage_client.py
Low-level cloud storage client — thin wrappers around boto3 (S3) and Cloudinary SDK.
Used by the backend services/cloud_service.py and standalone cloud utilities.
"""

import logging
import os
import uuid
from typing import Optional

from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)


# ─── S3 Client ───────────────────────────────────────────────────────────────

class S3StorageClient:
    """
    AWS S3 storage client.
    Requires: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_BUCKET_NAME, AWS_REGION
    """

    def __init__(self):
        import boto3
        self.s3 = boto3.client(
            "s3",
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            region_name=os.getenv("AWS_REGION", "ap-southeast-1"),
        )
        self.bucket = os.getenv("AWS_BUCKET_NAME", "smart-door-images")
        self.region = os.getenv("AWS_REGION", "ap-southeast-1")

    def upload(self, data: bytes, folder: str = "smart_door", content_type: str = "image/jpeg") -> Optional[tuple[str, str]]:
        """
        Upload bytes to S3.
        Returns: (public_url, key) or None
        """
        try:
            key = f"{folder}/{uuid.uuid4().hex}.jpg"
            self.s3.put_object(
                Bucket=self.bucket,
                Key=key,
                Body=data,
                ContentType=content_type,
                ACL="public-read",
            )
            url = f"https://{self.bucket}.s3.{self.region}.amazonaws.com/{key}"
            logger.info(f"S3 upload: {key}")
            return url, key
        except Exception as e:
            logger.error(f"S3 upload error: {e}")
            return None

    def delete(self, key: str) -> bool:
        """Delete an object by key. Returns True on success."""
        try:
            self.s3.delete_object(Bucket=self.bucket, Key=key)
            logger.info(f"S3 deleted: {key}")
            return True
        except Exception as e:
            logger.error(f"S3 delete error: {e}")
            return False

    def list_objects(self, prefix: str = "", older_than_days: int = 30) -> list[dict]:
        """List objects older than specified days (for cleanup jobs)."""
        from datetime import datetime, timezone, timedelta
        try:
            cutoff = datetime.now(timezone.utc) - timedelta(days=older_than_days)
            paginator = self.s3.get_paginator("list_objects_v2")
            old_objects = []
            for page in paginator.paginate(Bucket=self.bucket, Prefix=prefix):
                for obj in page.get("Contents", []):
                    if obj["LastModified"] < cutoff:
                        old_objects.append({"key": obj["Key"], "last_modified": obj["LastModified"]})
            return old_objects
        except Exception as e:
            logger.error(f"S3 list error: {e}")
            return []

    def delete_batch(self, keys: list[str]) -> int:
        """Delete multiple objects. Returns count of deleted objects."""
        if not keys:
            return 0
        try:
            objects = [{"Key": k} for k in keys]
            # S3 batch delete supports up to 1000 at a time
            for i in range(0, len(objects), 1000):
                batch = objects[i:i + 1000]
                self.s3.delete_objects(Bucket=self.bucket, Delete={"Objects": batch})
            logger.info(f"S3 batch deleted {len(keys)} objects")
            return len(keys)
        except Exception as e:
            logger.error(f"S3 batch delete error: {e}")
            return 0


# ─── Cloudinary Client ───────────────────────────────────────────────────────

class CloudinaryStorageClient:
    """
    Cloudinary storage client.
    Requires: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
    """

    def __init__(self):
        import cloudinary
        cloudinary.config(
            cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
            api_key=os.getenv("CLOUDINARY_API_KEY"),
            api_secret=os.getenv("CLOUDINARY_API_SECRET"),
            secure=True,
        )

    def upload(self, data: bytes, folder: str = "smart_door") -> Optional[tuple[str, str]]:
        """
        Upload bytes to Cloudinary with auto optimization.
        Returns: (secure_url, public_id) or None
        """
        try:
            import cloudinary.uploader
            public_id = f"{folder}/{uuid.uuid4().hex}"
            result = cloudinary.uploader.upload(
                data,
                public_id=public_id,
                resource_type="image",
                transformation=[
                    {"width": 800, "height": 800, "crop": "limit"},
                    {"quality": "auto"},
                    {"fetch_format": "auto"},
                ],
            )
            logger.info(f"Cloudinary upload: {result['public_id']}")
            return result["secure_url"], result["public_id"]
        except Exception as e:
            logger.error(f"Cloudinary upload error: {e}")
            return None

    def delete(self, public_id: str) -> bool:
        """Delete by public_id. Returns True on success."""
        try:
            import cloudinary.uploader
            result = cloudinary.uploader.destroy(public_id)
            success = result.get("result") == "ok"
            logger.info(f"Cloudinary deleted {public_id}: {result}")
            return success
        except Exception as e:
            logger.error(f"Cloudinary delete error: {e}")
            return False

    def list_old_resources(self, folder: str = "smart_door", older_than_days: int = 30) -> list[str]:
        """Return public_ids of resources older than specified days."""
        from datetime import datetime, timezone, timedelta
        try:
            import cloudinary.api
            cutoff = datetime.now(timezone.utc) - timedelta(days=older_than_days)
            results = cloudinary.api.resources(
                type="upload",
                prefix=folder,
                max_results=500,
            )
            old_ids = [
                r["public_id"]
                for r in results.get("resources", [])
                if datetime.fromisoformat(r["created_at"].replace("Z", "+00:00")) < cutoff
            ]
            return old_ids
        except Exception as e:
            logger.error(f"Cloudinary list error: {e}")
            return []


# ─── Factory ─────────────────────────────────────────────────────────────────

def get_storage_client():
    """Return the configured storage client based on STORAGE_PROVIDER env var."""
    provider = os.getenv("STORAGE_PROVIDER", "cloudinary").lower()
    if provider == "s3":
        return S3StorageClient()
    return CloudinaryStorageClient()
