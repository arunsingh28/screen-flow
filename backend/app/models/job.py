from sqlalchemy import (
    Column,
    String,
    DateTime,
    ForeignKey,
    Text,
    Enum as SQLEnum,
    Integer,
    ARRAY,
    Boolean,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
import enum
from app.database import Base


# Enums
class BatchStatus(str, enum.Enum):
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class CVStatus(str, enum.Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    SHORTLISTED = "shortlisted"
    REJECTED = "rejected"


class CVSource(str, enum.Enum):
    MANUAL_UPLOAD = "manual_upload"
    SMARTAPPLY = "smartapply"
    COPILOT = "copilot"


class SearchStatus(str, enum.Enum):
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


# Models
class CVBatch(Base):
    """CV Batches (Jobs) for organizing uploaded CVs"""

    __tablename__ = "cv_batches"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    job_description_id = Column(
        UUID(as_uuid=True), ForeignKey("job_descriptions.id"), nullable=True, index=True
    )

    # Job Details
    title = Column(String, nullable=False)  # Previously batch_name
    department = Column(String, nullable=True)
    location = Column(String, nullable=True)
    description = Column(Text, nullable=True)  # Internal notes
    job_description_text = Column(Text, nullable=True)  # Full JD text (legacy, prefer job_description relationship)
    is_active = Column(Boolean, default=True)
    is_archived = Column(Boolean, default=False)

    # Legacy/Compatibility (can map batch_name to title)
    @property
    def batch_name(self):
        return self.title

    @batch_name.setter
    def batch_name(self, value):
        self.title = value

    tags = Column(ARRAY(String), default=[])

    # Job Details (New Fields)
    employment_type = Column(String, nullable=True)
    seniority_level = Column(String, nullable=True)
    experience_range = Column(ARRAY(Integer), nullable=True)
    company_type = Column(String, nullable=True)
    industry = Column(String, nullable=True)
    prior_roles = Column(String, nullable=True)

    # Statistics
    total_cvs = Column(Integer, default=0)
    processed_cvs = Column(Integer, default=0)
    failed_cvs = Column(Integer, default=0)

    # Status
    status = Column(
        SQLEnum(BatchStatus), default=BatchStatus.PROCESSING, nullable=False, index=True
    )

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="cv_batches")
    cvs = relationship("CV", back_populates="batch", cascade="all, delete-orphan")
    job_description = relationship("JobDescription", backref="batches")


class CV(Base):
    """Individual CV/Resume"""

    __tablename__ = "cvs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    batch_id = Column(
        UUID(as_uuid=True), ForeignKey("cv_batches.id"), nullable=False, index=True
    )
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )

    # File details
    filename = Column(String, nullable=False)
    s3_key = Column(String, nullable=False, unique=True)  # S3 object key
    file_size_bytes = Column(Integer, nullable=False)

    # Processing data
    parsed_text = Column(Text, nullable=True)

    # JD Matching
    jd_match_score = Column(Integer, nullable=True)  # 0-100 match score against JD
    jd_match_data = Column(JSONB, nullable=True)  # Detailed matching analysis

    # Status
    status = Column(
        SQLEnum(CVStatus), default=CVStatus.QUEUED, nullable=False, index=True
    )
    error_message = Column(Text, nullable=True)

    # Source tracking
    source = Column(
        SQLEnum(CVSource), default=CVSource.MANUAL_UPLOAD, nullable=False, index=True
    )

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    batch = relationship("CVBatch", back_populates="cvs")
    user = relationship("User", back_populates="cvs")
    search_results = relationship(
        "SearchResult", back_populates="cv", cascade="all, delete-orphan"
    )
    llm_calls = relationship("LLMCall", back_populates="cv", cascade="all, delete-orphan")
    parse_detail = relationship("CVParseDetail", back_populates="cv", uselist=False, cascade="all, delete-orphan")

    @property
    def cv_quality_score(self):
        return self.parse_detail.cv_quality_score if self.parse_detail else None

    @property
    def candidate_name(self):
        return self.parse_detail.candidate_name if self.parse_detail else None
    
    @property
    def candidate_email(self):
        return self.parse_detail.candidate_email if self.parse_detail else None

    @property
    def current_role(self):
        return self.parse_detail.current_role if self.parse_detail else None
        
    @property
    def total_experience_years(self):
        return self.parse_detail.total_experience_years if self.parse_detail else None
    
    @property
    def skills_matched(self):
        # Extract skills from parsed_data
        if self.parse_detail and self.parse_detail.parsed_data:
             skills_data = self.parse_detail.parsed_data.get("skills", [])
             if isinstance(skills_data, list):
                 return [str(s) for s in skills_data] # Ensure strings
             if isinstance(skills_data, dict):
                 # Flatten values from categories (e.g. tools, languages)
                 all_skills = []
                 for val in skills_data.values():
                     if isinstance(val, list):
                         all_skills.extend([str(v) for v in val])
                     elif isinstance(val, str):
                         all_skills.append(val)
                 return all_skills
        return []

    # Alias for frontend consistency if needed
    @property
    def match_score(self):
        # Prefer JD match score, fallback to quality score
        if self.jd_match_score is not None:
            return self.jd_match_score
        return self.cv_quality_score or 0


class JobSearch(Base):
    """Job search/screening sessions"""

    __tablename__ = "job_searches"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )

    # Job details
    job_description = Column(Text, nullable=False)
    top_k = Column(Integer, default=10)  # Number of top candidates to return
    filters = Column(
        JSONB, nullable=True
    )  # Additional filters (skills, experience, etc.)

    # Status and metrics
    status = Column(
        SQLEnum(SearchStatus), default=SearchStatus.PROCESSING, nullable=False
    )
    total_analyzed = Column(Integer, default=0)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="job_searches")
    results = relationship(
        "SearchResult", back_populates="search", cascade="all, delete-orphan"
    )


class SearchResult(Base):
    """Results for each CV in a job search"""

    __tablename__ = "search_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    search_id = Column(
        UUID(as_uuid=True), ForeignKey("job_searches.id"), nullable=False, index=True
    )
    cv_id = Column(UUID(as_uuid=True), ForeignKey("cvs.id"), nullable=False, index=True)

    # Matching details
    rank = Column(Integer, nullable=False)  # Position in results (1-based)
    score = Column(Integer, nullable=False)  # Match score (0-100)
    matched_skills = Column(ARRAY(String), default=[])
    missing_skills = Column(ARRAY(String), default=[])
    reasoning = Column(Text, nullable=True)  # AI explanation

    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    search = relationship("JobSearch", back_populates="results")
    cv = relationship("CV", back_populates="search_results")
