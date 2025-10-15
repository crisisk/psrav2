from app.monitoring.error_tracker import error_tracker
from sentry_sdk import start_transaction
import time
from functools import wraps

class PerformanceTracker:
    @staticmethod
    def track_function_performance(func):
        """Decorator to track function performance."""
        @wraps(func)
        def wrapper(*args, **kwargs):
            with error_tracker.track_performance(func.__name__, "function") as transaction:
                start_time = time.time()
                try:
                    result = func(*args, **kwargs)
                    transaction.set_data("duration", time.time() - start_time)
                    return result
                except Exception as e:
                    transaction.set_data("error", str(e))
                    raise
        return wrapper

    @staticmethod
    def track_request_performance(request_path: str, method: str):
        """Track request performance."""
        return error_tracker.track_performance(f"{method} {request_path}", "http.server")

# Example usage:
# @PerformanceTracker.track_function_performance
# def some_function():
#     pass