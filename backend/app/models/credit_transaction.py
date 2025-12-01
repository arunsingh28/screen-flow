from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID
import uuid
import enum
from app.database import Base


class TransactionType(str, enum.Enum):
    PURCHASE = "purchase"
    USAGE = "usage"
    REFERRAL_BONUS = "referral_bonus"


class CreditTransaction(Base):
    __tablename__ = "credit_transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    type = Column(
        SQLEnum(TransactionType, name="credit_txn_type_final"), nullable=False
    )
    amount = Column(
        Integer, nullable=False
    )  # Positive for purchase, negative for usage
    description = Column(String, nullable=False)
    balance_after = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="credit_transactions")
