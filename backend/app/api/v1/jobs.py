from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import shutil
from pathlib import Path

from app.database import get_db
from app.models.user import User
from app.models.job import Job, CV, JobStatus, CVStatus
from app.schemas.job import (
    JobCreate,
    JobUpdate,
    JobResponse,
    JobDetailResponse,
    JobListResponse,
    BulkUploadResponse,
    FileUploadResponse,
)
from app.api.deps import get_current_user

router = APIRouter()

# File upload settings
UPLOAD_DIR = Path("/tmp/screenflow/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx"}


def save_uploaded_file(file: UploadFile, user_id: int, job_id: int, file_type: str = "cv") -> dict:
    """Save uploaded file and return file info"""
    # Check file extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type {file_ext} not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Create user directory
    user_dir = UPLOAD_DIR / f"user_{user_id}" / f"job_{job_id}" / file_type
    user_dir.mkdir(parents=True, exist_ok=True)

    # Generate unique filename
    file_path = user_dir / file.filename
    counter = 1
    while file_path.exists():
        stem = Path(file.filename).stem
        file_path = user_dir / f"{stem}_{counter}{file_ext}"
        counter += 1

    # Save file
    try:
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    finally:
        file.file.close()

    return {
        "file_name": file.filename,
        "file_path": str(file_path),
        "file_size": file_path.stat().st_size,
    }


@router.post("/", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def create_job(
    job_data: JobCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new job"""
    new_job = Job(
        user_id=current_user.id,
        title=job_data.title,
        department=job_data.department,
        location=job_data.location,
        description=job_data.description,
        status=JobStatus.DRAFT,
    )

    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    return JobResponse.from_orm(new_job)


@router.post("/{job_id}/upload-jd", response_model=FileUploadResponse)
async def upload_job_description(
    job_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload Job Description file for a job"""
    # Get job and verify ownership
    job = db.query(Job).filter(Job.id == job_id, Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    # Save file
    file_info = save_uploaded_file(file, current_user.id, job_id, "jd")

    # Update job with JD info
    job.jd_file_name = file_info["file_name"]
    job.jd_file_path = file_info["file_path"]
    job.jd_file_size = file_info["file_size"]

    db.commit()

    return FileUploadResponse(
        message="Job description uploaded successfully",
        **file_info
    )


@router.post("/{job_id}/upload-cvs", response_model=BulkUploadResponse)
async def upload_cvs(
    job_id: int,
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload multiple CV files for a job"""
    # Get job and verify ownership
    job = db.query(Job).filter(Job.id == job_id, Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    uploaded_files = []
    failed_count = 0

    for file in files:
        try:
            # Save file
            file_info = save_uploaded_file(file, current_user.id, job_id, "cv")

            # Create CV record
            cv = CV(
                job_id=job_id,
                user_id=current_user.id,
                file_name=file_info["file_name"],
                file_path=file_info["file_path"],
                file_size=file_info["file_size"],
                status=CVStatus.QUEUED,
            )
            db.add(cv)

            uploaded_files.append(FileUploadResponse(
                message="Success",
                **file_info
            ))

        except Exception as e:
            failed_count += 1
            print(f"Failed to upload {file.filename}: {str(e)}")

    # Update job candidate count
    job.candidate_count = len(uploaded_files)
    db.commit()

    return BulkUploadResponse(
        message=f"Successfully uploaded {len(uploaded_files)} CVs",
        job_id=job_id,
        uploaded_count=len(uploaded_files),
        failed_count=failed_count,
        files=uploaded_files
    )


@router.get("/", response_model=JobListResponse)
async def list_jobs(
    page: int = 1,
    page_size: int = 10,
    status: Optional[JobStatus] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all jobs for the current user"""
    query = db.query(Job).filter(Job.user_id == current_user.id)

    # Filter by status if provided
    if status:
        query = query.filter(Job.status == status)

    # Get total count
    total = query.count()

    # Paginate
    jobs = query.order_by(Job.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return JobListResponse(
        jobs=[JobResponse.from_orm(job) for job in jobs],
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{job_id}", response_model=JobDetailResponse)
async def get_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific job with all CVs"""
    job = db.query(Job).filter(Job.id == job_id, Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    return JobDetailResponse.from_orm(job)


@router.put("/{job_id}", response_model=JobResponse)
async def update_job(
    job_id: int,
    job_data: JobUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a job"""
    job = db.query(Job).filter(Job.id == job_id, Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    # Update fields
    update_data = job_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(job, field, value)

    db.commit()
    db.refresh(job)

    return JobResponse.from_orm(job)


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a job and all associated CVs"""
    job = db.query(Job).filter(Job.id == job_id, Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    # Delete job (CVs will be deleted due to cascade)
    db.delete(job)
    db.commit()

    return None
