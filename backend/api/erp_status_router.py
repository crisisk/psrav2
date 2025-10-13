"""ERP Integration Monitoring API Router.

REST API endpoints for monitoring ERP synchronisation status, metrics, and failures.

Endpoints:
- GET /api/erp/status - Get sync queue status
- GET /api/erp/metrics - Get success rate and average latency
- GET /api/erp/failed - Get failed sync attempts
- GET /api/erp/dead-letter - Get dead letter queue
- GET /api/erp/saga/{saga_id} - Get specific saga status
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Optional, Sequence
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

from backend.app.dal.models import ERPOutboxRecord
from backend.app.db.session import get_db
from backend.erp_integration.service import ERPIntegrationService, OutboxStatus


router = APIRouter(prefix="/api/erp", tags=["ERP Monitoring"])


# Response models
class SyncQueueStatus(BaseModel):
    """Current status of the ERP sync queue."""

    model_config = ConfigDict(frozen=True)

    pending_count: int = Field(description="Number of pending sync jobs")
    in_progress_count: int = Field(description="Number of jobs currently processing")
    completed_count: int = Field(description="Total completed syncs")
    dead_count: int = Field(description="Number of dead letter items")
    oldest_pending_at: Optional[datetime] = Field(description="Timestamp of oldest pending job")
    newest_pending_at: Optional[datetime] = Field(description="Timestamp of newest pending job")
    total_queue_size: int = Field(description="Total items in queue (pending + in_progress)")
    backlog_hours: Optional[float] = Field(description="Hours of backlog (oldest pending)")


class RetryMetrics(BaseModel):
    """Retry-related metrics."""

    model_config = ConfigDict(frozen=True)

    total_retries: int = Field(description="Total number of retries across all sagas")
    avg_retries_per_saga: float = Field(description="Average retries per saga")
    max_retries_saga_id: Optional[UUID] = Field(description="Saga with most retries")
    max_retries_count: int = Field(description="Maximum retries for a single saga")
    sagas_with_retries: int = Field(description="Number of sagas that required retries")


class ERPMetrics(BaseModel):
    """ERP integration performance metrics."""

    model_config = ConfigDict(frozen=True)

    success_rate: float = Field(description="Success rate (0-100%)")
    avg_latency_seconds: float = Field(description="Average processing time in seconds")
    total_processed: int = Field(description="Total processed jobs")
    total_succeeded: int = Field(description="Total successful jobs")
    total_failed: int = Field(description="Total failed jobs (including retries)")
    retry_metrics: RetryMetrics = Field(description="Retry-specific metrics")
    dead_letter_queue_size: int = Field(description="Current dead letter queue size")
    period_start: datetime = Field(description="Metrics period start")
    period_end: datetime = Field(description="Metrics period end")


class FailedSyncAttempt(BaseModel):
    """Details of a failed sync attempt."""

    model_config = ConfigDict(frozen=True)

    saga_id: UUID
    tenant_id: UUID
    event_type: str
    idempotency_key: str
    attempts: int
    last_error: Optional[str]
    next_run_at: datetime
    created_at: datetime
    updated_at: datetime
    status: str
    payload_summary: Optional[str] = Field(description="Summary of payload (recipe_code, etc.)")


class FailedSyncList(BaseModel):
    """List of failed sync attempts."""

    model_config = ConfigDict(frozen=True)

    items: Sequence[FailedSyncAttempt]
    total_count: int
    page: int
    page_size: int


class SagaDetail(BaseModel):
    """Detailed information about a specific saga."""

    model_config = ConfigDict(frozen=True)

    saga_id: UUID
    tenant_id: UUID
    idempotency_key: str
    event_type: str
    status: str
    attempts: int
    next_run_at: datetime
    last_error: Optional[str]
    payload: dict
    result_payload: Optional[dict]
    processing_started_at: Optional[datetime]
    processed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    backoff_seconds: Optional[int] = Field(description="Current backoff delay")
    time_in_queue_seconds: Optional[float] = Field(description="Time spent in queue")


# Service layer
@dataclass
class ERPMonitoringService:
    """Service for retrieving ERP monitoring data."""

    session: Session

    def get_queue_status(self) -> SyncQueueStatus:
        """Get current sync queue status."""
        now = datetime.utcnow()

        # Count by status
        pending_count = self.session.scalar(
            select(func.count(ERPOutboxRecord.id)).where(
                ERPOutboxRecord.status == OutboxStatus.PENDING.value
            )
        ) or 0

        in_progress_count = self.session.scalar(
            select(func.count(ERPOutboxRecord.id)).where(
                ERPOutboxRecord.status == OutboxStatus.IN_PROGRESS.value
            )
        ) or 0

        completed_count = self.session.scalar(
            select(func.count(ERPOutboxRecord.id)).where(
                ERPOutboxRecord.status == OutboxStatus.COMPLETED.value
            )
        ) or 0

        dead_count = self.session.scalar(
            select(func.count(ERPOutboxRecord.id)).where(
                ERPOutboxRecord.status == OutboxStatus.DEAD.value
            )
        ) or 0

        # Get oldest and newest pending
        oldest_pending_result = self.session.execute(
            select(func.min(ERPOutboxRecord.created_at)).where(
                ERPOutboxRecord.status == OutboxStatus.PENDING.value
            )
        ).scalar()

        newest_pending_result = self.session.execute(
            select(func.max(ERPOutboxRecord.created_at)).where(
                ERPOutboxRecord.status == OutboxStatus.PENDING.value
            )
        ).scalar()

        oldest_pending_at = oldest_pending_result if oldest_pending_result else None
        newest_pending_at = newest_pending_result if newest_pending_result else None

        # Calculate backlog hours
        backlog_hours = None
        if oldest_pending_at:
            delta = now - oldest_pending_at
            backlog_hours = delta.total_seconds() / 3600

        return SyncQueueStatus(
            pending_count=pending_count,
            in_progress_count=in_progress_count,
            completed_count=completed_count,
            dead_count=dead_count,
            oldest_pending_at=oldest_pending_at,
            newest_pending_at=newest_pending_at,
            total_queue_size=pending_count + in_progress_count,
            backlog_hours=backlog_hours,
        )

    def get_metrics(self, hours: int = 24) -> ERPMetrics:
        """Get ERP integration metrics for the specified time period."""
        period_end = datetime.utcnow()
        period_start = period_end - timedelta(hours=hours)

        # Get records in time period
        stmt: Select = select(ERPOutboxRecord).where(
            ERPOutboxRecord.created_at >= period_start
        )
        records = self.session.execute(stmt).scalars().all()

        total_processed = len(records)
        total_succeeded = sum(1 for r in records if r.status == OutboxStatus.COMPLETED.value)
        total_failed = sum(
            1
            for r in records
            if r.status in [OutboxStatus.DEAD.value, OutboxStatus.PENDING.value] and r.attempts > 0
        )

        # Calculate success rate
        success_rate = (total_succeeded / total_processed * 100) if total_processed > 0 else 0.0

        # Calculate average latency for completed jobs
        completed_records = [r for r in records if r.status == OutboxStatus.COMPLETED.value and r.processed_at]
        latencies = [
            (r.processed_at - r.created_at).total_seconds()
            for r in completed_records
            if r.processed_at
        ]
        avg_latency = sum(latencies) / len(latencies) if latencies else 0.0

        # Retry metrics
        total_retries = sum(r.attempts - 1 for r in records if r.attempts > 1)
        sagas_with_retries = sum(1 for r in records if r.attempts > 1)
        avg_retries = total_retries / total_processed if total_processed > 0 else 0.0

        # Find saga with most retries
        max_retry_record = max(records, key=lambda r: r.attempts) if records else None
        max_retries_saga_id = max_retry_record.saga_id if max_retry_record else None
        max_retries_count = max_retry_record.attempts if max_retry_record else 0

        # Dead letter queue size
        dead_count = self.session.scalar(
            select(func.count(ERPOutboxRecord.id)).where(
                ERPOutboxRecord.status == OutboxStatus.DEAD.value
            )
        ) or 0

        retry_metrics = RetryMetrics(
            total_retries=total_retries,
            avg_retries_per_saga=avg_retries,
            max_retries_saga_id=max_retries_saga_id,
            max_retries_count=max_retries_count,
            sagas_with_retries=sagas_with_retries,
        )

        return ERPMetrics(
            success_rate=success_rate,
            avg_latency_seconds=avg_latency,
            total_processed=total_processed,
            total_succeeded=total_succeeded,
            total_failed=total_failed,
            retry_metrics=retry_metrics,
            dead_letter_queue_size=dead_count,
            period_start=period_start,
            period_end=period_end,
        )

    def get_failed_syncs(
        self, *, page: int = 1, page_size: int = 50, include_dead: bool = True
    ) -> FailedSyncList:
        """Get list of failed sync attempts."""
        offset = (page - 1) * page_size

        # Build query for failed items
        statuses = [OutboxStatus.PENDING.value]
        if include_dead:
            statuses.append(OutboxStatus.DEAD.value)

        stmt: Select = (
            select(ERPOutboxRecord)
            .where(
                ERPOutboxRecord.status.in_(statuses),
                ERPOutboxRecord.attempts > 0,
            )
            .order_by(ERPOutboxRecord.updated_at.desc())
            .limit(page_size)
            .offset(offset)
        )

        records = self.session.execute(stmt).scalars().all()

        # Count total
        count_stmt = select(func.count(ERPOutboxRecord.id)).where(
            ERPOutboxRecord.status.in_(statuses),
            ERPOutboxRecord.attempts > 0,
        )
        total_count = self.session.scalar(count_stmt) or 0

        # Convert to response models
        items = [
            FailedSyncAttempt(
                saga_id=r.saga_id,
                tenant_id=r.tenant_id,
                event_type=r.event_type,
                idempotency_key=r.idempotency_key,
                attempts=r.attempts,
                last_error=r.last_error,
                next_run_at=r.next_run_at,
                created_at=r.created_at,
                updated_at=r.updated_at,
                status=r.status,
                payload_summary=self._get_payload_summary(r.payload),
            )
            for r in records
        ]

        return FailedSyncList(
            items=items,
            total_count=total_count,
            page=page,
            page_size=page_size,
        )

    def get_saga_detail(self, saga_id: UUID) -> Optional[SagaDetail]:
        """Get detailed information about a specific saga."""
        record = self.session.scalar(
            select(ERPOutboxRecord).where(ERPOutboxRecord.saga_id == saga_id)
        )

        if not record:
            return None

        # Calculate backoff seconds if pending and has attempts
        backoff_seconds = None
        if record.status == OutboxStatus.PENDING.value and record.attempts > 0:
            backoff_seconds = self._calculate_backoff(record.attempts)

        # Calculate time in queue
        time_in_queue_seconds = None
        if record.processed_at:
            time_in_queue_seconds = (record.processed_at - record.created_at).total_seconds()

        return SagaDetail(
            saga_id=record.saga_id,
            tenant_id=record.tenant_id,
            idempotency_key=record.idempotency_key,
            event_type=record.event_type,
            status=record.status,
            attempts=record.attempts,
            next_run_at=record.next_run_at,
            last_error=record.last_error,
            payload=record.payload,
            result_payload=record.result_payload,
            processing_started_at=record.processing_started_at,
            processed_at=record.processed_at,
            created_at=record.created_at,
            updated_at=record.updated_at,
            backoff_seconds=backoff_seconds,
            time_in_queue_seconds=time_in_queue_seconds,
        )

    @staticmethod
    def _get_payload_summary(payload: dict) -> Optional[str]:
        """Extract summary from payload."""
        if "recipe" in payload:
            recipe = payload["recipe"]
            return f"{recipe.get('recipe_code', 'N/A')} v{recipe.get('version', 'N/A')}"
        return None

    @staticmethod
    def _calculate_backoff(attempts: int) -> int:
        """Calculate backoff seconds for given attempt number."""
        backoff_schedule = (30, 120, 600, 1800, 3600)
        index = min(attempts - 1, len(backoff_schedule) - 1)
        return backoff_schedule[index]


# Dependency
def get_monitoring_service(session: Session = Depends(get_db)) -> ERPMonitoringService:
    """Dependency for ERP monitoring service."""
    return ERPMonitoringService(session=session)


# API Endpoints
@router.get("/status", response_model=SyncQueueStatus, summary="Get sync queue status")
async def get_sync_status(
    service: ERPMonitoringService = Depends(get_monitoring_service),
) -> SyncQueueStatus:
    """Get current status of the ERP synchronisation queue.

    Returns counts for:
    - Pending jobs
    - In-progress jobs
    - Completed jobs
    - Dead letter items
    - Queue backlog information
    """
    return service.get_queue_status()


@router.get("/metrics", response_model=ERPMetrics, summary="Get integration metrics")
async def get_erp_metrics(
    hours: int = Query(24, ge=1, le=168, description="Time period in hours (1-168)"),
    service: ERPMonitoringService = Depends(get_monitoring_service),
) -> ERPMetrics:
    """Get ERP integration performance metrics for the specified time period.

    Returns:
    - Success rate percentage
    - Average latency
    - Retry statistics
    - Dead letter queue size
    """
    return service.get_metrics(hours=hours)


@router.get("/failed", response_model=FailedSyncList, summary="Get failed sync attempts")
async def get_failed_syncs(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=200, description="Items per page"),
    include_dead: bool = Query(True, description="Include dead letter items"),
    service: ERPMonitoringService = Depends(get_monitoring_service),
) -> FailedSyncList:
    """Get list of failed synchronisation attempts.

    Returns paginated list of sync jobs that failed at least once,
    including those in retry queue and dead letter queue.
    """
    return service.get_failed_syncs(page=page, page_size=page_size, include_dead=include_dead)


@router.get("/saga/{saga_id}", response_model=SagaDetail, summary="Get saga details")
async def get_saga_status(
    saga_id: UUID,
    service: ERPMonitoringService = Depends(get_monitoring_service),
) -> SagaDetail:
    """Get detailed information about a specific saga by its ID.

    Includes:
    - Full payload
    - Result payload (if completed)
    - Retry history
    - Timing information
    """
    saga = service.get_saga_detail(saga_id)
    if not saga:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Saga {saga_id} not found",
        )
    return saga
