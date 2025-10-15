import logging

logger = logging.getLogger(__name__)

def database_fallback(query: str, *args, **kwargs):
    """Fallback for database connections: Return empty result set."""
    logger.warning("Database fallback triggered: Returning empty data.")
    return []  # Or a default dict, depending on your DB library

def redis_fallback(key: str, *args, **kwargs):
    """Fallback for Redis connections: Return None or default value."""
    logger.warning("Redis fallback triggered: Returning None.")
    return None

def ml_service_fallback(data: dict, *args, **kwargs):
    """Fallback for ML service calls: Return a default prediction."""
    logger.warning("ML service fallback triggered: Returning default prediction.")
    return {"prediction": 0.0, "confidence": 0.0}  # Example default

def external_api_fallback(endpoint: str, *args, **kwargs):
    """Fallback for external API calls: Return error response."""
    logger.warning("External API fallback triggered: Returning error response.")
    return {"error": "Service unavailable", "status": 503}

# Map service types to fallbacks
FALLBACK_HANDLERS = {
    "database": database_fallback,
    "redis": redis_fallback,
    "ml_service": ml_service_fallback,
    "external_api": external_api_fallback,
}

def get_fallback(service_type: str):
    """Retrieve the fallback handler for a service type."""
    return FALLBACK_HANDLERS.get(service_type, lambda *args, **kwargs: {"error": "Unknown service"})