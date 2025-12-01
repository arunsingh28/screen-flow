from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserWithToken, Token, UserResponse
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_access_token
)

router = APIRouter()


@router.post("/register", response_model=UserWithToken, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, response: Response, db: Session = Depends(get_db)):
    """Register a new user."""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Validate password strength
    if len(user_data.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long"
        )

    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        password_hash=hashed_password,
        company_name=user_data.company_name
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Handle Referral
    if user_data.referral_code:
        from app.models.referral import Referral, ReferralStatus
        from app.models.credit_transaction import CreditTransaction, TransactionType
        
        referrer = db.query(User).filter(User.referral_code == user_data.referral_code).first()
        if referrer:
            # Create Referral Record
            referral = Referral(
                referrer_id=referrer.id,
                referred_user_id=new_user.id,
                status=ReferralStatus.COMPLETED
            )
            db.add(referral)
            
            # Add Credits to Referrer
            bonus_amount = 50
            referrer.credits += bonus_amount
            
            # Create Transaction for Referrer
            transaction = CreditTransaction(
                user_id=referrer.id,
                type=TransactionType.REFERRAL_BONUS,
                amount=bonus_amount,
                description=f"Referral bonus for referring {new_user.email}",
                balance_after=referrer.credits
            )
            db.add(transaction)
            db.commit()

    # Create tokens
    new_user_id_str = str(new_user.id)
    access_token = create_access_token(data={"user_id": new_user_id_str, "email": new_user.email, "role": new_user.role})
    refresh_token = create_refresh_token(data={"user_id": new_user_id_str})

    # Set refresh token as HttpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=7 * 24 * 60 * 60
    )

    return UserWithToken(
        user=UserResponse.from_orm(new_user),
        token=Token(access_token=access_token)
    )


@router.post("/login", response_model=UserWithToken)
def login(credentials: UserLogin, response: Response, db: Session = Depends(get_db)):
    """Authenticate user and return JWT token."""
    # Find user by email
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    # Verify password
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    # Check if user is blocked
    if user.is_blocked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been blocked. Please contact support."
        )

    # Log login activity
    from app.models.activity import Activity, ActivityType
    from datetime import datetime
    activity = Activity(
        user_id=user.id,
        activity_type=ActivityType.USER_LOGIN,
        description=f"User logged in"
    )
    db.add(activity)
    
    # Update last login time
    user.last_login = datetime.utcnow()
    db.commit()

    # Create tokens
    user_id_str = str(user.id)
    access_token = create_access_token(data={"user_id": user_id_str, "email": user.email, "role": user.role})
    refresh_token = create_refresh_token(data={"user_id": user_id_str})

    # Set refresh token as HttpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=7 * 24 * 60 * 60
    )

    return UserWithToken(
        user=UserResponse.from_orm(user),
        token=Token(access_token=access_token)
    )


@router.post("/refresh", response_model=Token)
def refresh_token(request: Request, db: Session = Depends(get_db)):
    """Refresh access token using refresh token from cookie."""
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found"
        )

    # Decode refresh token
    payload = decode_access_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )

    # Verify user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    # Check if user is blocked
    if user.is_blocked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been blocked"
        )

    # Create new access token
    access_token = create_access_token(data={"user_id": user_id, "email": user.email, "role": user.role})

    return Token(access_token=access_token)


@router.post("/logout")
def logout(response: Response, db: Session = Depends(get_db), request: Request = None):
    """Logout user by clearing refresh token cookie."""
    # Try to log logout activity if we can get user from token
    try:
        from app.api.deps import get_current_user
        # Get token from Authorization header
        auth_header = request.headers.get("Authorization") if request else None
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            payload = decode_access_token(token)
            if payload:
                user_id = payload.get("user_id")
                if user_id:
                    from app.models.activity import Activity, ActivityType
                    activity = Activity(
                        user_id=user_id,
                        activity_type=ActivityType.USER_LOGOUT,
                        description=f"User logged out"
                    )
                    db.add(activity)
                    db.commit()
    except:
        pass  # Logout should succeed even if activity logging fails
    
    response.delete_cookie(key="refresh_token")
    return {"message": "Successfully logged out"}
