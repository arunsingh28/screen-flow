from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional
from uuid import UUID


class UserBase(BaseModel):
    email: EmailStr
    company_name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    job_title: Optional[str] = None
    department: Optional[str] = None
    profile_image_url: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(
        ..., min_length=8, description="Password must be at least 8 characters"
    )
    referral_code: Optional[str] = None


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    job_title: Optional[str] = None
    department: Optional[str] = None
    company_name: Optional[str] = None
    profile_image_url: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1, description="Current password")
    new_password: str = Field(
        ..., min_length=8, description="New password must be at least 8 characters"
    )


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    id: UUID
    referral_code: Optional[str] = None
    role: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[str] = None  # UUID as string
    email: Optional[str] = None


class UserWithToken(BaseModel):
    user: UserResponse
    token: Token
