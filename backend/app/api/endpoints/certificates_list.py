# /home/vncuser/psra-ltsd-enterprise-v2/backend/app/api/endpoints/certificates_list.py

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field, validator
from sqlalchemy import or_, and_
from sqlalchemy.orm import Session
from app.db.session import get_db  # Assuming this is defined elsewhere
from app.models.certificate import Certificate  # Assuming this SQLAlchemy model exists
from app.schemas.certificate import Certificate as CertificateSchema  # Assuming this Pydantic schema exists

router = APIRouter()

class CertificateFilters(BaseModel):
    """Model for certificate filters."""
    status: Optional[str] = Field(None, description="Certificate status: active, expired, or revoked")
    origin_country: Optional[str] = Field(None, description="Origin country ISO code")
    destination_country: Optional[str] = Field(None, description="Destination country ISO code")
    fta_agreement: Optional[str] = Field(None, description="FTA agreement name")
    date_from: Optional[str] = Field(None, description="Start date in ISO format (e.g., 2023-01-01)")
    date_to: Optional[str] = Field(None, description="End date in ISO format (e.g., 2023-12-31)")
    search: Optional[str] = Field(None, description="Search text in certificate_number, exporter, or importer")

    @validator('status')
    def validate_status(cls, v):
        if v and v not in ['active', 'expired', 'revoked']:
            raise ValueError("Status must be one of: active, expired, revoked")
        return v

class CertificateQueryParams(BaseModel):
    """Model for query parameters including pagination, sorting, and filters."""
    page: int = Field(1, ge=1, description="Page number (minimum 1)")
    page_size: int = Field(20, ge=1, le=100, description="Number of items per page (1-100)")
    sort_by: Optional[str] = Field("created_at", description="Field to sort by (e.g., created_at)")
    sort_order: Optional[str] = Field("desc", description="Sort order: asc or desc")
    filters: Optional[CertificateFilters] = Field(None, description="Optional filters for certificates")

    @validator('sort_order')
    def validate_sort_order(cls, v):
        if v and v not in ['asc', 'desc']:
            raise ValueError("Sort order must be 'asc' or 'desc'")
        return v

    @validator('sort_by')
    def validate_sort_by(cls, v):
        # Assuming valid sortable fields; adjust based on Certificate model
        valid_fields = ['created_at', 'certificate_number', 'status', 'origin_country', 'destination_country']
        if v and v not in valid_fields:
            raise ValueError(f"Sort by must be one of: {', '.join(valid_fields)}")
        return v

class CertificateListResponse(BaseModel):
    """Response model for the certificates list endpoint."""
    items: List[CertificateSchema]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_prev: bool

@router.get("/certificates", response_model=CertificateListResponse)
def get_certificates(
    params: CertificateQueryParams = Depends(),
    db: Session = Depends(get_db)
) -> CertificateListResponse:
    """
    Retrieve a paginated list of certificates with optional filters and sorting.

    - **page**: Page number (default 1, min 1)
    - **page_size**: Items per page (default 20, min 1, max 100)
    - **sort_by**: Field to sort by (default 'created_at')
    - **sort_order**: Sort order ('asc' or 'desc', default 'desc')
    - **filters**: Optional filters (status, countries, dates, search)

    Returns a paginated response with certificates.
    """
    # Build the base query
    query = db.query(Certificate)

    # Apply filters if provided
    if params.filters:
        filters = params.filters
        if filters.status:
            query = query.filter(Certificate.status == filters.status)
        if filters.origin_country:
            query = query.filter(Certificate.origin_country == filters.origin_country)
        if filters.destination_country:
            query = query.filter(Certificate.destination_country == filters.destination_country)
        if filters.fta_agreement:
            query = query.filter(Certificate.fta_agreement == filters.fta_agreement)
        if filters.date_from:
            # Assuming date_from applies to created_at; adjust if needed
            query = query.filter(Certificate.created_at >= filters.date_from)
        if filters.date_to:
            query = query.filter(Certificate.created_at <= filters.date_to)
        if filters.search:
            search_term = f"%{filters.search}%"
            query = query.filter(
                or_(
                    Certificate.certificate_number.ilike(search_term),
                    Certificate.exporter.ilike(search_term),
                    Certificate.importer.ilike(search_term)
                )
            )

    # Apply sorting
    sort_column = getattr(Certificate, params.sort_by, Certificate.created_at)
    if params.sort_order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())

    # Get total count before pagination
    total = query.count()

    # Apply pagination
    offset = (params.page - 1) * params.page_size
    items = query.offset(offset).limit(params.page_size).all()

    # Calculate pagination metadata
    total_pages = (total + params.page_size - 1) // params.page_size
    has_next = params.page < total_pages
    has_prev = params.page > 1

    # Return response
    return CertificateListResponse(
        items=items,
        total=total,
        page=params.page,
        page_size=params.page_size,
        total_pages=total_pages,
        has_next=has_next,
        has_prev=has_prev
    )
