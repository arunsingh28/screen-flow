from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.analytics import PageVisit
from pydantic import BaseModel

router = APIRouter()

class PageVisitCreate(BaseModel):
    path: str
    duration_seconds: float

@router.post("/page-visit")
def record_page_visit(
    visit: PageVisitCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Record a user's page visit and duration."""
    # Simple validation
    if visit.duration_seconds < 0:
        return {"message": "Invalid duration"}
    
    # Don't record very short visits (< 1s) as they might be redirects
    if visit.duration_seconds < 1:
        return {"message": "Visit too short"}

    page_visit = PageVisit(
        user_id=current_user.id,
        path=visit.path,
        duration_seconds=visit.duration_seconds
    )
    db.add(page_visit)
    db.commit()
    return {"message": "Recorded"}
