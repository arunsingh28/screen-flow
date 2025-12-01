from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID
import uuid
import enum
from app.database import Base


class ActivityType(str, enum.Enum):
    USER_LOGIN = "USER_LOGIN"
    USER_LOGOUT = "USER_LOGOUT"
    JOB_CREATED = "JOB_CREATED"
    CV_UPLOADED = "CV_UPLOADED"
    CV_PROCESSED = "CV_PROCESSED"
    CV_FAILED = "CV_FAILED"
    JOB_CLOSED = "JOB_CLOSED"
    JOB_REOPENED = "JOB_REOPENED"


class Activity(Base):
    """User activity log"""

    __tablename__ = "activities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )

    # Optional relation to a specific entity
    job_id = Column(UUID(as_uuid=True), ForeignKey("cv_batches.id"), nullable=True)
    cv_id = Column(UUID(as_uuid=True), ForeignKey("cvs.id"), nullable=True)

    activity_type = Column(SQLEnum(ActivityType), nullable=False)
    description = Column(String, nullable=False)
    metadata_json = Column(
        Text, nullable=True
    )  # Store extra details as JSON string if needed

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="activities")
