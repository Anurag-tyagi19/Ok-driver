"""
Audit Log Schema
================
API response ke liye Pydantic schema.
"""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class AuditLogResponse(BaseModel):
    id: int
    camera_id: int
    event: str
    details: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
