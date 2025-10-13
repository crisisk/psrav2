"""ERP integration service implementing saga + outbox semantics."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional, Protocol, Sequence
from uuid import UUID

from sqlalchemy import Select, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, sessionmaker

from backend.app.contracts.inventory import RecipeSyncCommand, RecipeSyncResult
from backend.app.dal.models import ERPOutboxRecord
from backend.app.db.session import session_scope


class OutboxStatus(str, Enum):
    """Lifecycle states for outbox messages."""

    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    DEAD = "dead"


class FatalERPIntegrationError(RuntimeError):
    """Raised when the ERP rejects a payload and retrying is futile."""


class InventoryGateway(Protocol):
    """Minimal interface that inventory implementations must satisfy."""

    def upsert_recipe(self, *, tenant_id: UUID, command: RecipeSyncCommand) -> Optional[str]:
        """Persist a recipe in the downstream ERP and return the external identifier."""


@dataclass(frozen=True, slots=True)
class OutboxEntry:
    """Lightweight representation of an outbox record."""

    saga_id: UUID
    tenant_id: UUID
    idempotency_key: str
    status: OutboxStatus
    attempts: int
    next_run_at: datetime
    last_error: Optional[str]
    event_type: str


@dataclass(frozen=True, slots=True)
class ProcessSummary:
    """Aggregated outcome of a processing round."""

    processed: int
    failed: int
    completed_ids: Sequence[UUID]
    failed_ids: Sequence[UUID]


class ERPIntegrationService:
    """Coordinates ERP synchronisation workflows via an outbox pattern."""

    MAX_ATTEMPTS = 5
    BACKOFF_SECONDS = (30, 120, 600, 1800, 3600)

    def __init__(self, session_factory: sessionmaker[Session], inventory_gateway: InventoryGateway):
        self._session_factory = session_factory
        self._inventory_gateway = inventory_gateway

    # ------------------------------------------------------------------
    # Outbox management
    # ------------------------------------------------------------------
    def enqueue_recipe_sync(self, command: RecipeSyncCommand) -> OutboxEntry:
        """Store a recipe sync request while enforcing idempotency."""

        payload = command.model_dump(mode="json")
        with session_scope(self._session_factory) as session:
            record = self._get_existing_entry(session, command.tenant_id, command.idempotency_key)
            if record is None:
                record = ERPOutboxRecord(
                    tenant_id=command.tenant_id,
                    idempotency_key=command.idempotency_key,
                    event_type="inventory.recipe.upsert",
                    payload=payload,
                    status=OutboxStatus.PENDING.value,
                    attempts=0,
                    next_run_at=datetime.utcnow(),
                )
                session.add(record)
                try:
                    session.flush()
                except IntegrityError:
                    session.rollback()
                    record = self._get_existing_entry(session, command.tenant_id, command.idempotency_key)
                    if record is None:
                        raise
            return self._to_entry(record)

    def get_entry(self, saga_id: UUID) -> Optional[OutboxEntry]:
        with session_scope(self._session_factory) as session:
            record = session.scalar(
                select(ERPOutboxRecord).where(ERPOutboxRecord.saga_id == saga_id)
            )
            return self._to_entry(record) if record else None

    def get_result(self, saga_id: UUID) -> Optional[RecipeSyncResult]:
        with session_scope(self._session_factory) as session:
            record = session.scalar(
                select(ERPOutboxRecord).where(ERPOutboxRecord.saga_id == saga_id)
            )
            if record and record.result_payload:
                return RecipeSyncResult.model_validate(record.result_payload)
            return None

    def list_dead_letters(self, *, limit: int = 100) -> Sequence[OutboxEntry]:
        with session_scope(self._session_factory) as session:
            stmt: Select[ERPOutboxRecord] = (
                select(ERPOutboxRecord)
                .where(ERPOutboxRecord.status == OutboxStatus.DEAD.value)
                .order_by(ERPOutboxRecord.updated_at.desc())
                .limit(limit)
            )
            records = session.execute(stmt).scalars().all()
            return [self._to_entry(record) for record in records]

    # ------------------------------------------------------------------
    # Processing
    # ------------------------------------------------------------------
    def process_pending(self, *, limit: int = 10) -> ProcessSummary:
        """Process pending outbox entries respecting retry semantics."""

        processed: list[UUID] = []
        failed: list[UUID] = []
        with session_scope(self._session_factory) as session:
            now = datetime.utcnow()
            stmt: Select[ERPOutboxRecord] = (
                select(ERPOutboxRecord)
                .where(ERPOutboxRecord.status == OutboxStatus.PENDING.value)
                .where(ERPOutboxRecord.next_run_at <= now)
                .order_by(ERPOutboxRecord.created_at.asc())
                .limit(limit)
                .with_for_update(skip_locked=True)
            )
            records = session.execute(stmt).scalars().all()
            for record in records:
                record.status = OutboxStatus.IN_PROGRESS.value
                record.processing_started_at = now
                record.attempts += 1
                session.flush()

                command = RecipeSyncCommand.model_validate(record.payload)
                try:
                    external_id = self._inventory_gateway.upsert_recipe(
                        tenant_id=command.tenant_id, command=command
                    )
                    self._mark_success(record, external_id)
                    processed.append(record.saga_id)
                except FatalERPIntegrationError as exc:  # pragma: no cover - exercised via subclass
                    self._mark_dead(record, str(exc))
                    failed.append(record.saga_id)
                except Exception as exc:  # noqa: BLE001
                    self._mark_retry(record, str(exc))
                    failed.append(record.saga_id)
        return ProcessSummary(
            processed=len(processed),
            failed=len(failed),
            completed_ids=processed,
            failed_ids=failed,
        )

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    def _get_existing_entry(
        self, session: Session, tenant_id: UUID, idempotency_key: str
    ) -> Optional[ERPOutboxRecord]:
        return session.scalar(
            select(ERPOutboxRecord).where(
                ERPOutboxRecord.tenant_id == tenant_id,
                ERPOutboxRecord.idempotency_key == idempotency_key,
            )
        )

    def _mark_success(self, record: ERPOutboxRecord, external_id: Optional[str]) -> None:
        record.status = OutboxStatus.COMPLETED.value
        record.processed_at = datetime.utcnow()
        result = RecipeSyncResult(
            external_recipe_id=external_id or record.payload["recipe"]["recipe_code"],
            processed_at=record.processed_at,
            attempts=record.attempts,
            notes=None,
        )
        record.result_payload = result.model_dump(mode="json")
        record.last_error = None
        record.next_run_at = record.processed_at

    def _mark_dead(self, record: ERPOutboxRecord, error: str) -> None:
        record.status = OutboxStatus.DEAD.value
        record.last_error = error
        record.processed_at = datetime.utcnow()
        record.next_run_at = record.processed_at

    def _mark_retry(self, record: ERPOutboxRecord, error: str) -> None:
        record.last_error = error
        record.processed_at = datetime.utcnow()
        if record.attempts >= self.MAX_ATTEMPTS:
            self._mark_dead(record, error)
            return
        delay = self._backoff_seconds(record.attempts)
        record.status = OutboxStatus.PENDING.value
        record.next_run_at = record.processed_at + timedelta(seconds=delay)

    def _to_entry(self, record: ERPOutboxRecord) -> OutboxEntry:
        return OutboxEntry(
            saga_id=record.saga_id,
            tenant_id=record.tenant_id,
            idempotency_key=record.idempotency_key,
            status=OutboxStatus(record.status),
            attempts=record.attempts,
            next_run_at=record.next_run_at,
            last_error=record.last_error,
            event_type=record.event_type,
        )

    def _backoff_seconds(self, attempt: int) -> int:
        index = min(attempt - 1, len(self.BACKOFF_SECONDS) - 1)
        return self.BACKOFF_SECONDS[index]
