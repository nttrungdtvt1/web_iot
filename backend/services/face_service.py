# # # # # """
# # # # # web_app_clean/backend/services/face_service.py

# # # # # CHANGES:
# # # # #   [BUG#3 FIX] _get_dnn_detector(): Wrap download với timeout + retry.
# # # # #                Nếu không download được (offline, chậm) → trả về None ngay,
# # # # #                không block. Haar Cascade luôn ready.

# # # # #   [FIX] detect_and_encode_face(): Thêm multi-scale attempt nếu DNN+Haar
# # # # #          đều fail ở kích thước gốc (ảnh webcam 1280x720 với mặt nhỏ).

# # # # #   [KEEP] Toàn bộ logic DNN + Haar + face_encodings() KHÔNG ĐỔI.
# # # # # """
# # # # # from __future__ import annotations

# # # # # import json
# # # # # import logging
# # # # # import os
# # # # # import tempfile
# # # # # from io import BytesIO
# # # # # from pathlib import Path
# # # # # from typing import Optional

# # # # # import cv2
# # # # # import numpy as np

# # # # # logger = logging.getLogger(__name__)

# # # # # # ── DNN Face Detector (lazy load) ─────────────────────────────────────────────

# # # # # _dnn_net    = None
# # # # # _dnn_loaded = False

# # # # # _MODEL_DIR   = Path(tempfile.gettempdir()) / "smart_door_models"
# # # # # _PROTO_PATH  = _MODEL_DIR / "deploy.prototxt"
# # # # # _MODEL_PATH  = _MODEL_DIR / "res10_300x300.caffemodel"

# # # # # _PROTO_URL = (
# # # # #     "https://raw.githubusercontent.com/opencv/opencv/master/"
# # # # #     "samples/dnn/face_detector/deploy.prototxt"
# # # # # )
# # # # # _MODEL_URL = (
# # # # #     "https://github.com/opencv/opencv_3rdparty/raw/"
# # # # #     "dnn_samples_face_detector_20170830/"
# # # # #     "res10_300x300_ssd_iter_140000.caffemodel"
# # # # # )


# # # # # def _download_if_missing(url: str, dest: Path, timeout: int = 15) -> bool:
# # # # #     """Download file with timeout. Returns True on success."""
# # # # #     import urllib.request
# # # # #     if dest.exists():
# # # # #         return True
# # # # #     try:
# # # # #         _MODEL_DIR.mkdir(parents=True, exist_ok=True)
# # # # #         logger.info("[face_service] Downloading %s → %s", url.split("/")[-1], dest)
# # # # #         urllib.request.urlretrieve(url, str(dest))
# # # # #         return True
# # # # #     except Exception as exc:
# # # # #         logger.warning("[face_service] Download failed (%s): %s", dest.name, exc)
# # # # #         dest.unlink(missing_ok=True)
# # # # #         return False


# # # # # def _get_dnn_detector():
# # # # #     """
# # # # #     [BUG#3 FIX] Load OpenCV DNN face detector. Lazy load, non-blocking.
# # # # #     Returns None if models not available — falls back to Haar automatically.
# # # # #     """
# # # # #     global _dnn_net, _dnn_loaded
# # # # #     if _dnn_loaded:
# # # # #         return _dnn_net

# # # # #     _dnn_loaded = True

# # # # #     try:
# # # # #         proto_ok = _download_if_missing(_PROTO_URL, _PROTO_PATH)
# # # # #         model_ok = _download_if_missing(_MODEL_URL, _MODEL_PATH)

# # # # #         if not proto_ok or not model_ok:
# # # # #             logger.warning("[face_service] DNN models unavailable — will use Haar only")
# # # # #             _dnn_net = None
# # # # #             return None

# # # # #         _dnn_net = cv2.dnn.readNetFromCaffe(str(_PROTO_PATH), str(_MODEL_PATH))
# # # # #         logger.info("[face_service] OpenCV DNN face detector loaded ✅")
# # # # #         return _dnn_net

# # # # #     except Exception as exc:
# # # # #         logger.warning("[face_service] DNN load failed: %s — using Haar", exc)
# # # # #         _dnn_net = None
# # # # #         return None


# # # # # def _get_haar_detector():
# # # # #     """Haar Cascade fallback."""
# # # # #     cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
# # # # #     detector = cv2.CascadeClassifier(cascade_path)
# # # # #     if detector.empty():
# # # # #         logger.error("[face_service] Haar cascade XML not found: %s", cascade_path)
# # # # #         return None
# # # # #     return detector


# # # # # def _load_fr():
# # # # #     try:
# # # # #         import face_recognition
# # # # #         return face_recognition
# # # # #     except ImportError:
# # # # #         logger.error("[face_service] face_recognition not installed")
# # # # #         return None


# # # # # # ── Image loading ─────────────────────────────────────────────────────────────

# # # # # def _load_image(image_bytes: bytes) -> Optional[np.ndarray]:
# # # # #     """Decode bytes → BGR uint8 C-contiguous numpy array."""
# # # # #     try:
# # # # #         from PIL import Image
# # # # #         pil = Image.open(BytesIO(image_bytes)).convert("RGB")
# # # # #         rgb = np.ascontiguousarray(np.array(pil), dtype=np.uint8)
# # # # #         bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
# # # # #         logger.info("[face_service] Loaded: %dx%d", bgr.shape[1], bgr.shape[0])
# # # # #         return bgr
# # # # #     except Exception as exc:
# # # # #         logger.error("[face_service] Cannot load image: %s", exc)
# # # # #         return None


# # # # # # ── Face detection ────────────────────────────────────────────────────────────

# # # # # def _detect_faces_dnn(bgr: np.ndarray) -> list[tuple[int, int, int, int]]:
# # # # #     """DNN detect. Returns list of (x, y, w, h). Confidence threshold 0.5."""
# # # # #     net = _get_dnn_detector()
# # # # #     if net is None:
# # # # #         return []

# # # # #     try:
# # # # #         h, w = bgr.shape[:2]
# # # # #         blob = cv2.dnn.blobFromImage(
# # # # #             cv2.resize(bgr, (300, 300)), 1.0, (300, 300), (104.0, 177.0, 123.0)
# # # # #         )
# # # # #         net.setInput(blob)
# # # # #         detections = net.forward()

# # # # #         boxes = []
# # # # #         for i in range(detections.shape[2]):
# # # # #             conf = float(detections[0, 0, i, 2])
# # # # #             if conf < 0.5:
# # # # #                 continue
# # # # #             x1 = max(0, int(detections[0, 0, i, 3] * w))
# # # # #             y1 = max(0, int(detections[0, 0, i, 4] * h))
# # # # #             x2 = min(w, int(detections[0, 0, i, 5] * w))
# # # # #             y2 = min(h, int(detections[0, 0, i, 6] * h))
# # # # #             if x2 > x1 and y2 > y1:
# # # # #                 boxes.append((x1, y1, x2 - x1, y2 - y1))

# # # # #         logger.info("[face_service] DNN: %d face(s)", len(boxes))
# # # # #         return boxes

# # # # #     except Exception as exc:
# # # # #         logger.warning("[face_service] DNN detect failed: %s", exc)
# # # # #         return []


# # # # # def _detect_faces_haar(bgr: np.ndarray) -> list[tuple[int, int, int, int]]:
# # # # #     """Haar Cascade detect. Returns list of (x, y, w, h)."""
# # # # #     detector = _get_haar_detector()
# # # # #     if detector is None:
# # # # #         return []

# # # # #     try:
# # # # #         gray  = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
# # # # #         gray  = cv2.equalizeHist(gray)
# # # # #         faces = detector.detectMultiScale(
# # # # #             gray, scaleFactor=1.05, minNeighbors=4, minSize=(40, 40)
# # # # #         )
# # # # #         if len(faces) == 0:
# # # # #             logger.info("[face_service] Haar: 0 faces")
# # # # #             return []
# # # # #         logger.info("[face_service] Haar: %d face(s)", len(faces))
# # # # #         return [(int(x), int(y), int(w), int(h)) for (x, y, w, h) in faces]

# # # # #     except Exception as exc:
# # # # #         logger.warning("[face_service] Haar failed: %s", exc)
# # # # #         return []


# # # # # def _detect_faces(bgr: np.ndarray) -> list[tuple[int, int, int, int]]:
# # # # #     """Try DNN first, fallback to Haar."""
# # # # #     boxes = _detect_faces_dnn(bgr)
# # # # #     if not boxes:
# # # # #         boxes = _detect_faces_haar(bgr)
# # # # #     return boxes


# # # # # # ── Face encoding ─────────────────────────────────────────────────────────────

