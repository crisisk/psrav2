"""
Prometheus Metrics Exporter for PSRA-LTSD

Exports FastAPI metrics to Prometheus for monitoring and alerting.
"""

from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
import time

# Define metrics
http_requests_total = Counter(
    'psra_http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

http_request_duration_seconds = Histogram(
    'psra_http_request_duration_seconds',
    'HTTP request latency',
    ['method', 'endpoint']
)

active_requests = Gauge(
    'psra_active_requests',
    'Number of active HTTP requests'
)

# PSRA-specific metrics
hs_code_lookups_total = Counter(
    'psra_hs_code_lookups_total',
    'Total HS code lookups',
    ['status']
)

origin_assessments_total = Counter(
    'psra_origin_assessments_total',
    'Total origin assessments',
    ['verdict']
)

ltsd_operations_total = Counter(
    'psra_ltsd_operations_total',
    'Total LTSD operations',
    ['operation', 'status']
)

webhook_deliveries_total = Counter(
    'psra_webhook_deliveries_total',
    'Total webhook deliveries',
    ['status']
)

llm_calls_total = Counter(
    'psra_llm_calls_total',
    'Total LLM API calls',
    ['model', 'status']
)

llm_cost_dollars = Counter(
    'psra_llm_cost_dollars_total',
    'Total LLM cost in USD',
    ['model']
)

llm_latency_seconds = Histogram(
    'psra_llm_latency_seconds',
    'LLM API call latency',
    ['model']
)

etl_last_success_timestamp = Gauge(
    'psra_etl_last_success_timestamp',
    'Unix timestamp of last successful ETL run'
)

cache_hits_total = Counter(
    'psra_cache_hits_total',
    'Total cache hits',
    ['cache_type']
)

cache_misses_total = Counter(
    'psra_cache_misses_total',
    'Total cache misses',
    ['cache_type']
)

database_query_duration_seconds = Histogram(
    'psra_database_query_duration_seconds',
    'Database query duration',
    ['query_type']
)


class PrometheusMiddleware(BaseHTTPMiddleware):
    """Middleware to collect HTTP metrics"""

    async def dispatch(self, request: Request, call_next):
        # Skip metrics endpoint itself
        if request.url.path == '/metrics':
            return await call_next(request)

        active_requests.inc()
        start_time = time.time()

        try:
            response = await call_next(request)
            duration = time.time() - start_time

            # Record metrics
            http_requests_total.labels(
                method=request.method,
                endpoint=request.url.path,
                status=response.status_code
            ).inc()

            http_request_duration_seconds.labels(
                method=request.method,
                endpoint=request.url.path
            ).observe(duration)

            return response
        finally:
            active_requests.dec()


async def metrics_endpoint(request: Request):
    """Endpoint to expose Prometheus metrics"""
    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )


# Helper functions for tracking PSRA-specific metrics

def track_hs_code_lookup(status: str):
    """Track HS code lookup"""
    hs_code_lookups_total.labels(status=status).inc()


def track_origin_assessment(verdict: str):
    """Track origin assessment"""
    origin_assessments_total.labels(verdict=verdict).inc()


def track_ltsd_operation(operation: str, status: str):
    """Track LTSD operation"""
    ltsd_operations_total.labels(operation=operation, status=status).inc()


def track_webhook_delivery(status: str):
    """Track webhook delivery"""
    webhook_deliveries_total.labels(status=status).inc()


def track_llm_call(model: str, status: str, duration: float, cost: float = 0.0):
    """Track LLM API call"""
    llm_calls_total.labels(model=model, status=status).inc()
    llm_latency_seconds.labels(model=model).observe(duration)
    if cost > 0:
        llm_cost_dollars.labels(model=model).inc(cost)


def track_etl_success():
    """Update ETL success timestamp"""
    etl_last_success_timestamp.set(time.time())


def track_cache_hit(cache_type: str):
    """Track cache hit"""
    cache_hits_total.labels(cache_type=cache_type).inc()


def track_cache_miss(cache_type: str):
    """Track cache miss"""
    cache_misses_total.labels(cache_type=cache_type).inc()


def track_database_query(query_type: str, duration: float):
    """Track database query"""
    database_query_duration_seconds.labels(query_type=query_type).observe(duration)
