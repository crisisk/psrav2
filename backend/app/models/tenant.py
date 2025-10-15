"""
Tenant Models for Multi-Tenancy Support
Defines tenant, quota, usage, and billing models
"""

from datetime import datetime, date
from decimal import Decimal
from enum import Enum
from typing import Optional, List
from uuid import UUID, uuid4

from sqlalchemy import (
    Column, String, DateTime, Boolean, Integer, 
    Numeric, Text, ForeignKey, Date, JSON, Index
)
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
from sqlalchemy.orm import relationship, Mapped
from sqlalchemy.sql import func

from app.core.database import Base


class TenantStatus(str, Enum):
    """Tenant status enumeration"""
    ACTIVE = "active"
    SUSPENDED = "suspended"
    PENDING = "pending"
    CANCELLED = "cancelled"
    TRIAL = "trial"


class TenantPlan(str, Enum):
    """Tenant plan enumeration"""
    FREE = "free"
    BASIC = "basic"
    PROFESSIONAL = "professional"
    ENTERPRISE = "enterprise"
    CUSTOM = "custom"


class BillingCycle(str, Enum):
    """Billing cycle enumeration"""
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"


class Tenant(Base):
    """Tenant model for multi-tenancy"""
    __tablename__ = "tenants"
    
    id = Column(PostgresUUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(255), nullable=False, index=True)
    subdomain = Column(String(100), unique=True, nullable=False, index=True)
    domain = Column(String(255), nullable=True)  # Custom domain
    
    # Contact Information
    company_name = Column(String(255), nullable=True)
    contact_email = Column(String(255), nullable=False)
    contact_name = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    
    # Address
    address_line1 = Column(String(255), nullable=True)
    address_line2 = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    postal_code = Column(String(20), nullable=True)
    country = Column(String(100), nullable=True)
    
    # Tenant Configuration
    status = Column(String(20), nullable=False, default=TenantStatus.PENDING)
    plan = Column(String(20), nullable=False, default=TenantPlan.FREE)
    billing_cycle = Column(String(20), nullable=False, default=BillingCycle.MONTHLY)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    activated_at = Column(DateTime(timezone=True), nullable=True)
    trial_ends_at = Column(DateTime(timezone=True), nullable=True)
    suspended_at = Column(DateTime(timezone=True), nullable=True)
    
    # Settings
    settings = Column(JSON, nullable=True, default={})
    features = Column(JSON, nullable=True, default={})
    
    # Relationships
    quota = relationship("TenantQuota", back_populates="tenant", uselist=False)
    usage_records = relationship("TenantUsage", back_populates="tenant")
    billing_records = relationship("TenantBilling", back_populates="tenant")
    users = relationship("User", back_populates="tenant")
    
    # Indexes
    __table_args__ = (
        Index('idx_tenant_status_plan', 'status', 'plan'),
        Index('idx_tenant_created_at', 'created_at'),
    )
    
    def __repr__(self):
        return f"<Tenant(id={self.id}, name='{self.name}', subdomain='{self.subdomain}')>"
    
    @property
    def is_active(self) -> bool:
        """Check if tenant is active"""
        return self.status == TenantStatus.ACTIVE
    
    @property
    def is_trial(self) -> bool:
        """Check if tenant is on trial"""
        return self.status == TenantStatus.TRIAL
    
    @property
    def trial_expired(self) -> bool:
        """Check if trial has expired"""
        if not self.trial_ends_at:
            return False
        return datetime.utcnow() > self.trial_ends_at


class TenantQuota(Base):
    """Tenant quota limits"""
    __tablename__ = "tenant_quotas"
    
    id = Column(PostgresUUID(as_uuid=True), primary_key=True, default=uuid4)
    tenant_id = Column(PostgresUUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, unique=True)
    
    # Storage Quotas (in bytes)
    max_storage = Column(Numeric(20, 0), nullable=False, default=1073741824)  # 1GB default
    max_file_size = Column(Numeric(20, 0), nullable=False, default=104857600)  # 100MB default
    
    # User Quotas
    max_users = Column(Integer, nullable=False, default=5)
    max_admin_users = Column(Integer, nullable=False, default=2)
    
    # Project Quotas
    max_projects = Column(Integer, nullable=False, default=10)
    max_assessments_per_project = Column(Integer, nullable=False, default=100)
    
    # API Quotas
    max_api_calls_per_day = Column(Integer, nullable=False, default=10000)
    max_api_calls_per_hour = Column(Integer, nullable=False, default=1000)
    max_concurrent_requests = Column(Integer, nullable=False, default=10)
    
    # Feature Quotas
    max_custom_fields = Column(Integer, nullable=False, default=50)
    max_integrations = Column(Integer, nullable=False, default=5)
    max_webhooks = Column(Integer, nullable=False, default=10)
    
    # Report Quotas
    max_reports_per_month = Column(Integer, nullable=False, default=100)
    max_scheduled_reports = Column(Integer, nullable=False, default=10)
    
    # Backup Quotas
    max_backup_retention_days = Column(Integer, nullable=False, default=30)
    max_backup_size = Column(Numeric(20, 0), nullable=False, default=5368709120)  # 5GB
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship
    tenant = relationship("Tenant", back_populates="quota")
    
    def __repr__(self):
        return f"<TenantQuota(tenant_id={self.tenant_id}, max_users={self.max_users})>"


