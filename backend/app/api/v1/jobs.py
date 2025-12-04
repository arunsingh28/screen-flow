from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request, Response
from sqlalchemy.orm import Session
from typing import List, Optional
from pathlib import Path
from uuid import UUID

from app.database import get_db
from app.models.user import User
from app.models.job import CVBatch, CV, BatchStatus, CVStatus, CVSource
from app.schemas.job import (
    CVBatchCreate,
    CVBatchResponse,
    CVDetailResponse,
    CVBatchListResponse,
    CVResponse,
    BulkUploadResponse,
    FileUploadResponse,
    CVUploadRequest,
    CVUploadResponse,
    CVUploadConfirmation,
    CVUploadConfirmation,
    CVUploadConfirmation,
    CVBulkDeleteRequest,
    DashboardStatsResponse,
    StatsHistoryResponse,
    DailyStats,
)
from app.models.activity import Activity
from app.models.job import JobSearch, SearchResult
from app.models.credit_transaction import CreditTransaction, TransactionType
from pydantic import BaseModel
from datetime import datetime
from app.api.deps import get_current_user
from app.services.s3_service import s3_service
from app.core.cache import cache_service
from app.core.rate_limit import limiter, RateLimits


class ActivityResponse(BaseModel):
    id: UUID
    user_id: UUID
    job_id: Optional[UUID]
    cv_id: Optional[UUID]
    activity_type: str
    description: str
    created_at: datetime

    class Config:
        from_attributes = True


router = APIRouter()

# File upload settings
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx"}


def validate_file(file: UploadFile) -> None:
    """Validate uploaded file"""
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type {file_ext} not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}",
        )


def deduct_credits(user: User, amount: int, description: str, db: Session):
    """Deduct credits from user and record transaction"""
    if user.credits < amount:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Insufficient credits. Required: {amount}, Available: {user.credits}",
        )

    new_balance = user.credits - amount

    # Create transaction
    transaction = CreditTransaction(
        user_id=user.id,
        type=TransactionType.USAGE,
        amount=-amount,  # Negative for usage
        description=description,
        balance_after=new_balance,
    )

    # Update user balance
    user.credits = new_balance

    db.add(transaction)
    db.add(user)
    # Note: We don't commit here, we let the caller commit to ensure atomicity with the main action


