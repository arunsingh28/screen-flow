"""
Pydantic schemas for JD Builder
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime


class JDBuilderInput(BaseModel):
    """Input for JD Builder form"""

    job_title: str = Field(..., description="Job title")
    department: Optional[str] = Field(None, description="Department")
    employment_type: Optional[str] = Field(None, description="Employment type")
    location: Optional[str] = Field(None, description="Location")
    seniority_level: Optional[str] = Field(None, description="Seniority level")
    min_years_experience: Optional[int] = Field(None, ge=0, description="Minimum years")
    max_years_experience: Optional[int] = Field(None, ge=0, description="Maximum years")
    company_type: Optional[str] = Field(None, description="Company type")
    industry: Optional[str] = Field(None, description="Industry")
    prior_roles: Optional[str] = Field(None, description="Prior role titles")


class JDUploadInput(BaseModel):
    """Input for uploading existing JD"""

    jd_text: str = Field(..., description="Raw JD text")


class JDRefinementInput(BaseModel):
    """Input for refining JD with missing fields"""

    jd_id: str = Field(..., description="JD UUID")
    provided_fields: Dict[str, Any] = Field(..., description="User-provided fields")


class JDResponse(BaseModel):
    """Response for JD operations"""

    success: bool
    jd_id: Optional[str] = None
    structured_jd: Optional[Dict[str, Any]] = None
    extraction_status: Optional[str] = None
    missing_fields: Optional[List[Dict[str, Any]]] = None
    usage: Optional[Dict[str, int]] = None
    cost: Optional[Dict[str, float]] = None
    error: Optional[str] = None

    class Config:
        from_attributes = True


class LLMCallResponse(BaseModel):
    """Response for LLM call details"""

    id: str
    call_type: str
    model_name: str
    input_tokens: int
    output_tokens: int
    total_tokens: int
    input_cost: float
    output_cost: float
    total_cost: float
    latency_ms: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())


class LLMStatsResponse(BaseModel):
    """Response for LLM usage statistics"""

    total_calls: int
    total_tokens: int
    total_cost: float
    by_call_type: Dict[str, Dict[str, Any]]
    recent_calls: List[LLMCallResponse]

    class Config:
        from_attributes = True
