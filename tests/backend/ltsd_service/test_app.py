from __future__ import annotations

import hashlib
from datetime import date
from pathlib import Path
from typing import Dict, List
from uuid import UUID, uuid4

import pytest
import yaml
from fastapi.testclient import TestClient
from sqlalchemy.exc import NoResultFound

from backend.app.contracts.psra import (
    BillOfMaterialsItem,
    DocumentationSnapshot,
    EvaluationContext,
    EvaluationInput,
    EvaluationOutput,
    MonetaryValue,
    PSRARule,
    ProcessSnapshot,
    ProductionOperation,
    VerdictStatus,
)
from backend.ltsd_service.app import (
    GenerateCertificateRequest,
    InMemoryLedger,
    Party,
    create_app,
)


FIXTURE_RULE = Path("psr/rules/hs39/ceta_polymer_rule.yaml")


class FakeDAL:
    """In-memory DAL substitute for exercising the LTSD service."""

    def __init__(self, rule: PSRARule) -> None:
        self._rule = rule
        self.persisted: Dict[UUID, EvaluationOutput] = {}

    def get_rule(self, rule_id: str) -> PSRARule:
        if rule_id != self._rule.metadata.rule_id:
            raise NoResultFound(rule_id)
        return self._rule

    def persist_verdict(self, evaluation: EvaluationOutput) -> None:
        self.persisted[evaluation.verdict.evaluation_id] = evaluation

    def fetch_verdict(self, evaluation_id: str) -> EvaluationOutput:
        identifier = UUID(evaluation_id)
        try:
            return self.persisted[identifier]
        except KeyError as exc:
            raise NoResultFound(evaluation_id) from exc


@pytest.fixture()
def rule() -> PSRARule:
    return PSRARule.model_validate(yaml.safe_load(FIXTURE_RULE.read_text()))


@pytest.fixture()
def dal(rule: PSRARule) -> FakeDAL:
    return FakeDAL(rule)


@pytest.fixture()
def ledger() -> InMemoryLedger:
    return InMemoryLedger()


@pytest.fixture()
def app(dal: FakeDAL, ledger: InMemoryLedger):
    return create_app(dal=dal, ledger=ledger)


@pytest.fixture()
def client(app) -> TestClient:  # type: ignore[override]
    return TestClient(app)


@pytest.fixture()
def base_context(rule: PSRARule) -> EvaluationContext:
    return EvaluationContext(
        tenant_id=UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        request_id=UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        agreement=rule.metadata.agreement,
        hs_code=rule.metadata.hs_code,
        effective_date=date(2025, 2, 15),
        import_country="NL",
        export_country="CA",
    )


def _qualified_bom() -> List[BillOfMaterialsItem]:
    return [
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
    ]


def _disqualifying_bom() -> List[BillOfMaterialsItem]:
    return [
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
    ]


def _process_snapshot(include_extrusion: bool = True) -> ProcessSnapshot:
    operations = [ProductionOperation(code="POLYMERIZATION")]
    if include_extrusion:
        operations.append(ProductionOperation(code="EXTRUSION"))
    return ProcessSnapshot(
        performed_operations=operations,
        total_manufacturing_cost=MonetaryValue(amount=1000.0, currency="EUR"),
        value_added_percentage=70.0 if include_extrusion else 40.0,
    )


def _documentation(has_evidence: bool = True) -> DocumentationSnapshot:
    evidence: Dict[str, str] = {"audit-report": "available"} if has_evidence else {}
    return DocumentationSnapshot(submitted_certificates=["EUR.1"], evidence=evidence)


def _qualified_input(context: EvaluationContext) -> EvaluationInput:
    return EvaluationInput(
        context=context,
        bill_of_materials=_qualified_bom(),
        process=_process_snapshot(include_extrusion=True),
        documentation=_documentation(has_evidence=True),
    )


def _disqualified_input(context: EvaluationContext) -> EvaluationInput:
    return EvaluationInput(
        context=context,
        bill_of_materials=_disqualifying_bom(),
        process=_process_snapshot(include_extrusion=False),
        documentation=_documentation(has_evidence=False),
    )


def _serialize_input(evaluation_input: EvaluationInput) -> Dict:
    payload = evaluation_input.model_dump(mode="json")
    payload["context"]["hs_code"].pop("full_code", None)
    return payload


def test_evaluate_endpoint_persists_verdict_and_returns_ledger_ref(
    client: TestClient,
    dal: FakeDAL,
    ledger: InMemoryLedger,
    base_context: EvaluationContext,
    rule: PSRARule,
) -> None:
    payload = {
        "rule_id": rule.metadata.rule_id,
        "evaluation_input": _serialize_input(_qualified_input(base_context)),
    }

    response = client.post("/evaluate", json=payload)

    assert response.status_code == 200
    body = response.json()
    evaluation_id = UUID(body["evaluation"]["verdict"]["evaluation_id"])
    assert body["ledger_reference"].startswith("ledger://evaluation/")
    assert evaluation_id in dal.persisted
    assert ledger.evaluations
    stored_ref, stored_eval = ledger.evaluations[-1]
    assert stored_ref == body["ledger_reference"]
    assert stored_eval.verdict.evaluation_id == evaluation_id


