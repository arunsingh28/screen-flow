from pydantic import BaseModel, Field, UUID4
from datetime import datetime
from typing import Optional, List
from app.models.job import BatchStatus, CVStatus, CVSource, SearchStatus


# CV Batch Schemas (Job Schemas)
class CVBatchCreate(BaseModel):
    """Schema for creating a Job (CV Batch)"""

    title: str = Field(..., min_length=1, max_length=200)
    department: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    job_description_text: Optional[str] = None
    tags: List[str] = Field(default_factory=list)


class CVBatchResponse(BaseModel):
    """Schema for Job response"""

    id: UUID4
    user_id: UUID4
    title: str
    department: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    job_description_text: Optional[str] = None
    is_active: bool
    is_archived: bool
    tags: List[str]
    total_cvs: int
    processed_cvs: int
    failed_cvs: int
    status: BatchStatus
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# S3 Direct Upload Schemas
class CVUploadRequest(BaseModel):
    """Request schema for getting a presigned URL"""

    filename: str
    content_type: str = "application/pdf"
    file_size_bytes: int


class CVUploadResponse(BaseModel):
    """Response schema with presigned URL"""

    cv_id: UUID4
    presigned_url: str
    s3_key: str


class CVUploadConfirmation(BaseModel):
    """Confirmation schema after S3 upload"""

    cv_id: UUID4
    status: CVStatus = CVStatus.QUEUED


# CV Schemas
class CVResponse(BaseModel):
    """Schema for CV response"""

    id: UUID4
    batch_id: UUID4
    user_id: UUID4
    filename: str
    s3_key: str
    file_size_bytes: int
    parsed_text: Optional[str] = None
    status: CVStatus
    error_message: Optional[str] = None
    source: CVSource
    created_at: datetime
    processed_at: Optional[datetime] = None
    download_url: Optional[str] = None  # Presigned URL (not stored in DB)
    job_id: Optional[UUID4] = Field(
        None, alias="batch_id"
    )  # Alias batch_id to job_id for frontend clarity
    job_title: Optional[str] = None

    class Config:
        from_attributes = True


class CVDetailResponse(CVBatchResponse):
    """Schema for Job with all CVs"""

    cvs: List[CVResponse] = []

    class Config:
        from_attributes = True


# Job Search Schemas
class JobSearchCreate(BaseModel):
    """Schema for creating a job search"""

    job_description: str = Field(..., min_length=50)
    top_k: int = Field(default=10, ge=1, le=100)
    filters: Optional[dict] = None


class SearchResultResponse(BaseModel):
    """Schema for search result"""

    id: UUID4
    search_id: UUID4
    cv_id: UUID4
    rank: int
    score: int
    matched_skills: List[str]
    missing_skills: List[str]
    reasoning: Optional[str] = None
    created_at: datetime
    cv: Optional[CVResponse] = None  # Include CV details

    class Config:
        from_attributes = True


class JobSearchResponse(BaseModel):
    """Schema for job search response"""

    id: UUID4
    user_id: UUID4
    job_description: str
    top_k: int
    filters: Optional[dict] = None
    status: SearchStatus
    total_analyzed: int
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class JobSearchDetailResponse(JobSearchResponse):
    """Schema for job search with results"""

    results: List[SearchResultResponse] = []

    class Config:
        from_attributes = True


# File Upload Schemas
class FileUploadResponse(BaseModel):
    """Schema for file upload response"""

    message: str
    cv_id: UUID4
    filename: str
    s3_key: str
    file_size_bytes: int
    status: CVStatus


class BulkUploadResponse(BaseModel):
    """Schema for bulk CV upload response"""

    message: str
    batch_id: UUID4
    batch_name: str
    uploaded_count: int
    failed_count: int
    files: List[FileUploadResponse]


# List Responses
class CVBatchListResponse(BaseModel):
    """Schema for paginated CV batch list"""

    batches: List[CVBatchResponse]
    total: int
    page: int
    page_size: int


class CVListResponse(BaseModel):
    """Schema for paginated CV list"""

    items: List[CVResponse]
    total: int
    page: int
    page_size: int


class JobSearchListResponse(BaseModel):
    """Schema for paginated job search list"""

    searches: List[JobSearchResponse]
    total: int
    page: int
    page_size: int


class CVBulkDeleteRequest(BaseModel):
    """Schema for bulk CV deletion"""

    cv_ids: List[UUID4]


class DashboardStatsResponse(BaseModel):
    """Schema for dashboard statistics"""

    total_cvs: int
    total_searches: int
    high_matches: int
    success_rate: float
    processing: int


class DailyStats(BaseModel):
    """Schema for daily activity stats"""

    date: str
    uploads: int
    searches: int


class StatsHistoryResponse(BaseModel):
    """Schema for historical stats response"""

    history: List[DailyStats]
