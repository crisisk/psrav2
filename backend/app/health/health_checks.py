import asyncio
import logging
from functools import lru_cache
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Query
from prometheus_client import Gauge, generate_latest
import time

from .dependency_checks import (
    check_database,
    check_redis,
    check_ml_services,
    check_disk_space,
    check_memory,
)

# Prometheus metrics
HEALTH_CHECK_DURATION = Gauge('health_check_duration_seconds', 'Time taken for health checks', ['check_type'])
HEALTH_CHECK_STATUS = Gauge('health_check_status', 'Status of health checks (1=healthy, 0=unhealthy)', ['check_type'])

# Cache for health checks (30-second TTL to prevent storms)
@lru_cache(maxsize=1)
def cached_health_checks() -> Dict[str, Any]:
    # Simple in-memory cache; in production, use Redis or similar
    return {
        'timestamp': time.time(),
        'checks': {
            'database': check_database(),
            'redis': check_redis(),
            'ml_services': check_ml_services(),
            'disk_space': check_disk_space(),
            'memory': check_memory(),
        }
    }

def get_health_checks() -> Dict[str, Any]:
    cached = cached_health_checks()
    if time.time() - cached['timestamp'] > 30:  # TTL expired
        cached_health_checks.cache_clear()
        cached = cached_health_checks()
    return cached

def aggregate_health(checks: Dict[str, Any]) -> bool:
    """Aggregate dependency health: all must be healthy."""
    return all(check['healthy'] for check in checks.values())

def trigger_auto_recovery(checks: Dict[str, Any]):
    """Basic auto-recovery: log failures and attempt simple recoveries."""
    for name, check in checks.items():
        if not check['healthy']:
            logging.error(f"Health check failed for {name}: {check.get('error', 'Unknown error')}")
            if name == 'database':
                # Example: Attempt reconnection (in real app, use connection pooling)
                pass  # Implement DB reconnection logic
            elif name == 'redis':
                pass  # Implement Redis reconnection
            # Add more recovery logic as needed

router = APIRouter()

@router.get("/live")
async def liveness_probe():
    """Kubernetes liveness probe: Always return 200 if the app is running."""
    return {"status": "alive"}

@router.get("/ready")
async def readiness_probe():
    """Kubernetes readiness probe: Check if the app is ready to serve traffic."""
    checks = get_health_checks()['checks']
    healthy = aggregate_health(checks)
    if not healthy:
        raise HTTPException(status_code=503, detail="Service not ready")
    return {"status": "ready"}

@router.get("/health")
async def health_check(detailed: bool = Query(False, description="Return detailed health info")):
    """General health check endpoint."""
    start_time = time.time()
    checks = get_health_checks()['checks']
    healthy = aggregate_health(checks)
    
    # Update Prometheus metrics
    for name, check in checks.items():
        HEALTH_CHECK_STATUS.labels(check_type=name).set(1 if check['healthy'] else 0)
        HEALTH_CHECK_DURATION.labels(check_type=name).set(time.time() - start_time)
    
    # Trigger auto-recovery if unhealthy
    if not healthy:
        trigger_auto_recovery(checks)
    
    if detailed:
        return {
            "healthy": healthy,
            "checks": checks,
            "timestamp": get_health_checks()['timestamp']
        }
    else:
        return {"healthy": healthy}

@router.get("/metrics")
async def prometheus_metrics():
    """Expose Prometheus metrics."""
    return generate_latest()