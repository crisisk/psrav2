from __future__ import annotations

from datetime import date, datetime
from pathlib import Path
from uuid import uuid4

import shutil

import pytest
import yaml
from sqlalchemy.exc import NoResultFound
from testcontainers.postgres import PostgresContainer

from backend.app.contracts import psra
from backend.app.dal.postgres_dal import PostgresDAL
from backend.app.db.base import Base
from backend.app.db.session import build_engine, create_session_factory

FIXTURE_DIR = Path(__file__).resolve().parents[3] / "psr" / "rules"


@pytest.fixture(scope="module")
def postgres_dsn() -> str:
    if shutil.which("docker") is None:
        pytest.skip("Docker is required to run Postgres test container")
    with PostgresContainer("postgres:15-alpine") as container:
        yield container.get_connection_url()


def _load_rule(name: str) -> psra.PSRARule:
    payload = yaml.safe_load((FIXTURE_DIR / name).read_text(encoding="utf-8"))
    return psra.PSRARule.model_validate(payload)


def test_upsert_and_list_rules(postgres_dsn: str) -> None:
    engine = build_engine(postgres_dsn)
    Base.metadata.create_all(engine)
    dal = PostgresDAL(create_session_factory(engine))
    rule = _load_rule("hs39/ceta_polymer_rule.yaml")

    dal.upsert_rules([rule])
    results = dal.list_rules(
        agreement_code=rule.metadata.agreement.code,
        hs_subheading=rule.metadata.hs_code.subheading,
        effective_on=date(2024, 5, 1),
    )

    assert len(results) == 1
    stored = results[0]
    assert stored.metadata.rule_id == rule.metadata.rule_id
    assert stored.metadata.priority == 1


def test_persist_and_fetch_verdict(postgres_dsn: str) -> None:
    engine = build_engine(postgres_dsn)
    Base.metadata.create_all(engine)
    dal = PostgresDAL(create_session_factory(engine))
    rule = _load_rule("hs40/tca_rubber_rule.yaml")
    dal.upsert_rules([rule])

    evaluation_input = psra.EvaluationInput(
        context=psra.EvaluationContext(
            tenant_id=uuid4(),
            request_id=uuid4(),
            agreement=rule.metadata.agreement,
            hs_code=rule.metadata.hs_code,
            effective_date=date(2024, 2, 1),
            import_country="GB",
            export_country="CA",
        ),
        bill_of_materials=[
            psra.BillOfMaterialsItem(
                line_id="1",
                description="Originating rubber",
                hs_code="400110",
                country_of_origin="CA",
                value=psra.MonetaryValue(amount=1500, currency="EUR"),
                is_originating=True,
            )
        ],
        process=psra.ProcessSnapshot(
            performed_operations=[psra.ProductionOperation(code="VULCANIZE")],
            total_manufacturing_cost=psra.MonetaryValue(amount=2200, currency="EUR"),
            value_added_percentage=70.0,
        ),
        documentation=psra.DocumentationSnapshot(
            submitted_certificates=["EUR.1"],
            evidence={"audit": "passed"},
        ),
    )
    verdict = psra.EvaluationVerdict(
        evaluation_id=uuid4(),
        rule_id=rule.metadata.rule_id,
        status=psra.VerdictStatus.DISQUALIFIED,
        decided_at=datetime.utcnow(),
        confidence=0.4,
        citations=rule.decision.qualified.citations,
        disqualification_reasons=rule.decision.disqualified.reasons,
        notes="Insufficient value content",
    )
    evaluation_output = psra.EvaluationOutput(
        input=evaluation_input,
        rule=rule,
        verdict=verdict,
        metrics=psra.EvaluationMetrics(processing_time_ms=215.0, rules_evaluated=1),
        provenance={"source": "pytest"},
    )

    dal.persist_verdict(evaluation_output)
    stored = dal.fetch_verdict(str(verdict.evaluation_id))

    assert stored.verdict.rule_id == rule.metadata.rule_id
    assert stored.verdict.status is psra.VerdictStatus.DISQUALIFIED
    assert stored.metrics.processing_time_ms == pytest.approx(215.0)
    assert stored.provenance["lineage_required"] is True

    with pytest.raises(NoResultFound):
        dal.fetch_verdict(str(uuid4()))
