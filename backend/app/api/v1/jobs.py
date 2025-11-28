from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
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
)
from app.api.deps import get_current_user
from app.services.s3_service import s3_service

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
            detail=f"File type {file_ext} not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )


@router.post("/batches", response_model=CVBatchResponse, status_code=status.HTTP_201_CREATED)
async def create_cv_batch(
    batch_data: CVBatchCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new CV batch"""
    new_batch = CVBatch(
        user_id=current_user.id,
        batch_name=batch_data.batch_name,
        tags=batch_data.tags,
    )

    db.add(new_batch)
    db.commit()
    db.refresh(new_batch)

    return CVBatchResponse.from_orm(new_batch)


@router.post("/batches/{batch_id}/upload", response_model=BulkUploadResponse)
async def upload_cvs_to_batch(
    batch_id: UUID,
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload multiple CV files to a batch"""
    # Get batch and verify ownership
    batch = db.query(CVBatch).filter(
        CVBatch.id == batch_id,
        CVBatch.user_id == current_user.id
    ).first()

    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Batch not found"
        )

    uploaded_files = []
    failed_count = 0

    for file in files:
        try:
            # Validate file
            validate_file(file)

            # Generate S3 key
            s3_key = s3_service.generate_s3_key(
                user_id=str(current_user.id),
                file_type="cvs",
                original_filename=file.filename,
                batch_id=str(batch_id)
            )

            # Upload to S3
            upload_result = s3_service.upload_file(
                file_obj=file.file,
                s3_key=s3_key,
                content_type=file.content_type or "application/pdf",
                metadata={
                    "user_id": str(current_user.id),
                    "batch_id": str(batch_id),
                    "original_filename": file.filename,
                }
            )

            # Create CV record
            cv = CV(
                batch_id=batch_id,
                user_id=current_user.id,
                filename=file.filename,
                s3_key=upload_result["s3_key"],
                file_size_bytes=upload_result["file_size"],
                status=CVStatus.QUEUED,
                source=CVSource.MANUAL_UPLOAD,
            )
            db.add(cv)

            uploaded_files.append(FileUploadResponse(
                message="Success",
                cv_id=cv.id,
                filename=file.filename,
                s3_key=upload_result["s3_key"],
                file_size_bytes=upload_result["file_size"],
                status=CVStatus.QUEUED,
            ))

        except Exception as e:
            failed_count += 1
            print(f"Failed to upload {file.filename}: {str(e)}")

    # Update batch statistics
    batch.total_cvs = len(uploaded_files)
    if len(uploaded_files) == len(files):
        batch.status = BatchStatus.COMPLETED
    db.commit()

    return BulkUploadResponse(
        message=f"Successfully uploaded {len(uploaded_files)} CVs",
        batch_id=batch_id,
        batch_name=batch.batch_name,
        uploaded_count=len(uploaded_files),
        failed_count=failed_count,
        files=uploaded_files
    )


@router.get("/batches", response_model=CVBatchListResponse)
async def list_cv_batches(
    page: int = 1,
    page_size: int = 10,
    status: Optional[BatchStatus] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all CV batches for the current user"""
    query = db.query(CVBatch).filter(CVBatch.user_id == current_user.id)

    # Filter by status if provided
    if status:
        query = query.filter(CVBatch.status == status)

    # Get total count
    total = query.count()

    # Paginate
    batches = query.order_by(CVBatch.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return CVBatchListResponse(
        batches=[CVBatchResponse.from_orm(batch) for batch in batches],
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/batches/{batch_id}", response_model=CVDetailResponse)
async def get_cv_batch(
    batch_id: UUID,
    include_download_urls: bool = True,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific CV batch with all CVs"""
    batch = db.query(CVBatch).filter(
        CVBatch.id == batch_id,
        CVBatch.user_id == current_user.id
    ).first()

    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Batch not found"
        )

    # Convert to response and add presigned URLs
    response = CVDetailResponse.from_orm(batch)

    if include_download_urls:
        for cv in response.cvs:
            try:
                cv.download_url = s3_service.generate_presigned_url(
                    s3_key=cv.s3_key,
                    filename=cv.filename
                )
            except Exception as e:
                print(f"Failed to generate presigned URL for {cv.filename}: {str(e)}")
                cv.download_url = None

    return response


@router.get("/cvs/{cv_id}/download-url")
async def get_cv_download_url(
    cv_id: UUID,
    expiration: int = 3600,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get presigned URL for downloading a CV"""
    cv = db.query(CV).filter(
        CV.id == cv_id,
        CV.user_id == current_user.id
    ).first()

    if not cv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CV not found"
        )

    try:
        download_url = s3_service.generate_presigned_url(
            s3_key=cv.s3_key,
            expiration=expiration,
            filename=cv.filename
        )

        return {
            "download_url": download_url,
            "expires_in": expiration,
            "filename": cv.filename
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate download URL: {str(e)}"
        )


@router.delete("/batches/{batch_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_cv_batch(
    batch_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a CV batch and all associated CVs"""
    batch = db.query(CVBatch).filter(
        CVBatch.id == batch_id,
        CVBatch.user_id == current_user.id
    ).first()

    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Batch not found"
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

    return None


@router.delete("/cvs/{cv_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_cv(
    cv_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a single CV"""
    cv = db.query(CV).filter(
        CV.id == cv_id,
        CV.user_id == current_user.id
    ).first()

    if not cv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CV not found"
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

    return None