@router.post(
    "/batches", response_model=CVBatchResponse, status_code=status.HTTP_201_CREATED
)
@limiter.limit(RateLimits.JOB_CREATE)
async def create_cv_batch(
    request: Request,
    response: Response,
    batch_data: CVBatchCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new Job (CV batch)"""
    # Check permissions
    if not current_user.can_create_jobs:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to create jobs.",
        )

    # Deduct 1 credit for job creation
    deduct_credits(current_user, 1, f"Job Creation: {batch_data.title}", db)

    new_batch = CVBatch(
        user_id=current_user.id,
        title=batch_data.title,
        department=batch_data.department,
        location=batch_data.location,
        description=batch_data.description,
        job_description_text=batch_data.job_description_text,
        tags=batch_data.tags,
        employment_type=batch_data.employment_type,
        seniority_level=batch_data.seniority_level,
        experience_range=batch_data.experience_range,
        company_type=batch_data.company_type,
        industry=batch_data.industry,
        prior_roles=batch_data.prior_roles,
    )

    db.add(new_batch)
    db.commit()
    db.refresh(new_batch)

    # Log Activity
    from app.models.activity import Activity, ActivityType

    activity = Activity(
        user_id=current_user.id,
        job_id=new_batch.id,
        activity_type=ActivityType.JOB_CREATED,
        description=f"Created job: {new_batch.title}",
    )
    db.add(activity)
    db.commit()

    # Invalidate caches
    await cache_service.delete_pattern(f"cache:{current_user.id}:list_cv_batches:*")
    await cache_service.delete_pattern(f"cache:{current_user.id}:get_dashboard_stats:*")
    await cache_service.delete_pattern(f"cache:{current_user.id}:get_stats_history:*")
    await cache_service.delete_pattern(f"cache:{current_user.id}:get_activities:*")

    return CVBatchResponse.from_orm(new_batch)


@router.post("/batches/{batch_id}/upload-request", response_model=CVUploadResponse)
@limiter.limit(RateLimits.CV_UPLOAD)
async def request_cv_upload(
    request: Request,
    response: Response,
    batch_id: UUID,
    upload_request: CVUploadRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Request a presigned URL for direct S3 upload"""
    batch = (
        db.query(CVBatch)
        .filter(CVBatch.id == batch_id, CVBatch.user_id == current_user.id)
        .first()
    )

    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Job not found"
        )

    # Check upload limit
    # Count current CVs in batch (including those currently uploading/queued)
    current_cv_count = db.query(CV).filter(CV.batch_id == batch_id).count()
    if current_cv_count >= current_user.cv_upload_limit:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Upload limit reached. You can only upload {current_user.cv_upload_limit} CVs per job.",
        )

    # Generate S3 key
    s3_key = s3_service.generate_s3_key(
        user_id=str(current_user.id),
        file_type="cvs",
        original_filename=upload_request.filename,
        batch_id=str(batch_id),
    )

    # Generate Presigned URL
    try:
        presigned_url = s3_service.generate_presigned_url(
            s3_key=s3_key,
            filename=upload_request.filename,
            expiration=3600,
            client_method="put_object",
            content_type=upload_request.content_type,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate upload URL: {str(e)}",
        )

    # Create CV record (Status: UPLOADING)
    # Note: We don't increment batch.total_cvs yet, only on confirmation
    cv = CV(
        batch_id=batch_id,
        user_id=current_user.id,
        filename=upload_request.filename,
        s3_key=s3_key,
        file_size_bytes=upload_request.file_size_bytes,
        status=CVStatus.QUEUED,  # Setting to QUEUED immediately for simplicity, or add UPLOADING status
        source=CVSource.MANUAL_UPLOAD,
    )

    # Check if we need to add UPLOADING to CVStatus enum.
    # For now, let's use QUEUED but maybe we should add a new status if strict tracking is needed.
    # Given the user wants "processing ... disable state", QUEUED is fine as initial state.

    db.add(cv)
    db.commit()
    db.refresh(cv)

    return CVUploadResponse(cv_id=cv.id, presigned_url=presigned_url, s3_key=s3_key)


