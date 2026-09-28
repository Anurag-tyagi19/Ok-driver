"""
Audit Log Model
===============
Camera ke events ka record rakhta hai.

Events:
  - CAMERA_CREATED
  - CAMERA_UPDATED
  - CAMERA_DISABLED
  - STATUS_ONLINE
  - STATUS_DEGRADED
  - STATUS_OFFLINE
  - HEARTBEAT_RECEIVED
"""

from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)

from app.db.base import Base


class AuditLog(Base):

    __tablename__ = "audit_logs"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # Kis camera ka event hai
    camera_id = Column(
        Integer,
        ForeignKey(
            "cameras.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    # Event type (CAMERA_CREATED, STATUS_ONLINE, etc.)
    event = Column(
        String(50),
        nullable=False,
        index=True
    )

    # Optional extra details (JSON ya plain text)
    details = Column(
        Text,
        nullable=True
    )

    # Kab hua
    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        index=True
    )
