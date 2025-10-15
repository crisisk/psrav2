"""
Comprehensive health check endpoint for FastAPI backend.
Verifies connectivity to PostgreSQL, Redis, and ML microservices.
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from typing import Dict, Any, List, Literal
import asyncpg
import redis.asyncio as redis
import httpx
import logging
import asyncio
from datetime import datetime
from contextlib import asynccontextmanager
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants
ML_SERVICES = [
    "psra-parser:8002",
    "psra-classify:8003",
    "psra-ner:8004",
    "psra-embed:8005",
    "psra-rag:8006",
    "psra-ml-gateway:8007",
    "psra-vector-store:8008",
    "psra-fine-tuner:8009",
]

ServiceStatus = Literal["healthy", "unhealthy", "degraded"]

class ServiceHealth(BaseModel):
    status: ServiceStatus
    response_time_ms: float
    timestamp: str
    details: Dict[str, Any] = {}

class HealthCheckResponse(BaseModel):
    status: ServiceStatus
    timestamp: str
    postgres_status: ServiceHealth
    redis_status: ServiceHealth
    ml_services_status: List[Dict[str, Any]]
    details: str

class HealthCheckError(Exception):
    """Custom exception for health check failures"""
    def __init__(self, message: str, service: str):
        super().__init__(message)
        self.service = service
        self.message = message

router = APIRouter(prefix="/health", tags=["health"])

async def check_database_health(db_url: str, timeout: int = 5) -> ServiceHealth:
    """
    Performs a comprehensive health check of the PostgreSQL database.

    Args:
        db_url: Database connection URL
        timeout: Connection timeout in seconds

    Returns:
        ServiceHealth with status and metrics
    """
    start_time = datetime.utcnow()

    try:
        conn = await asyncpg.connect(db_url, timeout=timeout)

        try:
            # Test query execution
            result = await conn.fetchrow("SELECT 1 as test")
            version = await conn.fetchval("SELECT version()")

            latency_ms = (datetime.utcnow() - start_time).total_seconds() * 1000

            return ServiceHealth(
                status="healthy",
                response_time_ms=round(latency_ms, 2),
                timestamp=datetime.utcnow().isoformat(),
                details={
                    "version": version,
                    "test_query": "passed"
                }
            )
        finally:
            await conn.close()

    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        latency_ms = (datetime.utcnow() - start_time).total_seconds() * 1000

        return ServiceHealth(
            status="unhealthy",
            response_time_ms=round(latency_ms, 2),
            timestamp=datetime.utcnow().isoformat(),
            details={"error": str(e)}
        )

async def check_redis_health(redis_url: str) -> ServiceHealth:
    """
    Checks Redis health by testing connection and basic operations.

    Args:
        redis_url: Redis connection URL

    Returns:
        ServiceHealth with status and metrics
    """
    start_time = datetime.utcnow()

    try:
        client = redis.from_url(redis_url)

        try:
            # Test ping
            pong = await client.ping()
            if not pong:
                raise HealthCheckError("Redis ping failed", "redis")

            # Test set/get operations
            test_key = "health_check_test"
            await client.set(test_key, "test_value", ex=10)
            value = await client.get(test_key)
            await client.delete(test_key)

            latency_ms = (datetime.utcnow() - start_time).total_seconds() * 1000

            # Get some info
            info = await client.info()

            return ServiceHealth(
                status="healthy",
                response_time_ms=round(latency_ms, 2),
                timestamp=datetime.utcnow().isoformat(),
                details={
                    "version": info.get("redis_version", "unknown"),
                    "used_memory": info.get("used_memory_human", "unknown"),
                    "operations": "passed"
                }
            )
        finally:
            await client.close()

    except Exception as e:
        logger.error(f"Redis health check failed: {e}")
        latency_ms = (datetime.utcnow() - start_time).total_seconds() * 1000

        return ServiceHealth(
            status="unhealthy",
            response_time_ms=round(latency_ms, 2),
            timestamp=datetime.utcnow().isoformat(),
            details={"error": str(e)}
        )

async def check_ml_service(service_url: str) -> Dict[str, Any]:
    """Check health of a single ML service"""
    start_time = datetime.utcnow()

    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            response = await client.get(f"http://{service_url}/health")
            latency_ms = (datetime.utcnow() - start_time).total_seconds() * 1000

            if response.status_code != 200:
                raise HealthCheckError(
                    f"Service returned status {response.status_code}",
                    service_url
                )

            return {
                "service": service_url,
                "status": "healthy",
                "response_time_ms": round(latency_ms, 2)
            }
    except Exception as e:
        latency_ms = (datetime.utcnow() - start_time).total_seconds() * 1000
        logger.error(f"ML service {service_url} check failed: {str(e)}")

        return {
            "service": service_url,
            "status": "unhealthy",
            "response_time_ms": round(latency_ms, 2),
            "error": str(e)
        }

async def check_ml_services_health() -> List[Dict[str, Any]]:
    """Check health of all ML services in parallel"""
    tasks = [check_ml_service(service) for service in ML_SERVICES]
    results = await asyncio.gather(*tasks)
    return results

def calculate_overall_health(
    postgres_health: ServiceHealth,
    redis_health: ServiceHealth,
    ml_services_health: List[Dict[str, Any]]
) -> tuple[ServiceStatus, str]:
    """
    Determines overall health based on service priority and availability.

    Priority:
    - CRITICAL: PostgreSQL, Redis
    - HIGH: ML services

    Returns 200 if all CRITICAL services are healthy, otherwise 503.
    """
    critical_services = []

    # Check critical services
    if postgres_health.status != "healthy":
        critical_services.append("PostgreSQL")
    if redis_health.status != "healthy":
        critical_services.append("Redis")

    # Check ML services
    unhealthy_ml_services = [
        svc["service"] for svc in ml_services_health
        if svc.get("status") != "healthy"
    ]

    if critical_services:
        status = "unhealthy"
        details = f"Critical services down: {', '.join(critical_services)}"
    elif unhealthy_ml_services:
        status = "degraded"
        details = f"ML services unavailable: {', '.join(unhealthy_ml_services)}"
    else:
        status = "healthy"
        details = "All systems operational"

    return status, details

@router.get(
    "/",
    response_model=HealthCheckResponse,
    summary="Health Check",
    description="Comprehensive health check of all backend dependencies",
    responses={
        200: {"description": "All systems operational"},
        503: {"description": "One or more services are unavailable"}
    }
)
async def health_check(
    db_url: str = "postgresql://app_user:app_password@psra-postgres:5432/psra-db",
    redis_url: str = "redis://psra-redis:6379/0"
):
    """Comprehensive health check endpoint"""
    timestamp = datetime.utcnow().isoformat()

    try:
        # Run all checks in parallel
        postgres_task = check_database_health(db_url)
        redis_task = check_redis_health(redis_url)
        ml_services_task = check_ml_services_health()

        postgres_status, redis_status, ml_services_status = await asyncio.gather(
            postgres_task, redis_task, ml_services_task
        )

        # Calculate overall health
        overall_status, details = calculate_overall_health(
            postgres_status, redis_status, ml_services_status
        )

        response_data = HealthCheckResponse(
            status=overall_status,
            timestamp=timestamp,
            postgres_status=postgres_status,
            redis_status=redis_status,
            ml_services_status=ml_services_status,
            details=details
        )

        if overall_status == "unhealthy":
            raise HTTPException(
                status_code=503,
                detail=jsonable_encoder(response_data)
            )

        return response_data

    except Exception as e:
        logger.error(f"Health check failed completely: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail="Health check system failure"
        )
