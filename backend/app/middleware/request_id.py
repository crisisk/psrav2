"""
Request ID middleware for tracking requests across the system.
Generates UUID for each request and propagates it through logs and headers.
"""

import uuid
from contextvars import ContextVar
from typing import Optional, Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

# Context variable to store request ID
request_id_var: ContextVar[Optional[str]] = ContextVar("request_id", default=None)

class RequestIDMiddleware(BaseHTTPMiddleware):
    """Middleware to generate and propagate request IDs."""

    def __init__(self, app, *, header_name: str = "X-Request-ID"):
        super().__init__(app)
        self.header_name = header_name

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process each request to add request ID."""

        # Get or generate request ID
        request_id = request.headers.get(self.header_name.lower()) or str(uuid.uuid4())

        # Store in context variable
        request_id_var.set(request_id)

        # Store in request state for easy access
        request.state.request_id = request_id

        # Process the request
        response = await call_next(request)

        # Add request ID to response headers
        response.headers[self.header_name] = request_id

        return response

def get_request_id() -> Optional[str]:
    """Get the current request ID from context."""
    return request_id_var.get()
