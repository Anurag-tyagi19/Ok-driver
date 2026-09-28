from pydantic import BaseModel
from typing import Optional


class CameraCreate(BaseModel):
    camera_code: str
    name: str
    department: str
    latitude: float
    longitude: float
    camera_type: str
    source_protocol: str
    stream_url: Optional[str] = None
    zone: Optional[str] = None


class CameraResponse(BaseModel):
    id: int
    camera_code: str
    name: str
    department: str
    latitude: float
    longitude: float
    camera_type: str
    source_protocol: str
    stream_url: Optional[str]
    status: str
    zone: Optional[str]

    class Config:
        from_attributes = True