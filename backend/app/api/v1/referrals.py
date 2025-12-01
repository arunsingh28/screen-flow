from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.referral import Referral, ReferralStatus
from app.models.credit_transaction import CreditTransaction, TransactionType
from pydantic import BaseModel
import random
import string

router = APIRouter()

class ReferralCodeResponse(BaseModel):
    referral_code: str
    referral_link: str

class ReferralStatsResponse(BaseModel):
    total_referrals: int
    total_credits_earned: int
    pending_referrals: int
    completed_referrals: int

class ValidateReferralResponse(BaseModel):
    valid: bool
    referrer_name: str | None = None

def generate_referral_code(length=8):
    """Generate a random alphanumeric referral code."""
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choice(chars) for _ in range(length))

@router.get("/code", response_model=ReferralCodeResponse)
def get_referral_code(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get or generate referral code for current user."""
    if not current_user.referral_code:
        # Generate unique code
        while True:
            code = generate_referral_code()
            existing = db.query(User).filter(User.referral_code == code).first()
            if not existing:
                current_user.referral_code = code
                db.commit()
                db.refresh(current_user)
                break
    
    # Assuming frontend URL is known or passed in config, but for now returning relative or just code
    # In a real app, we might construct the full URL based on env vars
    # For now, we'll return the code and a placeholder link
    return ReferralCodeResponse(
        referral_code=current_user.referral_code,
        referral_link=f"/signup?ref={current_user.referral_code}"
    )

@router.post("/validate/{code}", response_model=ValidateReferralResponse)
def validate_referral_code(
    code: str,
    db: Session = Depends(get_db)
):
    """Validate a referral code."""
    referrer = db.query(User).filter(User.referral_code == code).first()
    if not referrer:
        return ValidateReferralResponse(valid=False)
    
    name = referrer.first_name if referrer.first_name else "a user"
    return ValidateReferralResponse(valid=True, referrer_name=name)

@router.get("/stats", response_model=ReferralStatsResponse)
def get_referral_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get referral statistics for current user."""
    total_referrals = db.query(Referral).filter(Referral.referrer_id == current_user.id).count()
    completed = db.query(Referral).filter(
        Referral.referrer_id == current_user.id,
        Referral.status == ReferralStatus.COMPLETED
    ).count()
    pending = db.query(Referral).filter(
        Referral.referrer_id == current_user.id,
        Referral.status == ReferralStatus.PENDING
    ).count()
    
    # Calculate credits earned from referrals
    # We can query CreditTransactions where type is REFERRAL_BONUS
    # But wait, CreditTransaction doesn't link to Referral directly, just User.
    # So we sum amounts of REFERRAL_BONUS transactions for this user.
    
    credits_earned = db.query(func.sum(CreditTransaction.amount)).filter(
        CreditTransaction.user_id == current_user.id,
        CreditTransaction.type == TransactionType.REFERRAL_BONUS
    ).scalar() or 0
    
    return ReferralStatsResponse(
        total_referrals=total_referrals,
        total_credits_earned=credits_earned,
        pending_referrals=pending,
        completed_referrals=completed
    )
