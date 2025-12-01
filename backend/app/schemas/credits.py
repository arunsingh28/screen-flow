from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from uuid import UUID
from enum import Enum


class TransactionType(str, Enum):
    PURCHASE = "purchase"
    USAGE = "usage"


class CreditTransactionBase(BaseModel):
    type: TransactionType
    amount: int
    description: str
    balance_after: int


class CreditTransaction(CreditTransactionBase):
    id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class CreditBalance(BaseModel):
    credits: int
    max_credits: int = 100  # Hardcoded for now, could be dynamic later


class CreditHistory(BaseModel):
    transactions: List[CreditTransaction]
    total: int
    page: int
    size: int


class PurchaseCreditsRequest(BaseModel):
    amount: int
    description: str = "Credit Purchase"


class CreditUsageSummary(BaseModel):
    today: int
    last_7_days: int
    this_month: int
