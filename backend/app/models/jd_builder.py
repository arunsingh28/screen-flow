from sqlalchemy import (
    Column,
    String,
    DateTime,
    ForeignKey,
    Text,
    Enum as SQLEnum,
    Integer,
    Float,
    Boolean,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
import enum
from app.database import Base


class JDStatus(str, enum.Enum):
    DRAFT = "draft"
    GENERATING = "generating"
    COMPLETED = "completed"
    FAILED = "failed"


class JDSource(str, enum.Enum):
    BUILDER = "builder"  # Created via JD Builder form
    UPLOAD = "upload"  # Uploaded existing JD
    MANUAL = "manual"  # Manually entered


class JobDescription(Base):
    """Job Description created via builder or upload"""

    __tablename__ = "job_descriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )

    # Basic Info
    job_title = Column(String, nullable=False)
    department = Column(String, nullable=True)
    employment_type = Column(String, nullable=True)  # Full-time, Part-time, etc.
    location = Column(String, nullable=True)
    seniority_level = Column(String, nullable=True)  # Entry, Mid, Senior, etc.

    # Experience
    min_years_experience = Column(Integer, nullable=True)
    max_years_experience = Column(Integer, nullable=True)

    # Company & Industry
    company_type = Column(String, nullable=True)  # Startup, MNC, etc.
    industry = Column(String, nullable=True)  # FinTech, HealthTech, etc.
    prior_roles = Column(Text, nullable=True)  # Comma-separated prior role titles

    # Generated/Extracted Content
    structured_jd = Column(JSONB, nullable=True)  # Full structured JD output

    # Source tracking
    source = Column(SQLEnum(JDSource), default=JDSource.BUILDER, nullable=False)
    original_jd_text = Column(Text, nullable=True)  # If uploaded

    # Missing fields (for uploaded JDs)
    missing_fields = Column(JSONB, nullable=True)  # List of fields that need user input

    # Status
    status = Column(SQLEnum(JDStatus), default=JDStatus.DRAFT, nullable=False)
    error_message = Column(Text, nullable=True)

    # Metadata
    is_active = Column(Boolean, default=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="job_descriptions")
    llm_calls = relationship("LLMCall", back_populates="job_description", cascade="all, delete-orphan")


class LLMCallType(str, enum.Enum):
    JD_GENERATION = "jd_generation"
    JD_PARSING = "jd_parsing"
    CV_PARSING = "cv_parsing"
    CV_MATCHING = "cv_matching"
    GITHUB_ANALYSIS = "github_analysis"


class LLMCall(Base):
    """Track all LLM API calls for cost monitoring"""

    __tablename__ = "llm_calls"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )

    # Related entities (optional, depending on call type)
    job_description_id = Column(
        UUID(as_uuid=True), ForeignKey("job_descriptions.id"), nullable=True, index=True
    )
    cv_id = Column(
        UUID(as_uuid=True), ForeignKey("cvs.id"), nullable=True, index=True
    )
    cv_parse_detail_id = Column(
        UUID(as_uuid=True), ForeignKey("cv_parse_details.id"), nullable=True, index=True
    )

    # Call details
    call_type = Column(SQLEnum(LLMCallType), nullable=False, index=True)
    model_name = Column(String, nullable=False)  # e.g., "anthropic.claude-sonnet-4-20250514"
    provider = Column(String, default="bedrock")  # bedrock, openai, etc.

    # Token usage
    input_tokens = Column(Integer, nullable=False, default=0)
    output_tokens = Column(Integer, nullable=False, default=0)
    total_tokens = Column(Integer, nullable=False, default=0)

    # Cost calculation (in USD)
    input_cost = Column(Float, nullable=False, default=0.0)
    output_cost = Column(Float, nullable=False, default=0.0)
    total_cost = Column(Float, nullable=False, default=0.0)

    # Request/Response metadata
    prompt_size_chars = Column(Integer, nullable=True)  # Character count of prompt
    response_size_chars = Column(Integer, nullable=True)  # Character count of response
    latency_ms = Column(Integer, nullable=True)  # API call latency in milliseconds

    # Status
    success = Column(Boolean, default=True)
    error_message = Column(Text, nullable=True)

    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="llm_calls")
    job_description = relationship("JobDescription", back_populates="llm_calls")
    cv = relationship("CV", back_populates="llm_calls")
    cv_parse_detail = relationship("CVParseDetail", back_populates="llm_calls")


class CVParseDetail(Base):
    """Detailed parsed CV data from LLM"""

    __tablename__ = "cv_parse_details"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    cv_id = Column(
        UUID(as_uuid=True), ForeignKey("cvs.id"), nullable=False, unique=True, index=True
    )
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )

    # Parsed structured data (full JSON from LLM)
    parsed_data = Column(JSONB, nullable=False)

    # Quick access fields (denormalized for querying)
    candidate_name = Column(String, nullable=True, index=True)
    candidate_email = Column(String, nullable=True, index=True)
    current_role = Column(String, nullable=True)
    current_company = Column(String, nullable=True)
    total_experience_years = Column(Float, nullable=True)
    career_level = Column(String, nullable=True)  # entry/mid/senior/lead

    # Skill freshness summary
    current_skills_count = Column(Integer, default=0)
    outdated_skills_count = Column(Integer, default=0)

    # GitHub username (if found)
    github_username = Column(String, nullable=True)

    # CV quality score
    cv_quality_score = Column(Integer, nullable=True)  # 0-100
    parsing_confidence = Column(String, nullable=True)  # high/medium/low

    # Red flags count
    red_flags_count = Column(Integer, default=0)

    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    cv = relationship("CV", back_populates="parse_detail", uselist=False)
    user = relationship("User", back_populates="cv_parse_details")
    github_analysis = relationship("GitHubAnalysis", back_populates="cv_parse_detail", uselist=False)
    llm_calls = relationship("LLMCall", back_populates="cv_parse_detail")


class GitHubAnalysis(Base):
    """GitHub profile analysis for candidates"""

    __tablename__ = "github_analyses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    cv_parse_detail_id = Column(
        UUID(as_uuid=True), ForeignKey("cv_parse_details.id"), nullable=False, unique=True, index=True
    )
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )

    # GitHub profile info
    github_username = Column(String, nullable=False, index=True)

    # Analysis results (full JSON from LLM)
    analysis_data = Column(JSONB, nullable=False)

    # Quick access fields
    github_score = Column(Integer, nullable=True)  # 0-100
    activity_level = Column(String, nullable=True)  # high/medium/low/inactive
    last_activity_date = Column(DateTime(timezone=True), nullable=True)
    days_since_last_activity = Column(Integer, nullable=True)

    # Code quality
    code_quality_score = Column(Integer, nullable=True)  # 0-100

    # Flags
    green_flags_count = Column(Integer, default=0)
    red_flags_count = Column(Integer, default=0)

    # CV alignment
    cv_github_alignment = Column(String, nullable=True)  # strong/moderate/weak

    # Status
    success = Column(Boolean, default=True)
    error_message = Column(Text, nullable=True)

    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    cv_parse_detail = relationship("CVParseDetail", back_populates="github_analysis")
    user = relationship("User", back_populates="github_analyses")
