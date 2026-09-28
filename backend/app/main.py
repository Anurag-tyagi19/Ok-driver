"""
OkDriver CCTV Intelligence Platform
=====================================
Main FastAPI application.

Background Tasks:
  1. Camera Health Checker — har 30 sec mein camera status update karta hai
  2. AI Simulator — har 10 sec mein ek detection generate karta hai
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import asyncio
import os
import random
import httpx
from contextlib import asynccontextmanager

from app.api.cameras import router as camera_router
from app.api.video import router as video_router
from app.api.detections import router as detection_router
from app.api.watchlist import router as watchlist_router
from app.api.websocket import router as websocket_router
from app.api.alerts import router as alert_router
from app.api.audit import router as audit_router
from app.api.auth import router as auth_router

from app.db.database import SessionLocal, engine
from app.db.base import Base

# Sab models import karo taaki tables create ho sakein
from app.models import camera, detection, watchlist, alert, audit_log

from app.services.camera_health import update_camera_health
from app.services.websocket_manager import manager


# ==========================================
# DEMO VEHICLES (AI Simulator ke liye)
# ==========================================

DEMO_VEHICLES = [
    "GJ01XX0001",
    "GJ01AB1234",
    "GJ05CD5678",
    "DL01AB1234",
    "DL02CD5678",
    "UP16GH3456",
    "MH12XY7890",
]


# ==========================================
# CAMERA HEALTH BACKGROUND TASK
# ==========================================

async def health_checker():
    """
    Har 30 second mein sab cameras ka health check karta hai.
    Status change hone par WebSocket broadcast karta hai.
    """
    while True:

        db = SessionLocal()

        try:
            # Cameras ka health check + status update
            changed_cameras = update_camera_health(db)

            # Jo cameras ka status badla, unhe broadcast karo
            for camera in changed_cameras:

                await manager.broadcast({
                    "type": "CAMERA_HEALTH",
                    "camera_id": camera.id,
                    "camera_code": camera.camera_code,
                    "status": camera.status,
                    "last_heartbeat": (
                        camera.last_heartbeat.isoformat()
                        if camera.last_heartbeat
                        else None
                    ),
                })

        except Exception as error:
            print(f"[HEALTH] Camera health checker error: {error}")

        finally:
            db.close()

        # Har 30 second mein run karo
        await asyncio.sleep(30)


# ==========================================
# AI SIMULATOR BACKGROUND TASK
# ==========================================

async def ai_simulator():
    """
    Har 10 second mein ek random detection generate karta hai.
    Yeh real computer-vision system ko simulate karta hai.

    Production mein: Isko actual CV inference service se replace karein.
    """
    # Wait karo server properly start ho jaye
    await asyncio.sleep(5)

    print("[AI] AI Simulator started. Har 10 second mein detection generate hogi.")

    while True:

        db = SessionLocal()

        try:
            from app.models.camera import Camera as CameraModel

            # Sirf active + online cameras pe detection bhejo
            active_cameras = (
                db.query(CameraModel)
                .filter(
                    CameraModel.is_active == True,
                    CameraModel.status == "ONLINE"
                )
                .all()
            )

            if active_cameras:
                # Random camera choose karo
                chosen_camera = random.choice(active_cameras)

                # Internal API call karo detection create karne ke liye
                # (isse detection saving + watchlist check + WebSocket broadcast sab ho jaata hai)
                port = os.getenv("PORT", "8000")
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        f"http://127.0.0.1:{port}/api/v1/detections/",
                        json={
                            "camera_id": chosen_camera.id,
                            "event_type": "ANPR",
                            "vehicle_number": random.choice(DEMO_VEHICLES),
                            "confidence": round(random.uniform(0.85, 0.99), 2),
                        },
                        timeout=5.0,
                    )

                    if response.status_code == 200:
                        print(f"[AI] Detection generated for camera {chosen_camera.camera_code}")

        except Exception as error:
            print(f"[AI] Simulator error: {error}")

        finally:
            db.close()

        # Har 10 second mein ek detection
        await asyncio.sleep(10)


# ==========================================
# APPLICATION LIFESPAN
# ==========================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    App start hone par:
      1. Database tables create karo (if not exist)
      2. Background tasks start karo

    App band hone par:
      - Background tasks cancel karo
    """

    # Tables create karo
    Base.metadata.create_all(bind=engine)
    print("[DB] Database tables ready.")

    # Background tasks start karo
    health_task = asyncio.create_task(health_checker())
    ai_task = asyncio.create_task(ai_simulator())

    print("[APP] Background tasks started.")

    yield

    # App band hone par tasks cancel karo
    health_task.cancel()
    ai_task.cancel()

    for task in [health_task, ai_task]:
        try:
            await task
        except asyncio.CancelledError:
            pass

    print("[APP] Background tasks stopped.")


# ==========================================
# FASTAPI APPLICATION
# ==========================================

app = FastAPI(
    title="OkDriver CCTV Intelligence Platform",
    description="Centralized CCTV monitoring with AI/ANPR detection, watchlist alerts, and real-time WebSocket events.",
    version="1.0.0",
    lifespan=lifespan
)


# ==========================================
# CORS
# ==========================================

cors_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    cors_origins.append(frontend_url.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https?://.*\.onrender\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# ROUTES
# ==========================================

app.include_router(camera_router)
app.include_router(video_router)
app.include_router(detection_router)
app.include_router(watchlist_router)
app.include_router(websocket_router)
app.include_router(alert_router)
app.include_router(audit_router)
app.include_router(auth_router)


# ==========================================
# ROOT ENDPOINT
# ==========================================

@app.get("/")
def root():
    return {
        "message": "Welcome to OkDriver CCTV Intelligence Platform API!",
        "docs": "/docs",
        "health": "/health"
    }


# ==========================================
# HEALTH ENDPOINT
# ==========================================

@app.get("/health")
def health():
    return {
        "status": "healthy"
    }