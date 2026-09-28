from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
)

from sqlalchemy.orm import relationship

from app.db.base import Base


class Alert(Base):

    __tablename__ = "alerts"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    detection_id = Column(
        Integer,
        ForeignKey(
            "detections.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    camera_id = Column(
        Integer,
        ForeignKey(
            "cameras.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    identifier = Column(
        String(50),
        nullable=False,
        index=True
    )

    alert_type = Column(
        String(50),
        nullable=False,
        index=True
    )

    confidence = Column(
        Float,
        nullable=True
    )

    status = Column(
        String(20),
        default="ACTIVE",
        index=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        index=True
    )

    # Relationships

    detection = relationship(
        "Detection",
        back_populates="alerts"
    )

    camera = relationship(
        "Camera",
        back_populates="alerts"
    )