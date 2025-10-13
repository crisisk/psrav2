from __future__ import annotations

from datetime import date, datetime, timezone
from pathlib import Path
from uuid import UUID, uuid4

import yaml

from backend.app.contracts.psra import (
    BillOfMaterialsItem,
    DocumentationSnapshot,
    EvaluationContext,
    EvaluationInput,
    MonetaryValue,
    ProcessSnapshot,
    ProductionOperation,
)
from backend.rules_engine.origin import evaluate_origin

FIXTURE_RULE_PATH = Path("psr/rules/hs39/ceta_polymer_rule.yaml")


def _load_rule():
    data = yaml.safe_load(FIXTURE_RULE_PATH.read_text())
    from backend.app.contracts.psra import PSRARule

    return PSRARule.model_validate(data)


def _build_context() -> EvaluationContext:
    rule = _load_rule()
    return EvaluationContext(
        tenant_id=UUID("11111111-1111-1111-1111-111111111111"),
        request_id=UUID("22222222-2222-2222-2222-222222222222"),
        agreement=rule.metadata.agreement,
        hs_code=rule.metadata.hs_code,
        effective_date=date(2025, 2, 15),
        import_country="NL",
        export_country="CA",
    )


def _deterministic_now() -> datetime:
    return datetime(2025, 2, 15, 12, 0, tzinfo=timezone.utc)


def test_evaluate_origin_returns_qualified_verdict():
    rule = _load_rule()
    evaluation_input = EvaluationInput(
        context=_build_context(),
        bill_of_materials=[
            BillOfMaterialsItem(
                line_id="1",
                description="Originating naphtha feedstock",
                hs_code="271000",
                country_of_origin="CA",
                value=MonetaryValue(amount=250.0, currency="EUR"),
                is_originating=True,
            ),
            BillOfMaterialsItem(
                line_id="2",
                description="Additives",
                hs_code="381400",
                country_of_origin="FR",
                value=MonetaryValue(amount=500.0, currency="EUR"),
                is_originating=True,
            ),
        ],
        process=ProcessSnapshot(
            performed_operations=[
                ProductionOperation(code="POLYMERIZATION"),
                ProductionOperation(code="EXTRUSION"),
            ],
            total_manufacturing_cost=MonetaryValue(amount=1000.0, currency="EUR"),
            value_added_percentage=70.0,
        ),
        documentation=DocumentationSnapshot(
            submitted_certificates=["EUR.1"],
            evidence={"audit-report": "available"},
        ),
    )

    output = evaluate_origin(
        evaluation_input,
        rule,
        evaluation_id=uuid4(),
        now=_deterministic_now,
    )

    assert output.verdict.status.value == "qualified"
    assert output.verdict.disqualification_reasons == []
    assert output.verdict.citations
    assert output.verdict.decided_at == _deterministic_now()
    assert output.metrics.rules_evaluated == 1
    assert output.provenance["engine"] == "deterministic-origin"


def test_evaluate_origin_disqualifies_on_low_rvc():
    rule = _load_rule()
    evaluation_input = EvaluationInput(
        context=_build_context(),
        bill_of_materials=[
            BillOfMaterialsItem(
                line_id="1",
                description="Originating naphtha feedstock",
                hs_code="271000",
                country_of_origin="CA",
                value=MonetaryValue(amount=400.0, currency="EUR"),
                is_originating=True,
            ),
            BillOfMaterialsItem(
                line_id="2",
                description="Non-originating additives",
                hs_code="381400",
                country_of_origin="CN",
                value=MonetaryValue(amount=600.0, currency="EUR"),
                is_originating=False,
            ),
        ],
        process=ProcessSnapshot(
            performed_operations=[ProductionOperation(code="POLYMERIZATION")],
            total_manufacturing_cost=MonetaryValue(amount=1000.0, currency="EUR"),
            value_added_percentage=40.0,
        ),
        documentation=DocumentationSnapshot(
            submitted_certificates=["EUR.1"],
            evidence={},
        ),
    )

    output = evaluate_origin(
        evaluation_input,
        rule,
        evaluation_id=uuid4(),
        now=_deterministic_now,
    )

    assert output.verdict.status.value == "disqualified"
    codes = {reason.code for reason in output.verdict.disqualification_reasons}
    assert "INSUFFICIENT_RVC" in codes
    assert "MISSING_PROCESS" in codes  # EXTRUSION missing
    assert "MISSING_EVIDENCE" in codes
    assert output.verdict.citations
