import sys
import time
import os
from io import BytesIO

print("=" * 60)
print("FACE RECOGNITION DIAGNOSTIC v4")
print("=" * 60)

print("\n[1] Checking packages...")
try:
    import cv2
    print("  cv2:", cv2.__version__)
except Exception as e:
    print("  ERROR cv2:", e); sys.exit(1)

try:
    import face_recognition
    print("  face_recognition: OK")
except Exception as e:
    print("  ERROR face_recognition:", e); sys.exit(1)

try:
    import numpy as np
    print("  numpy:", np.__version__)
except Exception as e:
    print("  ERROR numpy:", e)

try:
    from PIL import Image, ImageDraw
    print("  Pillow: OK")
except Exception as e:
    print("  ERROR Pillow:", e); sys.exit(1)

print("\n[2] Creating test image 1280x720...")
img = Image.new("RGB", (1280, 720), (60, 55, 50))
draw = ImageDraw.Draw(img)
draw.ellipse([480, 180, 800, 540], fill=(200, 165, 125))
draw.ellipse([540, 270, 580, 310], fill=(40, 35, 30))
draw.ellipse([700, 270, 740, 310], fill=(40, 35, 30))
draw.arc([580, 380, 700, 440], 0, 180, fill=(150, 100, 90), width=4)
buf = BytesIO()
img.save(buf, "JPEG", quality=95)
test_bytes = buf.getvalue()

# Raw array from PIL
raw_arr = np.array(img)
print("  Raw PIL array: dtype={} contiguous={} shape={}".format(
    raw_arr.dtype, raw_arr.flags["C_CONTIGUOUS"], raw_arr.shape))

# Apply the v4 fix
fixed_arr = np.ascontiguousarray(raw_arr, dtype=np.uint8)
print("  Fixed array:   dtype={} contiguous={} shape={}".format(
    fixed_arr.dtype, fixed_arr.flags["C_CONTIGUOUS"], fixed_arr.shape))

print("\n[3] Testing face_locations() with FIXED array...")
configs = [
    ("1280x720 upsample=0", fixed_arr, 0),
    ("1280x720 upsample=1", fixed_arr, 1),
    ("1280x720 upsample=2", fixed_arr, 2),
]
for label, arr, up in configs:
    t0 = time.time()
    try:
        locs = face_recognition.face_locations(arr, model="hog", number_of_times_to_upsample=up)
        el = time.time() - t0
        status = "OK {} face(s)".format(len(locs)) if locs else "OK 0 faces (synthetic ok)"
        print("  [{}] {} in {:.2f}s".format(status, label, el))
    except Exception as e:
        print("  [ERR] {} -> {}".format(label, e))

print("\n[4] Testing face_locations() with RAW array (should fail or work depending on numpy)...")
try:
    locs = face_recognition.face_locations(raw_arr, model="hog", number_of_times_to_upsample=1)
    print("  Raw array: OK (numpy is already compatible on this machine)")
except Exception as e:
    print("  Raw array ERROR: {} <- THIS WAS THE BUG".format(e))

print("\n[5] Testing current face_service.py...")
fs_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "services", "face_service.py")
with open(fs_path, "r", encoding="utf-8") as f:
    fs_code = f.read()
if "ascontiguousarray" in fs_code:
    print("  VERSION: v4 (CORRECT - has ascontiguousarray fix)")
elif "TARGET_WIDTH = 550" in fs_code:
    print("  VERSION: v2 (BUG - has 550px resize)")
elif "TARGET_WIDTH" not in fs_code:
    print("  VERSION: v3 (missing ascontiguousarray fix)")
else:
    print("  VERSION: unknown")

import importlib.util
spec = importlib.util.spec_from_file_location("face_service", fs_path)
fs_mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fs_mod)
result = fs_mod.detect_and_encode_face(test_bytes)
if result:
    print("  detect_and_encode_face: OK - 128-d encoding returned")
else:
    print("  detect_and_encode_face: None (normal for synthetic, test with real photo)")

print("\n" + "=" * 60)
print("DONE")
print("=" * 60)
