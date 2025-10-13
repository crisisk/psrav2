"""
LTSD Management API Router (Task 2.4)

REST API endpoints for LTSD lifecycle management.

Endpoints:
- POST /ltsd - Create new LTSD
- GET /ltsd - List LTSDs
- GET /ltsd/{id} - Get LTSD by ID
- PUT /ltsd/{id} - Update LTSD (creates new version)
- POST /ltsd/{id}/activate - Activate LTSD
- POST /ltsd/{id}/validate - Validate LTSD
- POST /ltsd/{id}/revoke - Revoke LTSD
- GET /ltsd/{id}/pdf - Download PDF certificate
- GET /ltsd/statistics - Get LTSD statistics
"""

from __future__ import annotations

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
import io

from backend.models.ltsd_models import (
    LTSDDeclaration,
    LTSDStatus,
    LTSDType,
    LTSDCreateRequest,
    LTSDUpdateRequest,
    LTSDListParams,
    LTSDValidationRequest,
    LTSDValidationResponse,
    LTSDRevokeRequest,
    LTSDResponse,
    LTSDListResponse,
    LTSDStatistics,
)
from backend.services.ltsd_management_service import LTSDManagementService, get_ltsd_service


router = APIRouter(prefix="/ltsd", tags=["LTSD Management"])


# Dependency to get partner ID from auth
async def get_partner_id() -> str:
    """Extract partner ID from authentication context."""
    # TODO: Integrate with actual authentication
    # For now, return demo partner ID
    return "partner_demo_001"


# Dependency to get LTSD service
def get_service() -> LTSDManagementService:
    """Get LTSD management service instance."""
    # TODO: Inject actual database session
    from sqlalchemy.orm import Session
    db_session = Session()  # Placeholder
    return get_ltsd_service(db_session)


@router.post(
    "",
    response_model=LTSDResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create new LTSD declaration"
)
async def create_ltsd(
    request: LTSDCreateRequest,
    partner_id: str = Depends(get_partner_id),
    service: LTSDManagementService = Depends(get_service),
):
    """
    Create a new Long-Term Supplier's Declaration.

    **Request Body:**
    - supplier: Supplier party information
    - customer: Customer party information
    - products: List of products (minimum 1)
    - declared_origin: Origin declaration (default: EU)
    - valid_from: Validity start date
    - valid_to: Validity end date
    - signatory_name: Name of signatory
    - signatory_title: Title of signatory
    - issue_location: Location where issued
    - notes: Optional notes

    **Response:**
    - declaration: Created LTSD declaration
    - pdf_url: URL to download PDF (once activated)
    - verification_url: URL for verification

    **Status: DRAFT** (use /activate endpoint to activate)
    """
    try:
        declaration = service.create_ltsd(request, partner_id)

        return LTSDResponse(
            declaration=declaration,
            pdf_url=None,  # PDF generated on activation
            verification_url=f"https://psra.sevensa.nl/verify/ltsd/{declaration.id}",
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create LTSD: {str(e)}"
        )


