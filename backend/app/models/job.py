from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class JobStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    CLOSED = "closed"


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Job details
    title = Column(String, nullable=False)
    department = Column(String, nullable=True)
    location = Column(String, nullable=True)
    description = Column(Text, nullable=True)

    # Job description file
    jd_file_name = Column(String, nullable=True)
    jd_file_path = Column(String, nullable=True)
    jd_file_size = Column(Integer, nullable=True)  # in bytes

    # Status and counts
    status = Column(SQLEnum(JobStatus), default=JobStatus.DRAFT, nullable=False)
    candidate_count = Column(Integer, default=0)
    high_match_count = Column(Integer, default=0)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="jobs")
    cvs = relationship("CV", back_populates="job", cascade="all, delete-orphan")


class CVStatus(str, enum.Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class CV(Base):
    __tablename__ = "cvs"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # File details
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)  # in bytes

    # Processing status
    status = Column(SQLEnum(CVStatus), default=CVStatus.QUEUED, nullable=False)
    error_message = Column(Text, nullable=True)

    # Extracted data (will be populated later when we add AI)
    parsed_text = Column(Text, nullable=True)
    candidate_name = Column(String, nullable=True)
    candidate_email = Column(String, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    job = relationship("Job", back_populates="cvs")
    user = relationship("User", back_populates="cvs")