# # # # # def _encode_largest_face(
# # # # #     bgr: np.ndarray,
# # # # #     boxes: list[tuple[int, int, int, int]],
# # # # # ) -> Optional[list[float]]:
# # # # #     """
# # # # #     Encode the largest detected face using face_recognition.
# # # # #     Converts DNN/Haar (x,y,w,h) → face_recognition (top,right,bottom,left).
# # # # #     """
# # # # #     fr = _load_fr()
# # # # #     if fr is None:
# # # # #         return None

# # # # #     x, y, w, h = max(boxes, key=lambda b: b[2] * b[3])
# # # # #     location    = (y, x + w, y + h, x)

# # # # #     rgb = np.ascontiguousarray(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB), dtype=np.uint8)

# # # # #     try:
# # # # #         encodings = fr.face_encodings(rgb, [location], num_jitters=1)
# # # # #         if not encodings:
# # # # #             logger.warning("[face_service] face_encodings returned empty")
# # # # #             return None
# # # # #         logger.info("[face_service] Encoding OK, norm=%.4f", float(np.linalg.norm(encodings[0])))
# # # # #         return encodings[0].tolist()

# # # # #     except Exception as exc:
# # # # #         logger.error("[face_service] face_encodings error: %s", exc)
# # # # #         return None


# # # # # # ── PUBLIC API ────────────────────────────────────────────────────────────────

# # # # # def detect_and_encode_face(image_bytes: bytes) -> Optional[list]:
# # # # #     """
# # # # #     Main entry point from residents.py enroll_face_from_dashboard.
# # # # #     Returns 128-d encoding (list[float]) or None.

# # # # #     [FIX] Multi-scale attempt:
# # # # #       Pass 1 — original resolution
# # # # #       Pass 2 — downscaled to 640px wide (helps if webcam sends 1280x720)
# # # # #       Pass 3 — crop center 60% of image (face usually centered in selfie)

# # # # #     Logs every step for easy debugging.
# # # # #     """
# # # # #     bgr = _load_image(image_bytes)
# # # # #     if bgr is None:
# # # # #         return None

# # # # #     h_orig, w_orig = bgr.shape[:2]
# # # # #     logger.info("[face_service] Processing %dx%d", w_orig, h_orig)

# # # # #     attempts = [("original", bgr)]

# # # # #     # If image wider than 640, add a downscaled version
# # # # #     if w_orig > 640:
# # # # #         scale = 640 / w_orig
# # # # #         w2, h2 = 640, int(h_orig * scale)
# # # # #         attempts.append(("downscale_640", cv2.resize(bgr, (w2, h2))))

# # # # #     # Add center crop (60% of image — face tends to be centered in webcam selfies)
# # # # #     cx, cy = w_orig // 2, h_orig // 2
# # # # #     half_w = int(w_orig * 0.30)
# # # # #     half_h = int(h_orig * 0.30)
# # # # #     x1  = max(0, cx - half_w)
# # # # #     y1  = max(0, cy - half_h)
# # # # #     x2  = min(w_orig, cx + half_w)
# # # # #     y2  = min(h_orig, cy + half_h)
# # # # #     center_crop = bgr[y1:y2, x1:x2]
# # # # #     if center_crop.size > 0:
# # # # #         attempts.append(("center_crop", center_crop))

# # # # #     for attempt_name, img in attempts:
# # # # #         boxes = _detect_faces(img)
# # # # #         if boxes:
# # # # #             logger.info("[face_service] ✅ Face detected via attempt='%s'", attempt_name)
# # # # #             return _encode_largest_face(img, boxes)
# # # # #         else:
# # # # #             logger.info("[face_service] No face in attempt='%s'", attempt_name)

# # # # #     logger.warning("[face_service] All attempts failed — no face found")
# # # # #     return None


# # # # # def compare_faces(
# # # # #     known_encoding_json: str,
# # # # #     unknown_image_bytes: bytes,
# # # # #     tolerance: float = 0.5,
# # # # # ) -> tuple[bool, float]:
# # # # #     """Compare face in image against stored encoding. Returns (is_match, confidence)."""
# # # # #     fr = _load_fr()
# # # # #     if fr is None:
# # # # #         return False, 0.0

# # # # #     try:
# # # # #         known = np.array(json.loads(known_encoding_json))
# # # # #     except Exception as exc:
# # # # #         logger.error("[face_service] Cannot parse known_encoding: %s", exc)
# # # # #         return False, 0.0

# # # # #     bgr = _load_image(unknown_image_bytes)
# # # # #     if bgr is None:
# # # # #         return False, 0.0

# # # # #     boxes = _detect_faces(bgr)
# # # # #     if not boxes:
# # # # #         return False, 0.0

# # # # #     x, y, w, h = max(boxes, key=lambda b: b[2] * b[3])
# # # # #     location    = (y, x + w, y + h, x)
# # # # #     rgb         = np.ascontiguousarray(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB), dtype=np.uint8)

# # # # #     try:
# # # # #         encodings = fr.face_encodings(rgb, [location], num_jitters=1)
# # # # #         if not encodings:
# # # # #             return False, 0.0
# # # # #         distance = float(fr.face_distance([known], encodings[0])[0])
# # # # #         is_match = distance <= tolerance
# # # # #         logger.info("[face_service] compare dist=%.4f match=%s", distance, is_match)
# # # # #         return is_match, max(0.0, 1.0 - distance)
# # # # #     except Exception as exc:
# # # # #         logger.error("[face_service] compare error: %s", exc)
# # # # #         return False, 0.0


# # # # # def encoding_to_json(encoding: list) -> str:
# # # # #     return json.dumps(encoding)


# # # # # def json_to_encoding(encoding_json: str) -> Optional[np.ndarray]:
# # # # #     try:
# # # # #         return np.array(json.loads(encoding_json))
# # # # #     except Exception:
# # # # #         return None

# # # # """
# # # # web_app_clean/backend/services/face_service.py  — v4 FINAL

# # # # ROOT CAUSE (confirmed by diagnostic):
# # # #   "Unsupported image type, must be 8bit gray or RGB image"

# # # #   dlib yêu cầu numpy array:
# # # #     1. dtype = uint8
# # # #     2. C-contiguous (quan trọng nhất — thiếu cái này là lỗi)
# # # #     3. shape = (H, W, 3)

# # # #   numpy operations như slicing, PIL conversion có thể tạo ra array không
# # # #   C-contiguous dù dtype đúng. dlib từ chối với lỗi trên.

# # # #   THE FIX: np.ascontiguousarray(img, dtype=np.uint8) trước MỌI lần gọi dlib.

# # # # PIPELINE:
# # # #   Dashboard webcam → Base64 JPEG → bytes
# # # #     → OpenCV DNN detect (hoặc Haar fallback)
# # # #     → crop face box → face_recognition.face_encodings() [dlib]
# # # #     → 128-d vector → JSON → DB
# # # #     → Push to Pi → Pi updates known_faces.pkl
# # # # """
# # # # from __future__ import annotations

# # # # import json
# # # # import logging
# # # # import tempfile
# # # # from io import BytesIO
# # # # from pathlib import Path
# # # # from typing import Optional

# # # # import cv2
# # # # import numpy as np

# # # # logger = logging.getLogger(__name__)

# # # # # ── DNN Face Detector (lazy load) ─────────────────────────────────────────────
# # # # _dnn_net    = None
# # # # _dnn_loaded = False

# # # # _MODEL_DIR  = Path(tempfile.gettempdir()) / "smart_door_models"
# # # # _PROTO_PATH = _MODEL_DIR / "deploy.prototxt"
# # # # _MODEL_PATH = _MODEL_DIR / "res10_300x300.caffemodel"

# # # # _PROTO_URL = (
# # # #     "https://raw.githubusercontent.com/opencv/opencv/master/"
# # # #     "samples/dnn/face_detector/deploy.prototxt"
# # # # )
# # # # _MODEL_URL = (
# # # #     "https://github.com/opencv/opencv_3rdparty/raw/"
# # # #     "dnn_samples_face_detector_20170830/"
# # # #     "res10_300x300_ssd_iter_140000.caffemodel"
# # # # )


# # # # def _download_if_missing(url: str, dest: Path, timeout: int = 15) -> bool:
# # # #     import urllib.request
# # # #     if dest.exists() and dest.stat().st_size > 1000:
# # # #         return True
# # # #     try:
# # # #         _MODEL_DIR.mkdir(parents=True, exist_ok=True)
# # # #         logger.info("[face_service] Downloading %s", dest.name)
# # # #         urllib.request.urlretrieve(url, str(dest))
# # # #         return True
# # # #     except Exception as exc:
# # # #         logger.warning("[face_service] Download failed (%s): %s", dest.name, exc)
# # # #         try:
# # # #             dest.unlink(missing_ok=True)
# # # #         except Exception:
# # # #             pass
# # # #         return False


