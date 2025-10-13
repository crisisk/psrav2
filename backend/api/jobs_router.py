"""FastAPI router for async job management and status tracking."""

from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from backend.tasks.async_assessment import (
    Job,
    JobPriority,
    JobResult,
    JobStatus,
    get_job_queue,
)

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


# Request/Response Models
class SubmitJobRequest(BaseModel):
    """Request to submit a new job."""

    job_type: str = Field(..., description="Type of job to execute")
    payload: dict = Field(..., description="Job payload")
    priority: JobPriority = Field(default=JobPriority.NORMAL, description="Job priority")
    tenant_id: Optional[UUID] = Field(default=None, description="Tenant ID")
    user_id: Optional[str] = Field(default=None, description="User ID")
    ttl_seconds: int = Field(
        default=3600,
        ge=60,
        le=86400,
        description="Job result TTL in seconds (1min - 24hrs)",
    )


class SubmitJobResponse(BaseModel):
    """Response when job is submitted."""

    job_id: UUID
    status: JobStatus
    message: str = "Job submitted successfully"


class JobStatusResponse(BaseModel):
    """Job status response."""

    job_id: UUID
    status: JobStatus
    progress: int = Field(ge=0, le=100)
    progress_message: Optional[str] = None
    result: Optional[dict] = None
    error: Optional[str] = None
    created_at: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    duration_seconds: Optional[float] = None
    metadata: dict = Field(default_factory=dict)


class CancelJobResponse(BaseModel):
    """Response when job is cancelled."""

    job_id: UUID
    status: JobStatus
    message: str


# API Endpoints

@router.post("/submit", response_model=SubmitJobResponse, status_code=status.HTTP_202_ACCEPTED)
async def submit_job(request: SubmitJobRequest) -> SubmitJobResponse:
    """Submit a new job to the queue.

    Args:
        request: Job submission request

    Returns:
        Job submission response with job_id

    Raises:
        HTTPException: If job type is not supported
    """
    queue = get_job_queue()

    # Create job
    job = Job(
        job_type=request.job_type,
        priority=request.priority,
        payload=request.payload,
        tenant_id=request.tenant_id,
        user_id=request.user_id,
        ttl_seconds=request.ttl_seconds,
    )

    try:
        job_id = await queue.submit_job(job)
        return SubmitJobResponse(
            job_id=job_id,
            status=JobStatus.PENDING,
            message=f"Job {job_id} submitted successfully",
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get("/{job_id}/status", response_model=JobStatusResponse)
async def get_job_status(job_id: UUID) -> JobStatusResponse:
    """Get status of a job.

    Args:
        job_id: Job ID

    Returns:
        Job status

    Raises:
        HTTPException: If job not found
    """
    queue = get_job_queue()
    result = await queue.get_job_status(job_id)

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job {job_id} not found",
        )

    return JobStatusResponse(
        job_id=result.job_id,
        status=result.status,
        progress=result.progress,
        progress_message=result.progress_message,
        result=result.result if result.status == JobStatus.COMPLETED else None,
        error=result.error,
        created_at=result.created_at.isoformat(),
        started_at=result.started_at.isoformat() if result.started_at else None,
        completed_at=result.completed_at.isoformat() if result.completed_at else None,
        duration_seconds=result.duration_seconds,
        metadata=result.metadata,
    )


@router.post("/{job_id}/cancel", response_model=CancelJobResponse)
async def cancel_job(job_id: UUID) -> CancelJobResponse:
    """Cancel a running or pending job.

    Args:
        job_id: Job ID

    Returns:
        Cancellation response

    Raises:
        HTTPException: If job not found or already completed
    """
    queue = get_job_queue()

    # Check if job exists
    result = await queue.get_job_status(job_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job {job_id} not found",
        )

    # Check if job is already terminal
    if result.is_terminal:
        return CancelJobResponse(
            job_id=job_id,
            status=result.status,
            message=f"Job is already in terminal state: {result.status}",
        )

    # Cancel job
    cancelled = await queue.cancel_job(job_id)

    if cancelled:
        return CancelJobResponse(
            job_id=job_id,
            status=JobStatus.CANCELLED,
            message=f"Job {job_id} cancelled successfully",
        )
    else:
        return CancelJobResponse(
            job_id=job_id,
            status=result.status,
            message=f"Could not cancel job {job_id}",
        )


@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check() -> dict:
    """Health check endpoint for job queue service.

    Returns:
        Health status
    """
    queue = get_job_queue()
    return {
        "status": "ok",
        "service": "async_job_queue",
        "max_concurrent_jobs": queue.max_concurrent_jobs,
        "running_jobs": len(queue._running_jobs),
        "registered_handlers": list(queue.handlers.keys()),
    }


# Example: Assessment job submission endpoint
class AssessmentJobRequest(BaseModel):
    """Request to submit an assessment job."""

    rule_id: str
    hs_code: str
    origin_country: str
    destination_country: str
    tenant_id: Optional[UUID] = None
    user_id: Optional[str] = None


@router.post("/assessment/submit", response_model=SubmitJobResponse, status_code=status.HTTP_202_ACCEPTED)
async def submit_assessment_job(request: AssessmentJobRequest) -> SubmitJobResponse:
    """Submit an assessment job.

    Convenience endpoint for submitting assessment jobs with typed parameters.

    Args:
        request: Assessment job request

    Returns:
        Job submission response
    """
    payload = {
        "rule_id": request.rule_id,
        "hs_code": request.hs_code,
        "origin_country": request.origin_country,
        "destination_country": request.destination_country,
    }

    job_request = SubmitJobRequest(
        job_type="assessment",
        payload=payload,
        priority=JobPriority.NORMAL,
        tenant_id=request.tenant_id,
        user_id=request.user_id,
        ttl_seconds=3600,
    )

    return await submit_job(job_request)


# Example: Bulk import job submission endpoint
class BulkImportJobRequest(BaseModel):
    """Request to submit a bulk import job."""

    items: list[dict]
    tenant_id: Optional[UUID] = None
    user_id: Optional[str] = None


@router.post("/bulk-import/submit", response_model=SubmitJobResponse, status_code=status.HTTP_202_ACCEPTED)
async def submit_bulk_import_job(request: BulkImportJobRequest) -> SubmitJobResponse:
    """Submit a bulk import job.

    Convenience endpoint for submitting bulk import jobs.

    Args:
        request: Bulk import job request

    Returns:
        Job submission response
    """
    payload = {
        "items": request.items,
    }

    job_request = SubmitJobRequest(
        job_type="bulk_import",
        payload=payload,
        priority=JobPriority.LOW,
        tenant_id=request.tenant_id,
        user_id=request.user_id,
        ttl_seconds=7200,  # 2 hours for bulk operations
    )

    return await submit_job(job_request)
