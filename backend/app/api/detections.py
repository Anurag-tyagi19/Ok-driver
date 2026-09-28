"""
Detections API
==============
AI detection events receive karta hai, store karta hai,
watchlist match check karta hai, aur WebSocket se broadcast karta hai.

Event Deduplication:
  Same vehicle ke liye same camera pe 60 second ke andar
  duplicate alert create nahi hoga.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.services.websocket_manager import manager
from app.db.database import get_db
from app.models.camera import Camera
from app.models.detection import Detection
from app.schema.detection import DetectionCreate, DetectionResponse
from app.models.watchlist import Watchlist
from app.models.alert import Alert


router = APIRouter(
    prefix="/api/v1/detections",
    tags=["Detections"]
)


# ==========================================
# CREATE DETECTION
# ==========================================

@router.post("/", response_model=DetectionResponse)
async def create_detection(
    detection: DetectionCreate,
    db: Session = Depends(get_db)
):
    """
    Ek naya detection event create karta hai.

    Steps:
    1. Camera exist karta hai? Check karo.
    2. Detection DB mein save karo.
    3. WebSocket se DETECTION event broadcast karo.
    4. Watchlist mein vehicle hai? Alert create karo.
    5. Alert ke liye WATCHLIST_ALERT broadcast karo.

    Event Deduplication:
    Same vehicle + same camera pe 60 sec ke andar duplicate alert nahi banega.
    """

    # -------- Step 1: Camera check --------
    camera = db.query(Camera).filter(
        Camera.id == detection.camera_id
    ).first()

    if not camera:
        raise HTTPException(
            status_code=404,
            detail="Camera not found"
        )

    # -------- Step 2: Detection save --------
    new_detection = Detection(
        camera_id=detection.camera_id,
        event_type=detection.event_type,
        vehicle_number=detection.vehicle_number,
        confidence=detection.confidence
    )

    db.add(new_detection)
    db.commit()
    db.refresh(new_detection)

    # -------- Step 3: WebSocket broadcast --------
    await manager.broadcast({
        "type": "DETECTION",
        "id": new_detection.id,
        "camera_id": new_detection.camera_id,
        "camera_code": camera.camera_code,
        "camera_name": camera.name,
        "event_type": new_detection.event_type,
        "vehicle_number": new_detection.vehicle_number,
        "confidence": new_detection.confidence,
        "timestamp": new_detection.timestamp.isoformat(),
    })

    # -------- Step 4: Watchlist check --------
    if detection.vehicle_number:

        watchlist_entry = db.query(Watchlist).filter(
            Watchlist.identifier == detection.vehicle_number,
            Watchlist.is_active == True
        ).first()

        if watchlist_entry:

            # -------- Event Deduplication --------
            # Check karo kya 60 sec ke andar same vehicle + camera pe alert already hai
            sixty_seconds_ago = datetime.utcnow() - timedelta(seconds=60)

            recent_alert = db.query(Alert).filter(
                Alert.camera_id == detection.camera_id,
                Alert.identifier == detection.vehicle_number,
                Alert.created_at >= sixty_seconds_ago
            ).first()

            if recent_alert:
                # Duplicate alert — skip karo
                print(
                    f"[DEDUP] Skipping duplicate alert for "
                    f"{detection.vehicle_number} on camera {detection.camera_id}"
                )
            else:
                # Naya alert create karo
                new_alert = Alert(
                    detection_id=new_detection.id,
                    camera_id=detection.camera_id,
                    identifier=detection.vehicle_number,
                    alert_type="WATCHLIST_MATCH",
                    confidence=detection.confidence,
                    status="ACTIVE"
                )

                db.add(new_alert)
                db.commit()
                db.refresh(new_alert)

                # -------- Step 5: Alert broadcast --------
                await manager.broadcast({
                    "type": "WATCHLIST_ALERT",
                    "alert_id": new_alert.id,
                    "camera_id": new_alert.camera_id,
                    "camera_name": camera.name,
                    "identifier": new_alert.identifier,
                    "alert_type": new_alert.alert_type,
                    "confidence": new_alert.confidence,
                    "status": new_alert.status,
                    "created_at": new_alert.created_at.isoformat(),
                })

    return new_detection


# ==========================================
# SEARCH VEHICLE MOVEMENT
# ==========================================

@router.get("/search/{vehicle_number}")
def search_vehicle(
    vehicle_number: str,
    db: Session = Depends(get_db)
):
    """
    Vehicle number se uski movement history dikhata hai.
    Map pe path draw karne ke liye coordinates bhi return karta hai.
    """
    detections = db.query(Detection).filter(
        Detection.vehicle_number == vehicle_number
    ).order_by(
        Detection.timestamp.asc()
    ).all()

    results = []

    for det in detections:
        camera = db.query(Camera).filter(
            Camera.id == det.camera_id
        ).first()

        results.append({
            "detection_id": det.id,
            "vehicle_number": det.vehicle_number,
            "camera_id": det.camera_id,
            "camera_name": camera.name if camera else None,
            "camera_code": camera.camera_code if camera else None,
            "latitude": camera.latitude if camera else None,
            "longitude": camera.longitude if camera else None,
            "confidence": det.confidence,
            "timestamp": det.timestamp,
        })

    return results


# ==========================================
# GET RECENT DETECTIONS
# ==========================================

@router.get("/", response_model=list[DetectionResponse])
def get_detections(db: Session = Depends(get_db)):
    """
    Haali 50 detections return karta hai (latest pehle).
    """
    return (
        db.query(Detection)
        .order_by(Detection.timestamp.desc())
        .limit(50)
        .all()
    )