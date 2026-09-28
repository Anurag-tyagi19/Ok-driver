from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.alert import Alert
from app.schema.alert import AlertResponse

router = APIRouter(
    prefix="/api/v1/alerts",
    tags=["Alerts"]
)


@router.get("/", response_model=list[AlertResponse])
def get_alerts(db: Session = Depends(get_db)):
    return db.query(Alert).order_by(Alert.created_at.desc()).all()


@router.get("/active", response_model=list[AlertResponse])
def get_active_alerts(db: Session = Depends(get_db)):
    return db.query(Alert).filter(
        Alert.status == "ACTIVE"
    ).order_by(Alert.created_at.desc()).all()


@router.patch("/{alert_id}/acknowledge")
def acknowledge_alert(
    alert_id: int,
    db: Session = Depends(get_db)
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()

    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Alert not found"
        )

    alert.status = "ACKNOWLEDGED"
    db.commit()
    db.refresh(alert)

    return {
        "message": "Alert acknowledged",
        "alert_id": alert.id,
        "status": alert.status
    }


@router.patch("/{alert_id}/resolve")
def resolve_alert(
    alert_id: int,
    db: Session = Depends(get_db)
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()

    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Alert not found"
        )

    alert.status = "RESOLVED"
    db.commit()
    db.refresh(alert)

    return {
        "message": "Alert resolved",
        "alert_id": alert.id,
        "status": alert.status
    }