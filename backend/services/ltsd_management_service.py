"""
LTSD Management Service (Task 2.4)

Comprehensive LTSD lifecycle management:
- Create, read, update, revoke declarations
- Version control
- Validation and compliance checking
- Statistics and reporting
- Webhook integration
"""

from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy.exc import NoResultFound

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
    LTSDStatistics,
    OriginAssessment,
    OriginVerdict,
)
from backend.services.pdf_generator_service import (
    PDFGeneratorService,
    CertificateData,
    ProductInfo,
)


class LTSDManagementService:
    """Service for managing LTSD declarations."""

    def __init__(self, db_session: Session, webhook_service=None):
        self.db = db_session
        self.webhook_service = webhook_service
        self.pdf_generator = PDFGeneratorService()

    def create_ltsd(self, request: LTSDCreateRequest, partner_id: str) -> LTSDDeclaration:
        """
        Create new LTSD declaration.

        Args:
            request: LTSD creation data
            partner_id: Partner identifier

        Returns:
            Created LTSD declaration

        Raises:
            ValueError: If validation fails
        """
        # Generate document reference
        timestamp = datetime.utcnow()
        product_code = request.products[0].code if request.products else "MULTI"
        document_ref = self.pdf_generator.create_document_reference(product_code, timestamp)

        # Determine LTSD type (placeholder logic - replace with actual assessment)
        ltsd_type = LTSDType.NON_PREFERENTIAL

        # Create declaration
        declaration = LTSDDeclaration(
            document_ref=document_ref,
            version=1,
            status=LTSDStatus.DRAFT,
            ltsd_type=ltsd_type,
            supplier=request.supplier,
            customer=request.customer,
            products=request.products,
            declared_origin=request.declared_origin,
            valid_from=request.valid_from,
            valid_to=request.valid_to,
            signatory_name=request.signatory_name,
            signatory_title=request.signatory_title,
            issue_location=request.issue_location,
            notes=request.notes,
            created_by=partner_id,
        )

        # TODO: Persist to database
        # self.db.add(declaration)
        # self.db.commit()

        # Trigger webhook event
        if self.webhook_service:
            self._trigger_webhook("ltsd.created", declaration, partner_id)

        return declaration

    def get_ltsd(self, ltsd_id: UUID, partner_id: str) -> LTSDDeclaration:
        """
        Retrieve LTSD by ID.

        Args:
            ltsd_id: LTSD UUID
            partner_id: Partner identifier for access control

        Returns:
            LTSD declaration

        Raises:
            NoResultFound: If LTSD not found or access denied
        """
        # TODO: Query database with partner access check
        # declaration = self.db.query(LTSDDeclaration).filter_by(
        #     id=ltsd_id,
        #     created_by=partner_id
        # ).one()

        # Placeholder
        raise NoResultFound(f"LTSD {ltsd_id} not found")

    def list_ltsd(self, params: LTSDListParams, partner_id: str) -> tuple[List[LTSDDeclaration], int]:
        """
        List LTSD declarations with filtering.

        Args:
            params: Query parameters
            partner_id: Partner identifier

        Returns:
            Tuple of (declarations, total_count)
        """
        # TODO: Query database with filters
        # query = self.db.query(LTSDDeclaration).filter_by(created_by=partner_id)
        #
        # if params.status:
        #     query = query.filter_by(status=params.status)
        # if params.ltsd_type:
        #     query = query.filter_by(ltsd_type=params.ltsd_type)
        # if params.valid_at:
        #     query = query.filter(
        #         LTSDDeclaration.valid_from <= params.valid_at,
        #         LTSDDeclaration.valid_to >= params.valid_at
        #     )
        #
        # total = query.count()
        # declarations = query.offset(params.offset).limit(params.limit).all()

        # Placeholder
        return [], 0

    def update_ltsd(
        self,
        ltsd_id: UUID,
        request: LTSDUpdateRequest,
        partner_id: str
    ) -> LTSDDeclaration:
        """
        Update LTSD declaration (creates new version).

        Args:
            ltsd_id: LTSD UUID to update
            request: Update data
            partner_id: Partner identifier

        Returns:
            New version of LTSD declaration

        Raises:
            NoResultFound: If LTSD not found
            ValueError: If LTSD cannot be updated (e.g., revoked)
        """
        # Get current declaration
        current = self.get_ltsd(ltsd_id, partner_id)

        if current.status not in [LTSDStatus.DRAFT, LTSDStatus.ACTIVE]:
            raise ValueError(f"Cannot update LTSD in status {current.status}")

        # Create new version
        new_version = current.model_copy(update={
            "id": UUID(),  # New ID for new version
            "version": current.version + 1,
            "updated_at": datetime.utcnow(),
        })

        # Apply updates
        if request.products:
            new_version.products = request.products
        if request.valid_to:
            new_version.valid_to = request.valid_to
        if request.notes:
            new_version.notes = request.notes

        # Mark old version as superseded
        current.status = LTSDStatus.SUPERSEDED
        current.superseded_by = new_version.id

        # TODO: Persist both versions
        # self.db.add(new_version)
        # self.db.commit()

        # Trigger webhook
        if self.webhook_service:
            self._trigger_webhook("ltsd.updated", new_version, partner_id)

        return new_version

    def validate_ltsd(
        self,
        request: LTSDValidationRequest,
        partner_id: str
    ) -> LTSDValidationResponse:
        """
        Validate LTSD declaration for origin compliance.

        Args:
            request: Validation parameters
            partner_id: Partner identifier

        Returns:
            Validation result with assessment
        """
        # Get declaration
        declaration = self.get_ltsd(request.ltsd_id, partner_id)

        validation_errors = []
        warnings = []

        # Basic validations
        if declaration.status != LTSDStatus.ACTIVE:
            validation_errors.append(f"Declaration is {declaration.status}, expected ACTIVE")

        # Check validity
        today = date.today()
        if today < declaration.valid_from:
            validation_errors.append("Declaration not yet valid")
        elif today > declaration.valid_to:
            warnings.append("Declaration has expired")

        # Material validation
        if request.validate_materials:
            for product in declaration.products:
                if not product.materials:
                    warnings.append(f"Product {product.code} has no materials listed")
                else:
                    for material in product.materials:
                        if material.percentage and material.percentage < 1:
                            warnings.append(f"Material {material.hs_code} has low value percentage")

        # Perform origin assessment (placeholder - should use rules engine)
        is_qualified = len(validation_errors) == 0
        verdict = OriginVerdict.QUALIFIED if is_qualified else OriginVerdict.NOT_QUALIFIED

        assessment = OriginAssessment(
            verdict=verdict,
            confidence=0.85 if is_qualified else 0.65,
            trade_agreements=request.trade_agreements,
            qualified_agreements=request.trade_agreements if is_qualified else [],
            explanation="Automated validation completed",
            assessed_at=datetime.utcnow(),
            assessed_by=f"system:ltsd-validator",
        )

        # Update declaration with assessment
        declaration.assessment = assessment
        # TODO: Persist update
        # self.db.commit()

        # Trigger webhook
        if self.webhook_service:
            event_type = "ltsd.validated" if is_qualified else "ltsd.rejected"
            self._trigger_webhook(event_type, declaration, partner_id)

        return LTSDValidationResponse(
            ltsd_id=declaration.id,
            is_valid=is_qualified,
            assessment=assessment,
            validation_errors=validation_errors,
            warnings=warnings,
        )

    def revoke_ltsd(
        self,
        request: LTSDRevokeRequest,
        partner_id: str
    ) -> LTSDDeclaration:
        """
        Revoke LTSD declaration.

        Args:
            request: Revocation parameters
            partner_id: Partner identifier

        Returns:
            Revoked LTSD declaration
        """
        declaration = self.get_ltsd(request.ltsd_id, partner_id)

        if declaration.status == LTSDStatus.REVOKED:
            raise ValueError("LTSD already revoked")

        # Revoke
        declaration.status = LTSDStatus.REVOKED
        declaration.revoked_at = datetime.utcnow()
        declaration.notes = f"{declaration.notes or ''}\n\nREVOKED: {request.reason}".strip()

        # TODO: Persist
        # self.db.commit()

        # Trigger webhook
        if self.webhook_service:
            self._trigger_webhook("ltsd.revoked", declaration, partner_id)

        # Optionally notify customer
        if request.notify_customer:
            # TODO: Send notification to customer
            pass

        return declaration

    def activate_ltsd(self, ltsd_id: UUID, partner_id: str) -> LTSDDeclaration:
        """
        Activate LTSD declaration (move from DRAFT to ACTIVE).

        Args:
            ltsd_id: LTSD UUID
            partner_id: Partner identifier

        Returns:
            Activated LTSD declaration
        """
        declaration = self.get_ltsd(ltsd_id, partner_id)

        if declaration.status != LTSDStatus.DRAFT:
            raise ValueError(f"Can only activate DRAFT declarations, current status: {declaration.status}")

        # Validate before activation
        validation_request = LTSDValidationRequest(
            ltsd_id=ltsd_id,
            trade_agreements=["CETA", "EU-UK-TCA"],  # Default
            validate_materials=True,
        )
        validation_result = self.validate_ltsd(validation_request, partner_id)

        if validation_result.validation_errors:
            raise ValueError(f"Cannot activate: {', '.join(validation_result.validation_errors)}")

        # Activate
        declaration.status = LTSDStatus.ACTIVE
        declaration.issued_at = datetime.utcnow()

        # Generate PDF certificate
        cert_data = self._convert_to_certificate_data(declaration)
        pdf_bytes, pdf_hash = self.pdf_generator.generate_ltsd_certificate(cert_data), None
        pdf_hash = self.pdf_generator.generate_certificate_hash(pdf_bytes)

        declaration.pdf_sha256 = pdf_hash

        # TODO: Store PDF in MinIO/S3
        # pdf_url = self._store_pdf(declaration.id, pdf_bytes)

        # TODO: Persist
        # self.db.commit()

        # Trigger webhook
        if self.webhook_service:
            self._trigger_webhook("ltsd.activated", declaration, partner_id)

        return declaration

    def get_statistics(self, partner_id: str) -> LTSDStatistics:
        """
        Get LTSD statistics for partner.

        Args:
            partner_id: Partner identifier

        Returns:
            Statistics summary
        """
        # TODO: Query database for statistics
        # total = self.db.query(LTSDDeclaration).filter_by(created_by=partner_id).count()
        # active = self.db.query(LTSDDeclaration).filter_by(
        #     created_by=partner_id,
        #     status=LTSDStatus.ACTIVE
        # ).count()
        # ...

        # Placeholder
        return LTSDStatistics(
            total_declarations=0,
            active_declarations=0,
            expired_declarations=0,
            revoked_declarations=0,
            by_type={},
            by_verdict={},
            average_validity_days=365.0,
            compliance_rate=0.0,
        )

    def check_expiry(self) -> List[LTSDDeclaration]:
        """
        Check for expiring/expired LTSDs and update status.

        Returns:
            List of declarations that were updated
        """
        today = date.today()
        updated = []

        # TODO: Query active declarations with valid_to <= today
        # expired = self.db.query(LTSDDeclaration).filter(
        #     LTSDDeclaration.status == LTSDStatus.ACTIVE,
        #     LTSDDeclaration.valid_to <= today
        # ).all()
        #
        # for declaration in expired:
        #     declaration.status = LTSDStatus.EXPIRED
        #     updated.append(declaration)
        #
        #     # Trigger webhook
        #     if self.webhook_service:
        #         self._trigger_webhook(
        #             "ltsd.expired",
        #             declaration,
        #             declaration.created_by
        #         )
        #
        # self.db.commit()

        return updated

    def _convert_to_certificate_data(self, declaration: LTSDDeclaration) -> CertificateData:
        """Convert LTSD declaration to PDF certificate data."""
        from backend.services.pdf_generator_service import CertificateData

        # Convert products
        products = [
            ProductInfo(
                description=p.description,
                code=p.code,
                hs_code=p.hs_code,
            )
            for p in declaration.products
        ]

        # Determine verdict text
        if declaration.assessment and declaration.assessment.verdict == OriginVerdict.QUALIFIED:
            agreements = ", ".join(declaration.assessment.qualified_agreements)
            verdict_text = f"The product(s) qualify for preferential treatment under: {agreements}."
            is_preferential = True
        else:
            verdict_text = "N/A - The product does not meet preferential origin criteria under the evaluated agreements."
            is_preferential = False

        return CertificateData(
            document_ref=declaration.document_ref,
            generated_at=datetime.utcnow(),
            supplier_name=declaration.supplier.name,
            supplier_acting_for=None,
            customer_name=declaration.customer.name,
            products=products,
            declared_origin=declaration.declared_origin,
            is_preferential=is_preferential,
            trade_agreements=declaration.assessment.trade_agreements if declaration.assessment else None,
            verdict_text=verdict_text,
            validity_start=declaration.valid_from,
            validity_end=declaration.valid_to,
            location=declaration.issue_location,
            signature_date=declaration.issued_at.date() if declaration.issued_at else date.today(),
            signer_title=declaration.signatory_title,
            company_name=declaration.supplier.name,
            qr_code_url=None,  # TODO: Generate verification URL
            notes=declaration.notes,
        )

    def _trigger_webhook(self, event_type: str, declaration: LTSDDeclaration, partner_id: str):
        """Trigger webhook event for LTSD lifecycle event."""
        if not self.webhook_service:
            return

        # TODO: Integrate with webhook service
        # event_data = {
        #     "event_type": event_type,
        #     "ltsd_id": str(declaration.id),
        #     "document_ref": declaration.document_ref,
        #     "status": declaration.status.value,
        #     "partner_id": partner_id,
        #     "timestamp": datetime.utcnow().isoformat(),
        # }
        # self.webhook_service.trigger_event(partner_id, event_type, event_data)
        pass


# Singleton for easy access
_ltsd_service: Optional[LTSDManagementService] = None


def get_ltsd_service(db_session: Session, webhook_service=None) -> LTSDManagementService:
    """Get or create LTSD management service instance."""
    return LTSDManagementService(db_session, webhook_service)
