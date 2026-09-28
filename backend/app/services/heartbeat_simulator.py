"""
Heartbeat Simulator
===================
Yeh script camera heartbeats simulate karta hai.

Demo flow:
  - Camera ONLINE hoti hai (heartbeat aa raha hai)
  - Heartbeat ruk jaata hai → DEGRADED
  - Aur time baad → OFFLINE

Usage:
  python -m app.services.heartbeat_simulator

Isko backend folder se run karo:
  cd backend
  python -m app.services.heartbeat_simulator
"""

import time
import requests
import random


# API base URL
API_BASE = "http://127.0.0.1:8000"


def send_heartbeat(camera_id: int):
    """
    Ek camera ko heartbeat bhejta hai.
    Heartbeat aane par camera ONLINE ho jaati hai.
    """
    try:
        response = requests.post(
            f"{API_BASE}/api/v1/cameras/{camera_id}/heartbeat",
            timeout=5,
        )
        if response.status_code == 200:
            data = response.json()
            print(
                f"[HEARTBEAT] Camera {camera_id} → "
                f"Status: {data['status']} | "
                f"Time: {data['last_heartbeat']}"
            )
        else:
            print(
                f"[ERROR] Camera {camera_id} heartbeat failed: "
                f"{response.status_code}"
            )
    except requests.exceptions.ConnectionError:
        print("[ERROR] Backend se connect nahi ho pa raha. Kya FastAPI chal raha hai?")
    except Exception as error:
        print(f"[ERROR] {error}")


def get_all_cameras():
    """
    Saari active cameras ki list fetch karta hai.
    """
    try:
        response = requests.get(
            f"{API_BASE}/api/v1/cameras/",
            timeout=5
        )
        if response.status_code == 200:
            cameras = response.json()
            # Sirf active cameras return karo
            active = [c for c in cameras if c.get("is_active", True)]
            return active
        return []
    except Exception:
        return []


def run_demo_simulation():
    """
    Demo simulation:
    Phase 1 (0-60 sec): Sab cameras ko heartbeat bhejta hai → ONLINE
    Phase 2 (60-120 sec): Heartbeat ruk jaata hai → DEGRADED/OFFLINE
    Phase 3 (120+ sec): Kuch cameras phir ONLINE ho jaate hain
    """

    print("=" * 50)
    print("OkDriver Heartbeat Simulator")
    print("=" * 50)
    print()
    print("Phase 1: Sab cameras ONLINE ho rahe hain...")
    print("(30 seconds tak heartbeat bhejta rahega)")
    print()

    # ============================
    # PHASE 1: Heartbeat bhejo (30 sec)
    # ============================

    start_time = time.time()

    while time.time() - start_time < 30:
        cameras = get_all_cameras()

        if not cameras:
            print("[WARN] Koi active camera nahi mila. Pehle camera add karo.")
            time.sleep(5)
            continue

        for camera in cameras:
            send_heartbeat(camera["id"])

        time.sleep(8)  # Har 8 second mein heartbeat

    print()
    print("Phase 2: Heartbeat ruk gaya...")
    print("(Camera health checker ab DEGRADED detect karega - 30 sec baad)")
    print("(Phir OFFLINE - aur 60 sec baad)")
    print()
    print("Health checker automatically backend mein chal raha hai.")
    print("Frontend pe status change dekhna ke liye wait karo...")
    print()

    # ============================
    # PHASE 2: Wait (heartbeat band)
    # ============================

    time.sleep(120)  # 2 minute wait — DEGRADED → OFFLINE transition hogi

    print()
    print("Phase 3: Kuch cameras phir se ONLINE ho rahe hain...")
    print()

    # ============================
    # PHASE 3: Selective heartbeat
    # ============================

    cameras = get_all_cameras()

    if cameras:
        # Sirf pehli camera ko phir se online karo
        first_camera = cameras[0]
        for _ in range(5):
            send_heartbeat(first_camera["id"])
            time.sleep(5)

    print()
    print("Demo simulation complete!")
    print("Ab tum frontend pe dekh sakte ho:")
    print("  - Camera status changes: ONLINE → DEGRADED → OFFLINE → ONLINE")
    print("  - Real-time WebSocket events panel mein bhi aayenge")
    print()


def run_continuous():
    """
    Continuously saari cameras ko heartbeat bhejta rehta hai.
    Agar tum sirf ONLINE status maintain karna chahte ho to yeh use karo.
    """

    print("Continuous heartbeat mode...")
    print("Ctrl+C se band karo.")
    print()

    while True:
        cameras = get_all_cameras()

        if not cameras:
            print("[WARN] Koi active camera nahi mila. 10 sec mein retry...")
            time.sleep(10)
            continue

        for camera in cameras:
            send_heartbeat(camera["id"])

        time.sleep(15)  # Har 15 second mein heartbeat (30 sec timeout ke andar)


if __name__ == "__main__":
    import sys

    mode = sys.argv[1] if len(sys.argv) > 1 else "demo"

    if mode == "continuous":
        run_continuous()
    else:
        run_demo_simulation()
