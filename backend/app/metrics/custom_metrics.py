from prometheus_client import Counter, Histogram, Gauge, CollectorRegistry
import time

# Create a custom registry (optional, for isolation)
registry = CollectorRegistry()

# Business Metrics
certificates_issued = Counter(
    'psra_certificates_issued_total',
    'Total number of certificates issued',
    registry=registry
)

validation_time = Histogram(
    'psra_validation_time_seconds',
    'Time taken to validate a certificate',
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0],
    registry=registry
)

# System Metrics
uptime_gauge = Gauge(
    'psra_uptime_seconds',
    'Application uptime in seconds',
    registry=registry
)

errors_total = Counter(
    'psra_errors_total',
    'Total number of errors',
    ['type'],  # Labels: e.g., 'validation', 'issuance'
    registry=registry
)

# Track uptime start time
_uptime_start = time.time()

def update_uptime():
    """Update uptime gauge periodically."""
    uptime_gauge.set(time.time() - _uptime_start)

# Example usage in your app (call these functions where appropriate)
def issue_certificate():
    certificates_issued.inc()
    # Simulate validation
    start = time.time()
    # ... validation logic ...
    validation_time.observe(time.time() - start)

def record_error(error_type):
    errors_total.labels(type=error_type).inc()

# Expose metrics (integrate into your app's /metrics endpoint)
from prometheus_client import generate_latest

def metrics_endpoint():
    update_uptime()  # Update before exposing
    return generate_latest(registry)