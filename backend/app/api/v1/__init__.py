from fastapi import APIRouter
from app.api.v1 import auth, users, jobs, credits, referrals, admin, analytics, jd_builder, cv_processing

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
api_router.include_router(credits.router, prefix="/credits", tags=["credits"])
api_router.include_router(referrals.router, prefix="/referrals", tags=["referrals"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(jd_builder.router, prefix="/jd-builder", tags=["jd-builder"])
api_router.include_router(cv_processing.router, prefix="/cv-processing", tags=["cv-processing"])
