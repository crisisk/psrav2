"""
Webhook Data Models

Pydantic models for webhook configuration, events, and delivery logs.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, HttpUrl, validator


class WebhookEventType(str, Enum):
    """Supported webhook event types"""
    ORIGIN_CHECKED = "origin.checked"
    CERTIFICATE_GENERATED = "certificate.generated"
    CERTIFICATE_EXPIRED = "certificate.expired"
    LTSD_VALIDATED = "ltsd.validated"
    LTSD_REJECTED = "ltsd.rejected"


class WebhookStatus(str, Enum):
    """Webhook registration status"""
    ACTIVE = "active"
    PAUSED = "paused"
    DISABLED = "disabled"


class WebhookDeliveryStatus(str, Enum):
    """Webhook delivery attempt status"""
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"
    RETRY = "retry"


class WebhookCreate(BaseModel):
    """Request model for creating a webhook"""
    url: HttpUrl = Field(..., description="HTTPS endpoint to receive webhooks")
    events: List[WebhookEventType] = Field(..., min_items=1, description="Event types to subscribe to")
    secret: str = Field(..., min_length=32, max_length=128, description="Secret for HMAC signature verification")
    description: Optional[str] = Field(None, max_length=255, description="Optional description")

    @validator('url')
    def validate_https(cls, v):
        if not str(v).startswith('https://'):
            raise ValueError('Webhook URL must use HTTPS')
        return v


class WebhookUpdate(BaseModel):
    """Request model for updating a webhook"""
    url: Optional[HttpUrl] = None
    events: Optional[List[WebhookEventType]] = None
    secret: Optional[str] = Field(None, min_length=32, max_length=128)
    description: Optional[str] = Field(None, max_length=255)
    status: Optional[WebhookStatus] = None


class WebhookConfig(BaseModel):
    """Webhook configuration stored in database"""
    id: str = Field(..., description="Unique webhook identifier")
    partner_id: str = Field(..., description="Partner/tenant identifier")
    url: str = Field(..., description="Webhook endpoint URL")
    events: List[str] = Field(..., description="Subscribed event types")
    secret: str = Field(..., description="HMAC secret (encrypted in DB)")
    description: Optional[str] = None
    status: WebhookStatus = WebhookStatus.ACTIVE
    created_at: datetime
    updated_at: datetime
    last_delivery_at: Optional[datetime] = None

    # Delivery statistics
    total_deliveries: int = 0
    successful_deliveries: int = 0
    failed_deliveries: int = 0

    class Config:
        orm_mode = True


class WebhookEvent(BaseModel):
    """Webhook event payload"""
    event: WebhookEventType = Field(..., description="Event type")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Event timestamp")
    data: Dict[str, Any] = Field(..., description="Event-specific data")
    partner_id: str = Field(..., description="Partner identifier")
    correlation_id: Optional[str] = Field(None, description="Request correlation ID")

    class Config:
        use_enum_values = True


class WebhookDelivery(BaseModel):
    """Webhook delivery attempt record"""
    id: str = Field(..., description="Delivery attempt ID")
    webhook_id: str = Field(..., description="Webhook configuration ID")
    event_type: str = Field(..., description="Event type delivered")
    payload: Dict[str, Any] = Field(..., description="Full event payload")
    status: WebhookDeliveryStatus = WebhookDeliveryStatus.PENDING

    # Delivery details
    attempt: int = Field(1, ge=1, le=3, description="Delivery attempt number (1-3)")
    response_status: Optional[int] = Field(None, description="HTTP response status code")
    response_body: Optional[str] = Field(None, max_length=1000, description="Truncated response body")
    error_message: Optional[str] = Field(None, max_length=500, description="Error message if failed")

    # Timing
    created_at: datetime = Field(default_factory=datetime.utcnow)
    delivered_at: Optional[datetime] = None
    next_retry_at: Optional[datetime] = None

    # Metadata
    duration_ms: Optional[int] = Field(None, description="Delivery duration in milliseconds")

    class Config:
        orm_mode = True


class WebhookDeliveryResponse(BaseModel):
    """Response model for webhook delivery status"""
    delivery_id: str
    status: WebhookDeliveryStatus
    attempt: int
    response_status: Optional[int] = None
    error_message: Optional[str] = None
    next_retry_at: Optional[datetime] = None


class WebhookStats(BaseModel):
    """Webhook delivery statistics"""
    webhook_id: str
    partner_id: str
    url: str
    status: WebhookStatus

    # Overall statistics
    total_deliveries: int = 0
    successful_deliveries: int = 0
    failed_deliveries: int = 0
    success_rate: float = 0.0

    # Recent activity
    last_delivery_at: Optional[datetime] = None
    last_success_at: Optional[datetime] = None
    last_failure_at: Optional[datetime] = None

    # By event type
    deliveries_by_event: Dict[str, int] = Field(default_factory=dict)


class WebhookListResponse(BaseModel):
    """Response model for listing webhooks"""
    webhooks: List[WebhookConfig]
    total: int
    page: int = 1
    page_size: int = 25