class TenantUsage(Base):
    """Tenant usage tracking"""
    __tablename__ = "tenant_usage"
    
    id = Column(PostgresUUID(as_uuid=True), primary_key=True, default=uuid4)
    tenant_id = Column(PostgresUUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    date = Column(Date, nullable=False, default=date.today)
    
    # Storage Usage
    storage_used = Column(Numeric(20, 0), nullable=False, default=0)
    files_count = Column(Integer, nullable=False, default=0)
    
    # User Usage
    active_users = Column(Integer, nullable=False, default=0)
    total_users = Column(Integer, nullable=False, default=0)
    
    # Project Usage
    active_projects = Column(Integer, nullable=False, default=0)
    total_projects = Column(Integer, nullable=False, default=0)
    assessments_created = Column(Integer, nullable=False, default=0)
    
    # API Usage
    api_calls_today = Column(Integer, nullable=False, default=0)
    api_calls_this_hour = Column(Integer, nullable=False, default=0)
    
    # Feature Usage
    custom_fields_used = Column(Integer, nullable=False, default=0)
    integrations_active = Column(Integer, nullable=False, default=0)
    webhooks_active = Column(Integer, nullable=False, default=0)
    
    # Report Usage
    reports_generated = Column(Integer, nullable=False, default=0)
    scheduled_reports_active = Column(Integer, nullable=False, default=0)
    
    # Backup Usage
    backup_size = Column(Numeric(20, 0), nullable=False, default=0)
    backup_count = Column(Integer, nullable=False, default=0)
    
    # Additional Metrics
    login_count = Column(Integer, nullable=False, default=0)
    session_duration_minutes = Column(Integer, nullable=False, default=0)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship
    tenant = relationship("Tenant", back_populates="usage_records")
    
    # Indexes
    __table_args__ = (
        Index('idx_tenant_usage_date', 'tenant_id', 'date'),
        Index('idx_tenant_usage_created', 'created_at'),
    )
    
    def __repr__(self):
        return f"<TenantUsage(tenant_id={self.tenant_id}, date={self.date})>"


class TenantBilling(Base):
    """Tenant billing records"""
    __tablename__ = "tenant_billing"
    
    id = Column(PostgresUUID(as_uuid=True), primary_key=True, default=uuid4)
    tenant_id = Column(PostgresUUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    
    # Billing Period
    billing_period_start = Column(Date, nullable=False)
    billing_period_end = Column(Date, nullable=False)
    
    # Amounts
    base_amount = Column(Numeric(10, 2), nullable=False, default=0)
    usage_amount = Column(Numeric(10, 2), nullable=False, default=0)
    discount_amount = Column(Numeric(10, 2), nullable=False, default=0)
    tax_amount = Column(Numeric(10, 2), nullable=False, default=0)
    total_amount = Column(Numeric(10, 2), nullable=False, default=0)
    
    # Currency
    currency = Column(String(3), nullable=False, default="USD")
    
    # Status
    status = Column(String(20), nullable=False, default="pending")  # pending, paid, failed, cancelled
    
    # Payment Information
    payment_method = Column(String(50), nullable=True)
    payment_reference = Column(String(255), nullable=True)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    
    # Invoice Information
    invoice_number = Column(String(100), nullable=True, unique=True)
    invoice_url = Column(String(500), nullable=True)
    
    # Usage Details
    usage_details = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    due_date = Column(DateTime(timezone=True), nullable=True)
    
    # Relationship
    tenant = relationship("Tenant", back_populates="billing_records")
    
    # Indexes
    __table_args__ = (
        Index('idx_tenant_billing_period', 'tenant_id', 'billing_period_start', 'billing_period_end'),
        Index('idx_tenant_billing_status', 'status'),
        Index('idx_tenant_billing_due_date', 'due_date'),
    )
    
    def __repr__(self):
        return f"<TenantBilling(tenant_id={self.tenant_id}, total_amount={self.total_amount})>"


class TenantAuditLog(Base):
    """Tenant audit log for tracking changes"""
    __tablename__ = "tenant_audit_logs"
    
    id = Column(PostgresUUID(as_uuid=True), primary_key=True, default=uuid4)
    tenant_id = Column(PostgresUUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    
    # Event Information
    event_type = Column(String(100), nullable=False)  # created, updated, suspended, etc.
    event_description = Column(Text, nullable=True)
    
    # User Information
    user_id = Column(PostgresUUID(as_uuid=True), nullable=True)
    user_email = Column(String(255), nullable=True)
    user_ip = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    
    # Change Details
    old_values = Column(JSON, nullable=True)
    new_values = Column(JSON, nullable=True)
    
    # Additional Context
    metadata = Column(JSON, nullable=True)
    
    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Indexes
    __table_args__ = (
        Index('idx_tenant_audit_tenant_event', 'tenant_id', 'event_type'),
        Index('idx_tenant_audit_created', 'created_at'),
        Index('idx_tenant_audit_user', 'user_id'),
    )
    
    def __repr__(self):
        return f"<TenantAuditLog(tenant_id={self.tenant_id}, event_type='{self.event_type}')>"


# Add tenant_id to existing models for multi-tenancy
def add_tenant_column():
    """Helper function to add tenant_id to existing models"""
    
    # This would be used to modify existing models
    # Example for User model:
    """
    class User(Base):
        # ... existing columns ...
        tenant_id = Column(PostgresUUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
        
        # Relationship
        tenant = relationship("Tenant", back_populates="users")
        
        # Add to table args
        __table_args__ = (
            # ... existing indexes ...
            Index('idx_user_tenant', 'tenant_id'),
        )
    """
    pass