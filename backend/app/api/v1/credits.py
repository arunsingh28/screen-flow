from typing import Any, List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.credit_transaction import CreditTransaction, TransactionType
from app.schemas import credits as schemas

router = APIRouter()

@router.get("/", response_model=schemas.CreditBalance)
def get_credits(
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get current credit balance.
    """
    return {
        "credits": current_user.credits,
        "max_credits": 100 # Hardcoded max credits for now
    }

@router.get("/history", response_model=List[schemas.CreditTransaction])
def get_credit_history(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get credit transaction history.
    """
    transactions = (
        db.query(CreditTransaction)
        .filter(CreditTransaction.user_id == current_user.id)
        .order_by(CreditTransaction.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return transactions

@router.get("/usage", response_model=schemas.CreditUsageSummary)
def get_usage_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get credit usage summary (Today, Last 7 Days, This Month).
    """
    now = datetime.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    seven_days_ago = now - timedelta(days=7)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    def get_usage_sum(start_date):
        result = (
            db.query(func.sum(CreditTransaction.amount))
            .filter(
                CreditTransaction.user_id == current_user.id,
                CreditTransaction.type == TransactionType.USAGE,
                CreditTransaction.created_at >= start_date
            )
            .scalar()
        )
        # Usage amounts are negative, so we negate the result to get positive usage count
        return abs(result) if result else 0

    return {
        "today": get_usage_sum(today_start),
        "last_7_days": get_usage_sum(seven_days_ago),
        "this_month": get_usage_sum(month_start)
    }

@router.post("/purchase", response_model=schemas.CreditBalance)
def purchase_credits(
    purchase: schemas.PurchaseCreditsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Purchase credits (Mock implementation).
    """
    # In a real app, this would integrate with Stripe/etc.
    # For now, we just add the credits.
    
    new_balance = current_user.credits + purchase.amount
    
    # Create transaction record
    transaction = CreditTransaction(
        user_id=current_user.id,
        type=TransactionType.PURCHASE,
        amount=purchase.amount,
        description=purchase.description,
        balance_after=new_balance
    )
    
    # Update user balance
    current_user.credits = new_balance
    
    db.add(transaction)
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    
    return {
        "credits": current_user.credits,
        "max_credits": 100
    }
