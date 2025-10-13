"""
API Key Data Models

Pydantic models for Partner API key management and validation.
"""

from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, validator


class APIKeyStatus(str, Enum):
    """API key status enum"""
    ACTIVE = "active"
    REVOKED = "revoked"
    EXPIRED = "expired"
    SUSPENDED = "suspended"


class APIKey(BaseModel):
    """
    API Key model for Partner API authentication.

    Stores hashed API keys (never plaintext) with metadata for tracking and management.
    """

    id: str = Field(..., description="Unique API key identifier (UUID)")
    key_prefix: str = Field(..., min_length=8, max_length=8, description="First 8 chars of key for identification")
    key_hash: str = Field(..., min_length=64, max_length=64, description="SHA-256 hash of the API key")

    # Partner information
    partner_id: Optional[str] = Field(None, description="Partner/tenant identifier (if using multi-tenancy)")
    partner_name: str = Field(..., min_length=1, max_length=255, description="Partner organization name")
    contact_email: Optional[str] = Field(None, description="Partner contact email")

    # Key lifecycle
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Key creation timestamp")
    expires_at: Optional[datetime] = Field(None, description="Key expiration timestamp (None = no expiration)")
    last_used_at: Optional[datetime] = Field(None, description="Last time key was used successfully")
    revoked_at: Optional[datetime] = Field(None, description="Revocation timestamp")
    revoked_by: Optional[str] = Field(None, description="User who revoked the key")
    revocation_reason: Optional[str] = Field(None, max_length=500, description="Reason for revocation")

    # Status and configuration
    is_active: bool = Field(True, description="Whether key is active and can be used")
    status: APIKeyStatus = Field(APIKeyStatus.ACTIVE, description="Current key status")

    # Usage tracking
    usage_count: int = Field(0, ge=0, description="Total number of successful API calls")
    rate_limit: int = Field(100, ge=1, le=1000, description="Max requests per minute")

    # Metadata
    description: Optional[str] = Field(None, max_length=500, description="Optional key description")
    created_by: Optional[str] = Field(None, description="User who created the key")
    scopes: list[str] = Field(default_factory=list, description="API access scopes/permissions")
    environment: str = Field("production", description="Environment: production, staging, development")

    class Config:
        orm_mode = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

    @validator('key_hash')
    def validate_key_hash(cls, v):
        """Validate that key_hash is a valid SHA-256 hex string"""
        if not v or len(v) != 64:
            raise ValueError('key_hash must be 64 characters (SHA-256 hex)')
        if not all(c in '0123456789abcdef' for c in v.lower()):
            raise ValueError('key_hash must be hexadecimal')
        return v.lower()

    @validator('key_prefix')
    def validate_key_prefix(cls, v):
        """Validate that key_prefix is 8 hex characters"""
        if not v or len(v) != 8:
            raise ValueError('key_prefix must be 8 characters')
        if not all(c in '0123456789abcdef' for c in v.lower()):
            raise ValueError('key_prefix must be hexadecimal')
        return v.lower()

    @validator('status', always=True)
    def sync_status_with_flags(cls, v, values):
        """Synchronize status field with is_active and revoked_at"""
        if 'revoked_at' in values and values['revoked_at']:
            return APIKeyStatus.REVOKED
        if 'expires_at' in values and values['expires_at']:
            if values['expires_at'] < datetime.utcnow():
                return APIKeyStatus.EXPIRED
        if 'is_active' in values and not values['is_active']:
            return APIKeyStatus.SUSPENDED
        return APIKeyStatus.ACTIVE

    def is_valid(self) -> bool:
        """Check if the API key is valid (active, not expired, not revoked)"""
        if not self.is_active:
            return False
        if self.revoked_at is not None:
            return False
        if self.expires_at and self.expires_at < datetime.utcnow():
            return False
        return True

    def days_until_expiry(self) -> Optional[int]:
        """Calculate days remaining until expiration"""
        if not self.expires_at:
            return None
        delta = self.expires_at - datetime.utcnow()
        return max(0, delta.days)

    def should_renew(self, threshold_days: int = 30) -> bool:
        """Check if key should be renewed (within threshold days of expiration)"""
        days_left = self.days_until_expiry()
        if days_left is None:
            return False
        return days_left <= threshold_days


class APIKeyCreate(BaseModel):
    """Request model for creating a new API key"""
    partner_name: str = Field(..., min_length=1, max_length=255, description="Partner organization name")
    contact_email: Optional[str] = Field(None, description="Partner contact email")
    description: Optional[str] = Field(None, max_length=500, description="Key description/purpose")
    expires_days: int = Field(365, ge=1, le=1825, description="Days until expiration (max 5 years)")
    rate_limit: int = Field(100, ge=1, le=1000, description="Max requests per minute")
    scopes: list[str] = Field(default_factory=lambda: ["read", "write"], description="API access scopes")
    environment: str = Field("production", description="Environment: production, staging, development")
    created_by: Optional[str] = Field(None, description="User creating the key")


class APIKeyResponse(BaseModel):
    """Response model when returning API key information"""
    id: str
    key_prefix: str
    partner_name: str
    contact_email: Optional[str]
    created_at: datetime
    expires_at: Optional[datetime]
    last_used_at: Optional[datetime]
    is_active: bool
    status: APIKeyStatus
    usage_count: int
    rate_limit: int
    description: Optional[str]
    scopes: list[str]
    environment: str
    days_until_expiry: Optional[int]

    class Config:
        orm_mode = True


class APIKeyGenerateResponse(BaseModel):
    """Response when generating a new API key (includes plaintext key - only shown once!)"""
    api_key: str = Field(..., description="Plaintext API key (save this securely - shown only once!)")
    key_id: str = Field(..., description="Unique key identifier")
    key_prefix: str = Field(..., description="First 8 chars for identification")
    partner_name: str
    created_at: datetime
    expires_at: Optional[datetime]
    rate_limit: int
    scopes: list[str]
    environment: str

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }


class APIKeyRevoke(BaseModel):
    """Request model for revoking an API key"""
    key_id: str = Field(..., description="ID of the key to revoke")
    revoked_by: str = Field(..., description="User revoking the key")
    reason: str = Field(..., min_length=1, max_length=500, description="Reason for revocation")


class APIKeyUpdate(BaseModel):
    """Request model for updating API key metadata"""
    description: Optional[str] = Field(None, max_length=500)
    rate_limit: Optional[int] = Field(None, ge=1, le=1000)
    is_active: Optional[bool] = None
    scopes: Optional[list[str]] = None


class APIKeyStats(BaseModel):
    """Statistics for API key usage"""
    key_id: str
    key_prefix: str
    partner_name: str
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    last_24h_requests: int = 0
    last_7d_requests: int = 0
    avg_response_time_ms: Optional[float] = None
    last_used_at: Optional[datetime] = None
    created_at: datetime


class APIKeyListResponse(BaseModel):
    """Response model for listing API keys"""
    keys: list[APIKeyResponse]
    total: int
    active_count: int = 0
    expired_count: int = 0
    revoked_count: int = 0
    page: int = 1
    page_size: int = 25
