from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.watchlist import Watchlist
from app.schema.watchlist import (
    WatchlistCreate,
    WatchlistResponse
)

router = APIRouter(
    prefix="/api/v1/watchlist",
    tags=["Watchlist"]
)


# Add to watchlist
@router.post("/", response_model=WatchlistResponse)
def create_watchlist_entry(
    data: WatchlistCreate,
    db: Session = Depends(get_db)
):
    existing = (
        db.query(Watchlist)
        .filter(Watchlist.identifier == data.identifier)
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Identifier already exists in watchlist"
        )

    entry = Watchlist(
        identifier=data.identifier,
        entity_type=data.entity_type,
        description=data.description,
        is_active=True
    )

    db.add(entry)
    db.commit()
    db.refresh(entry)

    return entry


# Get all watchlist entries
@router.get("/", response_model=list[WatchlistResponse])
def get_watchlist(
    db: Session = Depends(get_db)
):
    return (
        db.query(Watchlist)
        .order_by(Watchlist.created_at.desc())
        .all()
    )


# Get only active watchlist entries
@router.get("/active", response_model=list[WatchlistResponse])
def get_active_watchlist(
    db: Session = Depends(get_db)
):
    return (
        db.query(Watchlist)
        .filter(Watchlist.is_active == True)
        .order_by(Watchlist.created_at.desc())
        .all()
    )


# Deactivate watchlist entry
@router.patch("/{watchlist_id}/deactivate")
def deactivate_watchlist_entry(
    watchlist_id: int,
    db: Session = Depends(get_db)
):
    entry = (
        db.query(Watchlist)
        .filter(Watchlist.id == watchlist_id)
        .first()
    )

    if not entry:
        raise HTTPException(
            status_code=404,
            detail="Watchlist entry not found"
        )

    entry.is_active = False

    db.commit()
    db.refresh(entry)

    return {
        "message": "Watchlist entry deactivated",
        "id": entry.id,
        "identifier": entry.identifier,
        "is_active": entry.is_active
    }