from pydantic import BaseModel, Field
from datetime import datetime
from typing import Any, Dict

class Event(BaseModel):
    """Base event model."""
    event_type: str = Field(..., description="Type of the event")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Event timestamp")
    data: Dict[str, Any] = Field(..., description="Event-specific data")

class CertificateCreated(Event):
    """Event for certificate creation."""
    event_type: str = "CertificateCreated"
    certificate_id: str
    user_id: str

class ValidationCompleted(Event):
    """Event for validation completion."""
    event_type: str = "ValidationCompleted"
    validation_id: str
    result: str  # e.g., "success" or "failure"