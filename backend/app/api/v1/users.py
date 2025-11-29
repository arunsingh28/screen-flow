from fastapi import APIRouter, Depends, HTTPException, Body, status
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate, ChangePasswordRequest
from app.api.deps import get_current_user, get_db
from app.services.s3_service import s3_service
from sqlalchemy.orm import Session
from pydantic import BaseModel

router = APIRouter()


class AvatarUploadRequest(BaseModel):
    filename: str
    content_type: str


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information."""
    user_data = UserResponse.from_orm(current_user)
    
    # If user has a profile image (S3 key), generate a presigned URL for viewing
    if current_user.profile_image_url:
        try:
            # Generate presigned GET URL valid for 1 hour
            presigned_url = s3_service.generate_presigned_url(
                s3_key=current_user.profile_image_url,
                client_method='get_object',
                expiration=3600  # 1 hour
            )
            # Replace the S3 key with the presigned URL
            user_data.profile_image_url = presigned_url
        except Exception as e:
            # If there's an error generating the URL, just return None
            print(f"Error generating presigned URL: {e}")
            user_data.profile_image_url = None
    
    return user_data


@router.put("/me", response_model=UserResponse)
def update_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user profile."""
    for field, value in user_update.dict(exclude_unset=True).items():
        setattr(current_user, field, value)
    
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return UserResponse.from_orm(current_user)


@router.post("/me/avatar/upload-url")
def get_avatar_upload_url(
    upload_request: AvatarUploadRequest,
    current_user: User = Depends(get_current_user)
):
    """Get presigned URL for avatar upload."""
    # Generate S3 key
    s3_key = s3_service.generate_s3_key(
        user_id=str(current_user.id),
        file_type="avatars",
        original_filename=upload_request.filename
    )
    
    # Generate presigned URL
    upload_url = s3_service.generate_presigned_url(
        s3_key=s3_key,
        client_method='put_object',
        content_type=upload_request.content_type
    )
    
    # Generate public URL (assuming public bucket or CloudFront, but here returning s3_key for reference if needed, 
    # or we can construct a public URL if the bucket is public. 
    # For now, we'll return the s3_key which can be stored in the profile after upload)
    
    # Actually, for the profile_image_url, we probably want a publicly accessible URL or a presigned GET URL.
    # If the bucket is private, we'd need a presigned GET URL every time.
    # Let's assume we store the S3 key or a permanent URL if public.
    # For this implementation, let's return the key so the frontend can send it back to update the profile.
    
    return {
        "upload_url": upload_url,
        "s3_key": s3_key,
        # If we want to preview it immediately after upload without another presigned URL call, 
        # we might need to know how to access it. 
        # For now, let's assume the frontend will use the s3_key to update the profile.
    }


@router.post("/me/change-password")
def change_password(
    password_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change user password."""
    from app.core.security import verify_password, get_password_hash
    
    # Verify current password
    if not verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Validate new password is different from current
    if verify_password(password_data.new_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password"
        )
    
    # Update password
    current_user.password_hash = get_password_hash(password_data.new_password)
    db.add(current_user)
    db.commit()
    
    return {"message": "Password changed successfully"}
