"""
Timeout context manager module.

This module provides a context manager to enforce timeouts on code blocks.
On timeout, it raises TimeoutError and logs an error for monitoring/alerts.
"""

import signal
import logging
from contextlib import contextmanager

logger = logging.getLogger(__name__)

@contextmanager
def timeout_context(seconds):
    """
    Context manager to enforce a timeout on a block of code.

    Args:
        seconds (int): Timeout in seconds.

    Raises:
        TimeoutError: If the block exceeds the timeout.
    """
    def timeout_handler(signum, frame):
        logger.error(f"Code block timed out after {seconds} seconds. Triggering alert/monitoring.")
        # Extend for alerts: e.g., send to Sentry, Slack, or email
        raise TimeoutError(f"Timed out after {seconds} seconds")

    signal.signal(signal.SIGALRM, timeout_handler)
    signal.alarm(seconds)
    try:
        yield
    finally:
        signal.alarm(0)  # Cancel the alarm