from fastapi import APIRouter, Depends
from app.models.user import User
from app.schemas.user import UserResponse
from app.api.deps import get_current_user

router = APIRouter()


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information."""
    return UserResponse.from_orm(current_user)
