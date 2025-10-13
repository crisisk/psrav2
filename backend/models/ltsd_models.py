"""
LTSD Data Models for Task 2.4 - LTSD Backend Service

Comprehensive models for LTSD management, validation, and lifecycle.
"""

from __future__ import annotations

from datetime import date, datetime
from enum import Enum
from typing import List, Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field, validator


class LTSDStatus(str, Enum):
    """LTSD declaration status."""
    DRAFT = "draft"
    ACTIVE = "active"
    EXPIRED = "expired"
    REVOKED = "revoked"
    SUPERSEDED = "superseded"


class LTSDType(str, Enum):
    """Type of LTSD declaration."""
    PREFERENTIAL = "preferential"
    NON_PREFERENTIAL = "non_preferential"
    MIXED = "mixed"


class OriginVerdict(str, Enum):
    """Origin assessment verdict."""
    QUALIFIED = "qualified"
    NOT_QUALIFIED = "not_qualified"
    CONDITIONAL = "conditional"
    PENDING_REVIEW = "pending_review"


class Material(BaseModel):
    """Material/component information."""
    hs_code: str = Field(..., pattern=r"^\d{6,10}$")
    description: str = Field(..., min_length=1, max_length=255)
    origin_country: str = Field(..., min_length=2, max_length=2)
    value: float = Field(..., gt=0)
    percentage: Optional[float] = Field(None, ge=0, le=100)


class Product(BaseModel):
    """Product information for LTSD."""
    code: str = Field(..., min_length=1, max_length=100)
    description: str = Field(..., min_length=1, max_length=500)
    hs_code: str = Field(..., pattern=r"^\d{6,10}$")
    materials: List[Material] = Field(default_factory=list)
    ex_works_value: Optional[float] = Field(None, gt=0)


class Party(BaseModel):
    """Party (supplier/customer) details."""
    name: str = Field(..., min_length=3, max_length=255)
    street: str = Field(..., min_length=3, max_length=255)
    city: str = Field(..., min_length=2, max_length=128)
    postal_code: str = Field(..., min_length=2, max_length=32)
    country: str = Field(..., min_length=2, max_length=2)
    address_line2: Optional[str] = Field(None, max_length=255)
    vat_number: Optional[str] = Field(None, min_length=5, max_length=32)
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None


class OriginAssessment(BaseModel):
    """Origin compliance assessment result."""
    verdict: OriginVerdict
    confidence: float = Field(..., ge=0, le=1)
    trade_agreements: List[str] = Field(default_factory=list)
    qualified_agreements: List[str] = Field(default_factory=list)
    regional_value_content: Optional[float] = Field(None, ge=0, le=100)
    applied_rules: List[str] = Field(default_factory=list)
    explanation: str
    assessed_at: datetime = Field(default_factory=datetime.utcnow)
    assessed_by: Optional[str] = None  # User/system identifier


class LTSDDeclaration(BaseModel):
    """Long-Term Supplier's Declaration."""

    # Identity
    id: UUID = Field(default_factory=uuid4)
    document_ref: str = Field(..., min_length=10, max_length=100)
    version: int = Field(default=1, ge=1)

    # Status
    status: LTSDStatus = Field(default=LTSDStatus.DRAFT)
    ltsd_type: LTSDType

    # Parties
    supplier: Party
    customer: Party

    # Products
    products: List[Product] = Field(..., min_items=1)

    # Origin Assessment
    declared_origin: str = Field(default="European Union (EU)")
    assessment: Optional[OriginAssessment] = None

    # Validity
    valid_from: date
    valid_to: date
    issued_at: Optional[datetime] = None
    revoked_at: Optional[datetime] = None
    superseded_by: Optional[UUID] = None

    # Signature
    signatory_name: str = Field(..., min_length=3, max_length=128)
    signatory_title: str = Field(..., min_length=3, max_length=128)
    issue_location: str = Field(..., min_length=2, max_length=128)

    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: Optional[str] = None  # Partner ID or user
    notes: Optional[str] = Field(None, max_length=2000)

    # Audit
    pdf_sha256: Optional[str] = Field(None, pattern=r"^[0-9a-f]{64}$")
    ledger_reference: Optional[str] = None

    @validator('valid_to')
    def validate_dates(cls, v, values):
        if 'valid_from' in values and v < values['valid_from']:
            raise ValueError('valid_to must be on or after valid_from')
        return v

    @validator('version')
    def validate_version(cls, v):
        if v < 1:
            raise ValueError('version must be >= 1')
        return v


# Request/Response Models

class LTSDCreateRequest(BaseModel):
    """Request to create new LTSD declaration."""
    supplier: Party
    customer: Party
    products: List[Product] = Field(..., min_items=1)
    declared_origin: str = Field(default="European Union (EU)")
    valid_from: date
    valid_to: date
    signatory_name: str = Field(..., min_length=3, max_length=128)
    signatory_title: str = Field(..., min_length=3, max_length=128)
    issue_location: str = Field(..., min_length=2, max_length=128)
    notes: Optional[str] = None
    partner_id: Optional[str] = None


class LTSDUpdateRequest(BaseModel):
    """Request to update LTSD declaration (creates new version)."""
    products: Optional[List[Product]] = None
    valid_to: Optional[date] = None
    notes: Optional[str] = None


class LTSDListParams(BaseModel):
    """Query parameters for listing LTSDs."""
    partner_id: Optional[str] = None
    status: Optional[LTSDStatus] = None
    ltsd_type: Optional[LTSDType] = None
    valid_at: Optional[date] = None  # Filter by validity date
    limit: int = Field(default=50, ge=1, le=500)
    offset: int = Field(default=0, ge=0)


class LTSDResponse(BaseModel):
    """LTSD declaration response."""
    declaration: LTSDDeclaration
    pdf_url: Optional[str] = None
    verification_url: Optional[str] = None


class LTSDListResponse(BaseModel):
    """List of LTSD declarations."""
    declarations: List[LTSDDeclaration]
    total: int
    limit: int
    offset: int


class LTSDValidationRequest(BaseModel):
    """Request to validate LTSD declaration."""
    ltsd_id: UUID
    trade_agreements: List[str] = Field(..., min_items=1)
    validate_materials: bool = Field(default=True)


class LTSDValidationResponse(BaseModel):
    """LTSD validation result."""
    ltsd_id: UUID
    is_valid: bool
    assessment: OriginAssessment
    validation_errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)


class LTSDRevokeRequest(BaseModel):
    """Request to revoke LTSD."""
    ltsd_id: UUID
    reason: str = Field(..., min_length=10, max_length=500)
    notify_customer: bool = Field(default=True)


class LTSDStatistics(BaseModel):
    """LTSD statistics for partner."""
    total_declarations: int
    active_declarations: int
    expired_declarations: int
    revoked_declarations: int
    by_type: dict[str, int]
    by_verdict: dict[str, int]
    average_validity_days: float
    compliance_rate: float  # Percentage qualified
