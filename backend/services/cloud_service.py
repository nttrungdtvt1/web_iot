# """
# services/cloud_service.py
# Cloud image storage abstraction supporting AWS S3 and Cloudinary.
# Set STORAGE_PROVIDER env var to "s3" or "cloudinary".
# """

# import logging
# import os
# import uuid
# from typing import Optional

# from dotenv import load_dotenv

# load_dotenv()

# logger = logging.getLogger(__name__)

# STORAGE_PROVIDER = os.getenv("STORAGE_PROVIDER", "cloudinary").lower()

# # AWS S3 config
# AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
# AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
# AWS_BUCKET_NAME = os.getenv("AWS_BUCKET_NAME", "smart-door-images")
# AWS_REGION = os.getenv("AWS_REGION", "ap-southeast-1")

# # Cloudinary config
# CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
# CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
# CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")


# # ─── Cloudinary Backend ───────────────────────────────────────────────────────

# def _init_cloudinary():
#     """Initialize Cloudinary SDK with credentials."""
#     try:
#         import cloudinary
#         cloudinary.config(
#             cloud_name=CLOUDINARY_CLOUD_NAME,
#             api_key=CLOUDINARY_API_KEY,
#             api_secret=CLOUDINARY_API_SECRET,
#             secure=True,
#         )
#         return True
#     except ImportError:
#         logger.error("cloudinary package not installed")
#         return False


# async def _cloudinary_upload(image_bytes: bytes, folder: str) -> Optional[tuple[str, str]]:
#     """
#     Upload image bytes to Cloudinary.

#     Returns:
#         Tuple of (secure_url, public_id) or None on failure
#     """
#     if not _init_cloudinary():
#         return None

#     try:
#         import cloudinary.uploader

#         # Generate unique public ID
#         public_id = f"{folder}/{uuid.uuid4().hex}"

#         result = cloudinary.uploader.upload(
#             image_bytes,
#             public_id=public_id,
#             resource_type="image",
#             folder=folder,
#             transformation=[
#                 {"width": 800, "height": 800, "crop": "limit"},
#                 {"quality": "auto"},
#                 {"fetch_format": "auto"},
#             ],
#         )
#         return result["secure_url"], result["public_id"]

#     except Exception as e:
#         logger.error(f"Cloudinary upload failed: {e}")
#         return None


# async def _cloudinary_delete(public_id: str) -> bool:
#     """Delete an image from Cloudinary by its public ID."""
#     if not _init_cloudinary():
#         return False

#     try:
#         import cloudinary.uploader
#         result = cloudinary.uploader.destroy(public_id)
#         return result.get("result") == "ok"
#     except Exception as e:
#         logger.error(f"Cloudinary delete failed: {e}")
#         return False


# # ─── AWS S3 Backend ──────────────────────────────────────────────────────────

# async def _s3_upload(image_bytes: bytes, folder: str) -> Optional[tuple[str, str]]:
#     """
#     Upload image bytes to AWS S3.

#     Returns:
#         Tuple of (public_url, s3_key) or None on failure
#     """
#     try:
#         import boto3

#         s3 = boto3.client(
#             "s3",
#             aws_access_key_id=AWS_ACCESS_KEY_ID,
#             aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
#             region_name=AWS_REGION,
#         )

#         key = f"{folder}/{uuid.uuid4().hex}.jpg"
#         s3.put_object(
#             Bucket=AWS_BUCKET_NAME,
#             Key=key,
#             Body=image_bytes,
#             ContentType="image/jpeg",
#             ACL="public-read",
#         )

#         url = f"https://{AWS_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{key}"
#         return url, key

#     except Exception as e:
#         logger.error(f"S3 upload failed: {e}")
#         return None


# async def _s3_delete(key: str) -> bool:
#     """Delete an object from AWS S3."""
#     try:
#         import boto3
#         s3 = boto3.client(
#             "s3",
#             aws_access_key_id=AWS_ACCESS_KEY_ID,
#             aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
#             region_name=AWS_REGION,
#         )
#         s3.delete_object(Bucket=AWS_BUCKET_NAME, Key=key)
#         return True
#     except Exception as e:
#         logger.error(f"S3 delete failed: {e}")
#         return False


# # ─── Public API ───────────────────────────────────────────────────────────────

# async def upload_image(
#     image_bytes: bytes,
#     folder: str = "smart_door"
# ) -> Optional[tuple[str, str]]:
#     """
#     Upload an image to the configured cloud provider.

#     Args:
#         image_bytes: Raw image bytes
#         folder: Storage folder/prefix

#     Returns:
#         Tuple of (public_url, storage_id) or None on failure
#     """
#     if STORAGE_PROVIDER == "s3":
#         return await _s3_upload(image_bytes, folder)
#     else:
#         return await _cloudinary_upload(image_bytes, folder)


# async def delete_image(storage_id: str) -> bool:
#     """
#     Delete an image from cloud storage.

#     Args:
#         storage_id: The public_id (Cloudinary) or key (S3) of the image

#     Returns:
#         True if deleted successfully
#     """
#     if STORAGE_PROVIDER == "s3":
#         return await _s3_delete(storage_id)
#     else:
#         return await _cloudinary_delete(storage_id)