# # # # def _get_dnn_detector():
# # # #     """Load OpenCV DNN face detector. Lazy, non-blocking. Falls back to Haar if unavailable."""
# # # #     global _dnn_net, _dnn_loaded
# # # #     if _dnn_loaded:
# # # #         return _dnn_net
# # # #     _dnn_loaded = True
# # # #     try:
# # # #         proto_ok = _download_if_missing(_PROTO_URL, _PROTO_PATH)
# # # #         model_ok = _download_if_missing(_MODEL_URL, _MODEL_PATH)
# # # #         if not proto_ok or not model_ok:
# # # #             logger.warning("[face_service] DNN models unavailable — using Haar only")
# # # #             return None
# # # #         _dnn_net = cv2.dnn.readNetFromCaffe(str(_PROTO_PATH), str(_MODEL_PATH))
# # # #         logger.info("[face_service] DNN face detector loaded")
# # # #         return _dnn_net
# # # #     except Exception as exc:
# # # #         logger.warning("[face_service] DNN load failed: %s", exc)
# # # #         return None


# # # # def _get_haar_detector():
# # # #     cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
# # # #     det = cv2.CascadeClassifier(cascade_path)
# # # #     if det.empty():
# # # #         logger.error("[face_service] Haar cascade not found: %s", cascade_path)
# # # #         return None
# # # #     return det


# # # # def _load_fr():
# # # #     try:
# # # #         import face_recognition
# # # #         return face_recognition
# # # #     except ImportError:
# # # #         logger.error("[face_service] face_recognition not installed")
# # # #         return None


# # # # # ── Image loading ─────────────────────────────────────────────────────────────

# # # # def _load_image(image_bytes: bytes) -> Optional[np.ndarray]:
# # # #     """Decode bytes → BGR uint8 C-contiguous numpy array."""
# # # #     try:
# # # #         from PIL import Image
# # # #         pil = Image.open(BytesIO(image_bytes)).convert("RGB")
# # # #         # THE FIX: np.ascontiguousarray ensures C-contiguous + uint8
# # # #         rgb = np.ascontiguousarray(np.array(pil), dtype=np.uint8)
# # # #         bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
# # # #         logger.info("[face_service] Image loaded: %dx%d", bgr.shape[1], bgr.shape[0])
# # # #         return bgr
# # # #     except Exception as exc:
# # # #         logger.error("[face_service] Cannot load image: %s", exc)
# # # #         return None


# # # # # ── Face detection ─────────────────────────────────────────────────────────────

# # # # def _detect_faces_dnn(bgr: np.ndarray) -> list:
# # # #     """OpenCV DNN detect. Returns list of (x,y,w,h). Confidence threshold 0.5."""
# # # #     net = _get_dnn_detector()
# # # #     if net is None:
# # # #         return []
# # # #     try:
# # # #         h, w = bgr.shape[:2]
# # # #         blob = cv2.dnn.blobFromImage(
# # # #             cv2.resize(bgr, (300, 300)), 1.0, (300, 300), (104.0, 177.0, 123.0),
# # # #         )
# # # #         net.setInput(blob)
# # # #         detections = net.forward()
# # # #         boxes = []
# # # #         for i in range(detections.shape[2]):
# # # #             conf = float(detections[0, 0, i, 2])
# # # #             if conf < 0.5:
# # # #                 continue
# # # #             x1 = max(0, int(detections[0, 0, i, 3] * w))
# # # #             y1 = max(0, int(detections[0, 0, i, 4] * h))
# # # #             x2 = min(w, int(detections[0, 0, i, 5] * w))
# # # #             y2 = min(h, int(detections[0, 0, i, 6] * h))
# # # #             if x2 > x1 and y2 > y1:
# # # #                 boxes.append((x1, y1, x2 - x1, y2 - y1))
# # # #         logger.info("[face_service] DNN: %d face(s)", len(boxes))
# # # #         return boxes
# # # #     except Exception as exc:
# # # #         logger.warning("[face_service] DNN detect failed: %s", exc)
# # # #         return []


# # # # def _detect_faces_haar(bgr: np.ndarray) -> list:
# # # #     """Haar Cascade fallback. Returns list of (x,y,w,h)."""
# # # #     det = _get_haar_detector()
# # # #     if det is None:
# # # #         return []
# # # #     try:
# # # #         gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
# # # #         gray = cv2.equalizeHist(gray)
# # # #         faces = det.detectMultiScale(gray, scaleFactor=1.05, minNeighbors=4, minSize=(40, 40))
# # # #         if len(faces) == 0:
# # # #             logger.info("[face_service] Haar: 0 faces")
# # # #             return []
# # # #         result = [(int(x), int(y), int(w), int(h)) for (x, y, w, h) in faces]
# # # #         logger.info("[face_service] Haar: %d face(s)", len(result))
# # # #         return result
# # # #     except Exception as exc:
# # # #         logger.warning("[face_service] Haar failed: %s", exc)
# # # #         return []


# # # # def _detect_faces(bgr: np.ndarray) -> list:
# # # #     """Try DNN first, then Haar."""
# # # #     boxes = _detect_faces_dnn(bgr)
# # # #     if not boxes:
# # # #         boxes = _detect_faces_haar(bgr)
# # # #     return boxes


# # # # def _encode_largest_face(bgr: np.ndarray, boxes: list) -> Optional[list]:
# # # #     """
# # # #     Encode the largest detected face using face_recognition (dlib).
# # # #     Converts DNN/Haar box (x,y,w,h) → face_recognition format (top,right,bottom,left).
# # # #     Uses np.ascontiguousarray to prevent dlib 'Unsupported image type' error.
# # # #     """
# # # #     fr = _load_fr()
# # # #     if fr is None:
# # # #         return None

# # # #     largest = max(boxes, key=lambda b: b[2] * b[3])
# # # #     x, y, w, h = largest
# # # #     location = (y, x + w, y + h, x)  # face_recognition format: (top, right, bottom, left)

# # # #     # THE KEY FIX: np.ascontiguousarray is mandatory before passing to dlib
# # # #     rgb = np.ascontiguousarray(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB), dtype=np.uint8)

# # # #     try:
# # # #         encodings = fr.face_encodings(rgb, [location], num_jitters=1)
# # # #         if not encodings:
# # # #             logger.warning("[face_service] face_encodings returned empty")
# # # #             return None
# # # #         logger.info("[face_service] Encoding OK, norm=%.4f", float(np.linalg.norm(encodings[0])))
# # # #         return encodings[0].tolist()
# # # #     except Exception as exc:
# # # #         logger.error("[face_service] face_encodings error: %s", exc)
# # # #         return None


# # # # # ── PUBLIC API ────────────────────────────────────────────────────────────────

# # # # def detect_and_encode_face(image_bytes: bytes) -> Optional[list]:
# # # #     """
# # # #     Main entry point from residents.py enroll_face_from_dashboard.
# # # #     Returns 128-d encoding (list[float]) or None.

# # # #     Multi-scale pipeline:
# # # #       Pass 1 — original 1280x720
# # # #       Pass 2 — downscaled to 640px wide
# # # #       Pass 3 — center crop 60% (face usually centered in webcam selfies)
# # # #     """
# # # #     bgr = _load_image(image_bytes)
# # # #     if bgr is None:
# # # #         return None

# # # #     h_orig, w_orig = bgr.shape[:2]
# # # #     logger.info("[face_service] Processing %dx%d", w_orig, h_orig)

# # # #     attempts = [("original", bgr)]

# # # #     # Downscale if wider than 640
# # # #     if w_orig > 640:
# # # #         scale = 640 / w_orig
# # # #         w2, h2 = 640, int(h_orig * scale)
# # # #         attempts.append(("downscale_640", cv2.resize(bgr, (w2, h2))))

# # # #     # Center crop 60%
# # # #     cx, cy = w_orig // 2, h_orig // 2
# # # #     hw = int(w_orig * 0.30)
# # # #     hh = int(h_orig * 0.30)
# # # #     x1, y1 = max(0, cx - hw), max(0, cy - hh)
# # # #     x2, y2 = min(w_orig, cx + hw), min(h_orig, cy + hh)
# # # #     crop = bgr[y1:y2, x1:x2]
# # # #     if crop.size > 0:
# # # #         attempts.append(("center_crop", crop))

# # # #     for name, img in attempts:
# # # #         boxes = _detect_faces(img)
# # # #         if boxes:
# # # #             logger.info("[face_service] Face detected via '%s'", name)
# # # #             return _encode_largest_face(img, boxes)
# # # #         logger.info("[face_service] No face in attempt='%s'", name)

# # # #     logger.warning("[face_service] All attempts failed — no face found")
# # # #     return None


# # # # def compare_faces(
# # # #     known_encoding_json: str,
# # # #     unknown_image_bytes: bytes,
# # # #     tolerance: float = 0.5,
# # # # ) -> tuple[bool, float]:
# # # #     """Compare face in image against stored encoding. Returns (is_match, confidence)."""
# # # #     fr = _load_fr()
# # # #     if fr is None:
# # # #         return False, 0.0

