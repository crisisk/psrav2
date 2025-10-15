"""
Tenant Management API
Provides endpoints for tenant CRUD operations, onboarding, and management
"""

from datetime import datetime, timedelta, date
from typing import List, Optional, Dict, Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload
from pydantic import BaseModel, EmailStr, validator

from app.core.database import get_db
from app.core.tenant_context import tenant_context, require_tenant_context
from app.models.tenant import (
    Tenant, TenantQuota, TenantUsage, TenantBilling, TenantAuditLog,
    TenantStatus, TenantPlan, BillingCycle
)
from app.models.user import User
from app.core.auth import get_current_admin_user
from app.core.config import settings

router = APIRouter(prefix="/tenants", tags=["tenants"])


# Pydantic Models
class TenantCreate(BaseModel):
    name: str
    subdomain: str
    company_name: Optional[str] = None
    contact_email: EmailStr
    contact_name: Optional[str] = None
    phone: Optional[str] = None
    plan: TenantPlan = TenantPlan.FREE
    billing_cycle: BillingCycle = BillingCycle.MONTHLY
    
    # Address
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    
    # Settings
    settings: Optional[Dict[str, Any]] = {}
    features: Optional[Dict[str, Any]] = {}
    
    @validator('subdomain')
    def validate_subdomain(cls, v):
        if not v.isalnum() and '-' not in v:
            raise ValueError('Subdomain must be alphanumeric with optional hyphens')
        if len(v) < 3 or len(v) > 50:
            raise ValueError('Subdomain must be between 3 and 50 characters')
        return v.lower()


class TenantUpdate(BaseModel):
    name: Optional[str] = None
    company_name: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_name: Optional[str] = None
    phone: Optional[str] = None
    domain: Optional[str] = None
    
    # Address
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    
    # Settings
    settings: Optional[Dict[str, Any]] = None
    features: Optional[Dict[str, Any]] = None


class TenantResponse(BaseModel):
    id: UUID
    name: str
    subdomain: str
    domain: Optional[str]
    company_name: Optional[str]
    contact_email: str
    contact_name: Optional[str]
    phone: Optional[str]
    status: TenantStatus
    plan: TenantPlan
    billing_cycle: BillingCycle
    created_at: datetime
    updated_at: Optional[datetime]
    activated_at: Optional[datetime]
    trial_ends_at: Optional[datetime]
    settings: Dict[str, Any]
    features: Dict[str, Any]
    
    class Config:
        from_attributes = True


class TenantQuotaCreate(BaseModel):
    max_storage: int = 1073741824  # 1GB
    max_file_size: int = 104857600  # 100MB
    max_users: int = 5
    max_admin_users: int = 2
    max_projects: int = 10
    max_assessments_per_project: int = 100
    max_api_calls_per_day: int = 10000
    max_api_calls_per_hour: int = 1000
    max_concurrent_requests: int = 10
    max_custom_fields: int = 50
    max_integrations: int = 5
    max_webhooks: int = 10
    max_reports_per_month: int = 100
    max_scheduled_reports: int = 10
    max_backup_retention_days: int = 30
    max_backup_size: int = 5368709120  # 5GB


class TenantQuotaResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    max_storage: int
    max_file_size: int
    max_users: int
    max_admin_users: int
    max_projects: int
    max_assessments_per_project: int
    max_api_calls_per_day: int
    max_api_calls_per_hour: int
    max_concurrent_requests: int
    max_custom_fields: int
    max_integrations: int
    max_webhooks: int
    max_reports_per_month: int
    max_scheduled_reports: int
    max_backup_retention_days: int
    max_backup_size: int
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class TenantUsageResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    date: date
    storage_used: int
    files_count: int
    active_users: int
    total_users: int
    active_projects: int
    total_projects: int
    assessments_created: int
    api_calls_today: int
    api_calls_this_hour: int
    custom_fields_used: int
    integrations_active: int
    webhooks_active: int
    reports_generated: int
    scheduled_reports_active: int
    backup_size: int
    backup_count: int
    login_count: int
    session_duration_minutes: int
    
    class Config:
        from_attributes = True


