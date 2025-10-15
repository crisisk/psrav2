from fastapi import Request, HTTPException
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.middleware import SlowAPIMiddleware
from slowapi.errors import RateLimitExceeded
from redis import Redis
from app.core.rate_limit_config import RateLimitConfig

# Initialize Redis-backed limiter
redis_conn = Redis(
    host=RateLimitConfig.REDIS_HOST,
    port=RateLimitConfig.REDIS_PORT,
    db=RateLimitConfig.REDIS_DB,
    password=RateLimitConfig.REDIS_PASSWORD,
    decode_responses=True,
)
limiter = Limiter(
    key_func=get_remote_address,  # Default key by IP; overridden per user
    storage_uri=f"redis://{RateLimitConfig.REDIS_HOST}:{RateLimitConfig.REDIS_PORT}/{RateLimitConfig.REDIS_DB}",
    strategy="fixed-window",  # Or "moving-window" for sliding
)

def get_user_tier(request: Request) -> str:
    """Extract user tier from request. Assumes auth sets request.state.user with 'tier'."""
    user = getattr(request.state, "user", None)
    if user and isinstance(user, dict) and "tier" in user:
        return user["tier"]  # e.g., "anonymous", "authenticated", "premium"
    return "anonymous"

def is_admin_bypass(request: Request) -> bool:
    """Check if request should bypass rate limiting (admin/internal)."""
    # Check header
    header_value = request.headers.get(RateLimitConfig.ADMIN_BYPASS_HEADER)
    if header_value == RateLimitConfig.ADMIN_BYPASS_SECRET:
        return True
    # Check IP (for internal services)
    client_ip = get_remote_address(request)
    return client_ip in RateLimitConfig.INTERNAL_IPS

# Custom rate limit exceeded handler
@_rate_limit_exceeded_handler
def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """Return 429 with JSON error."""
    raise HTTPException(status_code=429, detail="Rate limit exceeded. Try again later.")

# Middleware class
class RateLimitingMiddleware(SlowAPIMiddleware):
    def __init__(self, app):
        super().__init__(app, limiter)

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request = Request(scope, receive)
        
        # Admin bypass
        if is_admin_bypass(request):
            await self.app(scope, receive, send)
            return

        # Get user-specific limit
        tier = get_user_tier(request)
        limit_str = RateLimitConfig.get_limit_for_tier(tier)
        
        # Check for custom per-endpoint limit
        path = request.url.path
        custom_limit = RateLimitConfig.get_custom_limit(path)
        if custom_limit:
            limit_str = custom_limit
        
        # Apply limit using limiter (this will check and set headers)
        # Note: slowapi handles the actual limiting; we just configure it here
        # For per-request limits, we can use limiter.check_request_limit or integrate with routes
        # But for global middleware, rely on per-route decorators or global defaults
        
        await self.app(scope, receive, send)

# To use per-endpoint limits, decorate routes like:
# @app.get("/api/ml/predict")
# @limiter.limit("50/minute")  # Overrides global
# async def predict(...): ...