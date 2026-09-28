from pydantic import BaseModel
from typing import Optional


class AlertResponse(BaseModel):
    id: int
    detection_id: int
    camera_id: int
    identifier: str
    alert_type: str
    confidence: Optional[float]
    status: str

    class Config:
        from_attributes = True