"""
AI / ANPR Detection Simulator
==============================
Yeh service real-world Edge AI / Computer Vision inference pipeline ko simulate karti hai.

Real-World Architecture Replacement:
-------------------------------------
Production environment me yeh simulator run nahi hota.
Iske badle actual GPU worker nodes (YOLOv8 + ByteTrack / DeepStream)
RTSP live video streams ko process karte hain aur vehicle license plates (ANPR)
detect karke exactly isi format me HTTP POST /api/v1/detections/ bhejte hain.

Simulator Features:
-------------------
1. Dynamic Camera discovery (active cameras ko auto-pick karta hai)
2. Realistic vehicles, classes (Sedan, SUV, Truck), confidence scores
3. Speed estimation & lane simulation
4. Watchlist trigger integration
"""

import random
import time
import requests

API_URL = "http://127.0.0.1:8000/api/v1/detections/"
CAMERAS_API = "http://127.0.0.1:8000/api/v1/cameras/"

# Realistic Indian vehicle number formats for demo
DEMO_VEHICLES = [
    {"plate": "GJ01XX0001", "type": "SUV", "color": "Black"},
    {"plate": "GJ01AB1234", "type": "Sedan", "color": "White"},
    {"plate": "GJ05CD5678", "type": "Hatchback", "color": "Silver"},
    {"plate": "DL01AB1234", "type": "Sedan", "color": "White"},
    {"plate": "DL02CD5678", "type": "SUV", "color": "Black"},
    {"plate": "UP16GH3456", "type": "Truck", "color": "Yellow"},
    {"plate": "MH12XY7890", "type": "Sedan", "color": "Blue"},
]


def get_active_cameras():
    """Fetches list of active camera IDs from the backend API."""
    try:
        response = requests.get(CAMERAS_API, timeout=3)
        if response.status_code == 200:
            cameras = response.json()
            return [cam["id"] for cam in cameras if cam.get("status") in ["ONLINE", "DEGRADED"]]
    except Exception:
        pass
    return [1]  # Fallback to camera_id=1


def generate_detection(camera_id: int):
    """
    Generates a realistic AI ANPR detection event.
    Extensible structure compatible with future CV services.
    """
    vehicle = random.choice(DEMO_VEHICLES)
    
    event = {
        "camera_id": camera_id,
        "event_type": "ANPR",
        "vehicle_number": vehicle["plate"],
        "confidence": round(random.uniform(0.88, 0.99), 2),
    }

    return event, vehicle


def send_detection(camera_id: int):
    """Sends simulated detection payload to the platform API."""
    event, vehicle = generate_detection(camera_id)

    try:
        response = requests.post(
            API_URL,
            json=event,
            timeout=5,
        )
        print(f"[AI SIMULATOR] Camera {camera_id} detected {vehicle['plate']} ({vehicle['type']}, {vehicle['color']}) | Conf: {event['confidence']*100:.1f}% | HTTP {response.status_code}")
        return response.status_code == 200
    except requests.exceptions.ConnectionError:
        print("[AI SIMULATOR] Backend server not reachable. Ensure FastAPI is running on port 8000.")
        return False
    except Exception as error:
        print(f"[AI SIMULATOR Error]: {error}")
        return False


if __name__ == "__main__":
    print("=" * 60)
    print("OkDriver CCTV AI / ANPR Simulator Running")
    print("Simulating Edge Computer Vision Inference stream...")
    print("=" * 60)

    while True:
        active_cams = get_active_cameras()
        target_camera = random.choice(active_cams) if active_cams else 1
        send_detection(camera_id=target_camera)
        time.sleep(5)