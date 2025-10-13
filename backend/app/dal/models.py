"""SQLAlchemy ORM models for PSRA canonical storage."""

from __future__ import annotations

from datetime import date, datetime
from uuid import UUID, uuid4

from sqlalchemy import Boolean, Date, DateTime, Float, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.db.base import Base


class RuleRecord(Base):
    __tablename__ = "psra_rules"

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    rule_id: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    version: Mapped[str] = mapped_column(String(16), nullable=False)
    agreement_code: Mapped[str] = mapped_column(String(16), index=True, nullable=False)
    agreement_name: Mapped[str] = mapped_column(String(255), nullable=False)
    hs_chapter: Mapped[str] = mapped_column(String(2), nullable=False)
    hs_heading: Mapped[str] = mapped_column(String(4), nullable=False)
    hs_subheading: Mapped[str] = mapped_column(String(6), nullable=False)
    jurisdictions: Mapped[list[str]] = mapped_column(ARRAY(String(2)), nullable=False)
    effective_from: Mapped[date] = mapped_column(Date, nullable=False)
    effective_to: Mapped[date | None] = mapped_column(Date, nullable=True)
    priority: Mapped[int] = mapped_column(Integer, nullable=False)
    supersedes: Mapped[list[str]] = mapped_column(ARRAY(String(32)), nullable=False, default=list)
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )


class VerdictRecord(Base):
    __tablename__ = "psra_verdicts"

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    evaluation_id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), unique=True, nullable=False)
    rule_id: Mapped[str] = mapped_column(String(32), index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    citations: Mapped[dict] = mapped_column(JSONB, nullable=False)
    reasons: Mapped[dict] = mapped_column(JSONB, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    ledger_reference: Mapped[str | None] = mapped_column(String(255), nullable=True)
    input_payload: Mapped[dict] = mapped_column(JSONB, nullable=False)
    input_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    processing_time_ms: Mapped[float] = mapped_column(Float, nullable=False)
    rules_evaluated: Mapped[int] = mapped_column(Integer, nullable=False)
    decided_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )
    tenant_id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    request_id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    agreement_code: Mapped[str] = mapped_column(String(16), nullable=False)
    hs_subheading: Mapped[str] = mapped_column(String(6), nullable=False)
    effective_date: Mapped[date] = mapped_column(Date, nullable=False)
    import_country: Mapped[str] = mapped_column(String(2), nullable=False)
    export_country: Mapped[str] = mapped_column(String(2), nullable=False)
    lineage_required: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


class ERPOutboxRecord(Base):
    __tablename__ = "erp_outbox"
    __table_args__ = (
        UniqueConstraint("tenant_id", "idempotency_key", name="uq_erp_outbox_idempotency"),
    )

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    saga_id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid4)
    tenant_id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    idempotency_key: Mapped[str] = mapped_column(String(128), nullable=False)
    event_type: Mapped[str] = mapped_column(String(64), nullable=False)
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")
    attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    next_run_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    result_payload: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    processing_started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )
