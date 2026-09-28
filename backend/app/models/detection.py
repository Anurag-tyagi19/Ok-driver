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


class Detection(Base):

    __tablename__ = "detections"

    id = Column(
        Integer,
        primary_key=True,
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

    event_type = Column(
        String(50),
        nullable=False,
        index=True
    )

    vehicle_number = Column(
        String(50),
        nullable=True,
        index=True
    )

    confidence = Column(
        Float,
        nullable=True
    )

    timestamp = Column(
        DateTime,
        default=datetime.utcnow,
        index=True
    )

    # Relationship

    camera = relationship(
        "Camera",
        back_populates="detections"
    )

    alerts = relationship(
        "Alert",
        back_populates="detection"
    )