@router.post("/batches/{batch_id}/upload-complete", response_model=CVUploadConfirmation)
async def confirm_cv_upload(
    batch_id: UUID,
    confirmation: CVUploadConfirmation,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Confirm that a CV has been uploaded to S3"""
    cv = (
        db.query(CV)
        .filter(
            CV.id == confirmation.cv_id,
            CV.batch_id == batch_id,
            CV.user_id == current_user.id,
        )
        .first()
    )

    if not cv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="CV record not found"
        )

    # Deduct 2 credits for CV upload
    deduct_credits(current_user, 2, f"CV Upload: {cv.filename}", db)

    # Update status (e.g. trigger processing queue here if using async worker)
    # For now, we just confirm it's queued for processing
    cv.status = CVStatus.QUEUED

    # Update batch stats
    batch = cv.batch
    batch.total_cvs += 1

    # Log Activity
    from app.models.activity import Activity, ActivityType

    activity = Activity(
        user_id=current_user.id,
        job_id=batch_id,
        cv_id=cv.id,
        activity_type=ActivityType.CV_UPLOADED,
        description=f"Uploaded CV: {cv.filename}",
    )
    db.add(activity)

    db.commit()

    # Invalidate caches
    await cache_service.delete_pattern(f"cache:{current_user.id}:get_cv_batch:*")
    await cache_service.delete_pattern(f"cache:{current_user.id}:list_cv_batches:*")
    await cache_service.delete_pattern(f"cache:{current_user.id}:get_dashboard_stats:*")
    await cache_service.delete_pattern(f"cache:{current_user.id}:get_stats_history:*")
    await cache_service.delete_pattern(f"cache:{current_user.id}:list_all_cvs:*")
    await cache_service.delete_pattern(f"cache:{current_user.id}:get_activities:*")

    return CVUploadConfirmation(cv_id=cv.id, status=cv.status)


@router.get("/activities", response_model=List[ActivityResponse])
@cache_service.cache_response(ttl=60)
async def get_activities(
    skip: int = 0,
    limit: int = 50,
    request: Request = None,
    response: Response = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get recent activities for the current user"""
    from app.models.activity import ActivityType

    activities = (
        db.query(Activity)
        .filter(
            Activity.user_id == current_user.id,
            Activity.activity_type.notin_(
                [ActivityType.USER_LOGIN, ActivityType.USER_LOGOUT]
            ),
        )
        .order_by(Activity.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return [ActivityResponse.from_orm(a) for a in activities]


@router.get("/stats", response_model=DashboardStatsResponse)
@cache_service.cache_response(ttl=300)
async def get_dashboard_stats(
    request: Request = None,
    response: Response = None,
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Get dashboard statistics"""
    # Total CVs
    total_cvs = db.query(CV).filter(CV.user_id == current_user.id).count()

    # Total Searches
    total_searches = (
        db.query(JobSearch).filter(JobSearch.user_id == current_user.id).count()
    )

    # High Matches (score >= 80)
    # We need to join with JobSearch to ensure we only count results for this user's searches
    high_matches = (
        db.query(SearchResult)
        .join(JobSearch)
        .filter(JobSearch.user_id == current_user.id, SearchResult.score >= 80)
        .count()
    )

    # Processing (CVs in QUEUED or PROCESSING status)
    processing = (
        db.query(CV)
        .filter(
            CV.user_id == current_user.id,
            CV.status.in_([CVStatus.QUEUED, CVStatus.PROCESSING]),
        )
        .count()
    )

    # Success Rate (High Matches / Total Analyzed CVs in Searches) * 100
    # Or maybe (High Matches / Total Searches) if that makes more sense?
    # Let's stick to High Matches / Total Results for now as a proxy for "Quality Candidate Rate"
    total_results = (
        db.query(SearchResult)
        .join(JobSearch)
        .filter(JobSearch.user_id == current_user.id)
        .count()
    )

    success_rate = 0.0
    if total_results > 0:
        success_rate = round((high_matches / total_results) * 100, 1)

    return DashboardStatsResponse(
        total_cvs=total_cvs,
        total_searches=total_searches,
        high_matches=high_matches,
        success_rate=success_rate,
        processing=processing,
    )


@router.get("/stats/history", response_model=StatsHistoryResponse)
@cache_service.cache_response(ttl=300)
async def get_stats_history(
    days: int = 30,
    request: Request = None,
    response: Response = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get historical activity stats for charts"""
    from sqlalchemy import func, cast, Date
    from datetime import timedelta, date

    # Calculate date range
    end_date = date.today()
    start_date = end_date - timedelta(days=days)

    # Query Activity table
    # Group by date and activity_type
    # We are looking for JOB_CREATED (searches/jobs) and CV_UPLOADED (uploads)

    # Note: ActivityType.JOB_CREATED is used for "Job Batches" which we treat as searches/jobs here
    # ActivityType.CV_UPLOADED is for CVs

    results = (
        db.query(
            cast(Activity.created_at, Date).label("date"),
            Activity.activity_type,
            func.count(Activity.id).label("count"),
        )
        .filter(Activity.user_id == current_user.id, Activity.created_at >= start_date)
        .group_by(cast(Activity.created_at, Date), Activity.activity_type)
        .all()
    )

    # Process results into a dictionary keyed by date
    stats_by_date = {}

    # Initialize all dates with 0
    current_date = start_date
    while current_date <= end_date:
        date_str = current_date.isoformat()
        stats_by_date[date_str] = {"uploads": 0, "searches": 0}
        current_date += timedelta(days=1)

    # Fill with data
    from app.models.activity import ActivityType

    for r in results:
        date_str = r.date.isoformat()
        if date_str in stats_by_date:
            if r.activity_type == ActivityType.CV_UPLOADED:
                stats_by_date[date_str]["uploads"] += r.count
            elif r.activity_type == ActivityType.JOB_CREATED:
                stats_by_date[date_str]["searches"] += r.count

    # Convert to list
    history = [
        DailyStats(date=d, uploads=s["uploads"], searches=s["searches"])
        for d, s in stats_by_date.items()
    ]

    # Sort by date
    history.sort(key=lambda x: x.date)

    return StatsHistoryResponse(history=history)


@router.get("/batches", response_model=CVBatchListResponse)
@cache_service.cache_response(ttl=60)
async def list_cv_batches(
    page: int = 1,
    page_size: int = 10,
    status: Optional[BatchStatus] = None,
    is_archived: bool = False,
    request: Request = None,
    response: Response = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all CV batches for the current user"""
    query = db.query(CVBatch).filter(
        CVBatch.user_id == current_user.id, CVBatch.is_archived == is_archived
    )

    # Filter by status if provided
    if status:
        query = query.filter(CVBatch.status == status)

    # Get total count
    total = query.count()

    # Paginate
    batches = (
        query.order_by(CVBatch.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    # Create response with dynamic CV counts
    batch_responses = []
    for batch in batches:
        response = CVBatchResponse.from_orm(batch)
        # Dynamically count CVs to ensure accuracy
        response.total_cvs = len(batch.cvs)
        batch_responses.append(response)

    return CVBatchListResponse(
        batches=batch_responses, total=total, page=page, page_size=page_size
    )


@router.get("/batches/{batch_id}", response_model=CVDetailResponse)
@cache_service.cache_response(ttl=60)
async def get_cv_batch(
    batch_id: UUID,
    include_download_urls: bool = True,
    request: Request = None,
    response: Response = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific CV batch with all CVs"""
    batch = (
        db.query(CVBatch)
        .filter(CVBatch.id == batch_id, CVBatch.user_id == current_user.id)
        .first()
    )

    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found"
        )

    # Convert to response and add presigned URLs
    response = CVDetailResponse.from_orm(batch)

    if include_download_urls:
        for cv in response.cvs:
            try:
                cv.download_url = s3_service.generate_presigned_url(
                    s3_key=cv.s3_key, filename=cv.filename
                )
            except Exception as e:
                print(f"Failed to generate presigned URL for {cv.filename}: {str(e)}")
                cv.download_url = None

    return response


class BatchStatusUpdate(BaseModel):
    is_active: bool


@router.patch("/batches/{batch_id}/status", response_model=CVBatchResponse)
async def update_batch_status(
    batch_id: UUID,
    status_update: BatchStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update batch active status (Close/Reopen job)"""
    batch = (
        db.query(CVBatch)
        .filter(CVBatch.id == batch_id, CVBatch.user_id == current_user.id)
        .first()
    )

    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found"
        )

    batch.is_active = status_update.is_active
    db.commit()
    db.refresh(batch)

    # Log Activity
    from app.models.activity import Activity, ActivityType

    activity = Activity(
        user_id=current_user.id,
        job_id=batch.id,
        activity_type=ActivityType.JOB_CREATED,  # Reusing JOB_CREATED or we could add JOB_UPDATED
        description=f"{'Opened' if batch.is_active else 'Closed'} job: {batch.title}",
    )
    db.add(activity)
    db.commit()

    # Invalidate caches
    await cache_service.delete_pattern(f"cache:{current_user.id}:get_cv_batch:*")
    await cache_service.delete_pattern(f"cache:{current_user.id}:list_cv_batches:*")
    await cache_service.delete_pattern(f"cache:{current_user.id}:get_activities:*")

    return CVBatchResponse.from_orm(batch)


class BatchArchiveUpdate(BaseModel):
    is_archived: bool


@router.patch("/batches/{batch_id}/archive", response_model=CVBatchResponse)
async def archive_batch(
    batch_id: UUID,
    archive_update: BatchArchiveUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Archive or unarchive a batch"""
    batch = (
        db.query(CVBatch)
        .filter(CVBatch.id == batch_id, CVBatch.user_id == current_user.id)
        .first()
    )

    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found"
        )

    batch.is_archived = archive_update.is_archived
    db.commit()
    db.refresh(batch)

    # Log Activity
    from app.models.activity import Activity, ActivityType

    activity = Activity(
        user_id=current_user.id,
        job_id=batch.id,
        activity_type=ActivityType.JOB_CREATED,
        description=f"{'Archived' if batch.is_archived else 'Unarchived'} job: {batch.title}",
    )
    db.add(activity)
    db.commit()

    # Invalidate caches
    await cache_service.delete_pattern(f"cache:{current_user.id}:get_cv_batch:*")
    await cache_service.delete_pattern(f"cache:{current_user.id}:list_cv_batches:*")
    await cache_service.delete_pattern(f"cache:{current_user.id}:get_activities:*")

    return CVBatchResponse.from_orm(batch)


@router.get("/cvs/{cv_id}/download-url")
async def get_cv_download_url(
    cv_id: UUID,
    expiration: int = 3600,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get presigned URL for downloading a CV"""
    cv = db.query(CV).filter(CV.id == cv_id, CV.user_id == current_user.id).first()

    if not cv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="CV not found"
        )

    try:
        download_url = s3_service.generate_presigned_url(
            s3_key=cv.s3_key, expiration=expiration, filename=cv.filename
        )

        return {
            "download_url": download_url,
            "expires_in": expiration,
            "filename": cv.filename,
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate download URL: {str(e)}",
        )


@router.delete("/batches/{batch_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_cv_batch(
    batch_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a CV batch and all associated CVs"""
    batch = (
        db.query(CVBatch)
        .filter(CVBatch.id == batch_id, CVBatch.user_id == current_user.id)
        .first()
    )

    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found"
        )

    # Get all S3 keys for deletion
    s3_keys = [cv.s3_key for cv in batch.cvs]

    # Delete from S3
    if s3_keys:
        try:
            s3_service.delete_files(s3_keys)
        except Exception as e:
            print(f"Failed to delete files from S3: {str(e)}")
            # Continue with database deletion even if S3 deletion fails

    # Delete batch (CVs will be deleted due to cascade)
    db.delete(batch)
    db.commit()

    # Invalidate caches
    await cache_service.delete_pattern(f"cache:{current_user.id}:list_cv_batches:*")
    await cache_service.delete_pattern(f"cache:{current_user.id}:get_dashboard_stats:*")
    await cache_service.delete_pattern(f"cache:{current_user.id}:list_all_cvs:*")
    await cache_service.delete_pattern(f"cache:{current_user.id}:get_activities:*")

    return None


@router.delete("/cvs/{cv_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_cv(
    cv_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a single CV"""
    cv = db.query(CV).filter(CV.id == cv_id, CV.user_id == current_user.id).first()

    if not cv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="CV not found"
        )

    # Delete from S3
    try:
        s3_service.delete_file(cv.s3_key)
    except Exception as e:
        print(f"Failed to delete file from S3: {str(e)}")

    # Update batch statistics
    batch = cv.batch
    if batch:
        batch.total_cvs = max(0, batch.total_cvs - 1)

    # Delete CV
    db.delete(cv)
    db.commit()

    # Invalidate caches
    await cache_service.delete_pattern(f"cache:{current_user.id}:get_cv_batch:*")
    await cache_service.delete_pattern(f"cache:{current_user.id}:list_cv_batches:*")
    await cache_service.delete_pattern(f"cache:{current_user.id}:get_dashboard_stats:*")
    await cache_service.delete_pattern(f"cache:{current_user.id}:list_all_cvs:*")
    await cache_service.delete_pattern(f"cache:{current_user.id}:get_activities:*")

    return None


@router.post("/cvs/bulk-delete", status_code=status.HTTP_204_NO_CONTENT)
async def bulk_delete_cvs(
    delete_request: CVBulkDeleteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Bulk delete CVs"""
    if not delete_request.cv_ids:
        return None

    # Get CVs to delete (ensure they belong to user)
    cvs = (
        db.query(CV)
        .filter(CV.id.in_(delete_request.cv_ids), CV.user_id == current_user.id)
        .all()
    )

    if not cvs:
        return None

    # Get S3 keys
    s3_keys = [cv.s3_key for cv in cvs if cv.s3_key]

    # Delete from S3
    if s3_keys:
        try:
            s3_service.delete_files(s3_keys)
        except Exception as e:
            print(f"Failed to delete files from S3: {str(e)}")
            # Continue with DB deletion

    # Group by batch to update stats
    batch_updates = {}
    for cv in cvs:
        if cv.batch_id not in batch_updates:
            batch_updates[cv.batch_id] = 0
        batch_updates[cv.batch_id] += 1

    # Update batch stats
    for batch_id, count in batch_updates.items():
        batch = db.query(CVBatch).get(batch_id)
        if batch:
            batch.total_cvs = max(0, batch.total_cvs - count)

    # Log Activity
    from app.models.activity import Activity, ActivityType

    activity = Activity(
        user_id=current_user.id,
        activity_type=ActivityType.CV_FAILED,  # Using CV_FAILED as generic 'removed' or add new type
        description=f"Deleted {len(cvs)} CVs",
    )
    # Note: ActivityType might need a DELETE type, but for now using generic description
    db.add(activity)

    # Delete related activities first to avoid FK violation
    # Note: We need to import Activity model inside function or at top if not circular
    from app.models.activity import Activity

    # Delete activities referencing these CVs
    db.query(Activity).filter(Activity.cv_id.in_(delete_request.cv_ids)).delete(
        synchronize_session=False
    )

    # Delete from DB
    for cv in cvs:
        db.delete(cv)

    db.commit()

    # Invalidate caches
    await cache_service.delete_pattern(f"cache:{current_user.id}:get_cv_batch:*")
    await cache_service.delete_pattern(f"cache:{current_user.id}:list_cv_batches:*")
    await cache_service.delete_pattern(f"cache:{current_user.id}:get_dashboard_stats:*")
    await cache_service.delete_pattern(f"cache:{current_user.id}:list_all_cvs:*")
    await cache_service.delete_pattern(f"cache:{current_user.id}:get_activities:*")

    return None


@router.get("/cvs/{cv_id}/download-url")
async def get_cv_download_url(
    cv_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get presigned URL for downloading CV"""
    cv = db.query(CV).filter(CV.id == cv_id, CV.user_id == current_user.id).first()

    if not cv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="CV not found"
        )

    try:
        url = s3_service.generate_presigned_url(
            s3_key=cv.s3_key,
            client_method="get_object",
            filename=cv.filename,
            expiration=3600,
        )
        return {"url": url}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate download URL: {str(e)}",
        )


from app.schemas.job import CVListResponse


@router.get("/cvs", response_model=CVListResponse)
@cache_service.cache_response(ttl=60)
async def list_all_cvs(
    page: int = 1,
    page_size: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all CVs for the current user across all batches with pagination"""
    query = db.query(CV).filter(CV.user_id == current_user.id)

    # Get total count
    total = query.count()

    # Paginate
    cvs = (
        query.order_by(CV.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    # Populate job_title from the associated batch
    for cv in cvs:
        if cv.batch:
            cv.job_title = cv.batch.title

    return CVListResponse(items=cvs, total=total, page=page, page_size=page_size)


class CVStatusUpdate(BaseModel):
    status: str


@router.patch("/cvs/{cv_id}/status")
async def update_cv_status(
    cv_id: UUID,
    status_update: CVStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update CV status (e.g. shortlisted, rejected)"""
    cv = db.query(CV).filter(CV.id == cv_id, CV.user_id == current_user.id).first()

    if not cv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="CV not found"
        )

    try:
        cv.status = status_update.status
        db.commit()
    except Exception as e:
        db.rollback()
        # Try to handle Enum error by altering type (hacky but useful for dev)
        if "invalid input value for enum" in str(e):
            try:
                from sqlalchemy import text

                # Note: This syntax might vary based on Postgres version, but usually ADD VALUE works
                # We need to run this outside of transaction block usually, but let's try
                # db.connection().connection.set_isolation_level(0) # AUTOCOMMIT
                db.execute(
                    text(
                        f"ALTER TYPE cvstatus ADD VALUE '{status_update.status}' IF NOT EXISTS"
                    )
                )
                db.commit()

                # Re-fetch and update
                cv.status = status_update.status
                db.commit()
            except Exception as ex:
                print(f"Failed to alter enum: {ex}")
                raise HTTPException(
                    status_code=500, detail=f"Failed to update status: {str(e)}"
                )
        else:
            raise HTTPException(
                status_code=500, detail=f"Failed to update status: {str(e)}"
            )

    return {"status": "success", "cv_id": str(cv.id), "new_status": cv.status}
