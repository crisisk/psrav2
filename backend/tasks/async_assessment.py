"""Async task processing for PSRA assessments.

Provides background task queue for heavy assessment operations with progress tracking.
"""

from __future__ import annotations

import asyncio
import logging
import traceback
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Callable, Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field

from backend.services.cache_service import get_cache

logger = logging.getLogger(__name__)


class JobStatus(str, Enum):
    """Status of an async job."""

    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class JobPriority(str, Enum):
    """Priority levels for job execution."""

    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    CRITICAL = "critical"


class JobResult(BaseModel):
    """Result of a completed job."""

    job_id: UUID
    status: JobStatus
    result: Optional[Any] = None
    error: Optional[str] = None
    error_traceback: Optional[str] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    progress: int = Field(default=0, ge=0, le=100)
    progress_message: Optional[str] = None
    metadata: dict[str, Any] = Field(default_factory=dict)

    @property
    def duration_seconds(self) -> float | None:
        """Calculate job duration in seconds."""
        if self.started_at and self.completed_at:
            return (self.completed_at - self.started_at).total_seconds()
        return None

    @property
    def is_terminal(self) -> bool:
        """Check if job is in a terminal state."""
        return self.status in (JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED)


class Job(BaseModel):
    """Represents an async job."""

    job_id: UUID = Field(default_factory=uuid4)
    job_type: str
    priority: JobPriority = JobPriority.NORMAL
    payload: dict[str, Any]
    tenant_id: Optional[UUID] = None
    user_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    ttl_seconds: int = 3600  # Job result TTL in cache


class AsyncJobQueue:
    """Simple async job queue using Redis for state management."""

    def __init__(self, max_concurrent_jobs: int = 10):
        """Initialize job queue.

        Args:
            max_concurrent_jobs: Maximum number of concurrent jobs
        """
        self.cache = get_cache()
        self.max_concurrent_jobs = max_concurrent_jobs
        self.handlers: dict[str, Callable] = {}
        self._running_jobs: dict[UUID, asyncio.Task] = {}
        self._queue: asyncio.Queue[Job] = asyncio.Queue()
        self._worker_task: Optional[asyncio.Task] = None
        self._shutdown = False

        logger.info(f"Initialized AsyncJobQueue (max_concurrent={max_concurrent_jobs})")

    def register_handler(self, job_type: str, handler: Callable) -> None:
        """Register a handler for a specific job type.

        Args:
            job_type: Type of job to handle
            handler: Async function to execute for this job type
        """
        self.handlers[job_type] = handler
        logger.info(f"Registered handler for job type: {job_type}")

    async def submit_job(self, job: Job) -> UUID:
        """Submit a job to the queue.

        Args:
            job: Job to submit

        Returns:
            Job ID

        Raises:
            ValueError: If job type has no registered handler
        """
        if job.job_type not in self.handlers:
            raise ValueError(f"No handler registered for job type: {job.job_type}")

        # Create initial job result
        result = JobResult(
            job_id=job.job_id,
            status=JobStatus.PENDING,
            created_at=job.created_at,
            metadata={
                "job_type": job.job_type,
                "priority": job.priority,
                "tenant_id": str(job.tenant_id) if job.tenant_id else None,
                "user_id": job.user_id,
            },
        )

        # Store in cache
        self._save_job_result(result, ttl=job.ttl_seconds)

        # Add to queue
        await self._queue.put(job)

        logger.info(f"Job submitted: {job.job_id} (type={job.job_type}, priority={job.priority})")
        return job.job_id

    async def get_job_status(self, job_id: UUID) -> JobResult | None:
        """Get status of a job.

        Args:
            job_id: Job ID

        Returns:
            JobResult if found, None otherwise
        """
        cache_key = self._build_job_key(job_id)
        cached = self.cache.get(cache_key)
        if cached:
            return JobResult(**cached)
        return None

    async def cancel_job(self, job_id: UUID) -> bool:
        """Cancel a running or pending job.

        Args:
            job_id: Job ID

        Returns:
            True if cancelled, False otherwise
        """
        # Check if job is running
        if job_id in self._running_jobs:
            task = self._running_jobs[job_id]
            task.cancel()
            del self._running_jobs[job_id]

            # Update status
            result = await self.get_job_status(job_id)
            if result:
                result.status = JobStatus.CANCELLED
                result.completed_at = datetime.now(timezone.utc)
                self._save_job_result(result)

            logger.info(f"Job cancelled: {job_id}")
            return True

        return False

    async def start_workers(self) -> None:
        """Start background worker for processing jobs."""
        if self._worker_task is not None:
            logger.warning("Workers already started")
            return

        self._shutdown = False
        self._worker_task = asyncio.create_task(self._worker())
        logger.info("Job queue workers started")

    async def shutdown(self) -> None:
        """Shutdown the job queue gracefully."""
        self._shutdown = True

        # Cancel worker
        if self._worker_task:
            self._worker_task.cancel()
            try:
                await self._worker_task
            except asyncio.CancelledError:
                pass

        # Cancel running jobs
        for job_id, task in list(self._running_jobs.items()):
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass

        logger.info("Job queue shutdown complete")

    async def _worker(self) -> None:
        """Background worker to process jobs from queue."""
        logger.info("Worker started")

        while not self._shutdown:
            try:
                # Wait for a job or timeout
                try:
                    job = await asyncio.wait_for(self._queue.get(), timeout=1.0)
                except asyncio.TimeoutError:
                    continue

                # Check if we can process more jobs
                while len(self._running_jobs) >= self.max_concurrent_jobs:
                    await asyncio.sleep(0.1)

                # Start job processing
                task = asyncio.create_task(self._process_job(job))
                self._running_jobs[job.job_id] = task

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Worker error: {e}", exc_info=True)
                await asyncio.sleep(1.0)

        logger.info("Worker stopped")

    async def _process_job(self, job: Job) -> None:
        """Process a single job.

        Args:
            job: Job to process
        """
        result = await self.get_job_status(job.job_id)
        if not result:
            logger.error(f"Job result not found: {job.job_id}")
            return

        try:
            # Update status to running
            result.status = JobStatus.RUNNING
            result.started_at = datetime.now(timezone.utc)
            result.progress = 0
            result.progress_message = "Starting job..."
            self._save_job_result(result, ttl=job.ttl_seconds)

            logger.info(f"Processing job: {job.job_id} (type={job.job_type})")

            # Get handler
            handler = self.handlers[job.job_type]

            # Create progress callback
            async def update_progress(progress: int, message: str | None = None) -> None:
                result.progress = min(100, max(0, progress))
                if message:
                    result.progress_message = message
                self._save_job_result(result, ttl=job.ttl_seconds)

            # Execute handler with progress callback
            if asyncio.iscoroutinefunction(handler):
                job_result = await handler(job.payload, update_progress)
            else:
                job_result = handler(job.payload, update_progress)

            # Update result
            result.status = JobStatus.COMPLETED
            result.result = job_result
            result.completed_at = datetime.now(timezone.utc)
            result.progress = 100
            result.progress_message = "Job completed"
            self._save_job_result(result, ttl=job.ttl_seconds)

            logger.info(
                f"Job completed: {job.job_id} (duration={result.duration_seconds:.2f}s)"
            )

        except asyncio.CancelledError:
            result.status = JobStatus.CANCELLED
            result.completed_at = datetime.now(timezone.utc)
            result.error = "Job was cancelled"
            self._save_job_result(result, ttl=job.ttl_seconds)
            logger.info(f"Job cancelled: {job.job_id}")
            raise

        except Exception as e:
            result.status = JobStatus.FAILED
            result.completed_at = datetime.now(timezone.utc)
            result.error = str(e)
            result.error_traceback = traceback.format_exc()
            self._save_job_result(result, ttl=job.ttl_seconds)
            logger.error(f"Job failed: {job.job_id} - {e}", exc_info=True)

        finally:
            # Remove from running jobs
            if job.job_id in self._running_jobs:
                del self._running_jobs[job.job_id]

    def _build_job_key(self, job_id: UUID) -> str:
        """Build cache key for job result."""
        return f"job:{job_id}"

    def _save_job_result(self, result: JobResult, ttl: int = 3600) -> None:
        """Save job result to cache."""
        cache_key = self._build_job_key(result.job_id)
        self.cache.set(cache_key, result.model_dump(mode="json"), ttl=ttl)


