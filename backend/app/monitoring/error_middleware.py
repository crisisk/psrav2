from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from app.monitoring.error_tracker import error_tracker
import logging

logger = logging.getLogger(__name__)

class ErrorTrackingMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request = Request(scope, receive)
        
        # Set custom tags from request (e.g., tenant from headers)
        tenant = request.headers.get("X-Tenant")
        feature = request.headers.get("X-Feature")
        error_tracker.set_custom_tags(tenant=tenant, feature=feature)
        
        # Set user context if available
        user_id = getattr(request.state, "user_id", None)
        error_tracker.set_user_context(user_id=user_id)

        try:
            await self.app(scope, receive, send)
        except Exception as exc:
            # Automatic error capture with context
            error_tracker.set_error_context({"url": str(request.url), "method": request.method})
            error_tracker.capture_error(exc)
            logger.error(f"Unhandled error: {exc}")
            # Return a generic error response
            response = JSONResponse(status_code=500, content={"detail": "Internal server error"})
            await response(scope, receive, send)
            return

# Usage in your app (e.g., in main.py):
# from app.monitoring.error_middleware import ErrorTrackingMiddleware
# app.add_middleware(ErrorTrackingMiddleware)