@router.get(
    "",
    response_model=LTSDListResponse,
    summary="List LTSD declarations"
)
async def list_ltsd(
    status_filter: LTSDStatus = Query(None, alias="status"),
    ltsd_type: LTSDType = Query(None, alias="type"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    partner_id: str = Depends(get_partner_id),
    service: LTSDManagementService = Depends(get_service),
):
    """
    List LTSD declarations with optional filtering.

    **Query Parameters:**
    - status: Filter by status (draft, active, expired, revoked, superseded)
    - type: Filter by type (preferential, non_preferential, mixed)
    - limit: Maximum results (default: 50, max: 500)
    - offset: Pagination offset (default: 0)

    **Response:**
    - declarations: List of LTSD declarations
    - total: Total count (for pagination)
    - limit: Applied limit
    - offset: Applied offset
    """
    params = LTSDListParams(
        partner_id=partner_id,
        status=status_filter,
        ltsd_type=ltsd_type,
        limit=limit,
        offset=offset,
    )

    declarations, total = service.list_ltsd(params, partner_id)

    return LTSDListResponse(
        declarations=declarations,
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/{ltsd_id}",
    response_model=LTSDResponse,
    summary="Get LTSD by ID"
)
async def get_ltsd(
    ltsd_id: UUID,
    partner_id: str = Depends(get_partner_id),
    service: LTSDManagementService = Depends(get_service),
):
    """
    Retrieve LTSD declaration by ID.

    **Path Parameters:**
    - ltsd_id: UUID of LTSD declaration

    **Response:**
    - declaration: LTSD declaration
    - pdf_url: URL to download PDF (if active)
    - verification_url: URL for verification

    **Errors:**
    - 404: LTSD not found or access denied
    """
    try:
        declaration = service.get_ltsd(ltsd_id, partner_id)

        pdf_url = None
        if declaration.status == LTSDStatus.ACTIVE and declaration.pdf_sha256:
            pdf_url = f"https://psra.sevensa.nl/api/ltsd/{ltsd_id}/pdf"

        return LTSDResponse(
            declaration=declaration,
            pdf_url=pdf_url,
            verification_url=f"https://psra.sevensa.nl/verify/ltsd/{ltsd_id}",
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="LTSD not found or access denied"
        )


@router.put(
    "/{ltsd_id}",
    response_model=LTSDResponse,
    summary="Update LTSD declaration"
)
async def update_ltsd(
    ltsd_id: UUID,
    request: LTSDUpdateRequest,
    partner_id: str = Depends(get_partner_id),
    service: LTSDManagementService = Depends(get_service),
):
    """
    Update LTSD declaration (creates new version).

    **Path Parameters:**
    - ltsd_id: UUID of LTSD to update

    **Request Body:**
    - products: Updated product list (optional)
    - valid_to: Extended validity date (optional)
    - notes: Updated notes (optional)

    **Response:**
    - declaration: New version of LTSD

    **Note:** Creates new version, marks old as superseded.

    **Errors:**
    - 404: LTSD not found
    - 400: Cannot update (e.g., revoked status)
    """
    try:
        declaration = service.update_ltsd(ltsd_id, request, partner_id)
        return LTSDResponse(
            declaration=declaration,
            pdf_url=None,  # Requires re-activation
            verification_url=f"https://psra.sevensa.nl/verify/ltsd/{declaration.id}",
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="LTSD not found")


@router.post(
    "/{ltsd_id}/activate",
    response_model=LTSDResponse,
    summary="Activate LTSD declaration"
)
async def activate_ltsd(
    ltsd_id: UUID,
    partner_id: str = Depends(get_partner_id),
    service: LTSDManagementService = Depends(get_service),
):
    """
    Activate LTSD declaration (DRAFT → ACTIVE).

    **Path Parameters:**
    - ltsd_id: UUID of LTSD to activate

    **Actions:**
    - Validates declaration
    - Generates PDF certificate
    - Sets status to ACTIVE
    - Triggers webhook: ltsd.activated

    **Response:**
    - declaration: Activated LTSD
    - pdf_url: URL to download generated PDF

    **Errors:**
    - 400: Cannot activate (validation errors)
    - 404: LTSD not found
    """
    try:
        declaration = service.activate_ltsd(ltsd_id, partner_id)

        pdf_url = f"https://psra.sevensa.nl/api/ltsd/{ltsd_id}/pdf"

        return LTSDResponse(
            declaration=declaration,
            pdf_url=pdf_url,
            verification_url=f"https://psra.sevensa.nl/verify/ltsd/{ltsd_id}",
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="LTSD not found")


@router.post(
    "/{ltsd_id}/validate",
    response_model=LTSDValidationResponse,
    summary="Validate LTSD declaration"
)
async def validate_ltsd(
    ltsd_id: UUID,
    request: LTSDValidationRequest,
    partner_id: str = Depends(get_partner_id),
    service: LTSDManagementService = Depends(get_service),
):
    """
    Validate LTSD declaration for origin compliance.

    **Path Parameters:**
    - ltsd_id: UUID of LTSD to validate

    **Request Body:**
    - trade_agreements: List of agreements to validate against
    - validate_materials: Check material composition (default: true)

    **Response:**
    - ltsd_id: LTSD UUID
    - is_valid: Validation result
    - assessment: Origin assessment details
    - validation_errors: List of errors
    - warnings: List of warnings

    **Triggers Webhook:**
    - ltsd.validated (if valid)
    - ltsd.rejected (if invalid)

    **Errors:**
    - 404: LTSD not found
    """
    # Set ltsd_id in request
    request.ltsd_id = ltsd_id

    try:
        result = service.validate_ltsd(request, partner_id)
        return result
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="LTSD not found")


