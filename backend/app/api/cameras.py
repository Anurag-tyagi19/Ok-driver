"""
Cameras API
===========
Camera registry ke liye CRUD endpoints.
Heartbeat + Audit logging included.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.database import get_db
from app.models.camera import Camera
from app.schema.camera import CameraCreate, CameraResponse
from app.services.audit import log_event
from app.services.websocket_manager import manager


router = APIRouter(
    prefix="/api/v1/cameras",
    tags=["Cameras"]
)


# ==========================================
# CREATE CAMERA
# ==========================================

@router.post("/", response_model=CameraResponse)
def create_camera(
    camera: CameraCreate,
    db: Session = Depends(get_db)
):
    # Check karo koi duplicate camera_code toh nahi
    existing_camera = (
        db.query(Camera)
        .filter(Camera.camera_code == camera.camera_code)
        .first()
    )

    if existing_camera:
        raise HTTPException(
            status_code=400,
            detail="Camera code already exists"
        )

    new_camera = Camera(
        camera_code=camera.camera_code,
        name=camera.name,
        department=camera.department,
        latitude=camera.latitude,
        longitude=camera.longitude,
        camera_type=camera.camera_type,
        source_protocol=camera.source_protocol,
        stream_url=camera.stream_url,
        zone=camera.zone,
        status="OFFLINE"
    )

    db.add(new_camera)
    db.commit()
    db.refresh(new_camera)

    # Audit log
    log_event(
        db,
        camera_id=new_camera.id,
        event="CAMERA_CREATED",
        details=f"Camera '{new_camera.name}' created with code {new_camera.camera_code}"
    )

    return new_camera


# ==========================================
# GET ALL CAMERAS
# ==========================================

@router.get("/", response_model=list[CameraResponse])
def get_cameras(
    db: Session = Depends(get_db)
):
    cameras = db.query(Camera).filter(Camera.is_active == True).all()
    return cameras


# ==========================================
# GET ONE CAMERA
# ==========================================

@router.get("/{camera_id}", response_model=CameraResponse)
def get_camera(
    camera_id: int,
    db: Session = Depends(get_db)
):
    camera = (
        db.query(Camera)
        .filter(Camera.id == camera_id)
        .first()
    )

    if not camera:
        raise HTTPException(
            status_code=404,
            detail="Camera not found"
        )

    return camera


# ==========================================
# UPDATE CAMERA
# ==========================================

@router.put("/{camera_id}", response_model=CameraResponse)
def update_camera(
    camera_id: int,
    camera_data: CameraCreate,
    db: Session = Depends(get_db)
):
    camera = (
        db.query(Camera)
        .filter(Camera.id == camera_id)
        .first()
    )

    if not camera:
        raise HTTPException(
            status_code=404,
            detail="Camera not found"
        )

    camera.camera_code = camera_data.camera_code
    camera.name = camera_data.name
    camera.department = camera_data.department
    camera.latitude = camera_data.latitude
    camera.longitude = camera_data.longitude
    camera.camera_type = camera_data.camera_type
    camera.source_protocol = camera_data.source_protocol
    camera.stream_url = camera_data.stream_url
    camera.zone = camera_data.zone

    db.commit()
    db.refresh(camera)

    # Audit log
    log_event(
        db,
        camera_id=camera.id,
        event="CAMERA_UPDATED",
        details=f"Camera '{camera.name}' updated"
    )

    return camera


# ==========================================
# DISABLE CAMERA
# ==========================================

@router.delete("/{camera_id}")
def disable_camera(
    camera_id: int,
    db: Session = Depends(get_db)
):
    camera = (
        db.query(Camera)
        .filter(Camera.id == camera_id)
        .first()
    )

    if not camera:
        raise HTTPException(
            status_code=404,
            detail="Camera not found"
        )

    camera.is_active = False
    camera.status = "OFFLINE"

    db.commit()

    # Audit log
    log_event(
        db,
        camera_id=camera.id,
        event="CAMERA_DISABLED",
        details=f"Camera '{camera.name}' disabled"
    )

    return {
        "message": "Camera disabled successfully"
    }


# ==========================================
# HEARTBEAT
# ==========================================

@router.post("/{camera_id}/heartbeat")
async def camera_heartbeat(
    camera_id: int,
    db: Session = Depends(get_db)
):
    """
    Camera heartbeat receive karta hai.
    - Camera status ONLINE ho jaata hai
    - WebSocket se sab clients ko notify karta hai
    - Audit log mein record hota hai
    """
    camera = db.query(Camera).filter(
        Camera.id == camera_id,
        Camera.is_active == True
    ).first()

    if not camera:
        raise HTTPException(
            status_code=404,
            detail="Camera not found or disabled"
        )

    camera.status = "ONLINE"
    camera.last_heartbeat = datetime.utcnow()

    db.commit()
    db.refresh(camera)

    # Audit log (heartbeat log nahi karte kyunki bahut frequent hoga)
    # Sirf status change par log karte hain

    # WebSocket se broadcast karo
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

    return {
        "message": "Heartbeat received",
        "camera_id": camera.id,
        "camera_code": camera.camera_code,
        "status": camera.status,
        "last_heartbeat": camera.last_heartbeat
    }


# ==========================================
# MANUAL HEALTH CHECK (for testing)
# ==========================================

@router.post("/health/check")
def check_camera_health(
    db: Session = Depends(get_db)
):
    from app.services.camera_health import update_camera_health
    update_camera_health(db)

    return {
        "message": "Camera health updated"
    }


# ==========================================
# CAMERA AUDIT HISTORY
# ==========================================

@router.get("/{camera_id}/audit")
def get_camera_audit(
    camera_id: int,
    db: Session = Depends(get_db)
):
    """
    Ek camera ki puri audit history dikhata hai.
    """
    from app.models.audit_log import AuditLog

    camera = db.query(Camera).filter(Camera.id == camera_id).first()

    if not camera:
        raise HTTPException(
            status_code=404,
            detail="Camera not found"
        )

    logs = (
        db.query(AuditLog)
        .filter(AuditLog.camera_id == camera_id)
        .order_by(AuditLog.created_at.desc())
        .limit(50)
        .all()
    )

    return [
        {
            "id": log.id,
            "event": log.event,
            "details": log.details,
            "created_at": log.created_at.isoformat(),
        }
        for log in logs
    ]