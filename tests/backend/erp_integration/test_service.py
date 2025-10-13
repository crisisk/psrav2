from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

import pytest
import shutil
from sqlalchemy import select
from testcontainers.postgres import PostgresContainer

from backend.app.contracts import inventory, psra
from backend.app.db.base import Base
from backend.app.db.session import build_engine, create_session_factory, session_scope
from backend.erp_integration import (
    ERPIntegrationService,
    FatalERPIntegrationError,
    OutboxStatus,
)
from backend.app.dal.models import ERPOutboxRecord


class DummyGateway:
    def __init__(self) -> None:
        self.calls: list[tuple[UUID, inventory.RecipeSyncCommand]] = []
        self.fail_next = False
        self.raise_fatal = False

    def upsert_recipe(
        self, *, tenant_id: UUID, command: inventory.RecipeSyncCommand
    ) -> str | None:
        self.calls.append((tenant_id, command))
        if self.raise_fatal:
            raise FatalERPIntegrationError("fatal rejection")
        if self.fail_next:
            self.fail_next = False
            raise RuntimeError("transient failure")
        return f"ERP-{command.recipe.recipe_code}"


def _make_command() -> inventory.RecipeSyncCommand:
    material = inventory.RecipeMaterial(
        material_code="MAT-001",
        description="Primary polymer",
        hs_code="390110",
        quantity=10.0,
        unit_of_measure="KG",
        unit_cost=psra.MonetaryValue(amount=5.5, currency="EUR"),
    )
    recipe = inventory.Recipe(
        recipe_code="RCP-100",
        name="Polymer Blend",
        version="1.0",
        effective_from=datetime.utcnow(),
        materials=[material],
    )
    return inventory.RecipeSyncCommand(
        tenant_id=uuid4(),
        idempotency_key="sync-rcp-100",
        recipe=recipe,
        triggered_at=datetime.utcnow(),
        source_system="psra-ltsd",
        requested_by="automation",
    )


@pytest.fixture(scope="module")
def postgres_dsn() -> str:
    if shutil.which("docker") is None:
        pytest.skip("Docker is required to run Postgres test container")
    with PostgresContainer("postgres:15-alpine") as container:
        yield container.get_connection_url()


@pytest.fixture()
def service(postgres_dsn: str):
    engine = build_engine(postgres_dsn)
    Base.metadata.create_all(engine)
    session_factory = create_session_factory(engine)
    gateway = DummyGateway()
    service = ERPIntegrationService(session_factory, gateway)
    try:
        yield service, gateway, session_factory
    finally:
        Base.metadata.drop_all(engine)


def test_enqueue_is_idempotent(service) -> None:
    svc, gateway, _ = service
    command = _make_command()

    first = svc.enqueue_recipe_sync(command)
    second = svc.enqueue_recipe_sync(command)

    assert first.saga_id == second.saga_id
    assert first.status is OutboxStatus.PENDING
    assert first.attempts == 0
    assert gateway.calls == []


def test_process_pending_success(service) -> None:
    svc, gateway, _ = service
    command = _make_command()

    entry = svc.enqueue_recipe_sync(command)

    summary = svc.process_pending(limit=5)

    assert summary.processed == 1
    assert summary.failed == 0
    assert entry.saga_id in summary.completed_ids
    assert len(gateway.calls) == 1

    stored = svc.get_entry(entry.saga_id)
    assert stored is not None
    assert stored.status is OutboxStatus.COMPLETED
    assert stored.attempts == 1

    result = svc.get_result(entry.saga_id)
    assert result is not None
    assert result.external_recipe_id == "ERP-RCP-100"
    assert result.attempts == 1


def test_process_retry_then_success(service) -> None:
    svc, gateway, session_factory = service
    command = _make_command()
    gateway.fail_next = True
    entry = svc.enqueue_recipe_sync(command)

    summary_fail = svc.process_pending(limit=5)
    assert summary_fail.failed == 1
    pending = svc.get_entry(entry.saga_id)
    assert pending is not None
    assert pending.status is OutboxStatus.PENDING
    assert pending.attempts == 1
    assert pending.last_error is not None

    # accelerate retry window
    with session_scope(session_factory) as session:
        record = session.scalar(
            select(ERPOutboxRecord).where(ERPOutboxRecord.saga_id == entry.saga_id)
        )
        assert record is not None
        record.next_run_at = datetime.utcnow()

    summary_success = svc.process_pending(limit=5)
    assert summary_success.processed == 1
    final_entry = svc.get_entry(entry.saga_id)
    assert final_entry is not None
    assert final_entry.status is OutboxStatus.COMPLETED
    assert final_entry.attempts == 2
    result = svc.get_result(entry.saga_id)
    assert result is not None
    assert result.attempts == 2