# Global job queue instance
_job_queue: AsyncJobQueue | None = None


def get_job_queue() -> AsyncJobQueue:
    """Get or create the global job queue instance.

    Returns:
        AsyncJobQueue instance
    """
    global _job_queue
    if _job_queue is None:
        _job_queue = AsyncJobQueue(max_concurrent_jobs=10)
    return _job_queue


# Example: Assessment job handler
async def process_assessment_job(
    payload: dict[str, Any],
    update_progress: Callable[[int, str | None], None],
) -> dict[str, Any]:
    """Process an assessment job.

    Args:
        payload: Job payload containing assessment parameters
        update_progress: Callback to update job progress

    Returns:
        Assessment result
    """
    await update_progress(10, "Validating input...")
    await asyncio.sleep(0.1)  # Simulate work

    await update_progress(30, "Loading HS codes...")
    await asyncio.sleep(0.1)

    await update_progress(50, "Loading rules...")
    await asyncio.sleep(0.1)

    await update_progress(70, "Running assessment...")
    await asyncio.sleep(0.2)

    await update_progress(90, "Saving results...")
    await asyncio.sleep(0.1)

    # TODO: Replace with actual assessment logic
    result = {
        "evaluation_id": str(uuid4()),
        "status": "completed",
        "verdict": "qualified",
        "confidence": 0.95,
    }

    await update_progress(100, "Complete")
    return result


# Example: Bulk import job handler
async def process_bulk_import_job(
    payload: dict[str, Any],
    update_progress: Callable[[int, str | None], None],
) -> dict[str, Any]:
    """Process a bulk import job.

    Args:
        payload: Job payload containing import data
        update_progress: Callback to update job progress

    Returns:
        Import result
    """
    items = payload.get("items", [])
    total = len(items)

    if total == 0:
        return {"imported": 0, "errors": 0}

    imported = 0
    errors = 0

    for i, item in enumerate(items):
        try:
            # TODO: Process item
            await asyncio.sleep(0.01)  # Simulate work
            imported += 1
        except Exception as e:
            logger.error(f"Error importing item {i}: {e}")
            errors += 1

        # Update progress every 10 items
        if i % 10 == 0:
            progress = int((i + 1) / total * 100)
            await update_progress(progress, f"Imported {i + 1}/{total} items...")

    await update_progress(100, f"Import complete: {imported} imported, {errors} errors")

    return {
        "imported": imported,
        "errors": errors,
        "total": total,
    }


# Register default handlers
def register_default_handlers(queue: AsyncJobQueue | None = None) -> None:
    """Register default job handlers.

    Args:
        queue: Job queue instance (uses global if None)
    """
    if queue is None:
        queue = get_job_queue()

    queue.register_handler("assessment", process_assessment_job)
    queue.register_handler("bulk_import", process_bulk_import_job)

    logger.info("Default job handlers registered")
