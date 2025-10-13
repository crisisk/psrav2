"""Deterministic origin evaluation engine.

This module implements the core preferential origin logic that is shared across
all orchestrated and deterministic execution paths.  The rules are fully
deterministic and rely solely on the canonical PSRA contracts which are already
validated against the Rules-as-Code schema.  The intent is to guarantee that
repeated executions over the same inputs produce identical verdicts with clear
citations for auditability.
"""

from __future__ import annotations

import time
from datetime import datetime, timezone
from typing import Callable, Dict, Iterable, List, Optional
from uuid import UUID, uuid4

from backend.app.contracts.psra import (
    AdditionalEvidence,
    BillOfMaterialsItem,
    Citation,
    DisqualificationReason,
    EvaluationInput,
    EvaluationMetrics,
    EvaluationOutput,
    EvaluationVerdict,
    PSRARule,
    ProcessSnapshot,
    Operation,
    RequiredInput,
    Severity,
    VerdictStatus,
)

_ENGINE_VERSION = "1.0.0"


class OriginEvaluationError(RuntimeError):
    """Raised when an unrecoverable error occurs during origin evaluation."""


def evaluate_origin(
    evaluation_input: EvaluationInput,
    rule: PSRARule,
    *,
    evaluation_id: Optional[UUID] = None,
    now: Callable[[], datetime] | None = None,
) -> EvaluationOutput:
    """Evaluate an origin rule deterministically.

    Parameters
    ----------
    evaluation_input:
        The canonical evaluation input contract describing BOM, process, and
        documentation snapshots.
    rule:
        A fully validated PSRA rule describing the criteria and decision
        metadata.
    evaluation_id:
        Optional externally supplied evaluation identifier.  If omitted, a new
        UUID4 identifier is generated.
    now:
        Optional callable returning the current datetime.  This exists purely to
        facilitate deterministic unit testing.
    """

    timer_start = time.perf_counter()
    evaluation_uuid = evaluation_id or uuid4()
    now_fn = now or (lambda: datetime.now(tz=timezone.utc))

    bom_failures = _validate_bom(
        evaluation_input.bill_of_materials, rule.criteria.bom.required_inputs
    )
    non_originating_limit = (
        rule.criteria.bom.non_originating_materials.max_percentage
        if rule.criteria.bom.non_originating_materials
        else None
    )
    rvc_failures = _validate_regional_value(
        evaluation_input.bill_of_materials,
        evaluation_input.process,
        rule.criteria.bom.regional_value_content.threshold,
        non_originating_limit,
    )
    process_failures = _validate_process(
        evaluation_input.process, rule.criteria.process.required_operations, rule.criteria.process.disallowed_operations
    )
    documentation_failures = _validate_documentation(
        evaluation_input.documentation.submitted_certificates,
        evaluation_input.documentation.evidence,
        rule.criteria.documentation.certificates,
        rule.criteria.documentation.additional_evidence or [],
    )

    failures: List[DisqualificationReason] = (
        bom_failures + rvc_failures + process_failures + documentation_failures
    )

    decided_at = now_fn()
    citations = _collect_citations(rule.decision.verdicts.qualified.citations)

    if failures:
        verdict_status = VerdictStatus.DISQUALIFIED
        confidence = 0.0
        disqualification_reasons = failures
    else:
        verdict_status = VerdictStatus.QUALIFIED
        confidence = 1.0
        disqualification_reasons = []

    metrics = EvaluationMetrics(
        processing_time_ms=(time.perf_counter() - timer_start) * 1000.0,
        rules_evaluated=1,
    )

    verdict = EvaluationVerdict(
        evaluation_id=evaluation_uuid,
        rule_id=rule.metadata.rule_id,
        status=verdict_status,
        decided_at=decided_at,
        confidence=confidence,
        citations=citations,
        disqualification_reasons=disqualification_reasons,
        ledger_reference=rule.audit.traceability.ledger_reference
        if rule.audit.traceability.lineage_required
        else None,
    )

    provenance: Dict[str, str] = {
        "engine": "deterministic-origin",
        "engine_version": _ENGINE_VERSION,
        "rule_version": rule.version,
    }

    return EvaluationOutput(
        input=evaluation_input,
        rule=rule,
        verdict=verdict,
        metrics=metrics,
        provenance=provenance,
    )


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _validate_bom(
    bom: Iterable[BillOfMaterialsItem], required_inputs: Iterable[RequiredInput]
) -> List[DisqualificationReason]:
    items = list(bom)
    failures: List[DisqualificationReason] = []
    total_value = sum(item.value.amount for item in items)
    if total_value <= 0:
        raise OriginEvaluationError("Bill of materials total value must be positive")

    for requirement in required_inputs:
        matching_items = [
            item for item in items if item.hs_code.startswith(requirement.hs_code)
        ]
        if not matching_items:
            failures.append(
                DisqualificationReason(
                    code="BOM_MISSING_INPUT",
                    description=(
                        "Bill of materials does not contain required input HS "
                        f"{requirement.hs_code} ({requirement.description})"
                    ),
                    severity=Severity.HIGH,
                )
            )
            continue
        if requirement.max_percentage is not None:
            matching_value = sum(item.value.amount for item in matching_items)
            percentage = (matching_value / total_value) * 100.0
            if percentage > requirement.max_percentage + 1e-6:
                failures.append(
                    DisqualificationReason(
                        code="BOM_EXCEEDS_THRESHOLD",
                        description=(
                            f"Required input {requirement.hs_code} exceeds allowed "
                            f"percentage ({percentage:.2f}% > {requirement.max_percentage:.2f}%)"
                        ),
                        severity=Severity.HIGH,
                    )
                )
    return failures


