# Error Tracking and Monitoring Setup

This document outlines the setup for comprehensive error tracking and monitoring using Sentry (or a self-hosted alternative like GlitchTip).

## Prerequisites
- Python 3.8+
- `sentry-sdk` installed: `pip install sentry-sdk`
- Environment variables: `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `SENTRY_RELEASE`, `ERROR_BUDGET_LIMIT`

## Setup Steps
1. **Initialize Sentry**: Import and use `ErrorTracker` in your app's entry point (e.g., `main.py`).
2. **Add Middleware**: Apply `ErrorTrackingMiddleware` to capture errors automatically.
3. **Integrate Performance Tracking**: Use decorators from `PerformanceTracker` for functions/requests.
4. **Custom Tags**: Set tags via `error_tracker.set_custom_tags()` in request handlers.
5. **Alerting Rules**: In Sentry dashboard, create rules for alerts (e.g., on error rate > threshold).
6. **Resolution Workflow**: Use Sentry's issue tracking; assign, comment, and resolve issues directly in the UI.
7. **Error Budget**: Monitored via custom metrics; alerts trigger if exceeded.

## Dashboard Configuration
- **Sentry Dashboard** (built-in):
  - Navigate to your project in Sentry.
  - View errors under "Issues", performance under "Performance".
  - Create custom dashboards for error rates, user impact, and budgets.
  - Set up alerts: Go to Alerts > Create Alert Rule (e.g., "Error rate > 5% in 1 hour").

- **Grafana Integration** (for advanced visualization):
  - Install Grafana and add Sentry as a data source (via Prometheus if using Sentry metrics).
  - Create panels for:
    - Error rate over time: Query `sentry_errors_total{project="your_project"}`.
    - Error budget: Gauge panel showing current rate vs. limit.
    - Performance: Latency charts from APM data.
  - Example dashboard JSON: [Download from Grafana community](https://grafana.com/grafana/dashboards/) or create custom.

## Self-Hosted Alternative
Replace Sentry with GlitchTip:
- Install GlitchTip (Docker-based).
- Update `SENTRY_DSN` to point to your GlitchTip instance.
- Features remain similar; adjust integrations if needed.

## Testing
Run unit tests: `pytest backend/tests/test_error_tracking.py`.

## Troubleshooting
- Ensure DSN is set; otherwise, errors won't be captured.
- For performance issues, adjust `traces_sample_rate` in production.