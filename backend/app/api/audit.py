"""
Audit Logs API
==============
Camera events ki history dekhne ke liye.

Endpoints:
  GET /api/v1/audit/             → Sab audit logs (latest first)
  GET /api/v1/audit/{camera_id}  → Ek camera ke logs
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.audit_log import AuditLog
from app.schema.audit_log import AuditLogResponse


router = APIRouter(
    prefix="/api/v1/audit",
    tags=["Audit Logs"]
)


# ==========================================
# GET ALL AUDIT LOGS
# ==========================================

@router.get("/", response_model=list[AuditLogResponse])
def get_all_audit_logs(
    limit: int = Query(default=100, le=500),
    db: Session = Depends(get_db)
):
    """
    Sab audit logs return karta hai, latest pehle.
    """
    return (
        db.query(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
        .all()
    )


# ==========================================
# GET AUDIT LOGS FOR ONE CAMERA
# ==========================================

@router.get("/{camera_id}", response_model=list[AuditLogResponse])
def get_camera_audit_logs(
    camera_id: int,
    limit: int = Query(default=50, le=200),
    db: Session = Depends(get_db)
):
    """
    Ek specific camera ke audit logs return karta hai.
    """
    return (
        db.query(AuditLog)
        .filter(AuditLog.camera_id == camera_id)
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
        .all()
    )