def test_evaluate_endpoint_returns_404_for_unknown_rule(
    client: TestClient, base_context: EvaluationContext, rule: PSRARule
) -> None:
    missing_rule = rule.metadata.rule_id[:-3] + "999"
    response = client.post(
        "/evaluate",
        json={
            "rule_id": missing_rule,
            "evaluation_input": _serialize_input(_qualified_input(base_context)),
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "rule_not_found"


def test_generate_certificate_streams_pdf_with_hash_headers(
    client: TestClient,
    dal: FakeDAL,
    ledger: InMemoryLedger,
    base_context: EvaluationContext,
    rule: PSRARule,
) -> None:
    eval_response = client.post(
        "/evaluate",
        json={
            "rule_id": rule.metadata.rule_id,
            "evaluation_input": _serialize_input(_qualified_input(base_context)),
            "evaluation_id": str(uuid4()),
        },
    )
    evaluation_id = eval_response.json()["evaluation"]["verdict"]["evaluation_id"]

    request = GenerateCertificateRequest(
        evaluation_id=UUID(evaluation_id),
        certificate_code="EUR-MED",
        supplier=Party(
            name="Acme Polymers",
            street="Industrial Way 12",
            city="Rotterdam",
            postal_code="3011",
            country="NL",
            vat_number="NL123456789B01",
        ),
        customer=Party(
            name="Northern Plastics",
            street="80 Maple Street",
            city="Toronto",
            postal_code="M5H",
            country="CA",
        ),
        valid_from=date(2025, 1, 1),
        valid_to=date(2025, 12, 31),
        signatory_name="Sanne de Vries",
        signatory_title="Head of Compliance",
        issue_location="Rotterdam",
        notes="Issued under automated LTSD process",
    )

    response = client.post("/generate", json=request.model_dump(mode="json"))

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.headers["x-ledger-reference"].startswith("ledger://certificate/")
    payload_hash = hashlib.sha256(response.content).hexdigest()
    assert response.headers["x-notary-hash"] == payload_hash
    assert ledger.certificates
    recorded_ref, record = ledger.certificates[-1]
    assert recorded_ref == response.headers["x-ledger-reference"]
    assert record.sha256 == payload_hash
    assert record.evaluation_id == request.evaluation_id


def test_generate_certificate_rejects_disqualified_verdict(
    client: TestClient,
    dal: FakeDAL,
    base_context: EvaluationContext,
    rule: PSRARule,
) -> None:
    eval_response = client.post(
        "/evaluate",
        json={
            "rule_id": rule.metadata.rule_id,
            "evaluation_input": _serialize_input(_disqualified_input(base_context)),
        },
    )
    evaluation = eval_response.json()["evaluation"]
    assert evaluation["verdict"]["status"] == VerdictStatus.DISQUALIFIED.value

    response = client.post(
        "/generate",
        json={
            "evaluation_id": evaluation["verdict"]["evaluation_id"],
            "certificate_code": "EUR-MED",
            "supplier": {
                "name": "Supplier",
                "street": "Street 1",
                "city": "City",
                "postal_code": "1000",
                "country": "NL",
            },
            "customer": {
                "name": "Customer",
                "street": "Street 2",
                "city": "City",
                "postal_code": "2000",
                "country": "CA",
            },
            "valid_from": "2025-01-01",
            "valid_to": "2025-12-31",
            "signatory_name": "Signer",
            "signatory_title": "Title",
            "issue_location": "Rotterdam",
        },
    )

    assert response.status_code == 422
    assert response.json()["detail"] == "certificate_available_only_for_qualified_verdicts"


def test_generate_certificate_returns_404_for_unknown_evaluation(client: TestClient) -> None:
    response = client.post(
        "/generate",
        json={
            "evaluation_id": str(uuid4()),
            "certificate_code": "EUR-MED",
            "supplier": {
                "name": "Supplier",
                "street": "Street 1",
                "city": "City",
                "postal_code": "1000",
                "country": "NL",
            },
            "customer": {
                "name": "Customer",
                "street": "Street 2",
                "city": "City",
                "postal_code": "2000",
                "country": "CA",
            },
            "valid_from": "2025-01-01",
            "valid_to": "2025-12-31",
            "signatory_name": "Signer",
            "signatory_title": "Title",
            "issue_location": "Rotterdam",
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "evaluation_not_found"
