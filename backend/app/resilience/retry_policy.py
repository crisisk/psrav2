import logging
from tenacity import retry, stop_after_attempt, wait_exponential_jitter, retry_if_exception_type
from .circuit_breaker import get_circuit_breaker

logger = logging.getLogger(__name__)

# In-memory set for idempotency keys (in production, use Redis or DB)
idempotency_keys = set()

# Configurations for retries per service
RETRY_CONFIGS = {
    "database": {
        "stop": stop_after_attempt(3),
        "wait": wait_exponential_jitter(multiplier=1, min=1, max=10),
        "retry_on": retry_if_exception_type(Exception),
    },
    "redis": {
        "stop": stop_after_attempt(5),
        "wait": wait_exponential_jitter(multiplier=0.5, min=0.5, max=5),
        "retry_on": retry_if_exception_type(Exception),
    },
    "ml_service": {
        "stop": stop_after_attempt(2),  # Fewer retries for ML
        "wait": wait_exponential_jitter(multiplier=2, min=2, max=20),
        "retry_on": retry_if_exception_type(Exception),
    },
    "external_api": {
        "stop": stop_after_attempt(4),
        "wait": wait_exponential_jitter(multiplier=1, min=1, max=15),
        "retry_on": retry_if_exception_type(Exception),
    },
}

def create_retry_decorator(service_type: str, idempotency_key: str = None):
    """Create a retry decorator with circuit breaker integration and idempotency."""
    config = RETRY_CONFIGS.get(service_type, RETRY_CONFIGS["database"])  # Default to database
    breaker = get_circuit_breaker(service_type)
    
    def before_retry(retry_state):
        if idempotency_key and idempotency_key in idempotency_keys:
            logger.warning(f"Idempotency key {idempotency_key} already processed, skipping retry.")
            retry_state.stop()
        else:
            if idempotency_key:
                idempotency_keys.add(idempotency_key)
    
    return retry(
        stop=config["stop"],
        wait=config["wait"],
        retry=config["retry_on"],
        before=before_retry,
        reraise=True,  # Re-raise exceptions after retries
    )(breaker)  # Wrap with circuit breaker

# Example usage decorator for a function
def with_retry_and_circuit(service_type: str, idempotency_key: str = None):
    """Decorator to apply retry and circuit breaker to a function."""
    def decorator(func):
        retry_decorator = create_retry_decorator(service_type, idempotency_key)
        return retry_decorator(func)
    return decorator