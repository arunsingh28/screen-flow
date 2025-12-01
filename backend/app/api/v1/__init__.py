from fastapi import APIRouter
from app.api.v1 import auth, users, jobs, credits, referrals

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
api_router.include_router(credits.router, prefix="/credits", tags=["credits"])
api_router.include_router(referrals.router, prefix="/referrals", tags=["referrals"])