@router.post(
    "/{ltsd_id}/revoke",
    response_model=LTSDResponse,
    summary="Revoke LTSD declaration"
)
async def revoke_ltsd(
    ltsd_id: UUID,
    request: LTSDRevokeRequest,
    partner_id: str = Depends(get_partner_id),
    service: LTSDManagementService = Depends(get_service),
):
    """
    Revoke LTSD declaration.

    **Path Parameters:**
    - ltsd_id: UUID of LTSD to revoke

    **Request Body:**
    - reason: Reason for revocation (minimum 10 chars)
    - notify_customer: Send notification to customer (default: true)

    **Actions:**
    - Sets status to REVOKED
    - Records revocation reason
    - Triggers webhook: ltsd.revoked
    - Optionally notifies customer

    **Response:**
    - declaration: Revoked LTSD

    **Errors:**
    - 400: Already revoked
    - 404: LTSD not found
    """
    # Set ltsd_id in request
    request.ltsd_id = ltsd_id

    try:
        declaration = service.revoke_ltsd(request, partner_id)
        return LTSDResponse(
            declaration=declaration,
            pdf_url=None,  # PDF no longer valid
            verification_url=None,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="LTSD not found")


@router.get(
    "/{ltsd_id}/pdf",
    response_class=StreamingResponse,
    summary="Download LTSD certificate PDF"
)
async def download_pdf(
    ltsd_id: UUID,
    partner_id: str = Depends(get_partner_id),
    service: LTSDManagementService = Depends(get_service),
):
    """
    Download LTSD certificate as PDF.

    **Path Parameters:**
    - ltsd_id: UUID of LTSD

    **Response:**
    - Content-Type: application/pdf
    - Content-Disposition: attachment; filename=ltsd-{id}.pdf
    - X-Notary-Hash: SHA-256 hash of PDF

    **Errors:**
    - 404: LTSD not found or PDF not generated
    - 400: LTSD not active
    """
    try:
        declaration = service.get_ltsd(ltsd_id, partner_id)

        if declaration.status != LTSDStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"PDF only available for active LTSDs (current status: {declaration.status})"
            )

        if not declaration.pdf_sha256:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="PDF not generated yet"
            )

        # Generate PDF
        cert_data = service._convert_to_certificate_data(declaration)
        pdf_bytes = service.pdf_generator.generate_ltsd_certificate(cert_data)

        # Verify hash matches
        actual_hash = service.pdf_generator.generate_certificate_hash(pdf_bytes)
        if actual_hash != declaration.pdf_sha256:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="PDF integrity check failed"
            )

        headers = {
            "Content-Disposition": f"attachment; filename=ltsd-{ltsd_id}.pdf",
            "X-Notary-Hash": declaration.pdf_sha256,
        }

        if declaration.ledger_reference:
            headers["X-Ledger-Reference"] = declaration.ledger_reference

        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers=headers,
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="LTSD not found")


@router.get(
    "/statistics",
    response_model=LTSDStatistics,
    summary="Get LTSD statistics"
)
async def get_statistics(
    partner_id: str = Depends(get_partner_id),
    service: LTSDManagementService = Depends(get_service),
):
    """
    Get LTSD statistics for partner.

    **Response:**
    - total_declarations: Total LTSD count
    - active_declarations: Currently active
    - expired_declarations: Expired count
    - revoked_declarations: Revoked count
    - by_type: Count by LTSD type
    - by_verdict: Count by origin verdict
    - average_validity_days: Average validity period
    - compliance_rate: Percentage qualified

    **Use Case:** Dashboard KPIs
    """
    stats = service.get_statistics(partner_id)
    return stats
