import pytest
from unittest.mock import patch, MagicMock
from app.monitoring.error_tracker import ErrorTracker, error_tracker
from app.monitoring.performance_tracking import PerformanceTracker

@patch("sentry_sdk.init")
def test_error_tracker_init(mock_sentry_init):
    tracker = ErrorTracker()
    mock_sentry_init.assert_called_once()
    assert tracker.dsn is not None

@patch("sentry_sdk.capture_exception")
def test_capture_error(mock_capture):
    error_tracker.capture_error(ValueError("test"))
    mock_capture.assert_called_once()

@patch("sentry_sdk.set_tag")
def test_set_custom_tags(mock_set_tag):
    error_tracker.set_custom_tags(tenant="test_tenant", feature="test_feature")
    mock_set_tag.assert_any_call("tenant", "test_tenant")
    mock_set_tag.assert_any_call("feature", "test_feature")

@patch("sentry_sdk.metrics.set")
def test_track_error_budget(mock_metrics_set):
    error_tracker.track_error_budget(100, 10)  # 10% error rate
    mock_metrics_set.assert_called_once_with("error_rate", 0.1, unit="ratio")

def test_performance_decorator():
    @PerformanceTracker.track_function_performance
    def dummy_func():
        return "ok"
    
    with patch("app.monitoring.error_tracker.error_tracker.track_performance") as mock_track:
        result = dummy_func()
        assert result == "ok"
        mock_track.assert_called_once()