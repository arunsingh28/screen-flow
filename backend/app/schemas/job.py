from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from app.models.job import JobStatus, CVStatus


# CV Schemas
class CVBase(BaseModel):
    file_name: str
    file_size: int


class CVCreate(CVBase):
    job_id: int


class CVResponse(CVBase):
    id: int
    job_id: int
    user_id: int
    file_path: str
    status: CVStatus
    error_message: Optional[str] = None
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    created_at: datetime
    processed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Job Schemas
class JobBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    department: Optional[str] = Field(None, max_length=100)
    location: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None


class JobCreate(JobBase):
    """Schema for creating a new job"""
    pass


class JobUpdate(BaseModel):
    """Schema for updating a job"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    department: Optional[str] = Field(None, max_length=100)
    location: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    status: Optional[JobStatus] = None


class JobResponse(JobBase):
    """Schema for job response"""
    id: int
    user_id: int
    status: JobStatus
    candidate_count: int
    high_match_count: int
    jd_file_name: Optional[str] = None
    jd_file_size: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class JobDetailResponse(JobResponse):
    """Schema for detailed job response with CVs"""
    cvs: List[CVResponse] = []

    class Config:
        from_attributes = True


class JobListResponse(BaseModel):
    """Schema for paginated job list"""
    jobs: List[JobResponse]
    total: int
    page: int
    page_size: int


class FileUploadResponse(BaseModel):
    """Schema for file upload response"""
    message: str
    file_name: str
    file_size: int
    file_path: str


class BulkUploadResponse(BaseModel):
    """Schema for bulk CV upload response"""
    message: str
    job_id: int
    uploaded_count: int
    failed_count: int
    files: List[FileUploadResponse]
