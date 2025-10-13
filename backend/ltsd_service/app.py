"""LTSD evaluation and certificate generation microservice."""

from __future__ import annotations

import hashlib
import io
from datetime import date, datetime, timezone
from typing import Annotated, Callable, Optional, Protocol
from uuid import UUID, uuid4

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import Field, model_validator
from sqlalchemy.exc import NoResultFound

from backend.app.contracts.psra import (
    CertificateCode,
    CountryCode,
    EvaluationInput,
    EvaluationOutput,
    PSRABaseModel,
    RuleId,
    VerdictStatus,
)
from backend.app.dal.postgres_dal import PostgresDAL
from backend.app.db.session import build_engine, create_session_factory
from backend.rules_engine.origin import OriginEvaluationError, evaluate_origin


class EvaluateRequest(PSRABaseModel):
    """Payload required to run an LTSD evaluation."""

    rule_id: RuleId
    evaluation_input: EvaluationInput
    evaluation_id: Optional[UUID] = Field(
        default=None,
        description="Optional externally supplied evaluation identifier",
    )


class EvaluateResponse(PSRABaseModel):
    """Response contract for LTSD evaluations."""

    evaluation: EvaluationOutput
    ledger_reference: Annotated[str, Field(pattern=r"^ledger://[-/a-z0-9]+$")]


class Party(PSRABaseModel):
    """Represents a supplier or customer on the LTSD certificate."""

    name: Annotated[str, Field(min_length=3, max_length=255)]
    street: Annotated[str, Field(min_length=3, max_length=255)]
    city: Annotated[str, Field(min_length=2, max_length=128)]
    postal_code: Annotated[str, Field(min_length=2, max_length=32)]
    country: CountryCode
    address_line2: Optional[Annotated[str, Field(min_length=3, max_length=255)]] = None
    vat_number: Optional[Annotated[str, Field(min_length=5, max_length=32)]] = None


class GenerateCertificateRequest(PSRABaseModel):
    """Certificate generation request."""

    evaluation_id: UUID
    certificate_code: CertificateCode
    supplier: Party
    customer: Party
    valid_from: date
    valid_to: date
    signatory_name: Annotated[str, Field(min_length=3, max_length=128)]
    signatory_title: Annotated[str, Field(min_length=3, max_length=128)]
    issue_location: Annotated[str, Field(min_length=2, max_length=128)]
    notes: Optional[Annotated[str, Field(max_length=1024)]] = None

    @model_validator(mode="after")
    def _validate_dates(self) -> "GenerateCertificateRequest":
        if self.valid_to < self.valid_from:
            msg = "valid_to must be on or after valid_from"
            raise ValueError(msg)
        return self


class CertificateLedgerRecord(PSRABaseModel):
    """Payload stored for generated LTSD certificates."""

    evaluation_id: UUID
    certificate_code: CertificateCode
    sha256: Annotated[str, Field(pattern=r"^[0-9a-f]{64}$")]
    issued_at: datetime
    valid_from: date
    valid_to: date
    supplier: Party
    customer: Party
    signatory_name: Annotated[str, Field(min_length=3, max_length=128)]
    signatory_title: Annotated[str, Field(min_length=3, max_length=128)]
    issue_location: Annotated[str, Field(min_length=2, max_length=128)]
    notes: Optional[Annotated[str, Field(max_length=1024)]] = None


class LedgerPublisher(Protocol):
    """Abstract interface for the append-only audit ledger."""

    def append_evaluation(self, evaluation: EvaluationOutput) -> str:
        """Persist an evaluation result and return the ledger reference."""

    def append_certificate(self, record: CertificateLedgerRecord) -> str:
        """Persist a certificate issuance record and return the ledger reference."""


class InMemoryLedger(LedgerPublisher):
    """Simple in-memory ledger used for local development and tests."""

    def __init__(self) -> None:
        self.evaluations: list[tuple[str, EvaluationOutput]] = []
        self.certificates: list[tuple[str, CertificateLedgerRecord]] = []

    def append_evaluation(self, evaluation: EvaluationOutput) -> str:
        reference = f"ledger://evaluation/{uuid4()}"
        self.evaluations.append((reference, evaluation))
        return reference

    def append_certificate(self, record: CertificateLedgerRecord) -> str:
        reference = f"ledger://certificate/{uuid4()}"
        self.certificates.append((reference, record))
        return reference


