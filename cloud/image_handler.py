"""
cloud/image_handler.py
Image pre-processing utilities: resize, compress, and validate before cloud upload.
Uses Pillow for all image operations.
"""

import io
import logging
from typing import Optional

from PIL import Image, ImageOps, ExifTags

logger = logging.getLogger(__name__)

# Target dimensions and quality settings
FACE_IMAGE_MAX_SIZE = (800, 800)    # Max dimensions for resident face photos
SNAPSHOT_MAX_SIZE = (1280, 720)     # Max dimensions for door camera snapshots
JPEG_QUALITY = 85                   # JPEG compression quality (1-95)
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB output limit


def fix_image_orientation(image: Image.Image) -> Image.Image:
    """
    Auto-rotate image based on EXIF orientation tag.
    Prevents upside-down/sideways photos from phone cameras.
    """
    try:
        exif = image._getexif()
        if exif is None:
            return image

        orientation_key = next(
            (k for k, v in ExifTags.TAGS.items() if v == "Orientation"), None
        )
        if orientation_key and orientation_key in exif:
            orientation = exif[orientation_key]
            rotations = {3: 180, 6: 270, 8: 90}
            if orientation in rotations:
                image = image.rotate(rotations[orientation], expand=True)
    except (AttributeError, Exception):
        pass  # Non-critical — proceed with original
    return image


def process_face_image(image_bytes: bytes) -> Optional[bytes]:
    """
    Process a resident face image for storage:
    1. Decode and validate
    2. Fix EXIF orientation
    3. Convert to RGB (drop alpha)
    4. Resize to max 800x800 (preserve aspect ratio)
    5. Compress as JPEG

    Args:
        image_bytes: Raw input image bytes

    Returns:
        Processed JPEG bytes, or None on failure
    """
    try:
        image = Image.open(io.BytesIO(image_bytes))

        # Fix orientation from EXIF data
        image = fix_image_orientation(image)

        # Convert to RGB (JPEG doesn't support RGBA/palette)
        if image.mode not in ("RGB",):
            image = image.convert("RGB")

        # Resize keeping aspect ratio
        image.thumbnail(FACE_IMAGE_MAX_SIZE, Image.LANCZOS)

        # Save as optimized JPEG
        output = io.BytesIO()
        image.save(output, format="JPEG", quality=JPEG_QUALITY, optimize=True)
        result = output.getvalue()

        logger.info(
            f"Face image processed: {len(image_bytes) // 1024}KB → {len(result) // 1024}KB"
        )
        return result

    except Exception as e:
        logger.error(f"Face image processing failed: {e}")
        return None


def process_snapshot_image(image_bytes: bytes) -> Optional[bytes]:
    """
    Process a door camera snapshot:
    1. Decode and validate
    2. Convert to RGB
    3. Resize to max 1280x720
    4. Compress as JPEG

    Args:
        image_bytes: Raw image bytes from Pi camera

    Returns:
        Processed JPEG bytes, or None on failure
    """
    try:
        image = Image.open(io.BytesIO(image_bytes))
        image = fix_image_orientation(image)

        if image.mode not in ("RGB",):
            image = image.convert("RGB")

        image.thumbnail(SNAPSHOT_MAX_SIZE, Image.LANCZOS)

        output = io.BytesIO()
        image.save(output, format="JPEG", quality=80, optimize=True)
        result = output.getvalue()

        logger.info(
            f"Snapshot processed: {len(image_bytes) // 1024}KB → {len(result) // 1024}KB"
        )
        return result

    except Exception as e:
        logger.error(f"Snapshot processing failed: {e}")
        return None


def validate_image(image_bytes: bytes) -> tuple[bool, str]:
    """
    Validate image format and basic integrity.

    Returns:
        (is_valid: bool, error_message: str)
    """
    ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}

    try:
        image = Image.open(io.BytesIO(image_bytes))
        image.verify()  # Verify it's not corrupted

        if image.format not in ALLOWED_FORMATS:
            return False, f"Unsupported format: {image.format}. Allowed: {', '.join(ALLOWED_FORMATS)}"

        return True, ""

    except Exception as e:
        return False, f"Invalid image: {e}"


def get_image_dimensions(image_bytes: bytes) -> Optional[tuple[int, int]]:
    """Return (width, height) of an image, or None on failure."""
    try:
        image = Image.open(io.BytesIO(image_bytes))
        return image.size
    except Exception:
        return None
