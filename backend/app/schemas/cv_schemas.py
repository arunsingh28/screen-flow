"""
Pydantic schemas for CV Processing
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class CVParseDetailResponse(BaseModel):
    """Response for CV parse details"""

    id: str
    cv_id: str
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    current_role: Optional[str] = None
    current_company: Optional[str] = None
    total_experience_years: Optional[float] = None
    career_level: Optional[str] = None
    current_skills_count: int
    outdated_skills_count: int
    github_username: Optional[str] = None
    cv_quality_score: Optional[int] = None
    parsing_confidence: Optional[str] = None
    red_flags_count: int
    parsed_data: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True


class QueueStatusResponse(BaseModel):
    """Response for queue status"""

    batch_id: str
    total_cvs: int
    queued: int
    processing: int
    completed: int
    failed: int
    percentage: float
    estimated_time_seconds: int
    estimated_time_minutes: float


class CVProcessResponse(BaseModel):
    """Response for CV processing initiation"""

    success: bool
    message: str
    batch_id: str
    total_cvs: int
    task_ids: List[str]
