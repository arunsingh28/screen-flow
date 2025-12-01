from sqlalchemy import Column, String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID
import uuid
import enum
from app.database import Base

class ReferralStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"

class Referral(Base):
    __tablename__ = "referrals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    referrer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    referred_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True)
    status = Column(SQLEnum(ReferralStatus, name="referral_status_enum"), default=ReferralStatus.COMPLETED, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    referrer = relationship("User", foreign_keys=[referrer_id], backref="referrals_made")
    referred_user = relationship("User", foreign_keys=[referred_user_id], backref="referral_received")
