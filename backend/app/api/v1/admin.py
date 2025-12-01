from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.api.deps import require_admin
from app.models.user import User
from app.models.job_search import JobSearch
from app.models.cv import CV
from app.models.activity import Activity
from typing import List, Optional
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

router = APIRouter()

# Response Models
class AdminUserResponse(BaseModel):
    id: UUID
    email: str
    company_name: str | None
    first_name: str | None
    last_name: str | None
    role: str
    credits: int
    created_at: datetime
    last_login: datetime | None
    jobs_count: int
    cvs_count: int

    class Config:
        from_attributes = True


class AdminStatsResponse(BaseModel):
    total_users: int
    total_jobs: int
    total_cvs: int
    active_sessions: int


class AdminActivityResponse(BaseModel):
    id: UUID
    user_email: str
    type: str
    description: str
    created_at: datetime

    class Config:
        from_attributes = True


# Admin Endpoints
@router.get("/analytics/overview", response_model=AdminStatsResponse)
def get_admin_stats(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get overall platform statistics."""
    total_users = db.query(User).count()
    total_jobs = db.query(JobSearch).count()
    total_cvs = db.query(CV).count()
    
    # For active sessions, we could track this in a separate table
    # For now, return a placeholder
    active_sessions = 0
    
    return AdminStatsResponse(
        total_users=total_users,
        total_jobs=total_jobs,
        total_cvs=total_cvs,
        active_sessions=active_sessions
    )


@router.get("/users", response_model=List[AdminUserResponse])
def get_all_users(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000)
):
    """Get all users with their stats."""
    query = db.query(User)
    
    # Search filter
    if search:
        query = query.filter(
            (User.email.ilike(f"%{search}%")) |
            (User.company_name.ilike(f"%{search}%"))
        )
    
    users = query.offset(skip).limit(limit).all()
    
    # Enrich with counts
    result = []
    for user in users:
        jobs_count = db.query(JobSearch).filter(JobSearch.user_id == user.id).count()
        cvs_count = db.query(CV).filter(CV.user_id == user.id).count()
        
        result.append(AdminUserResponse(
            id=user.id,
            email=user.email,
            company_name=user.company_name,
            first_name=user.first_name,
            last_name=user.last_name,
            role=user.role,
            credits=user.credits,
            created_at=user.created_at,
            last_login=user.last_login,
            jobs_count=jobs_count,
            cvs_count=cvs_count
        ))
    
    return result


@router.get("/users/{user_id}")
def get_user_details(
    user_id: UUID,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    jobs = db.query(JobSearch).filter(JobSearch.user_id == user_id).all()
    cvs_count = db.query(CV).filter(CV.user_id == user_id).count()
    
    return {
        "user": AdminUserResponse(
            id=user.id,
            email=user.email,
            company_name=user.company_name,
            first_name=user.first_name,
            last_name=user.last_name,
            role=user.role,
            credits=user.credits,
            created_at=user.created_at,
            last_login=user.last_login,
            jobs_count=len(jobs),
            cvs_count=cvs_count
        ),
        "jobs": jobs
    }


@router.get("/activity", response_model=List[AdminActivityResponse])
def get_all_activity(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000)
):
    """Get all platform activity logs."""
    activities = (
        db.query(Activity, User.email)
        .join(User, Activity.user_id == User.id)
        .order_by(Activity.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    
    return [
        AdminActivityResponse(
            id=activity.id,
            user_email=email,
            type=activity.type,
            description=activity.description,
            created_at=activity.created_at
        )
        for activity, email in activities
    ]


@router.get("/sessions")
def get_active_sessions(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get active user sessions."""
    # This would require session tracking implementation
    # For now, return users who logged in recently
    from datetime import datetime, timedelta
    
    recent_threshold = datetime.utcnow() - timedelta(hours=24)
    recent_users = (
        db.query(User)
        .filter(User.last_login >= recent_threshold)
        .all()
    )
    
    return {
        "active_sessions": len(recent_users),
        "users": [
            {
                "email": user.email,
                "last_login": user.last_login
            }
            for user in recent_users
        ]
    }
