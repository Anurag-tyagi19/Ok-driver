from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

router = APIRouter(
    prefix="/api/v1/video",
    tags=["Video"]
)
VIDEO_DIR = Path(__file__).resolve().parent.parent / "videos"


@router.get("/{filename}")
def get_video(filename: str):
    video_path = (VIDEO_DIR / filename).resolve()
    if VIDEO_DIR.resolve() not in video_path.parents or not video_path.is_file():
        raise HTTPException(status_code=404, detail="Video not found")

    return FileResponse(
        video_path,
        media_type="video/mp4"
    )
