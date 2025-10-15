import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration  # Adjust for your framework (e.g., Django, Flask)
from sentry_sdk import capture_exception, set_tag, set_user, set_context, metrics
import os
from typing import Optional, Dict, Any

class ErrorTracker:
    def __init__(self):
        self.dsn = os.getenv("SENTRY_DSN")
        self.environment = os.getenv("SENTRY_ENVIRONMENT", "development")
        self.release = os.getenv("SENTRY_RELEASE", "1.0.0")  # Set via CI/CD
        self.error_budget_limit = float(os.getenv("ERROR_BUDGET_LIMIT", 0.05))  # 5% error rate budget
        self._init_sentry()

    def _init_sentry(self):
        if not self.dsn:
            raise ValueError("SENTRY_DSN environment variable is required.")
        
        sentry_sdk.init(
            dsn=self.dsn,
            environment=self.environment,
            release=self.release,
            integrations=[FastApiIntegration()],  # Adjust for your framework
            # Automatic error capture and stack traces with context
            auto_enabling_integrations=True,
            # Performance monitoring (APM)
            traces_sample_rate=1.0,  # Adjust for production (e.g., 0.1)
            profiles_sample_rate=1.0,  # For profiling
            # Error grouping and deduplication: Handled automatically by Sentry
            # User impact tracking: Enabled via set_user
        )

    def set_custom_tags(self, tenant: Optional[str] = None, feature: Optional[str] = None, **kwargs):
        """Set custom tags for error context."""
        if tenant:
            set_tag("tenant", tenant)
        if feature:
            set_tag("feature", feature)
        for key, value in kwargs.items():
            set_tag(key, value)

    def set_user_context(self, user_id: Optional[str] = None, email: Optional[str] = None):
        """Track user impact."""
        set_user({"id": user_id, "email": email})

    def set_error_context(self, context: Dict[str, Any]):
        """Add additional context to errors."""
        set_context("additional_info", context)

    def capture_error(self, exception: Exception, severity: str = "error"):
        """Capture an error with severity classification."""
        # Severity levels: fatal, error, warning, info, debug
        with sentry_sdk.configure_scope() as scope:
            scope.level = severity
            capture_exception(exception)

    def track_performance(self, transaction_name: str, operation: str):
        """Start a performance transaction."""
        return sentry_sdk.start_transaction(name=transaction_name, op=operation)

    def track_error_budget(self, total_requests: int, error_count: int):
        """Track error budget (custom metric)."""
        error_rate = error_count / total_requests if total_requests > 0 else 0
        metrics.set("error_rate", error_rate, unit="ratio")
        if error_rate > self.error_budget_limit:
            # Trigger alert (integrates with Sentry alerting rules)
            self.capture_error(ValueError(f"Error budget exceeded: {error_rate:.2%} > {self.error_budget_limit:.2%}"), severity="fatal")

# Singleton instance
error_tracker = ErrorTracker()