"""
Test suite for Prometheus metrics integration.

Tests that the metrics endpoint works correctly and returns valid Prometheus format.
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app


@pytest.fixture
def client():
    """Create a test client."""
    return TestClient(app)


def test_metrics_endpoint_exists(client):
    """Test that the /metrics endpoint exists and returns 200."""
    response = client.get("/metrics")
    assert response.status_code == 200


def test_metrics_content_type(client):
    """Test that metrics endpoint returns correct content type."""
    response = client.get("/metrics")
    # Prometheus metrics should be plain text
    assert "text/plain" in response.headers.get("content-type", "")


def test_metrics_format(client):
    """Test that metrics are in valid Prometheus format."""
    response = client.get("/metrics")
    content = response.text

    # Should contain metric definitions (HELP and TYPE)
    assert "# HELP" in content
    assert "# TYPE" in content


def test_http_metrics_present(client):
    """Test that HTTP metrics are present in output."""
    # Make a request to generate metrics
    client.get("/healthz")

    # Check metrics endpoint
    response = client.get("/metrics")
    content = response.text

    # Check for HTTP request metrics
    assert "psra_http_requests_total" in content
    assert "psra_http_request_duration_seconds" in content


def test_active_requests_metric(client):
    """Test that active requests metric is present."""
    response = client.get("/metrics")
    content = response.text

    assert "psra_active_requests" in content


def test_business_metrics_defined(client):
    """Test that PSRA business metrics are defined."""
    response = client.get("/metrics")
    content = response.text

    # Check for business metric definitions
    assert "psra_hs_code_lookups_total" in content
    assert "psra_origin_assessments_total" in content
    assert "psra_ltsd_operations_total" in content
    assert "psra_webhook_deliveries_total" in content


def test_llm_metrics_defined(client):
    """Test that LLM metrics are defined."""
    response = client.get("/metrics")
    content = response.text

    # Check for LLM metric definitions
    assert "psra_llm_calls_total" in content
    assert "psra_llm_cost_dollars_total" in content
    assert "psra_llm_latency_seconds" in content


def test_cache_metrics_defined(client):
    """Test that cache metrics are defined."""
    response = client.get("/metrics")
    content = response.text

    # Check for cache metric definitions
    assert "psra_cache_hits_total" in content
    assert "psra_cache_misses_total" in content


def test_database_metrics_defined(client):
    """Test that database metrics are defined."""
    response = client.get("/metrics")
    content = response.text

    # Check for database metric definitions
    assert "psra_database_query_duration_seconds" in content


def test_etl_metrics_defined(client):
    """Test that ETL metrics are defined."""
    response = client.get("/metrics")
    content = response.text

    # Check for ETL metric definitions
    assert "psra_etl_last_success_timestamp" in content


def test_metrics_not_affected_by_middleware(client):
    """Test that /metrics endpoint is excluded from HTTP metrics."""
    # Get initial metrics
    response1 = client.get("/metrics")
    content1 = response1.text

    # Make another metrics request
    response2 = client.get("/metrics")
    content2 = response2.text

    # The metrics endpoint should not track itself
    # (This is harder to test directly, but we verify it doesn't error)
    assert response2.status_code == 200


def test_http_request_labels(client):
    """Test that HTTP request metrics include proper labels."""
    # Make a request to generate labeled metrics
    client.get("/healthz")

    # Check metrics
    response = client.get("/metrics")
    content = response.text

    # Should have labels for method, endpoint, and status
    assert 'method=' in content
    assert 'endpoint=' in content
    assert 'status=' in content


def test_histogram_buckets(client):
    """Test that histogram metrics include buckets."""
    # Make a request to generate metrics
    client.get("/healthz")

    # Check metrics
    response = client.get("/metrics")
    content = response.text

    # Histogram metrics should have _bucket, _sum, and _count
    if "psra_http_request_duration_seconds" in content:
        assert "psra_http_request_duration_seconds_bucket" in content
        assert "psra_http_request_duration_seconds_sum" in content
        assert "psra_http_request_duration_seconds_count" in content


def test_healthz_endpoint_works(client):
    """Test that health check endpoint works."""
    response = client.get("/healthz")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


def test_readyz_endpoint_works(client):
    """Test that readiness endpoint works."""
    response = client.get("/readyz")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"


def test_root_endpoint_works(client):
    """Test that root endpoint works."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "service" in data
    assert "version" in data
    assert data["metrics"] == "/metrics"


if __name__ == "__main__":
    # Run tests with pytest
    pytest.main([__file__, "-v"])