class TenantStatsResponse(BaseModel):
    total_tenants: int
    active_tenants: int
    trial_tenants: int
    suspended_tenants: int
    total_users: int
    total_projects: int
    total_storage_used: int
    total_api_calls_today: int
    revenue_this_month: float
    growth_rate: float


# Admin Endpoints
@router.post("/", response_model=TenantResponse)
async def create_tenant(
    tenant_data: TenantCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Create a new tenant (Admin only)"""
    
    # Check if subdomain already exists
    stmt = select(Tenant).where(Tenant.subdomain == tenant_data.subdomain)
    existing_tenant = await db.execute(stmt)
    if existing_tenant.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Subdomain already exists"
        )
    
    # Create tenant
    tenant = Tenant(
        **tenant_data.dict(),
        status=TenantStatus.PENDING
    )
    
    db.add(tenant)
    await db.flush()  # Get the ID
    
    # Create default quota
    quota = TenantQuota(tenant_id=tenant.id)
    db.add(quota)
    
    # Create initial usage record
    usage = TenantUsage(tenant_id=tenant.id)
    db.add(usage)
    
    # Create audit log
    audit_log = TenantAuditLog(
        tenant_id=tenant.id,
        event_type="tenant_created",
        event_description=f"Tenant '{tenant.name}' created by admin",
        user_id=current_user.id,
        user_email=current_user.email,
        new_values=tenant_data.dict()
    )
    db.add(audit_log)
    
    await db.commit()
    await db.refresh(tenant)
    
    # Schedule onboarding tasks
    background_tasks.add_task(onboard_tenant, tenant.id)
    
    return tenant


@router.get("/", response_model=List[TenantResponse])
async def list_tenants(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[TenantStatus] = None,
    plan: Optional[TenantPlan] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """List all tenants with filtering (Admin only)"""
    
    stmt = select(Tenant)
    
    # Apply filters
    if status:
        stmt = stmt.where(Tenant.status == status)
    
    if plan:
        stmt = stmt.where(Tenant.plan == plan)
    
    if search:
        search_term = f"%{search}%"
        stmt = stmt.where(
            or_(
                Tenant.name.ilike(search_term),
                Tenant.subdomain.ilike(search_term),
                Tenant.company_name.ilike(search_term),
                Tenant.contact_email.ilike(search_term)
            )
        )
    
    stmt = stmt.offset(skip).limit(limit).order_by(Tenant.created_at.desc())
    
    result = await db.execute(stmt)
    tenants = result.scalars().all()
    
    return tenants


@router.get("/stats", response_model=TenantStatsResponse)
async def get_tenant_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Get tenant statistics (Admin only)"""
    
    # Get tenant counts
    total_tenants = await db.scalar(select(func.count(Tenant.id)))
    active_tenants = await db.scalar(
        select(func.count(Tenant.id)).where(Tenant.status == TenantStatus.ACTIVE)
    )
    trial_tenants = await db.scalar(
        select(func.count(Tenant.id)).where(Tenant.status == TenantStatus.TRIAL)
    )
    suspended_tenants = await db.scalar(
        select(func.count(Tenant.id)).where(Tenant.status == TenantStatus.SUSPENDED)
    )
    
    # Get usage stats
    today = date.today()
    usage_stats = await db.execute(
        select(
            func.sum(TenantUsage.active_users),
            func.sum(TenantUsage.active_projects),
            func.sum(TenantUsage.storage_used),
            func.sum(TenantUsage.api_calls_today)
        ).where(TenantUsage.date == today)
    )
    
    total_users, total_projects, total_storage_used, total_api_calls_today = usage_stats.first()
    
    # Get revenue stats (this month)
    first_day_of_month = today.replace(day=1)
    revenue_stats = await db.execute(
        select(func.sum(TenantBilling.total_amount))
        .where(
            and_(
                TenantBilling.billing_period_start >= first_day_of_month,
                TenantBilling.status == "paid"
            )
        )
    )
    revenue_this_month = revenue_stats.scalar() or 0
    
    # Calculate growth rate (simplified)
    last_month_start = (first_day_of_month - timedelta(days=1)).replace(day=1)
    last_month_tenants = await db.scalar(
        select(func.count(Tenant.id))
        .where(Tenant.created_at < first_day_of_month)
    )
    
    growth_rate = 0.0
    if last_month_tenants > 0:
        growth_rate = ((total_tenants - last_month_tenants) / last_month_tenants) * 100
    
    return TenantStatsResponse(
        total_tenants=total_tenants or 0,
        active_tenants=active_tenants or 0,
        trial_tenants=trial_tenants or 0,
        suspended_tenants=suspended_tenants or 0,
        total_users=total_users or 0,
        total_projects=total_projects or 0,
        total_storage_used=total_storage_used or 0,
        total_api_calls_today=total_api_calls_today or 0,
        revenue_this_month=float(revenue_this_month),
        growth_rate=growth_rate
    )


@router.get("/{tenant_id}", response_model=TenantResponse)
async def get_tenant(
    tenant_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Get tenant by ID (Admin only)"""
    
    stmt = select(Tenant).where(Tenant.id == tenant_id)
    result = await db.execute(stmt)
    tenant = result.scalar_one_or_none()
    
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    return tenant


@router.put("/{tenant_id}", response_model=TenantResponse)
async def update_tenant(
    tenant_id: UUID,
    tenant_data: TenantUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Update tenant (Admin only)"""
    
    stmt = select(Tenant).where(Tenant.id == tenant_id)
    result = await db.execute(stmt)
    tenant = result.scalar_one_or_none()
    
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    # Store old values for audit
    old_values = {
        "name": tenant.name,
        "company_name": tenant.company_name,
        "contact_email": tenant.contact_email,
        "settings": tenant.settings,
        "features": tenant.features
    }
    
    # Update tenant
    update_data = tenant_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(tenant, field, value)
    
    tenant.updated_at = datetime.utcnow()
    
    # Create audit log
    audit_log = TenantAuditLog(
        tenant_id=tenant.id,
        event_type="tenant_updated",
        event_description=f"Tenant '{tenant.name}' updated by admin",
        user_id=current_user.id,
        user_email=current_user.email,
        old_values=old_values,
        new_values=update_data
    )
    db.add(audit_log)
    
    await db.commit()
    await db.refresh(tenant)
    
    return tenant


@router.post("/{tenant_id}/activate")
async def activate_tenant(
    tenant_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Activate tenant (Admin only)"""
    
    stmt = select(Tenant).where(Tenant.id == tenant_id)
    result = await db.execute(stmt)
    tenant = result.scalar_one_or_none()
    
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    if tenant.status == TenantStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant is already active"
        )
    
    tenant.status = TenantStatus.ACTIVE
    tenant.activated_at = datetime.utcnow()
    tenant.updated_at = datetime.utcnow()
    
    # Create audit log
    audit_log = TenantAuditLog(
        tenant_id=tenant.id,
        event_type="tenant_activated",
        event_description=f"Tenant '{tenant.name}' activated by admin",
        user_id=current_user.id,
        user_email=current_user.email
    )
    db.add(audit_log)
    
    await db.commit()
    
    return {"message": "Tenant activated successfully"}


@router.post("/{tenant_id}/suspend")
async def suspend_tenant(
    tenant_id: UUID,
    reason: str = Query(..., description="Reason for suspension"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Suspend tenant (Admin only)"""
    
    stmt = select(Tenant).where(Tenant.id == tenant_id)
    result = await db.execute(stmt)
    tenant = result.scalar_one_or_none()
    
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    if tenant.status == TenantStatus.SUSPENDED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant is already suspended"
        )
    
    tenant.status = TenantStatus.SUSPENDED
    tenant.suspended_at = datetime.utcnow()
    tenant.updated_at = datetime.utcnow()
    
    # Create audit log
    audit_log = TenantAuditLog(
        tenant_id=tenant.id,
        event_type="tenant_suspended",
        event_description=f"Tenant '{tenant.name}' suspended by admin. Reason: {reason}",
        user_id=current_user.id,
        user_email=current_user.email,
        metadata={"reason": reason}
    )
    db.add(audit_log)
    
    await db.commit()
    
    return {"message": "Tenant suspended successfully"}


# Tenant Quota Management
@router.get("/{tenant_id}/quota", response_model=TenantQuotaResponse)
async def get_tenant_quota(
    tenant_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Get tenant quota (Admin only)"""
    
    stmt = select(TenantQuota).where(TenantQuota.tenant_id == tenant_id)
    result = await db.execute(stmt)
    quota = result.scalar_one_or_none()
    
    if not quota:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant quota not found"
        )
    
    return quota


@router.put("/{tenant_id}/quota", response_model=TenantQuotaResponse)
async def update_tenant_quota(
    tenant_id: UUID,
    quota_data: TenantQuotaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Update tenant quota (Admin only)"""
    
    stmt = select(TenantQuota).where(TenantQuota.tenant_id == tenant_id)
    result = await db.execute(stmt)
    quota = result.scalar_one_or_none()
    
    if not quota:
        # Create new quota
        quota = TenantQuota(tenant_id=tenant_id, **quota_data.dict())
        db.add(quota)
    else:
        # Update existing quota
        for field, value in quota_data.dict().items():
            setattr(quota, field, value)
        quota.updated_at = datetime.utcnow()
    
    # Create audit log
    audit_log = TenantAuditLog(
        tenant_id=tenant_id,
        event_type="quota_updated",
        event_description=f"Quota updated for tenant {tenant_id}",
        user_id=current_user.id,
        user_email=current_user.email,
        new_values=quota_data.dict()
    )
    db.add(audit_log)
    
    await db.commit()
    await db.refresh(quota)
    
    return quota


# Tenant Usage and Analytics
@router.get("/{tenant_id}/usage", response_model=List[TenantUsageResponse])
async def get_tenant_usage(
    tenant_id: UUID,
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Get tenant usage history (Admin only)"""
    
    start_date = date.today() - timedelta(days=days)
    
    stmt = select(TenantUsage).where(
        and_(
            TenantUsage.tenant_id == tenant_id,
            TenantUsage.date >= start_date
        )
    ).order_by(TenantUsage.date.desc())
    
    result = await db.execute(stmt)
    usage_records = result.scalars().all()
    
    return usage_records


# Self-service endpoints for tenants
@router.get("/me/info", response_model=TenantResponse)
@require_tenant_context
async def get_my_tenant_info(
    db: AsyncSession = Depends(get_db)
):
    """Get current tenant information"""
    
    tenant = tenant_context.get_current_tenant()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant context not found"
        )
    
    return tenant


@router.get("/me/usage", response_model=TenantUsageResponse)
@require_tenant_context
async def get_my_tenant_usage(
    db: AsyncSession = Depends(get_db)
):
    """Get current tenant usage"""
    
    tenant_id = tenant_context.get_current_tenant_id()
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant context not found"
        )
    
    today = date.today()
    stmt = select(TenantUsage).where(
        and_(
            TenantUsage.tenant_id == tenant_id,
            TenantUsage.date == today
        )
    )
    
    result = await db.execute(stmt)
    usage = result.scalar_one_or_none()
    
    if not usage:
        # Create today's usage record if it doesn't exist
        usage = TenantUsage(tenant_id=tenant_id, date=today)
        db.add(usage)
        await db.commit()
        await db.refresh(usage)
    
    return usage


@router.get("/me/quota", response_model=TenantQuotaResponse)
@require_tenant_context
async def get_my_tenant_quota(
    db: AsyncSession = Depends(get_db)
):
    """Get current tenant quota"""
    
    tenant_id = tenant_context.get_current_tenant_id()
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant context not found"
        )
    
    stmt = select(TenantQuota).where(TenantQuota.tenant_id == tenant_id)
    result = await db.execute(stmt)
    quota = result.scalar_one_or_none()
    
    if not quota:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant quota not found"
        )
    
    return quota


# Background Tasks
async def onboard_tenant(tenant_id: UUID):
    """Background task for tenant onboarding"""
    try:
        # This would include:
        # 1. Send welcome email
        # 2. Create default admin user
        # 3. Set up default projects/templates
        # 4. Initialize integrations
        # 5. Send onboarding notifications
        
        print(f"Onboarding tenant {tenant_id}")
        
        # Simulate onboarding tasks
        import asyncio
        await asyncio.sleep(5)
        
        print(f"Tenant {tenant_id} onboarding completed")
        
    except Exception as e:
        print(f"Error onboarding tenant {tenant_id}: {e}")