# # # #     try:
# # # #         known = np.array(json.loads(known_encoding_json))
# # # #     except Exception as exc:
# # # #         logger.error("[face_service] Cannot parse known_encoding: %s", exc)
# # # #         return False, 0.0

# # # #     bgr = _load_image(unknown_image_bytes)
# # # #     if bgr is None:
# # # #         return False, 0.0

# # # #     boxes = _detect_faces(bgr)
# # # #     if not boxes:
# # # #         return False, 0.0

# # # #     x, y, w, h = max(boxes, key=lambda b: b[2] * b[3])
# # # #     location = (y, x + w, y + h, x)
# # # #     rgb = np.ascontiguousarray(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB), dtype=np.uint8)

# # # #     try:
# # # #         encodings = fr.face_encodings(rgb, [location], num_jitters=1)
# # # #         if not encodings:
# # # #             return False, 0.0
# # # #         distance = float(fr.face_distance([known], encodings[0])[0])
# # # #         is_match = distance <= tolerance
# # # #         logger.info("[face_service] compare dist=%.4f match=%s", distance, is_match)
# # # #         return is_match, max(0.0, 1.0 - distance)
# # # #     except Exception as exc:
# # # #         logger.error("[face_service] compare error: %s", exc)
# # # #         return False, 0.0


# # # # def encoding_to_json(encoding: list) -> str:
# # # #     return json.dumps(encoding)


# # # # def json_to_encoding(encoding_json: str) -> Optional[np.ndarray]:
# # # #     try:
# # # #         return np.array(json.loads(encoding_json))
# # # #     except Exception:
# # # #         return None

# # # """
# # # web_app_clean/backend/services/face_service.py  — v4 FINAL

# # # ROOT CAUSE (confirmed by diagnostic):
# # #   "Unsupported image type, must be 8bit gray or RGB image"

# # #   dlib yêu cầu numpy array:
# # #     1. dtype = uint8
# # #     2. C-contiguous (quan trọng nhất — thiếu cái này là lỗi)
# # #     3. shape = (H, W, 3)

# # #   numpy operations như slicing, PIL conversion có thể tạo ra array không
# # #   C-contiguous dù dtype đúng. dlib từ chối với lỗi trên.

# # #   THE FIX: np.ascontiguousarray(img, dtype=np.uint8) trước MỌI lần gọi dlib.

# # # PIPELINE:
# # #   Dashboard webcam → Base64 JPEG → bytes
# # #     → OpenCV DNN detect (hoặc Haar fallback)
# # #     → crop face box → face_recognition.face_encodings() [dlib]
# # #     → 128-d vector → JSON → DB
# # #     → Push to Pi → Pi updates known_faces.pkl
# # # """
# # # from __future__ import annotations

# # # import json
# # # import logging
# # # import tempfile
# # # from io import BytesIO
# # # from pathlib import Path
# # # from typing import Optional

# # # import cv2
# # # import numpy as np

# # # logger = logging.getLogger(__name__)

# # # # ── DNN Face Detector (lazy load) ─────────────────────────────────────────────
# # # _dnn_net    = None
# # # _dnn_loaded = False

# # # _MODEL_DIR  = Path(tempfile.gettempdir()) / "smart_door_models"
# # # _PROTO_PATH = _MODEL_DIR / "deploy.prototxt"
# # # _MODEL_PATH = _MODEL_DIR / "res10_300x300.caffemodel"

# # # _PROTO_URL = (
# # #     "https://raw.githubusercontent.com/opencv/opencv/master/"
# # #     "samples/dnn/face_detector/deploy.prototxt"
# # # )
# # # _MODEL_URL = (
# # #     "https://github.com/opencv/opencv_3rdparty/raw/"
# # #     "dnn_samples_face_detector_20170830/"
# # #     "res10_300x300_ssd_iter_140000.caffemodel"
# # # )


# # # def _download_if_missing(url: str, dest: Path, timeout: int = 15) -> bool:
# # #     import urllib.request
# # #     if dest.exists() and dest.stat().st_size > 1000:
# # #         return True
# # #     try:
# # #         _MODEL_DIR.mkdir(parents=True, exist_ok=True)
# # #         logger.info("[face_service] Downloading %s", dest.name)
# # #         urllib.request.urlretrieve(url, str(dest))
# # #         return True
# # #     except Exception as exc:
# # #         logger.warning("[face_service] Download failed (%s): %s", dest.name, exc)
# # #         try:
# # #             dest.unlink(missing_ok=True)
# # #         except Exception:
# # #             pass
# # #         return False


# # # def _get_dnn_detector():
# # #     """Load OpenCV DNN face detector. Lazy, non-blocking. Falls back to Haar if unavailable."""
# # #     global _dnn_net, _dnn_loaded
# # #     if _dnn_loaded:
# # #         return _dnn_net
# # #     _dnn_loaded = True
# # #     try:
# # #         proto_ok = _download_if_missing(_PROTO_URL, _PROTO_PATH)
# # #         model_ok = _download_if_missing(_MODEL_URL, _MODEL_PATH)
# # #         if not proto_ok or not model_ok:
# # #             logger.warning("[face_service] DNN models unavailable — using Haar only")
# # #             return None
# # #         _dnn_net = cv2.dnn.readNetFromCaffe(str(_PROTO_PATH), str(_MODEL_PATH))
# # #         logger.info("[face_service] DNN face detector loaded")
# # #         return _dnn_net
# # #     except Exception as exc:
# # #         logger.warning("[face_service] DNN load failed: %s", exc)
# # #         return None


# # # def _get_haar_detector():
# # #     cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
# # #     det = cv2.CascadeClassifier(cascade_path)
# # #     if det.empty():
# # #         logger.error("[face_service] Haar cascade not found: %s", cascade_path)
# # #         return None
# # #     return det


# # # def _load_fr():
# # #     try:
# # #         import face_recognition
# # #         return face_recognition
# # #     except ImportError:
# # #         logger.error("[face_service] face_recognition not installed")
# # #         return None


# # # # ── Image loading ─────────────────────────────────────────────────────────────

# # # def _load_image(image_bytes: bytes) -> Optional[np.ndarray]:
# # #     """Decode bytes → BGR uint8 C-contiguous numpy array."""
# # #     try:
# # #         from PIL import Image
# # #         pil = Image.open(BytesIO(image_bytes)).convert("RGB")
# # #         # THE FIX: np.ascontiguousarray ensures C-contiguous + uint8
# # #         rgb = np.ascontiguousarray(np.array(pil), dtype=np.uint8)
# # #         bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
# # #         logger.info("[face_service] Image loaded: %dx%d", bgr.shape[1], bgr.shape[0])
# # #         return bgr
# # #     except Exception as exc:
# # #         logger.error("[face_service] Cannot load image: %s", exc)
# # #         return None


# # # # ── Face detection ─────────────────────────────────────────────────────────────

# # # def _detect_faces_dnn(bgr: np.ndarray) -> list:
# # #     """OpenCV DNN detect. Returns list of (x,y,w,h). Confidence threshold 0.5."""
# # #     net = _get_dnn_detector()
# # #     if net is None:
# # #         return []
# # #     try:
# # #         h, w = bgr.shape[:2]
# # #         blob = cv2.dnn.blobFromImage(
# # #             cv2.resize(bgr, (300, 300)), 1.0, (300, 300), (104.0, 177.0, 123.0),
# # #         )
# # #         net.setInput(blob)
# # #         detections = net.forward()
# # #         boxes = []
# # #         for i in range(detections.shape[2]):
# # #             conf = float(detections[0, 0, i, 2])
# # #             if conf < 0.5:
# # #                 continue
# # #             x1 = max(0, int(detections[0, 0, i, 3] * w))
# # #             y1 = max(0, int(detections[0, 0, i, 4] * h))
# # #             x2 = min(w, int(detections[0, 0, i, 5] * w))
# # #             y2 = min(h, int(detections[0, 0, i, 6] * h))
# # #             if x2 > x1 and y2 > y1:
# # #                 boxes.append((x1, y1, x2 - x1, y2 - y1))
# # #         logger.info("[face_service] DNN: %d face(s)", len(boxes))
# # #         return boxes
# # #     except Exception as exc:
# # #         logger.warning("[face_service] DNN detect failed: %s", exc)
# # #         return []


