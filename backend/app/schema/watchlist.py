from pydantic import BaseModel
from typing import Optional


class WatchlistCreate(BaseModel):
    identifier: str
    entity_type: str
    description: Optional[str] = None


class WatchlistResponse(BaseModel):
    id: int
    identifier: str
    entity_type: str
    description: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True