class DependencyContainer:
    """Lazy dependency resolver for the LTSD microservice."""

    def __init__(
        self,
        dal_factory: Callable[[], PostgresDAL],
        ledger_factory: Callable[[], LedgerPublisher],
    ) -> None:
        self._dal_factory = dal_factory
        self._ledger_factory = ledger_factory
        self._dal: Optional[PostgresDAL] = None
        self._ledger: Optional[LedgerPublisher] = None

    def dal(self) -> PostgresDAL:
        if self._dal is None:
            self._dal = self._dal_factory()
        return self._dal

    def ledger(self) -> LedgerPublisher:
        if self._ledger is None:
            self._ledger = self._ledger_factory()
        return self._ledger


def _default_dal_factory() -> PostgresDAL:
    engine = build_engine()
    session_factory = create_session_factory(engine)
    return PostgresDAL(session_factory)


def _default_ledger_factory() -> LedgerPublisher:
    return InMemoryLedger()


def create_app(
    *,
    dal: Optional[PostgresDAL] = None,
    ledger: Optional[LedgerPublisher] = None,
) -> FastAPI:
    """Create a configured FastAPI application for LTSD operations."""

    container = DependencyContainer(
        dal_factory=(lambda: dal) if dal is not None else _default_dal_factory,
        ledger_factory=(lambda: ledger) if ledger is not None else _default_ledger_factory,
    )

    app = FastAPI(
        title="PSRA LTSD Service",
        version="1.0.0",
        description=(
            "Deterministic LTSD evaluation and certificate generation service "
            "with append-only ledger provenance."
        ),
    )

    def _get_dal() -> PostgresDAL:
        try:
            return container.dal()
        except RuntimeError as exc:  # pragma: no cover - configuration guard
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc

    def _get_ledger() -> LedgerPublisher:
        return container.ledger()

    @app.get("/healthz", status_code=status.HTTP_200_OK)
    def healthcheck() -> dict[str, str]:
        """Lightweight readiness probe."""

        # Attempt to resolve the DAL to ensure configuration is valid.
        _get_dal()
        return {"status": "ok"}

    @app.post("/evaluate", response_model=EvaluateResponse, status_code=status.HTTP_200_OK)
    def evaluate(  # noqa: D401 - FastAPI endpoint docstring
        request: EvaluateRequest,
        dal: PostgresDAL = Depends(_get_dal),
        ledger: LedgerPublisher = Depends(_get_ledger),
    ) -> EvaluateResponse:
        """Run a deterministic LTSD evaluation against the configured rule."""

        try:
            rule = dal.get_rule(request.rule_id)
        except NoResultFound as exc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="rule_not_found") from exc

        try:
            evaluation = evaluate_origin(
                request.evaluation_input,
                rule,
                evaluation_id=request.evaluation_id,
            )
        except OriginEvaluationError as exc:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

        ledger_reference = ledger.append_evaluation(evaluation)
        verdict = evaluation.verdict.model_copy(update={"ledger_reference": ledger_reference})
        evaluation = evaluation.model_copy(update={"verdict": verdict})
        dal.persist_verdict(evaluation)

        return EvaluateResponse(evaluation=evaluation, ledger_reference=ledger_reference)

    @app.post("/generate", status_code=status.HTTP_200_OK)
    def generate_certificate(  # noqa: D401 - FastAPI endpoint docstring
        request: GenerateCertificateRequest,
        dal: PostgresDAL = Depends(_get_dal),
        ledger: LedgerPublisher = Depends(_get_ledger),
    ) -> StreamingResponse:
        """Generate a signed LTSD certificate PDF based on a prior evaluation."""

        try:
            evaluation = dal.fetch_verdict(str(request.evaluation_id))
        except NoResultFound as exc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="evaluation_not_found") from exc

        if evaluation.verdict.status is not VerdictStatus.QUALIFIED:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="certificate_available_only_for_qualified_verdicts",
            )

        issued_at = datetime.now(timezone.utc)
        pdf_bytes = _render_certificate_pdf(evaluation, request, issued_at)
        notary_hash = hashlib.sha256(pdf_bytes).hexdigest()

        ledger_record = CertificateLedgerRecord(
            evaluation_id=request.evaluation_id,
            certificate_code=request.certificate_code,
            sha256=notary_hash,
            issued_at=issued_at,
            valid_from=request.valid_from,
            valid_to=request.valid_to,
            supplier=request.supplier,
            customer=request.customer,
            signatory_name=request.signatory_name,
            signatory_title=request.signatory_title,
            issue_location=request.issue_location,
            notes=request.notes,
        )
        ledger_reference = ledger.append_certificate(ledger_record)

        headers = {
            "X-Notary-Hash": notary_hash,
            "X-Ledger-Reference": ledger_reference,
            "Content-Disposition": (
                f"attachment; filename=ltsd-certificate-{request.evaluation_id}.pdf"
            ),
        }

        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers=headers,
        )

    return app


