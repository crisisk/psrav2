from __future__ import annotations

from datetime import date, datetime
from pathlib import Path
from uuid import UUID, uuid4

import pytest

import yaml

from backend.app.contracts import psra

FIXTURE_DIR = Path(__file__).resolve().parents[3] / "psr" / "rules"


def test_rule_contract_parses_fixture() -> None:
    rule_path = FIXTURE_DIR / "hs39" / "ceta_polymer_rule.yaml"
    payload = yaml.safe_load(rule_path.read_text(encoding="utf-8"))
    rule = psra.PSRARule.model_validate(payload)

    assert rule.metadata.rule_id == "CETA-HS39-001"
    assert rule.metadata.agreement.code == "CETA"
    assert rule.metadata.hs_code.full_code == "390110"
    assert rule.decision.qualified.citations[0].reference == "CETA Annex 5-A"
    assert rule.decision.disqualified.reasons[0].code == "INSUFFICIENT_RVC"


def test_duplicate_jurisdictions_raise_error() -> None:
    metadata = {
        "rule_id": "CETA-HS39-999",
        "title": "Invalid jurisdictions",
        "description": "Test",
        "agreement": {"code": "CETA", "name": "Agreement"},
        "hs_code": {"chapter": "39", "heading": "3901", "subheading": "390110"},
        "jurisdiction": ["EU", "EU"],
        "effective_from": "2024-01-01",
        "effective_to": None,
        "priority": 1,
        "supersedes": [],
    }
    with pytest.raises(ValueError):
        psra.RuleMetadata.model_validate(metadata)


def test_evaluation_output_round_trip() -> None:
    payload = yaml.safe_load(
        (FIXTURE_DIR / "hs40" / "tca_rubber_rule.yaml").read_text(encoding="utf-8")
    )
    rule = psra.PSRARule.model_validate(payload)
    evaluation_input = psra.EvaluationInput(
        context=psra.EvaluationContext(
            tenant_id=uuid4(),
            request_id=uuid4(),
            agreement=rule.metadata.agreement,
            hs_code=rule.metadata.hs_code,
            effective_date=date(2024, 3, 1),
            import_country="GB",
            export_country="CA",
        ),
        bill_of_materials=[
            psra.BillOfMaterialsItem(
                line_id="1",
                description="Originating rubber",
                hs_code="400110",
                country_of_origin="CA",
                value=psra.MonetaryValue(amount=1000, currency="EUR"),
                is_originating=True,
            )
        ],
        process=psra.ProcessSnapshot(
            performed_operations=[
                psra.ProductionOperation(code="VULCANIZE", performed_at=datetime.utcnow())
            ],
            total_manufacturing_cost=psra.MonetaryValue(amount=1500, currency="EUR"),
            value_added_percentage=65.0,
        ),
        documentation=psra.DocumentationSnapshot(
            submitted_certificates=["EUR.1"],
            evidence={"audit": "available"},
        ),
    )
    verdict = psra.EvaluationVerdict(
        evaluation_id=uuid4(),
        rule_id=rule.metadata.rule_id,
        status=psra.VerdictStatus.QUALIFIED,
        decided_at=datetime.utcnow(),
        confidence=0.92,
        citations=rule.decision.qualified.citations,
    )
    output = psra.EvaluationOutput(
        input=evaluation_input,
        rule=rule,
        verdict=verdict,
        metrics=psra.EvaluationMetrics(processing_time_ms=120.0, rules_evaluated=1),
        provenance={"source": "unit-test"},
    )

    assert output.verdict.rule_id == rule.metadata.rule_id
    assert output.input.context.agreement.code == "TCA"
    assert output.metrics.processing_time_ms == 120.0
