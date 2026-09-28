"""
Audit Log Helper
================
Simple helper function jo audit logs likhta hai.

Usage:
    from app.services.audit import log_event
    log_event(db, camera_id=1, event="CAMERA_CREATED", details="Camera added")
"""

from app.models.audit_log import AuditLog


def log_event(db, camera_id: int, event: str, details: str = None):
    """
    Ek audit log entry create karta hai.

    Args:
        db: SQLAlchemy session
        camera_id: Kis camera ka event hai
        event: Event name (e.g., "CAMERA_CREATED", "STATUS_ONLINE")
        details: Optional extra info
    """
    entry = AuditLog(
        camera_id=camera_id,
        event=event,
        details=details,
    )
    db.add(entry)
    db.commit()