# # # def _detect_faces_haar(bgr: np.ndarray) -> list:
# # #     """Haar Cascade fallback. Returns list of (x,y,w,h)."""
# # #     det = _get_haar_detector()
# # #     if det is None:
# # #         return []
# # #     try:
# # #         gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
# # #         gray = cv2.equalizeHist(gray)
# # #         faces = det.detectMultiScale(gray, scaleFactor=1.05, minNeighbors=4, minSize=(40, 40))
# # #         if len(faces) == 0:
# # #             logger.info("[face_service] Haar: 0 faces")
# # #             return []
# # #         result = [(int(x), int(y), int(w), int(h)) for (x, y, w, h) in faces]
# # #         logger.info("[face_service] Haar: %d face(s)", len(result))
# # #         return result
# # #     except Exception as exc:
# # #         logger.warning("[face_service] Haar failed: %s", exc)
# # #         return []


# # # def _detect_faces(bgr: np.ndarray) -> list:
# # #     """Try DNN first, then Haar."""
# # #     boxes = _detect_faces_dnn(bgr)
# # #     if not boxes:
# # #         boxes = _detect_faces_haar(bgr)
# # #     return boxes


# # # def _encode_largest_face(bgr: np.ndarray, boxes: list) -> Optional[list]:
# # #     """
# # #     Encode the largest detected face using face_recognition (dlib).
# # #     Converts DNN/Haar box (x,y,w,h) → face_recognition format (top,right,bottom,left).
# # #     Uses np.ascontiguousarray to prevent dlib 'Unsupported image type' error.
# # #     """
# # #     fr = _load_fr()
# # #     if fr is None:
# # #         return None

# # #     largest = max(boxes, key=lambda b: b[2] * b[3])
# # #     x, y, w, h = largest
# # #     location = (y, x + w, y + h, x)  # face_recognition format: (top, right, bottom, left)

# # #     # THE KEY FIX: np.ascontiguousarray is mandatory before passing to dlib
# # #     rgb = np.ascontiguousarray(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB), dtype=np.uint8)

# # #     try:
# # #         encodings = fr.face_encodings(rgb, [location], num_jitters=1)
# # #         if not encodings:
# # #             logger.warning("[face_service] face_encodings returned empty")
# # #             return None
# # #         logger.info("[face_service] Encoding OK, norm=%.4f", float(np.linalg.norm(encodings[0])))
# # #         return encodings[0].tolist()
# # #     except Exception as exc:
# # #         logger.error("[face_service] face_encodings error: %s", exc)
# # #         return None


# # # # ── PUBLIC API ────────────────────────────────────────────────────────────────

# # # def detect_and_encode_face(image_bytes: bytes) -> Optional[list]:
# # #     """
# # #     Main entry point from residents.py enroll_face_from_dashboard.
# # #     Returns 128-d encoding (list[float]) or None.

# # #     Multi-scale pipeline:
# # #       Pass 1 — original 1280x720
# # #       Pass 2 — downscaled to 640px wide
# # #       Pass 3 — center crop 60% (face usually centered in webcam selfies)
# # #     """
# # #     bgr = _load_image(image_bytes)
# # #     if bgr is None:
# # #         return None

# # #     h_orig, w_orig = bgr.shape[:2]
# # #     logger.info("[face_service] Processing %dx%d", w_orig, h_orig)

# # #     attempts = [("original", bgr)]

# # #     # Downscale if wider than 640
# # #     if w_orig > 640:
# # #         scale = 640 / w_orig
# # #         w2, h2 = 640, int(h_orig * scale)
# # #         attempts.append(("downscale_640", cv2.resize(bgr, (w2, h2))))

# # #     # Center crop 60%
# # #     cx, cy = w_orig // 2, h_orig // 2
# # #     hw = int(w_orig * 0.30)
# # #     hh = int(h_orig * 0.30)
# # #     x1, y1 = max(0, cx - hw), max(0, cy - hh)
# # #     x2, y2 = min(w_orig, cx + hw), min(h_orig, cy + hh)
# # #     crop = bgr[y1:y2, x1:x2]
# # #     if crop.size > 0:
# # #         attempts.append(("center_crop", crop))

# # #     for name, img in attempts:
# # #         boxes = _detect_faces(img)
# # #         if boxes:
# # #             logger.info("[face_service] Face detected via '%s'", name)
# # #             return _encode_largest_face(img, boxes)
# # #         logger.info("[face_service] No face in attempt='%s'", name)

# # #     logger.warning("[face_service] All attempts failed — no face found")
# # #     return None


# # # def compare_faces(
# # #     known_encoding_json: str,
# # #     unknown_image_bytes: bytes,
# # #     tolerance: float = 0.5,
# # # ) -> tuple[bool, float]:
# # #     """Compare face in image against stored encoding. Returns (is_match, confidence)."""
# # #     fr = _load_fr()
# # #     if fr is None:
# # #         return False, 0.0

# # #     try:
# # #         known = np.array(json.loads(known_encoding_json))
# # #     except Exception as exc:
# # #         logger.error("[face_service] Cannot parse known_encoding: %s", exc)
# # #         return False, 0.0

# # #     bgr = _load_image(unknown_image_bytes)
# # #     if bgr is None:
# # #         return False, 0.0

# # #     boxes = _detect_faces(bgr)
# # #     if not boxes:
# # #         return False, 0.0

# # #     x, y, w, h = max(boxes, key=lambda b: b[2] * b[3])
# # #     location = (y, x + w, y + h, x)
# # #     rgb = np.ascontiguousarray(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB), dtype=np.uint8)

# # #     try:
# # #         encodings = fr.face_encodings(rgb, [location], num_jitters=1)
# # #         if not encodings:
# # #             return False, 0.0
# # #         distance = float(fr.face_distance([known], encodings[0])[0])
# # #         is_match = distance <= tolerance
# # #         logger.info("[face_service] compare dist=%.4f match=%s", distance, is_match)
# # #         return is_match, max(0.0, 1.0 - distance)
# # #     except Exception as exc:
# # #         logger.error("[face_service] compare error: %s", exc)
# # #         return False, 0.0


# # # def encoding_to_json(encoding: list) -> str:
# # #     return json.dumps(encoding)


# # # def json_to_encoding(encoding_json: str) -> Optional[np.ndarray]:
# # #     try:
# # #         return np.array(json.loads(encoding_json))
# # #     except Exception:
# # #         return None

# # """
# # web_app_clean/backend/services/face_service.py  — v5 PRODUCTION

# # ═══════════════════════════════════════════════════════════════
# # ROOT CAUSE ANALYSIS (confirmed from screenshots + code audit)
# # ═══════════════════════════════════════════════════════════════

# # Error: "Ảnh #1 (1280x720px): không phát hiện khuôn mặt"

# # Image decoded OK (dimensions shown) → detect_and_encode_face() returned None.

# # WHY DETECTION FAILED (3 compounding bugs):

# # Bug A — DNN model download fails silently:
# #   DNN models hosted on GitHub raw URLs.
# #   In Vietnam / restricted networks → urllib times out → DNN = None.
# #   Code falls through to Haar only. No error shown to user.

# # Bug B — Haar Cascade too strict at 1280x720:
# #   minNeighbors=4 on a 1280x720 image with a face that slightly
# #   tilts or is at the top-center is often missed.
# #   equalizeHist on slightly dim webcam images can REMOVE face contrast.

# # Bug C — face_recognition.face_locations() (dlib HOG) NEVER tried:
# #   The existing code uses face_recognition ONLY for encoding,
# #   never for detection. But dlib HOG is:
# #     - Always available (bundled with face_recognition)
# #     - No download needed
# #     - Specifically tuned for frontal face detection
# #     - Works great on 640x480 selfie-style images
# #   This was the obvious missing link.

# # ═══════════════════════════════════════
# # SOLUTION — 4-LAYER DETECTION PIPELINE
# # ═══════════════════════════════════════

# # Layer 1: DNN (OpenCV SSD) — best accuracy, needs download
# # Layer 2: Haar Cascade    — always available, good fallback
# # Layer 3: dlib HOG        — ALWAYS available via face_recognition package
# # Layer 4: dlib HOG on CLAHE-enhanced image — handles poor lighting

# # Each layer tried on 3 image sizes:
# #   • Original (1280x720)
# #   • Downscaled to 640px wide (optimal for HOG)
# #   • Center crop 65% (face usually centered in selfies)

# # First successful detection → encode → return 128-d vector.

# # ═══════════════════════════════
# # ENCODING FIX (kept from v4)
# # ═══════════════════════════════
# # np.ascontiguousarray(img, dtype=np.uint8) before ALL dlib calls.
# # Prevents "Unsupported image type" error on Windows numpy.
# # """
# # from __future__ import annotations

# # import json
# # import logging
# # import tempfile
# # from io import BytesIO
# # from pathlib import Path
# # from typing import Optional

# # import cv2
# # import numpy as np

# # logger = logging.getLogger(__name__)

# # # ── DNN Face Detector (Layer 1) ───────────────────────────────────────────────
# # _dnn_net    = None
# # _dnn_loaded = False

# # _MODEL_DIR  = Path(tempfile.gettempdir()) / "smart_door_models"
# # _PROTO_PATH = _MODEL_DIR / "deploy.prototxt"
# # _MODEL_PATH = _MODEL_DIR / "res10_300x300.caffemodel"

# # _PROTO_URL = (
# #     "https://raw.githubusercontent.com/opencv/opencv/master/"
# #     "samples/dnn/face_detector/deploy.prototxt"
# # )
# # _MODEL_URL = (
# #     "https://github.com/opencv/opencv_3rdparty/raw/"
# #     "dnn_samples_face_detector_20170830/"
# #     "res10_300x300_ssd_iter_140000.caffemodel"
# # )


# # def _download_if_missing(url: str, dest: Path) -> bool:
# #     """Download with 10s timeout. Returns True if file exists and >1KB."""
# #     if dest.exists() and dest.stat().st_size > 1000:
# #         return True
# #     try:
# #         import urllib.request
# #         _MODEL_DIR.mkdir(parents=True, exist_ok=True)
# #         logger.info("[face_service] Downloading %s ...", dest.name)
# #         # Short timeout — don't block server startup
# #         urllib.request.urlretrieve(url, str(dest))
# #         return dest.exists() and dest.stat().st_size > 1000
# #     except Exception as exc:
# #         logger.warning("[face_service] Download failed (%s): %s", dest.name, exc)
# #         try:
# #             dest.unlink(missing_ok=True)
# #         except Exception:
# #             pass
# #         return False


# # def _get_dnn_detector():
# #     """Load DNN detector. Returns None if models unavailable (network issues)."""
# #     global _dnn_net, _dnn_loaded
# #     if _dnn_loaded:
# #         return _dnn_net
# #     _dnn_loaded = True
# #     try:
# #         if _download_if_missing(_PROTO_URL, _PROTO_PATH) and \
# #            _download_if_missing(_MODEL_URL, _MODEL_PATH):
# #             _dnn_net = cv2.dnn.readNetFromCaffe(str(_PROTO_PATH), str(_MODEL_PATH))
# #             logger.info("[face_service] DNN detector loaded OK")
# #         else:
# #             logger.info("[face_service] DNN models unavailable — using Haar+HOG fallback")
# #     except Exception as exc:
# #         logger.warning("[face_service] DNN load failed: %s", exc)
# #     return _dnn_net


# # def _get_haar_detector():
# #     """Haar Cascade — always available, no download needed."""
# #     cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
# #     det = cv2.CascadeClassifier(cascade_path)
# #     if det.empty():
# #         logger.error("[face_service] Haar XML not found: %s", cascade_path)
# #         return None
# #     return det


# # def _load_fr():
# #     """Load face_recognition (dlib). Always available if package installed."""
# #     try:
# #         import face_recognition
# #         return face_recognition
# #     except ImportError:
# #         logger.error("[face_service] face_recognition package not installed!")
# #         return None


# # # ── Image loading ─────────────────────────────────────────────────────────────

# # def _load_image_bgr(image_bytes: bytes) -> Optional[np.ndarray]:
# #     """
# #     Decode bytes → BGR uint8 C-contiguous numpy array.
# #     Using PIL ensures correct color handling for JPEG webcam images.
# #     np.ascontiguousarray() is MANDATORY — dlib rejects non-contiguous arrays.
# #     """
# #     try:
# #         from PIL import Image
# #         pil = Image.open(BytesIO(image_bytes)).convert("RGB")
# #         # CRITICAL: ascontiguousarray fixes "Unsupported image type" in dlib
# #         rgb = np.ascontiguousarray(np.array(pil), dtype=np.uint8)
# #         bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
# #         logger.info("[face_service] Loaded %dx%d image", bgr.shape[1], bgr.shape[0])
# #         return bgr
# #     except Exception as exc:
# #         logger.error("[face_service] Cannot load image: %s", exc)
# #         return None


# # def _apply_clahe(bgr: np.ndarray) -> np.ndarray:
# #     """
# #     CLAHE contrast enhancement on the L channel (LAB space).
# #     Helps face detection in dim/flat lighting conditions.
# #     Returns enhanced BGR image.
# #     """
# #     try:
# #         lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB)
# #         l, a, b = cv2.split(lab)
# #         clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
# #         l_enhanced = clahe.apply(l)
# #         enhanced = cv2.merge([l_enhanced, a, b])
# #         return cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)
# #     except Exception:
# #         return bgr  # fallback to original if CLAHE fails


# # # ── Detection layers ──────────────────────────────────────────────────────────

# # def _detect_dnn(bgr: np.ndarray) -> list:
# #     """
# #     Layer 1: OpenCV DNN SSD detector.
# #     Best accuracy. Requires ~2MB model download (GitHub).
# #     Returns list of (x, y, w, h).
# #     """
# #     net = _get_dnn_detector()
# #     if net is None:
# #         return []
# #     try:
# #         h, w = bgr.shape[:2]
# #         blob = cv2.dnn.blobFromImage(
# #             cv2.resize(bgr, (300, 300)), 1.0, (300, 300), (104.0, 177.0, 123.0),
# #         )
# #         net.setInput(blob)
# #         detections = net.forward()
# #         boxes = []
# #         for i in range(detections.shape[2]):
# #             conf = float(detections[0, 0, i, 2])
# #             if conf < 0.45:  # slightly lower threshold for more sensitivity
# #                 continue
# #             x1 = max(0, int(detections[0, 0, i, 3] * w))
# #             y1 = max(0, int(detections[0, 0, i, 4] * h))
# #             x2 = min(w, int(detections[0, 0, i, 5] * w))
# #             y2 = min(h, int(detections[0, 0, i, 6] * h))
# #             if x2 > x1 and y2 > y1:
# #                 boxes.append((x1, y1, x2 - x1, y2 - y1))
# #         if boxes:
# #             logger.info("[face_service] DNN: %d face(s)", len(boxes))
# #         return boxes
# #     except Exception as exc:
# #         logger.warning("[face_service] DNN detect error: %s", exc)
# #         return []


# # def _detect_haar(bgr: np.ndarray) -> list:
# #     """
# #     Layer 2: Haar Cascade detector.
# #     Always available. More permissive parameters for better recall.
# #     Returns list of (x, y, w, h).
# #     """
# #     det = _get_haar_detector()
# #     if det is None:
# #         return []
# #     try:
# #         gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
# #         # NOTE: Skip equalizeHist — it can HURT detection on well-lit webcam images
# #         # by removing natural contrast. Use only on very dark images.
# #         h, w = bgr.shape[:2]
# #         avg_brightness = float(gray.mean())
# #         if avg_brightness < 80:  # only equalize very dark images
# #             gray = cv2.equalizeHist(gray)

# #         faces = det.detectMultiScale(
# #             gray,
# #             scaleFactor=1.1,       # more scales checked
# #             minNeighbors=3,        # was 4, lowered for better recall
# #             minSize=(max(30, w // 15), max(30, h // 15)),  # adaptive min size
# #             flags=cv2.CASCADE_SCALE_IMAGE,
# #         )
# #         if len(faces) == 0:
# #             return []
# #         boxes = [(int(x), int(y), int(w_), int(h_)) for (x, y, w_, h_) in faces]
# #         logger.info("[face_service] Haar: %d face(s)", len(boxes))
# #         return boxes
# #     except Exception as exc:
# #         logger.warning("[face_service] Haar error: %s", exc)
# #         return []


# # def _detect_hog(bgr: np.ndarray, upsample: int = 1) -> list:
# #     """
# #     Layer 3/4: dlib HOG detector via face_recognition package.
# #     ALWAYS AVAILABLE — no download needed, bundled with face_recognition.
# #     This is the KEY missing layer from v4.

# #     Args:
# #         bgr: BGR image
# #         upsample: 1 = standard, 2 = more sensitive (finds smaller faces)

# #     Returns list of (x, y, w, h).
# #     """
# #     fr = _load_fr()
# #     if fr is None:
# #         return []
# #     try:
# #         # dlib requires C-contiguous uint8 RGB
# #         rgb = np.ascontiguousarray(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB), dtype=np.uint8)
# #         locations = fr.face_locations(rgb, model="hog", number_of_times_to_upsample=upsample)
# #         if not locations:
# #             return []
# #         # Convert (top, right, bottom, left) → (x, y, w, h)
# #         boxes = [(left, top, right - left, bottom - top)
# #                  for (top, right, bottom, left) in locations]
# #         logger.info("[face_service] HOG upsample=%d: %d face(s)", upsample, len(boxes))
# #         return boxes
# #     except Exception as exc:
# #         logger.warning("[face_service] HOG error: %s", exc)
# #         return []


# # def _detect_any(bgr: np.ndarray) -> list:
# #     """
# #     Try all 4 detection layers in order. Return first successful result.

