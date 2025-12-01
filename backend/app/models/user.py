from sqlalchemy import Column, String, DateTime, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    referral_code = Column(String, unique=True, index=True, nullable=True)
    company_name = Column(String, nullable=True)
    credits = Column(Integer, default=100, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)

    # Profile fields
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    location = Column(String, nullable=True)
    bio = Column(String, nullable=True)
    job_title = Column(String, nullable=True)
    department = Column(String, nullable=True)
    profile_image_url = Column(String, nullable=True)

    # Relationships
    cv_batches = relationship("CVBatch", back_populates="user", cascade="all, delete-orphan")
    cvs = relationship("CV", back_populates="user", cascade="all, delete-orphan")
    job_searches = relationship("JobSearch", back_populates="user", cascade="all, delete-orphan")
    activities = relationship("Activity", back_populates="user", cascade="all, delete-orphan")
    credit_transactions = relationship("CreditTransaction", back_populates="user", cascade="all, delete-orphan")