def _render_certificate_pdf(
    evaluation: EvaluationOutput,
    request: GenerateCertificateRequest,
    issued_at: datetime,
) -> bytes:
    """Render a minimal yet valid PDF summarising the LTSD decision."""

    lines: list[str] = [
        "PSRA LTSD Certificate",
        "",  # spacer line
        f"Certificate Code: {request.certificate_code}",
        f"Evaluation ID: {evaluation.verdict.evaluation_id}",
        f"Rule ID: {evaluation.verdict.rule_id}",
        f"Verdict: {evaluation.verdict.status.value.upper()} (confidence {evaluation.verdict.confidence:.2f})",
        f"Issued At: {issued_at.isoformat()}",
        f"Valid From: {request.valid_from.isoformat()}",
        f"Valid To: {request.valid_to.isoformat()}",
        "",
        "Supplier",
        * _format_party_lines(request.supplier),
        "",
        "Customer",
        * _format_party_lines(request.customer),
        "",
        f"Signatory: {request.signatory_name} ({request.signatory_title})",
        f"Issue Location: {request.issue_location}",
        "",
        "Citations:",
    ]

    for citation in evaluation.verdict.citations:
        lines.append(f"- {citation.reference}")

    if request.notes:
        lines.extend(["", "Notes:", request.notes])

    return _build_pdf(lines)


def _format_party_lines(party: Party) -> list[str]:
    lines = [party.name, party.street]
    if party.address_line2:
        lines.append(party.address_line2)
    lines.append(f"{party.postal_code} {party.city}")
    lines.append(party.country)
    if party.vat_number:
        lines.append(f"VAT: {party.vat_number}")
    return lines


def _build_pdf(lines: list[str]) -> bytes:
    """Construct a tiny single-page PDF containing the provided lines."""

    escaped_lines = [_escape_pdf_text(line) for line in lines]
    text_stream = "BT /F1 12 Tf 50 780 Td 16 TL"
    first_line = True
    for line in escaped_lines:
        if first_line:
            text_stream += f" ({line}) Tj"
            first_line = False
        else:
            text_stream += f" T* ({line}) Tj"
    text_stream += " ET"
    text_bytes = text_stream.encode("latin-1")

    objects: list[bytes] = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Count 1 /Kids [3 0 R] >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
        f"<< /Length {len(text_bytes)} >>\nstream\n".encode("latin-1")
        + text_bytes
        + b"\nendstream",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]

    buffer = io.BytesIO()
    buffer.write(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")

    offsets = [0]
    for index, obj in enumerate(objects, start=1):
        offsets.append(buffer.tell())
        buffer.write(f"{index} 0 obj\n".encode("latin-1"))
        buffer.write(obj)
        buffer.write(b"\nendobj\n")

    xref_start = buffer.tell()
    buffer.write(f"xref\n0 {len(offsets)}\n".encode("latin-1"))
    buffer.write(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        buffer.write(f"{offset:010d} 00000 n \n".encode("latin-1"))
    buffer.write(
        (
            "trailer\n"
            f"<< /Size {len(offsets)} /Root 1 0 R >>\n"
            "startxref\n"
            f"{xref_start}\n"
            "%%EOF\n"
        ).encode("latin-1")
    )

    return buffer.getvalue()


def _escape_pdf_text(text: str) -> str:
    return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


app = create_app()
