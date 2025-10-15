"""
Tenant Context Manager for Multi-Tenancy Support
Handles tenant detection, context switching, and isolation
"""

import asyncio
from contextvars import ContextVar
from typing import Optional, Dict, Any
from uuid import UUID
import logging
from functools import wraps

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from fastapi import HTTPException, status
from jose import jwt, JWTError

from app.core.config import settings
from app.models.tenant import Tenant, TenantQuota, TenantUsage

logger = logging.getLogger(__name__)

# Context variables for tenant isolation
current_tenant_id: ContextVar[Optional[UUID]] = ContextVar('current_tenant_id', default=None)
current_tenant: ContextVar[Optional[Tenant]] = ContextVar('current_tenant', default=None)
current_tenant_context: ContextVar[Optional[Dict[str, Any]]] = ContextVar('current_tenant_context', default=None)


class TenantContext:
    """Manages tenant context and isolation"""
    
    def __init__(self):
        self._tenant_cache: Dict[UUID, Tenant] = {}
        self._quota_cache: Dict[UUID, TenantQuota] = {}
    
    async def get_tenant_from_jwt(self, token: str) -> Optional[Tenant]:
        """Extract tenant information from JWT token"""
        try:
            payload = jwt.decode(
                token, 
                settings.SECRET_KEY, 
                algorithms=[settings.ALGORITHM]
            )
            
            tenant_id = payload.get("tenant_id")
            if not tenant_id:
                return None
                
            return await self.get_tenant_by_id(UUID(tenant_id))
            
        except (JWTError, ValueError) as e:
            logger.warning(f"Invalid JWT token for tenant extraction: {e}")
            return None
    
    async def get_tenant_from_subdomain(self, subdomain: str, db: AsyncSession) -> Optional[Tenant]:
        """Get tenant from subdomain"""
        try:
            from sqlalchemy import select
            
            stmt = select(Tenant).where(Tenant.subdomain == subdomain)
            result = await db.execute(stmt)
            tenant = result.scalar_one_or_none()
            
            if tenant:
                self._tenant_cache[tenant.id] = tenant
            
            return tenant
            
        except Exception as e:
            logger.error(f"Error getting tenant from subdomain {subdomain}: {e}")
            return None
    
    async def get_tenant_by_id(self, tenant_id: UUID, db: Optional[AsyncSession] = None) -> Optional[Tenant]:
        """Get tenant by ID with caching"""
        if tenant_id in self._tenant_cache:
            return self._tenant_cache[tenant_id]
        
        if not db:
            return None
            
        try:
            from sqlalchemy import select
            
            stmt = select(Tenant).where(Tenant.id == tenant_id)
            result = await db.execute(stmt)
            tenant = result.scalar_one_or_none()
            
            if tenant:
                self._tenant_cache[tenant_id] = tenant
            
            return tenant
            
        except Exception as e:
            logger.error(f"Error getting tenant {tenant_id}: {e}")
            return None
    
    async def set_tenant_context(self, tenant: Tenant, db: AsyncSession):
        """Set tenant context for current request"""
        try:
            # Set context variables
            current_tenant_id.set(tenant.id)
            current_tenant.set(tenant)
            
            # Set database tenant context
            await self._set_db_tenant_context(tenant.id, db)
            
            # Set additional context
            context = {
                'tenant_id': tenant.id,
                'tenant_name': tenant.name,
                'tenant_plan': tenant.plan,
                'tenant_status': tenant.status
            }
            current_tenant_context.set(context)
            
            logger.debug(f"Set tenant context for {tenant.name} ({tenant.id})")
            
        except Exception as e:
            logger.error(f"Error setting tenant context: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to set tenant context"
            )
    
    async def _set_db_tenant_context(self, tenant_id: UUID, db: AsyncSession):
        """Set database-level tenant context for RLS"""
        try:
            # Set the tenant_id for row-level security
            await db.execute(
                text("SELECT set_config('app.current_tenant_id', :tenant_id, true)"),
                {"tenant_id": str(tenant_id)}
            )
            
        except Exception as e:
            logger.error(f"Error setting database tenant context: {e}")
            raise
    
    async def clear_tenant_context(self, db: AsyncSession):
        """Clear tenant context"""
        try:
            # Clear context variables
            current_tenant_id.set(None)
            current_tenant.set(None)
            current_tenant_context.set(None)
            
            # Clear database context
            await db.execute(
                text("SELECT set_config('app.current_tenant_id', '', true)")
            )
            
        except Exception as e:
            logger.error(f"Error clearing tenant context: {e}")
    
    def get_current_tenant_id(self) -> Optional[UUID]:
        """Get current tenant ID from context"""
        return current_tenant_id.get()
    
    def get_current_tenant(self) -> Optional[Tenant]:
        """Get current tenant from context"""
        return current_tenant.get()
    
    def get_current_tenant_context(self) -> Optional[Dict[str, Any]]:
        """Get current tenant context"""
        return current_tenant_context.get()
    
    async def check_tenant_quota(self, tenant_id: UUID, resource_type: str, amount: int = 1) -> bool:
        """Check if tenant has quota for resource"""
        try:
            quota = await self.get_tenant_quota(tenant_id)
            if not quota:
                return False
            
            usage = await self.get_tenant_usage(tenant_id)
            if not usage:
                return True
            
            # Check specific resource limits
            if resource_type == "storage":
                return (usage.storage_used + amount) <= quota.max_storage
            elif resource_type == "api_calls":
                return usage.api_calls_today < quota.max_api_calls_per_day
            elif resource_type == "users":
                return usage.active_users < quota.max_users
            elif resource_type == "projects":
                return usage.active_projects < quota.max_projects
            
            return True
            
        except Exception as e:
            logger.error(f"Error checking tenant quota: {e}")
            return False
    
    async def get_tenant_quota(self, tenant_id: UUID) -> Optional[TenantQuota]:
        """Get tenant quota with caching"""
        if tenant_id in self._quota_cache:
            return self._quota_cache[tenant_id]
        
        # This would be implemented with database access
        # For now, return None to indicate no quota found
        return None
    
    async def get_tenant_usage(self, tenant_id: UUID) -> Optional[TenantUsage]:
        """Get current tenant usage"""
        # This would be implemented with database access
        # For now, return None to indicate no usage found
        return None
    
    async def increment_usage(self, tenant_id: UUID, resource_type: str, amount: int = 1):
        """Increment tenant usage counter"""
        try:
            # This would update the tenant usage in database
            logger.debug(f"Incrementing {resource_type} usage for tenant {tenant_id} by {amount}")
            
        except Exception as e:
            logger.error(f"Error incrementing tenant usage: {e}")


# Global tenant context manager
tenant_context = TenantContext()


def require_tenant_context(func):
    """Decorator to ensure tenant context is set"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        if not tenant_context.get_current_tenant_id():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tenant context not set"
            )
        return await func(*args, **kwargs)
    return wrapper


def with_tenant_context(tenant_id: UUID):
    """Context manager for setting tenant context"""
    class TenantContextManager:
        def __init__(self, tenant_id: UUID):
            self.tenant_id = tenant_id
            self.previous_tenant_id = None
        
        async def __aenter__(self):
            self.previous_tenant_id = current_tenant_id.get()
            current_tenant_id.set(self.tenant_id)
            return self
        
        async def __aexit__(self, exc_type, exc_val, exc_tb):
            current_tenant_id.set(self.previous_tenant_id)
    
    return TenantContextManager(tenant_id)


class TenantIsolationError(Exception):
    """Raised when tenant isolation is violated"""
    pass


def ensure_tenant_isolation(tenant_id: UUID):
    """Ensure current context matches required tenant"""
    current_id = tenant_context.get_current_tenant_id()
    if current_id != tenant_id:
        raise TenantIsolationError(
            f"Tenant isolation violation: expected {tenant_id}, got {current_id}"
        )