"""
services/cloud_service.py

Mục đích: Service layer để upload/delete ảnh lên cloud storage.
          Được gọi bởi residents.py khi upload ảnh khuôn mặt.

LUỒNG CLOUDINARY (Backend):
  1. User chọn ảnh trên Residents page
  2. React gọi POST /api/residents/{id}/face-image (multipart)
  3. FastAPI residents.py đọc file bytes
  4. Gọi cloud_service.upload_image(bytes, folder='residents')
  5. cloud_service gọi CloudinaryStorageClient.upload()
  6. Cloudinary trả về (secure_url, public_id)
  7. Backend lưu URL vào DB, trả về ResidentResponse

CÁC BIẾN MÔI TRƯỜNG CẦN SET (trong backend/.env):
  STORAGE_PROVIDER=cloudinary
  CLOUDINARY_CLOUD_NAME=dkqlpd5e2
  CLOUDINARY_API_KEY=173195636838673
  CLOUDINARY_API_SECRET=rzkAjyPXCDDKoiY28GxLJd_pUr0

LƯU Ý CLOUDINARY TRÊN PI:
  Pi dùng thư viện cloudinary riêng (pip install cloudinary) với biến
  CLOUD_BACKEND, CLOUD_BUCKET, CLOUD_KEY_ID, CLOUD_SECRET trong Pi/.env.
  Đây là TWO separate upload pipelines:
    - Pi upload snapshot sự kiện (face_unknown, motion, v.v.)
    - Backend upload ảnh profile cư dân (từ Residents page)
"""

import logging
import os

logger = logging.getLogger(__name__)

# Lazy import để tránh lỗi nếu package chưa cài
def _get_cloudinary_client():
    try:
        import cloudinary
        import cloudinary.uploader
        cloudinary.config(
            cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
            api_key=os.getenv('CLOUDINARY_API_KEY'),
            api_secret=os.getenv('CLOUDINARY_API_SECRET'),
            secure=True,
        )
        return cloudinary
    except ImportError:
        logger.error('cloudinary package not installed. Run: pip install cloudinary')
        return None

def _get_s3_client():
    try:
        import boto3
        return boto3.client(
            's3',
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
            region_name=os.getenv('AWS_REGION', 'ap-southeast-1'),
        )
    except ImportError:
        logger.error('boto3 not installed. Run: pip install boto3')
        return None


async def upload_image(image_bytes: bytes, folder: str = 'smart_door') -> tuple[str, str] | None:
    """
    Upload ảnh lên cloud storage.
    Trả về (url, public_id) hoặc None nếu lỗi.
    """
    provider = os.getenv('STORAGE_PROVIDER', 'cloudinary').lower()

    if provider == 'cloudinary':
        return _upload_cloudinary(image_bytes, folder)
    elif provider == 's3':
        return _upload_s3(image_bytes, folder)
    else:
        logger.error(f'Unknown STORAGE_PROVIDER: {provider}')
        return None


def _upload_cloudinary(image_bytes: bytes, folder: str) -> tuple[str, str] | None:
    """Upload lên Cloudinary, trả về (secure_url, public_id)."""
    cloudinary = _get_cloudinary_client()
    if not cloudinary:
        return None
    try:
        import uuid
        import cloudinary.uploader
        public_id = f'{folder}/{uuid.uuid4().hex}'
        result = cloudinary.uploader.upload(
            image_bytes,
            public_id=public_id,
            resource_type='image',
            transformation=[
                {'width': 800, 'height': 800, 'crop': 'limit'},
                {'quality': 'auto'},
                {'fetch_format': 'auto'},
            ],
        )
        logger.info(f'Cloudinary upload OK: {result["public_id"]}')
        return result['secure_url'], result['public_id']
    except Exception as e:
        logger.error(f'Cloudinary upload error: {e}')
        return None


def _upload_s3(image_bytes: bytes, folder: str) -> tuple[str, str] | None:
    """Upload lên AWS S3, trả về (public_url, key)."""
    import uuid
    s3     = _get_s3_client()
    bucket = os.getenv('AWS_BUCKET_NAME', 'smart-door-images')
    region = os.getenv('AWS_REGION', 'ap-southeast-1')
    if not s3:
        return None
    try:
        key = f'{folder}/{uuid.uuid4().hex}.jpg'
        s3.put_object(
            Bucket=bucket,
            Key=key,
            Body=image_bytes,
            ContentType='image/jpeg',
            ACL='public-read',
        )
        url = f'https://{bucket}.s3.{region}.amazonaws.com/{key}'
        logger.info(f'S3 upload OK: {key}')
        return url, key
    except Exception as e:
        logger.error(f'S3 upload error: {e}')
        return None


async def delete_image(public_id: str) -> bool:
    """Xóa ảnh khỏi cloud storage theo public_id/key."""
    provider = os.getenv('STORAGE_PROVIDER', 'cloudinary').lower()

    if provider == 'cloudinary':
        try:
            import cloudinary.uploader
            _get_cloudinary_client()
            result = cloudinary.uploader.destroy(public_id)
            return result.get('result') == 'ok'
        except Exception as e:
            logger.error(f'Cloudinary delete error: {e}')
            return False

    elif provider == 's3':
        try:
            s3     = _get_s3_client()
            bucket = os.getenv('AWS_BUCKET_NAME', 'smart-door-images')
            s3.delete_object(Bucket=bucket, Key=public_id)
            return True
        except Exception as e:
            logger.error(f'S3 delete error: {e}')
            return False

    return False
