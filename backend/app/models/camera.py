from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    Integer,
    String,
)

from sqlalchemy.orm import relationship

from app.db.base import Base


class Camera(Base):

    __tablename__ = "cameras"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    camera_code = Column(
        String(50),
        unique=True,
        nullable=False,
        index=True
    )

    name = Column(
        String(100),
        nullable=False
    )

    department = Column(
        String(100),
        nullable=False,
        index=True
    )

    latitude = Column(
        Float,
        nullable=False
    )

    longitude = Column(
        Float,
        nullable=False
    )

    camera_type = Column(
        String(50),
        nullable=False,
        index=True
    )

    source_protocol = Column(
        String(50),
        nullable=False
    )

    stream_url = Column(
        String(500),
        nullable=True
    )

    status = Column(
        String(20),
        default="OFFLINE",
        index=True
    )

    zone = Column(
        String(100),
        nullable=True,
        index=True
    )

    last_heartbeat = Column(
        DateTime,
        nullable=True
    )

    is_active = Column(
        Boolean,
        default=True,
        index=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    # Relationships

    detections = relationship(
        "Detection",
        back_populates="camera"
    )

    alerts = relationship(
        "Alert",
        back_populates="camera"
    )