"""
Timeout configuration module.

This module defines timeout values for various service types. Values are in seconds.
Customize these based on your application's needs (e.g., via environment variables or config files).
"""

import os

# Default timeout configurations per service type
# - http: Connection, read, and write timeouts for HTTP clients (e.g., requests library)
# - database: Query timeout (default for database operations)
# - ml: Inference timeout for ML models
# - cache: Operation timeout for cache interactions (e.g., Redis, Memcached)
# - lock: Acquisition timeout for locks (e.g., threading.Lock or distributed locks)
# - celery: Task timeout for Celery tasks
TIMEOUTS = {
    'http': {
        'connection': int(os.getenv('HTTP_CONNECTION_TIMEOUT', 5)),
        'read': int(os.getenv('HTTP_READ_TIMEOUT', 30)),
        'write': int(os.getenv('HTTP_WRITE_TIMEOUT', 30)),
    },
    'database': {
        'query': int(os.getenv('DATABASE_QUERY_TIMEOUT', 10)),
    },
    'ml': {
        'inference': int(os.getenv('ML_INFERENCE_TIMEOUT', 60)),
    },
    'cache': {
        'operation': int(os.getenv('CACHE_OPERATION_TIMEOUT', 1)),
    },
    'lock': {
        'acquisition': int(os.getenv('LOCK_ACQUISITION_TIMEOUT', 5)),  # Example: 5s for lock waits
    },
    'celery': {
        'task': int(os.getenv('CELERY_TASK_TIMEOUT', 300)),  # Example: 5 minutes for tasks
    },
}

# Helper function to get a timeout value
def get_timeout(service_type, operation):
    """
    Retrieve a timeout value for a given service type and operation.

    Args:
        service_type (str): e.g., 'http', 'database'
        operation (str): e.g., 'connection', 'query'

    Returns:
        int: Timeout in seconds

    Raises:
        KeyError: If service_type or operation is invalid
    """
    return TIMEOUTS[service_type][operation]