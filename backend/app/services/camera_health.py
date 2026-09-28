"""
Camera Health Service
=====================
Har 30 second mein background mein chalta hai.
Cameras ka heartbeat check karta hai:
  - 30 sec se kam → ONLINE
  - 30-90 sec → DEGRADED
  - 90 sec se zyada → OFFLINE

Status change hone par:
  - WebSocket broadcast hota hai
  - Audit log mein record hota hai
"""

from datetime import datetime
from sqlalchemy.orm import Session

from app.models.camera import Camera


def update_camera_health(db: Session):
    """
    Sab active cameras ka health check karta hai.
    Jo cameras ka status change hua, unki list return karta hai.
    """
    cameras = (
        db.query(Camera)
        .filter(Camera.is_active == True)
        .all()
    )

    now = datetime.utcnow()

    changed_cameras = []

    for camera in cameras:

        old_status = camera.status

        if camera.last_heartbeat is None:
            # Koi heartbeat nahi aaya → OFFLINE
            camera.status = "OFFLINE"

        else:
            seconds_since_heartbeat = (
                now - camera.last_heartbeat
            ).total_seconds()

            if seconds_since_heartbeat <= 30:
                camera.status = "ONLINE"

            elif seconds_since_heartbeat <= 90:
                camera.status = "DEGRADED"

            else:
                camera.status = "OFFLINE"

        # Agar status change hua toh list mein add karo
        if old_status != camera.status:
            changed_cameras.append(camera)

            # Audit log karo status change
            _log_status_change(
                db,
                camera_id=camera.id,
                old_status=old_status,
                new_status=camera.status
            )

    db.commit()

    return changed_cameras


def _log_status_change(db: Session, camera_id: int, old_status: str, new_status: str):
    """
    Status change ko audit log mein record karta hai.
    Import yahan rakha hai taaki circular imports na ho.
    """
    try:
        from app.models.audit_log import AuditLog

        entry = AuditLog(
            camera_id=camera_id,
            event=f"STATUS_{new_status}",
            details=f"Status changed from {old_status} to {new_status}",
        )
        db.add(entry)
        # Note: commit() caller function mein hoga
    except Exception as error:
        # Audit log fail hone par main flow band nahi hona chahiye
        print(f"[AUDIT] Failed to log status change: {error}")