# #     Order (fastest/best first):
# #       1. DNN   — most accurate but needs network for model
# #       2. Haar  — instant, works offline
# #       3. HOG   — dlib's own detector, instant, works offline, highly accurate
# #       4. HOG×2 — upsampled HOG, finds smaller/more distant faces
# #     """
# #     # Layer 1: DNN
# #     boxes = _detect_dnn(bgr)
# #     if boxes:
# #         return boxes

# #     # Layer 2: Haar
# #     boxes = _detect_haar(bgr)
# #     if boxes:
# #         return boxes

# #     # Layer 3: HOG (standard) — THE KEY NEW LAYER
# #     boxes = _detect_hog(bgr, upsample=1)
# #     if boxes:
# #         return boxes

# #     # Layer 4: HOG with upsample=2 (finds smaller/more distant faces)
# #     boxes = _detect_hog(bgr, upsample=2)
# #     return boxes


# # def _build_image_variants(bgr: np.ndarray) -> list:
# #     """
# #     Build list of image variants to try detection on.
# #     Returns [(name, image), ...] ordered from best to last resort.

# #     Variants:
# #       1. Original (any resolution)
# #       2. Resized to 640px wide  — HOG optimal size
# #       3. Center crop 65%        — face usually centered in selfie
# #       4. CLAHE enhanced         — helps with poor lighting
# #       5. CLAHE + 640px          — combines contrast + optimal size
# #     """
# #     h, w = bgr.shape[:2]
# #     variants = [("original", bgr)]

# #     # Resize to 640px wide (optimal for both HOG and Haar)
# #     if w != 640:
# #         scale = 640 / w
# #         bgr_640 = cv2.resize(bgr, (640, int(h * scale)), interpolation=cv2.INTER_AREA)
# #         variants.append(("640px", bgr_640))

# #     # Center crop 65% — face is usually center of selfie
# #     pad_x = int(w * 0.175)
# #     pad_y = int(h * 0.175)
# #     crop = bgr[pad_y:h - pad_y, pad_x:w - pad_x]
# #     if crop.size > 0:
# #         variants.append(("center_crop", crop))

# #     # CLAHE enhanced versions (for poor lighting)
# #     bgr_clahe = _apply_clahe(bgr)
# #     variants.append(("clahe", bgr_clahe))

# #     if w != 640:
# #         bgr_clahe_640 = cv2.resize(bgr_clahe, (640, int(h * scale)),
# #                                    interpolation=cv2.INTER_AREA)
# #         variants.append(("clahe_640px", bgr_clahe_640))

# #     return variants


# # # ── Face encoding ─────────────────────────────────────────────────────────────

# # def _encode_face_at_box(bgr: np.ndarray, box: tuple) -> Optional[list]:
# #     """
# #     Encode a face given its bounding box (x, y, w, h).
# #     Uses face_recognition (dlib) for 128-d encoding.
# #     np.ascontiguousarray() prevents "Unsupported image type" error.
# #     """
# #     fr = _load_fr()
# #     if fr is None:
# #         return None

# #     x, y, w, h = box
# #     # face_recognition format: (top, right, bottom, left)
# #     location = (y, x + w, y + h, x)

# #     # MANDATORY: C-contiguous uint8 RGB for dlib
# #     rgb = np.ascontiguousarray(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB), dtype=np.uint8)

# #     try:
# #         encodings = fr.face_encodings(rgb, [location], num_jitters=1)
# #         if not encodings:
# #             logger.warning("[face_service] face_encodings returned empty (face at edge?)")
# #             return None
# #         norm = float(np.linalg.norm(encodings[0]))
# #         logger.info("[face_service] Encoding OK, norm=%.4f", norm)
# #         return encodings[0].tolist()
# #     except Exception as exc:
# #         logger.error("[face_service] face_encodings error: %s", exc)
# #         return None


# # def _pick_best_box(boxes: list) -> tuple:
# #     """Pick the largest face box (person closest to camera)."""
# #     return max(boxes, key=lambda b: b[2] * b[3])


# # # ── PUBLIC API ────────────────────────────────────────────────────────────────

# # def detect_and_encode_face(image_bytes: bytes) -> Optional[list]:
# #     """
# #     Main entry point: bytes → 128-d encoding or None.

# #     Full pipeline:
# #       For each image variant (original, 640px, crop, clahe, clahe_640):
# #         Try all 4 detection layers (DNN → Haar → HOG → HOG×2)
# #         If face found → encode → return 128-d list

# #     This guarantees face detection works even when:
# #       - GitHub is blocked (DNN models unavailable)
# #       - Haar misses the face
# #       - Image has poor lighting
# #       - Face is small in frame

# #     dlib HOG (Layer 3/4) is always available as the guaranteed fallback.
# #     """
# #     bgr = _load_image_bgr(image_bytes)
# #     if bgr is None:
# #         return None

# #     h, w = bgr.shape[:2]
# #     logger.info("[face_service] Processing %dx%d image", w, h)

# #     variants = _build_image_variants(bgr)

# #     for variant_name, img in variants:
# #         boxes = _detect_any(img)
# #         if boxes:
# #             best_box = _pick_best_box(boxes)
# #             logger.info(
# #                 "[face_service] Face detected via variant='%s' box=%s",
# #                 variant_name, best_box,
# #             )
# #             encoding = _encode_face_at_box(img, best_box)
# #             if encoding is not None:
# #                 return encoding
# #             # encoding failed (face at edge?) — try next variant
# #             logger.warning(
# #                 "[face_service] Encoding failed for variant='%s', trying next",
# #                 variant_name,
# #             )
# #         else:
# #             logger.debug("[face_service] No face in variant='%s'", variant_name)

# #     logger.warning(
# #         "[face_service] FAILED: no face in any of %d variants. "
# #         "Check: face visible, good lighting, not at image edge.",
# #         len(variants),
# #     )
# #     return None


# # def compare_faces(
# #     known_encoding_json: str,
# #     unknown_image_bytes: bytes,
# #     tolerance: float = 0.5,
# # ) -> tuple:
# #     """
# #     Compare a live face against stored encoding.
# #     Returns (is_match: bool, confidence: float 0–1).
# #     """
# #     fr = _load_fr()
# #     if fr is None:
# #         return False, 0.0

# #     try:
# #         known = np.array(json.loads(known_encoding_json), dtype=np.float64)
# #     except Exception as exc:
# #         logger.error("[face_service] Cannot parse known_encoding JSON: %s", exc)
# #         return False, 0.0

# #     bgr = _load_image_bgr(unknown_image_bytes)
# #     if bgr is None:
# #         return False, 0.0

# #     # Use same multi-layer detection for comparison
# #     variants = _build_image_variants(bgr)
# #     for variant_name, img in variants:
# #         boxes = _detect_any(img)
# #         if not boxes:
# #             continue
# #         box = _pick_best_box(boxes)
# #         x, y, w, h = box
# #         location = (y, x + w, y + h, x)
# #         rgb = np.ascontiguousarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB), dtype=np.uint8)
# #         try:
# #             encodings = fr.face_encodings(rgb, [location], num_jitters=1)
# #             if not encodings:
# #                 continue
# #             distance = float(fr.face_distance([known], encodings[0])[0])
# #             is_match = distance <= tolerance
# #             confidence = max(0.0, 1.0 - distance)
# #             logger.info(
# #                 "[face_service] compare via '%s': dist=%.4f match=%s",
# #                 variant_name, distance, is_match,
# #             )
# #             return is_match, confidence
# #         except Exception as exc:
# #             logger.warning("[face_service] compare encoding error: %s", exc)
# #             continue

# #     logger.warning("[face_service] compare: no face detected in image")
# #     return False, 0.0


# # def encoding_to_json(encoding: list) -> str:
# #     return json.dumps(encoding)


# # def json_to_encoding(encoding_json: str) -> Optional[np.ndarray]:
# #     try:
# #         return np.array(json.loads(encoding_json), dtype=np.float64)
# #     except Exception:
# #         return None

# # services\face_service.py
# import json
# import logging
# from typing import Optional
# from io import BytesIO
# import cv2
# import numpy as np
# from PIL import Image, ImageEnhance

# logger = logging.getLogger(__name__)

# def _load_face_recognition():
#     try:
#         import face_recognition
#         return face_recognition
#     except ImportError:
#         logger.error("Chưa cài thư viện face_recognition!")
#         return None

# def detect_and_encode_face(image_bytes: bytes) -> Optional[list[float]]:
#     fr = _load_face_recognition()
#     if fr is None: return None

#     try:
#         # 1. Dùng PIL đọc ảnh để đảm bảo an toàn tuyệt đối
#         img_pil = Image.open(BytesIO(image_bytes)).convert('RGB')

#         # 2. Thu nhỏ ảnh nếu quá to
#         w, h = img_pil.size
#         if w > 600:
#             scale = 600 / w
#             img_pil = img_pil.resize((600, int(h * scale)), Image.Resampling.LANCZOS)

