from app.models.user import User
from app.models.job import (
    CVBatch,
    CV,
    JobSearch,
    SearchResult,
    BatchStatus,
    CVStatus,
    CVSource,
    SearchStatus,
)
from app.models.analytics import PageVisit
from app.models.referral import Referral
from app.models.credit_transaction import CreditTransaction
from app.models.jd_builder import (
    JobDescription,
    LLMCall,
    CVParseDetail,
    GitHubAnalysis,
    JDStatus,
    JDSource,
    LLMCallType,
)
from app.models.activity import Activity

__all__ = [
    "User",
    "CVBatch",
    "CV",
    "JobSearch",
    "SearchResult",
    "BatchStatus",
    "CVStatus",
    "CVSource",
    "SearchStatus",
    "Referral",
    "CreditTransaction",
    "PageVisit",
    "JobDescription",
    "LLMCall",
    "CVParseDetail",
    "GitHubAnalysis",
    "JDStatus",
    "JDSource",
    "LLMCallType",
    "Activity",
]
