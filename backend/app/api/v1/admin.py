from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.api.deps import require_admin
from app.models.user import User
from app.models.job import CVBatch, CV
from app.models.activity import Activity, ActivityType
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
    
    # Restrictions
    is_blocked: bool
    can_create_jobs: bool
    cv_upload_limit: int

    class Config:
        from_attributes = True


class UserStatusUpdate(BaseModel):
    is_blocked: Optional[bool] = None
    can_create_jobs: Optional[bool] = None
    cv_upload_limit: Optional[int] = None


class UserCreditsUpdate(BaseModel):
    credits: int


from app.models.analytics import PageVisit
from sqlalchemy import func, desc
from datetime import datetime, timedelta

# ... (previous imports)

class LoginTrend(BaseModel):
    date: str
    count: int

class PageStat(BaseModel):
    path: str
    visits: int
    avg_duration: float

class AdminStatsResponse(BaseModel):
    total_users: int
    total_jobs: int
    total_cvs: int
    active_sessions: int
    login_trends: List[LoginTrend]
    top_pages: List[PageStat]


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
    """Get overall platform statistics with trends."""
    total_users = db.query(User).count()
    total_jobs = db.query(CVBatch).count()
    total_cvs = db.query(CV).count()
    
    # Active sessions (users logged in last 24h)
    recent_threshold = datetime.utcnow() - timedelta(hours=24)
    active_sessions = db.query(User).filter(User.last_login >= recent_threshold).count()
    
    # Login Trends (Last 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    login_data = (
        db.query(
            func.date_trunc('day', Activity.created_at).label('date'),
            func.count(Activity.id).label('count')
        )
        .filter(Activity.activity_type == ActivityType.USER_LOGIN)
        .filter(Activity.created_at >= seven_days_ago)
        .group_by('date')
        .order_by('date')
        .all()
    )
    
    login_trends = [
        LoginTrend(
            date=item.date.strftime('%Y-%m-%d'),
            count=item.count
        ) for item in login_data
    ]

    # Top Pages (Most visited)
    page_data = (
        db.query(
            PageVisit.path,
            func.count(PageVisit.id).label('visits'),
            func.avg(PageVisit.duration_seconds).label('avg_duration')
        )
        .group_by(PageVisit.path)
        .order_by(desc('visits'))
        .limit(10)
        .all()
    )
    
    top_pages = [
        PageStat(
            path=item.path,
            visits=item.visits,
            avg_duration=round(item.avg_duration or 0, 1)
        ) for item in page_data
    ]
    
    return AdminStatsResponse(
        total_users=total_users,
        total_jobs=total_jobs,
        total_cvs=total_cvs,
        active_sessions=active_sessions,
        login_trends=login_trends,
        top_pages=top_pages
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
        jobs_count = db.query(CVBatch).filter(CVBatch.user_id == user.id).count()
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
            cvs_count=cvs_count,
            is_blocked=user.is_blocked,
            can_create_jobs=user.can_create_jobs,
            cv_upload_limit=user.cv_upload_limit
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
    
    jobs = db.query(CVBatch).filter(CVBatch.user_id == user_id).all()
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
            cvs_count=cvs_count,
            is_blocked=user.is_blocked,
            can_create_jobs=user.can_create_jobs,
            cv_upload_limit=user.cv_upload_limit
        ),
        "jobs": jobs
    }


@router.patch("/users/{user_id}/status", response_model=AdminUserResponse)
def update_user_status(
    user_id: UUID,
    status_update: UserStatusUpdate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update user status and permissions."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if status_update.is_blocked is not None:
        user.is_blocked = status_update.is_blocked
    
    if status_update.can_create_jobs is not None:
        user.can_create_jobs = status_update.can_create_jobs
        
    if status_update.cv_upload_limit is not None:
        user.cv_upload_limit = status_update.cv_upload_limit
    
    db.commit()
    db.refresh(user)
    
    # Return enriched response
    jobs_count = db.query(CVBatch).filter(CVBatch.user_id == user.id).count()
    cvs_count = db.query(CV).filter(CV.user_id == user.id).count()
    
    return AdminUserResponse(
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
        cvs_count=cvs_count,
        is_blocked=user.is_blocked,
        can_create_jobs=user.can_create_jobs,
        cv_upload_limit=user.cv_upload_limit
    )


@router.patch("/users/{user_id}/credits", response_model=AdminUserResponse)
def update_user_credits(
    user_id: UUID,
    credits_update: UserCreditsUpdate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update user credits manually."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.credits = credits_update.credits
    
    db.commit()
    db.refresh(user)
    
    # Return enriched response
    jobs_count = db.query(CVBatch).filter(CVBatch.user_id == user.id).count()
    cvs_count = db.query(CV).filter(CV.user_id == user.id).count()
    
    return AdminUserResponse(
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
        cvs_count=cvs_count,
        is_blocked=user.is_blocked,
        can_create_jobs=user.can_create_jobs,
        cv_upload_limit=user.cv_upload_limit
    )


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
            type=activity.activity_type,
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