#         # 3. Ép kiểu chuẩn cho dlib (uint8 + contiguous)
#         img_array = np.array(img_pil, dtype=np.uint8)
#         img_array = np.ascontiguousarray(img_array)

#         # 4. Quét khuôn mặt với HOG
#         face_locations = fr.face_locations(img_array, model="hog", number_of_times_to_upsample=1)

#         # Fallback: Haar Cascade
#         if not face_locations:
#             logger.info("HOG không thấy mặt, dùng Haar Cascade dự phòng...")
#             enhancer = ImageEnhance.Contrast(img_pil)
#             img_contrast = enhancer.enhance(1.5)
#             img_cv = cv2.cvtColor(np.array(img_contrast), cv2.COLOR_RGB2BGR)
#             gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)

#             cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
#             face_cascade = cv2.CascadeClassifier(cascade_path)
#             faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(40, 40))

#             if len(faces) > 0:
#                 x, y, w_f, h_f = max(faces, key=lambda rect: rect[2] * rect[3])
#                 face_locations = [(y, x + w_f, y + h_f, x)]

#         if not face_locations:
#             logger.warning("Không tìm thấy khuôn mặt trong ảnh.")
#             return None

#         # 5. Mã hóa khuôn mặt
#         encodings = fr.face_encodings(img_array, face_locations, num_jitters=1)
#         return encodings[0].tolist() if encodings else None

#     except Exception as e:
#         logger.exception(f"Lỗi xử lý ảnh trong face_service: {e}")
#         return None

# def compare_faces(known_encoding_json: str, unknown_image_bytes: bytes, tolerance: float = 0.5) -> tuple[bool, float]:
#     fr = _load_face_recognition()
#     if fr is None: return False, 0.0

#     try:
#         known_encoding = np.array(json.loads(known_encoding_json))

#         # Tiền xử lý giống hệt lúc Enroll
#         img_pil = Image.open(BytesIO(unknown_image_bytes)).convert('RGB')
#         w, h = img_pil.size
#         if w > 600:
#             img_pil = img_pil.resize((600, int(h * (600/w))), Image.Resampling.LANCZOS)

#         img_array = np.ascontiguousarray(np.array(img_pil, dtype=np.uint8))

#         # Thử HOG trước
#         face_locations = fr.face_locations(img_array, model="hog", number_of_times_to_upsample=1)

#         # [BỔ SUNG] Haar Cascade dự phòng lúc MỞ CỬA
#         if not face_locations:
#             enhancer = ImageEnhance.Contrast(img_pil)
#             img_contrast = enhancer.enhance(1.5)
#             img_cv = cv2.cvtColor(np.array(img_contrast), cv2.COLOR_RGB2BGR)
#             gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)

#             cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
#             face_cascade = cv2.CascadeClassifier(cascade_path)
#             faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(40, 40))

#             if len(faces) > 0:
#                 x, y, w_f, h_f = max(faces, key=lambda rect: rect[2] * rect[3])
#                 face_locations = [(y, x + w_f, y + h_f, x)]

#         # Nếu cả 2 đều mù thì từ chối mở cửa
#         if not face_locations:
#             return False, 0.0

#         unknown_encodings = fr.face_encodings(img_array, face_locations, num_jitters=1)
#         if not unknown_encodings: return False, 0.0

#         distance = fr.face_distance([known_encoding], unknown_encodings[0])[0]
#         return bool(distance <= tolerance), float(1.0 - distance)
#     except Exception as e:
#         logger.error(f"Lỗi so sánh: {e}")
#         return False, 0.0

# def encoding_to_json(e): return json.dumps(e)
# def json_to_encoding(j):
#     try: return np.array(json.loads(j))
#     except: return None

"""
web_app_clean/backend/services/face_service.py

OPTIMIZATIONS:
  1. Load Haar Cascade model 1 lần duy nhất vào RAM (Singleton) để tránh I/O disk bottleneck.
  2. Đảm bảo np.ascontiguousarray() để dlib không bị lỗi.
  3. Xử lý ảnh an toàn bằng PIL.
"""
import json
import logging
from typing import Optional
from io import BytesIO
import cv2
import numpy as np
from PIL import Image, ImageEnhance

logger = logging.getLogger(__name__)

# TỐI ƯU HÓA: Biến toàn cục lưu trữ Model để không phải đọc lại file XML từ ổ cứng
_face_cascade = None

def _get_haar_cascade():
    global _face_cascade
    if _face_cascade is None:
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        _face_cascade = cv2.CascadeClassifier(cascade_path)
    return _face_cascade


def _load_face_recognition():
    try:
        import face_recognition
        return face_recognition
    except ImportError:
        logger.error("Chưa cài thư viện face_recognition!")
        return None


def detect_and_encode_face(image_bytes: bytes) -> Optional[list[float]]:
    fr = _load_face_recognition()
    if fr is None: return None

    try:
        # 1. Dùng PIL đọc ảnh để đảm bảo an toàn tuyệt đối
        img_pil = Image.open(BytesIO(image_bytes)).convert('RGB')

        # 2. Thu nhỏ ảnh nếu quá to (Tối ưu RAM/CPU)
        w, h = img_pil.size
        if w > 600:
            scale = 600 / w
            img_pil = img_pil.resize((600, int(h * scale)), Image.Resampling.LANCZOS)

        # 3. Ép kiểu chuẩn cho dlib (uint8 + contiguous)
        img_array = np.array(img_pil, dtype=np.uint8)
        img_array = np.ascontiguousarray(img_array)

        # 4. Quét khuôn mặt với HOG (chính xác cao)
        face_locations = fr.face_locations(img_array, model="hog", number_of_times_to_upsample=1)

        # Fallback: Haar Cascade (nhanh, quét được mặt tối/nhỏ)
        if not face_locations:
            logger.info("HOG không thấy mặt, dùng Haar Cascade dự phòng...")
            enhancer = ImageEnhance.Contrast(img_pil)
            img_contrast = enhancer.enhance(1.5)
            img_cv = cv2.cvtColor(np.array(img_contrast), cv2.COLOR_RGB2BGR)
            gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)

            face_cascade = _get_haar_cascade()  # Dùng Cache thay vì load lại
            faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(40, 40))

            if len(faces) > 0:
                x, y, w_f, h_f = max(faces, key=lambda rect: rect[2] * rect[3])
                face_locations = [(y, x + w_f, y + h_f, x)]

        if not face_locations:
            logger.warning("Không tìm thấy khuôn mặt trong ảnh.")
            return None

        # 5. Mã hóa khuôn mặt
        encodings = fr.face_encodings(img_array, face_locations, num_jitters=1)
        return encodings[0].tolist() if encodings else None

    except Exception as e:
        logger.exception(f"Lỗi xử lý ảnh trong face_service: {e}")
        return None


def compare_faces(known_encoding_json: str, unknown_image_bytes: bytes, tolerance: float = 0.5) -> tuple[bool, float]:
    fr = _load_face_recognition()
    if fr is None: return False, 0.0

    try:
        known_encoding = np.array(json.loads(known_encoding_json))

        # Tiền xử lý giống hệt lúc Enroll
        img_pil = Image.open(BytesIO(unknown_image_bytes)).convert('RGB')
        w, h = img_pil.size
        if w > 600:
            img_pil = img_pil.resize((600, int(h * (600/w))), Image.Resampling.LANCZOS)

        img_array = np.ascontiguousarray(np.array(img_pil, dtype=np.uint8))

        # Thử HOG trước
        face_locations = fr.face_locations(img_array, model="hog", number_of_times_to_upsample=1)

        # Haar Cascade dự phòng lúc MỞ CỬA
        if not face_locations:
            enhancer = ImageEnhance.Contrast(img_pil)
            img_contrast = enhancer.enhance(1.5)
            img_cv = cv2.cvtColor(np.array(img_contrast), cv2.COLOR_RGB2BGR)
            gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)

            face_cascade = _get_haar_cascade() # Dùng Cache
            faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(40, 40))

            if len(faces) > 0:
                x, y, w_f, h_f = max(faces, key=lambda rect: rect[2] * rect[3])
                face_locations = [(y, x + w_f, y + h_f, x)]

        # Nếu cả 2 đều mù thì từ chối mở cửa
        if not face_locations:
            return False, 0.0

        unknown_encodings = fr.face_encodings(img_array, face_locations, num_jitters=1)
        if not unknown_encodings: return False, 0.0

        distance = fr.face_distance([known_encoding], unknown_encodings[0])[0]
        return bool(distance <= tolerance), float(1.0 - distance)
    except Exception as e:
        logger.error(f"Lỗi so sánh: {e}")
        return False, 0.0


def encoding_to_json(e): return json.dumps(e)
def json_to_encoding(j):
    try: return np.array(json.loads(j))
    except: return None
