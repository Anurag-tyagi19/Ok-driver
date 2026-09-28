from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DetectionCreate(BaseModel):
    camera_id: int
    event_type: str
    vehicle_number: Optional[str] = None
    confidence: Optional[float] = None


class DetectionResponse(BaseModel):
    id: int
    camera_id: int
    event_type: str
    vehicle_number: Optional[str]
    confidence: Optional[float]
    timestamp: datetime

    class Config:
        from_attributes = True