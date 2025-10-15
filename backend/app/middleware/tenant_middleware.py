"""
Tenant Middleware for Multi-Tenancy Support
Handles tenant detection and context setting for all requests
"""

import logging
from typing import Optional
from urllib.parse import urlparse
import time

from fastapi import Request, Response, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.tenant_context import tenant_context, TenantIsolationError
from app.core.database import get_db
from app.models.tenant import TenantStatus

logger = logging.getLogger(__name__)


class TenantMiddleware(BaseHTTPMiddleware):
    """Middleware to handle tenant detection and context setting"""
    
    def __init__(self, app, exclude_paths: Optional[list] = None):
        super().__init__(app)
        self.exclude_paths = exclude_paths or [
            "/docs",
            "/redoc",
            "/openapi.json",
            "/health",
            "/metrics",
            "/admin/tenants",  # Admin endpoints
        ]
    
    async def dispatch(self, request: Request, call_next):
        """Process request with tenant context"""
        start_time = time.time()
        
        # Skip tenant detection for excluded paths
        if self._should_skip_tenant_detection(request):
            response = await call_next(request)
            return response
        
        try:
            # Get database session
            db = None
            async for session in get_db():
                db = session
                break
            
            if not db:
                return JSONResponse(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    content={"detail": "Database connection failed"}
                )
            
            # Detect tenant
            tenant = await self._detect_tenant(request, db)
            
            if not tenant:
                return JSONResponse(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    content={"detail": "Tenant not found or invalid"}
                )
            
            # Check tenant status
            if tenant.status != TenantStatus.ACTIVE:
                return JSONResponse(
                    status_code=status.HTTP_403_FORBIDDEN,
                    content={"detail": f"Tenant is {tenant.status.value}"}
                )
            
            # Set tenant context
            await tenant_context.set_tenant_context(tenant, db)
            
            # Add tenant info to request state
            request.state.tenant = tenant
            request.state.tenant_id = tenant.id
            
            # Process request
            response = await call_next(request)
            
            # Add tenant headers to response
            response.headers["X-Tenant-ID"] = str(tenant.id)
            response.headers["X-Tenant-Name"] = tenant.name
            
            # Log request
            process_time = time.time() - start_time
            logger.info(
                f"Tenant request: {tenant.name} ({tenant.id}) - "
                f"{request.method} {request.url.path} - "
                f"{response.status_code} - {process_time:.3f}s"
            )
            
            # Track API usage
            await self._track_api_usage(tenant.id, request, response)
            
            return response
            
        except TenantIsolationError as e:
            logger.error(f"Tenant isolation violation: {e}")
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"detail": "Tenant isolation violation"}
            )
            
        except Exception as e:
            logger.error(f"Tenant middleware error: {e}")
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"detail": "Internal server error"}
            )
            
        finally:
            # Clear tenant context
            if db:
                await tenant_context.clear_tenant_context(db)
    
    def _should_skip_tenant_detection(self, request: Request) -> bool:
        """Check if tenant detection should be skipped for this path"""
        path = request.url.path
        
        # Skip for excluded paths
        for exclude_path in self.exclude_paths:
            if path.startswith(exclude_path):
                return True
        
        # Skip for OPTIONS requests
        if request.method == "OPTIONS":
            return True
        
        return False
    
    async def _detect_tenant(self, request: Request, db: AsyncSession):
        """Detect tenant from request"""
        tenant = None
        
        # Method 1: Try JWT token first
        tenant = await self._detect_tenant_from_jwt(request)
        if tenant:
            return tenant
        
        # Method 2: Try subdomain
        tenant = await self._detect_tenant_from_subdomain(request, db)
        if tenant:
            return tenant
        
        # Method 3: Try custom header
        tenant = await self._detect_tenant_from_header(request, db)
        if tenant:
            return tenant
        
        # Method 4: Try query parameter (for development)
        tenant = await self._detect_tenant_from_query(request, db)
        if tenant:
            return tenant
        
        return None
    
    async def _detect_tenant_from_jwt(self, request: Request):
        """Detect tenant from JWT token"""
        try:
            # Get token from Authorization header
            auth_header = request.headers.get("Authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                return None
            
            token = auth_header.split(" ")[1]
            return await tenant_context.get_tenant_from_jwt(token)
            
        except Exception as e:
            logger.debug(f"Failed to detect tenant from JWT: {e}")
            return None
    
    async def _detect_tenant_from_subdomain(self, request: Request, db: AsyncSession):
        """Detect tenant from subdomain"""
        try:
            host = request.headers.get("host", "")
            if not host:
                return None
            
            # Extract subdomain
            parts = host.split(".")
            if len(parts) < 3:  # Need at least subdomain.domain.tld
                return None
            
            subdomain = parts[0]
            
            # Skip common subdomains
            if subdomain in ["www", "api", "admin"]:
                return None
            
            return await tenant_context.get_tenant_from_subdomain(subdomain, db)
            
        except Exception as e:
            logger.debug(f"Failed to detect tenant from subdomain: {e}")
            return None
    
    async def _detect_tenant_from_header(self, request: Request, db: AsyncSession):
        """Detect tenant from custom header"""
        try:
            tenant_id = request.headers.get("X-Tenant-ID")
            if not tenant_id:
                return None
            
            from uuid import UUID
            return await tenant_context.get_tenant_by_id(UUID(tenant_id), db)
            
        except Exception as e:
            logger.debug(f"Failed to detect tenant from header: {e}")
            return None
    
    async def _detect_tenant_from_query(self, request: Request, db: AsyncSession):
        """Detect tenant from query parameter (development only)"""
        try:
            tenant_id = request.query_params.get("tenant_id")
            if not tenant_id:
                return None
            
            from uuid import UUID
            return await tenant_context.get_tenant_by_id(UUID(tenant_id), db)
            
        except Exception as e:
            logger.debug(f"Failed to detect tenant from query: {e}")
            return None
    
    async def _track_api_usage(self, tenant_id, request: Request, response: Response):
        """Track API usage for billing and quotas"""
        try:
            # Increment API call counter
            await tenant_context.increment_usage(tenant_id, "api_calls", 1)
            
            # Track specific metrics
            metrics = {
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "user_agent": request.headers.get("user-agent", ""),
                "ip_address": request.client.host if request.client else None,
            }
            
            # Log for analytics (could be sent to analytics service)
            logger.info(f"API Usage: {tenant_id} - {metrics}")
            
        except Exception as e:
            logger.error(f"Failed to track API usage: {e}")


class TenantQuotaMiddleware(BaseHTTPMiddleware):
    """Middleware to enforce tenant quotas"""
    
    def __init__(self, app):
        super().__init__(app)
        self.quota_exempt_paths = [
            "/health",
            "/metrics",
            "/billing",
        ]
    
    async def dispatch(self, request: Request, call_next):
        """Check tenant quotas before processing request"""
        
        # Skip quota check for exempt paths
        if any(request.url.path.startswith(path) for path in self.quota_exempt_paths):
            return await call_next(request)
        
        # Get tenant from request state
        tenant_id = getattr(request.state, "tenant_id", None)
        if not tenant_id:
            return await call_next(request)
        
        try:
            # Check API call quota
            if not await tenant_context.check_tenant_quota(tenant_id, "api_calls"):
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={
                        "detail": "API call quota exceeded",
                        "error_code": "QUOTA_EXCEEDED_API_CALLS"
                    }
                )
            
            # Check storage quota for upload endpoints
            if request.method in ["POST", "PUT", "PATCH"] and "upload" in request.url.path:
                content_length = int(request.headers.get("content-length", 0))
                if content_length > 0:
                    if not await tenant_context.check_tenant_quota(tenant_id, "storage", content_length):
                        return JSONResponse(
                            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                            content={
                                "detail": "Storage quota exceeded",
                                "error_code": "QUOTA_EXCEEDED_STORAGE"
                            }
                        )
            
            return await call_next(request)
            
        except Exception as e:
            logger.error(f"Quota middleware error: {e}")
            return await call_next(request)


class TenantSecurityMiddleware(BaseHTTPMiddleware):
    """Additional security middleware for tenant isolation"""
    
    async def dispatch(self, request: Request, call_next):
        """Add security headers and checks"""
        
        response = await call_next(request)
        
        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # Add tenant-specific security headers
        tenant = getattr(request.state, "tenant", None)
        if tenant:
            response.headers["X-Tenant-Isolation"] = "enabled"
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        return response