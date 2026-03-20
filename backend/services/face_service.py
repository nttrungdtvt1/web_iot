"""
services/face_service.py
Face detection and encoding service using the face_recognition library.
Handles encoding computation and comparison for resident verification.
"""

import json
import logging
from typing import Optional
from io import BytesIO

import numpy as np

logger = logging.getLogger(__name__)


def _load_face_recognition():
    """Lazy import face_recognition to avoid startup errors if not installed."""
    try:
        import face_recognition
        return face_recognition
    except ImportError:
        logger.warning("face_recognition library not installed. Face features disabled.")
        return None


def detect_and_encode_face(image_bytes: bytes) -> Optional[list[float]]:
    """
    Detect a face in the given image bytes and compute its 128-dim encoding.

    Args:
        image_bytes: Raw image bytes (JPEG, PNG, etc.)

    Returns:
        List of 128 floats representing the face encoding, or None if no face found.

    Raises:
        ValueError: If multiple faces are detected (only one allowed per resident)
    """
    fr = _load_face_recognition()
    if fr is None:
        logger.error("face_recognition not available")
        return None

    try:
        from PIL import Image

        # Load image using Pillow, convert to RGB numpy array
        image = Image.open(BytesIO(image_bytes)).convert("RGB")
        image_array = np.array(image)

        # Detect face locations
        face_locations = fr.face_locations(image_array, model="hog")

        if len(face_locations) == 0:
            logger.warning("No face detected in the uploaded image")
            return None

        if len(face_locations) > 1:
            raise ValueError(
                f"Multiple faces detected ({len(face_locations)}). "
                "Please upload an image with exactly one face."
            )

        # Compute face encodings
        encodings = fr.face_encodings(image_array, face_locations)

        if not encodings:
            logger.warning("Could not compute face encoding")
            return None

        encoding = encodings[0]
        return encoding.tolist()

    except ValueError:
        raise
    except Exception as e:
        logger.exception(f"Error during face encoding: {e}")
        return None


def compare_faces(
    known_encoding_json: str,
    unknown_image_bytes: bytes,
    tolerance: float = 0.6
) -> tuple[bool, float]:
    """
    Compare a stored face encoding against an unknown face image.

    Args:
        known_encoding_json: JSON string of the stored face encoding
        unknown_image_bytes: Raw image bytes of the unknown person
        tolerance: Match threshold (lower = stricter, default 0.6)

    Returns:
        Tuple of (is_match: bool, confidence: float)
    """
    fr = _load_face_recognition()
    if fr is None:
        return False, 0.0

    try:
        from PIL import Image

        # Deserialize known encoding
        known_encoding = np.array(json.loads(known_encoding_json))

        # Load and encode unknown face
        image = Image.open(BytesIO(unknown_image_bytes)).convert("RGB")
        image_array = np.array(image)

        face_locations = fr.face_locations(image_array)
        if not face_locations:
            return False, 0.0

        unknown_encodings = fr.face_encodings(image_array, face_locations)
        if not unknown_encodings:
            return False, 0.0

        unknown_encoding = unknown_encodings[0]

        # Compute face distance (lower = more similar)
        distance = fr.face_distance([known_encoding], unknown_encoding)[0]
        confidence = float(1.0 - distance)
        is_match = bool(distance <= tolerance)

        return is_match, confidence

    except Exception as e:
        logger.exception(f"Error during face comparison: {e}")
        return False, 0.0


def encoding_to_json(encoding: list[float]) -> str:
    """Serialize a face encoding list to JSON string for storage."""
    return json.dumps(encoding)


def json_to_encoding(encoding_json: str) -> Optional[np.ndarray]:
    """Deserialize a JSON string back to a numpy encoding array."""
    try:
        return np.array(json.loads(encoding_json))
    except Exception:
        return None