def _validate_regional_value(
    bom: Iterable[BillOfMaterialsItem],
    process: ProcessSnapshot,
    threshold: float,
    non_originating_max: Optional[float],
) -> List[DisqualificationReason]:
    total_value = sum(item.value.amount for item in bom)
    if total_value <= 0:
        raise OriginEvaluationError("Bill of materials total value must be positive")

    failures: List[DisqualificationReason] = []

    if process.value_added_percentage + 1e-6 < threshold:
        failures.append(
            DisqualificationReason(
                code="INSUFFICIENT_RVC",
                description=(
                    "Regional value content below required threshold "
                    f"({process.value_added_percentage:.2f}% < {threshold:.2f}%)"
                ),
                severity=Severity.HIGH,
            )
        )

    if non_originating_max is not None:
        non_originating_value = sum(
            item.value.amount for item in bom if not item.is_originating
        )
        non_originating_percentage = (non_originating_value / total_value) * 100.0
        if non_originating_percentage > non_originating_max + 1e-6:
            failures.append(
                DisqualificationReason(
                    code="NON_ORIGINATING_THRESHOLD",
                    description=(
                        "Non-originating materials exceed allowed share "
                        f"({non_originating_percentage:.2f}% > {non_originating_max:.2f}%)"
                    ),
                    severity=Severity.HIGH,
                )
            )

    return failures


def _validate_process(
    process: ProcessSnapshot,
    required_operations: Iterable[Operation],
    disallowed_operations: Iterable[Operation],
) -> List[DisqualificationReason]:
    performed_codes = {op.code for op in process.performed_operations}
    failures: List[DisqualificationReason] = []

    for required in required_operations:
        if required.code not in performed_codes:
            failures.append(
                DisqualificationReason(
                    code="MISSING_PROCESS",
                    description=(
                        f"Required operation {required.code} not performed during production"
                    ),
                    severity=Severity.CRITICAL,
                )
            )

    disallowed_codes = {op.code for op in disallowed_operations}
    for operation in process.performed_operations:
        if operation.code in disallowed_codes:
            failures.append(
                DisqualificationReason(
                    code="DISALLOWED_OPERATION",
                    description=(
                        f"Disallowed operation {operation.code} detected in manufacturing process"
                    ),
                    severity=Severity.HIGH,
                )
            )
    return failures


def _validate_documentation(
    submitted_certificates: Iterable[str],
    submitted_evidence: Dict[str, str],
    required_certificates: Iterable[str],
    required_evidence: Iterable[AdditionalEvidence],
) -> List[DisqualificationReason]:
    failures: List[DisqualificationReason] = []
    submitted_set = set(submitted_certificates)

    for certificate in required_certificates:
        if certificate not in submitted_set:
            failures.append(
                DisqualificationReason(
                    code="MISSING_CERTIFICATE",
                    description=f"Required certificate {certificate} not provided",
                    severity=Severity.HIGH,
                )
            )

    for evidence in required_evidence:
        if evidence.type not in submitted_evidence:
            failures.append(
                DisqualificationReason(
                    code="MISSING_EVIDENCE",
                    description=(
                        f"Required evidence '{evidence.type}' not supplied in documentation"
                    ),
                    severity=Severity.MEDIUM,
                )
            )
    return failures


def _collect_citations(citations: Iterable[Citation]) -> List[Citation]:
    collected = list(citations)
    if not collected:
        raise OriginEvaluationError("Rules must provide at least one citation")
    return collected
