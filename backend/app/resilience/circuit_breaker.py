import logging
from tenacity import CircuitBreaker, CircuitBreakerOpen
from collections import defaultdict

logger = logging.getLogger(__name__)

# In-memory metrics for circuit breakers (in production, use Prometheus or similar)
circuit_metrics = defaultdict(lambda: {"success": 0, "failure": 0, "state_changes": 0})

# Configurations for each service type
CIRCUIT_CONFIGS = {
    "database": {
        "failure_threshold": 5,  # Open after 5 failures
        "recovery_timeout": 60,  # Half-open after 60 seconds
        "expected_exception": Exception,  # Any exception triggers failure
    },
    "redis": {
        "failure_threshold": 3,
        "recovery_timeout": 30,
        "expected_exception": Exception,
    },
    "ml_service": {
        "failure_threshold": 10,  # ML services might be more tolerant
        "recovery_timeout": 120,
        "expected_exception": Exception,
    },
    "external_api": {
        "failure_threshold": 5,
        "recovery_timeout": 60,
        "expected_exception": Exception,
    },
}

# Circuit breakers for each service
circuit_breakers = {}
for service, config in CIRCUIT_CONFIGS.items():
    breaker = CircuitBreaker(
        failure_threshold=config["failure_threshold"],
        recovery_timeout=config["recovery_timeout"],
        expected_exception=config["expected_exception"],
    )
    # Attach metrics listeners
    def on_success(service_name):
        def _on_success(retry_state):
            circuit_metrics[service_name]["success"] += 1
        return _on_success

    def on_failure(service_name):
        def _on_failure(retry_state):
            circuit_metrics[service_name]["failure"] += 1
        return _on_failure

    def on_state_change(service_name):
        def _on_state_change(retry_state, previous_state, current_state):
            circuit_metrics[service_name]["state_changes"] += 1
            logger.info(f"Circuit for {service_name} changed from {previous_state} to {current_state}")
        return _on_state_change

    breaker.add_success_callback(on_success(service))
    breaker.add_failure_callback(on_failure(service))
    breaker.add_state_change_callback(on_state_change(service))
    
    circuit_breakers[service] = breaker

def get_circuit_breaker(service_type: str):
    """Retrieve the circuit breaker for a given service type."""
    if service_type not in circuit_breakers:
        raise ValueError(f"Unknown service type: {service_type}")
    return circuit_breakers[service_type]

def get_metrics(service_type: str):
    """Get metrics for a service type."""
    return circuit_metrics.get(service_type, {"success": 0, "failure": 0, "state_changes": 0})