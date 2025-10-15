"""
Timeout decorator module.

This module provides a decorator to enforce timeouts on function calls.
On timeout, it raises TimeoutError and logs an error for monitoring/alerts.
"""

import signal
import logging
from functools import wraps

logger = logging.getLogger(__name__)

def timeout_decorator(seconds):
    """
    Decorator to enforce a timeout on a function.

    Args:
        seconds (int): Timeout in seconds.

    Raises:
        TimeoutError: If the function exceeds the timeout.
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            def timeout_handler(signum, frame):
                logger.error(f"Function {func.__name__} timed out after {seconds} seconds. "
                             f"Args: {args}, Kwargs: {kwargs}. Triggering alert/monitoring.")
                # Extend for alerts: e.g., send to Sentry, Slack, or email
                raise TimeoutError(f"Function {func.__name__} timed out after {seconds} seconds")

            signal.signal(signal.SIGALRM, timeout_handler)
            signal.alarm(seconds)
            try:
                result = func(*args, **kwargs)
            finally:
                signal.alarm(0)  # Cancel the alarm
            return result
        return wrapper
    return decorator