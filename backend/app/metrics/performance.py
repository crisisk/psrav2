"""
Performance metrics tracking with Prometheus.
Tracks response times, percentiles, and exposes /metrics endpoint.
"""

from fastapi import FastAPI, Request, Response
from prometheus_client import (
    Counter,
    Gauge,
    Histogram,
    generate_latest,
    CONTENT_TYPE_LATEST,
    REGISTRY
)
import time
import numpy as np
from typing import Dict
from collections import deque
from starlette.middleware.base import BaseHTTPMiddleware
import logging

logger = logging.getLogger(__name__)

# Prometheus metrics
REQUEST_COUNT = Counter(
    "http_requests_total",
    "Total number of HTTP requests",
    ["method", "endpoint", "status_code"],
)

REQUEST_LATENCY = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency in seconds",
    ["method", "endpoint"],
    buckets=[0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1.0, 2.5, 5.0, 7.5, 10.0]
)

RESPONSE_TIME_METRICS = Gauge(
    "http_response_time_metrics_ms",
    "Response time metrics in milliseconds",
    ["metric", "endpoint"],
)

# Storage for response times
response_times: Dict[str, deque] = {}
MAX_RECORDS = 1000  # Keep last 1000 records per endpoint

class PerformanceMetricsMiddleware(BaseHTTPMiddleware):
    """Middleware to track performance metrics."""

    async def dispatch(self, request: Request, call_next):
        # Skip metrics endpoint
        if request.url.path == "/metrics":
            return await call_next(request)

        start_time = time.time()
        method = request.method
        endpoint = request.url.path

        response = None
        try:
            response = await call_next(request)
            status_code = response.status_code
        except Exception as e:
            status_code = 500
            raise
        finally:
            # Calculate response time
            process_time = (time.time() - start_time) * 1000  # in milliseconds

            # Track request count
            REQUEST_COUNT.labels(
                method=method,
                endpoint=endpoint,
                status_code=status_code
            ).inc()

            # Store response time
            if endpoint not in response_times:
                response_times[endpoint] = deque(maxlen=MAX_RECORDS)
            response_times[endpoint].append(process_time)

            # Update Prometheus metrics
            REQUEST_LATENCY.labels(method=method, endpoint=endpoint).observe(
                process_time / 1000
            )
            self._update_percentile_metrics(endpoint)

            # Log slow requests (> 1000ms)
            if process_time > 1000:
                logger.warning(
                    f"Slow request detected",
                    extra={
                        "endpoint": endpoint,
                        "method": method,
                        "duration_ms": round(process_time, 2),
                        "status_code": status_code
                    }
                )

        return response

    def _update_percentile_metrics(self, endpoint: str):
        """Calculate and update percentile metrics for an endpoint."""
        times = list(response_times.get(endpoint, []))
        if not times:
            return

        try:
            metrics = {
                "min": float(np.min(times)),
                "max": float(np.max(times)),
                "avg": float(np.mean(times)),
                "p50": float(np.percentile(times, 50)),
                "p95": float(np.percentile(times, 95)),
                "p99": float(np.percentile(times, 99)),
            }

            for metric, value in metrics.items():
                RESPONSE_TIME_METRICS.labels(metric=metric, endpoint=endpoint).set(value)

            # Check for alert threshold (p95 > 1000ms)
            if metrics["p95"] > 1000:
                logger.error(
                    f"ALERT: High p95 latency",
                    extra={
                        "endpoint": endpoint,
                        "p95_ms": round(metrics["p95"], 2),
                        "threshold_ms": 1000
                    }
                )

        except Exception as e:
            logger.error(f"Error updating percentile metrics: {e}")

def setup_metrics(app: FastAPI):
    """Setup metrics endpoint."""

    @app.get("/metrics")
    async def metrics():
        """Expose Prometheus metrics."""
        return Response(
            content=generate_latest(REGISTRY),
            media_type=CONTENT_TYPE_LATEST,
        )

    # Add middleware
    app.add_middleware(PerformanceMetricsMiddleware)

    logger.info("Performance metrics enabled at /metrics")
