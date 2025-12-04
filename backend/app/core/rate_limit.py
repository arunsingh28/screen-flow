from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from fastapi.responses import JSONResponse
from typing import Callable
import logging

logger = logging.getLogger(__name__)

# Initialize limiter with Redis backend for distributed rate limiting
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri="redis://redis:6379",
    strategy="fixed-window",
    headers_enabled=True,
)


def get_user_identifier(request: Request) -> str:
    """
    Get unique identifier for rate limiting.
    Uses user_id if authenticated, otherwise falls back to IP address.
    """
    # Try to get user from request state (set by auth middleware)
    if hasattr(request.state, "user") and request.state.user:
        return f"user:{request.state.user.id}"

    # Fall back to IP address for unauthenticated requests
    return f"ip:{get_remote_address(request)}"


def get_user_limiter() -> Limiter:
    """
    Get limiter instance that uses user ID for authenticated requests.
    """
    return Limiter(
        key_func=get_user_identifier,
        storage_uri="redis://redis:6379",
        strategy="fixed-window",
        headers_enabled=True,
    )


# Rate limit configurations
class RateLimits:
    """Centralized rate limit configurations"""

    # Public endpoints (IP-based)
    LOGIN = "5/minute"
    REGISTER = "5/minute"
    FORGOT_PASSWORD = "3/hour"
    VALIDATE_REFERRAL = "10/minute"

    # Authenticated endpoints (User-based)
    JOB_CREATE = "10/hour"
    CV_UPLOAD = "50/hour"
    GENERAL_API = "100/minute"
    SEARCH_QUERY = "30/minute"

    # Admin endpoints
    ADMIN_API = "200/minute"


# Custom rate limit exceeded handler
async def custom_rate_limit_handler(request: Request, exc: RateLimitExceeded):
    """
    Custom handler for rate limit exceeded errors.
    Logs the violation and returns a user-friendly error message.
    """
    identifier = get_user_identifier(request)
    logger.warning(f"Rate limit exceeded for {identifier} on {request.url.path}")

    return JSONResponse(
        status_code=429,
        content={
            "error": "Rate limit exceeded",
            "message": "Too many requests. Please try again later.",
            "retry_after": str(exc.detail),
        },
    )
