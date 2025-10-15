import pytest
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.middleware.rate_limiter import RateLimitingMiddleware, get_user_tier, is_admin_bypass
from app.core.rate_limit_config import RateLimitConfig

# Mock Redis
@pytest.fixture
def mock_redis():
    with patch("app.middleware.rate_limiter.redis_conn") as mock_conn:
        yield mock_conn

# Test app setup
@pytest.fixture
def app(mock_redis):
    app = FastAPI()
    
    @app.get("/test")
    async def test_endpoint():
        return {"message": "ok"}
    
    @app.get("/api/ml/predict")
    async def ml_endpoint():
        return {"prediction": "result"}
    
    app.add_middleware(RateLimitingMiddleware)
    return app

@pytest.fixture
def client(app):
    return TestClient(app)

def test_get_user_tier_anonymous():
    request = MagicMock(spec=Request)
    request.state.user = None
    assert get_user_tier(request) == "anonymous"

def test_get_user_tier_authenticated():
    request = MagicMock(spec=Request)
    request.state.user = {"tier": "authenticated"}
    assert get_user_tier(request) == "authenticated"

def test_is_admin_bypass_header():
    request = MagicMock(spec=Request)
    request.headers = {RateLimitConfig.ADMIN_BYPASS_HEADER: RateLimitConfig.ADMIN_BYPASS_SECRET}
    assert is_admin_bypass(request) is True

def test_is_admin_bypass_ip():
    request = MagicMock(spec=Request)
    request.headers = {}
    with patch("app.middleware.rate_limiter.get_remote_address", return_value="127.0.0.1"):
        assert is_admin_bypass(request) is True

def test_rate_limit_anonymous(client, mock_redis):
    # Mock limiter to simulate exceeding limit
    with patch("slowapi.Limiter.check_request_limit", side_effect=Exception("Rate limit exceeded")):
        response = client.get("/test")
        assert response.status_code == 429
        assert "Rate limit exceeded" in response.json()["detail"]

def test_rate_limit_authenticated(client, mock_redis):
    # Assume auth sets tier
    with patch("app.middleware.rate_limiter.get_user_tier", return_value="authenticated"):
        # Mock no exceed
        with patch("slowapi.Limiter.check_request_limit", return_value=None):
            response = client.get("/test")
            assert response.status_code == 200
            # Check headers (slowapi adds them)
            assert "X-RateLimit-Limit" in response.headers

def test_custom_endpoint_limit(client, mock_redis):
    # For /api/ml/predict, custom limit applies
    with patch("slowapi.Limiter.check_request_limit", return_value=None):
        response = client.get("/api/ml/predict")
        assert response.status_code == 200
        # In real scenario, verify limit via Redis or logs

def test_admin_bypass(client, mock_redis):
    headers = {RateLimitConfig.ADMIN_BYPASS_HEADER: RateLimitConfig.ADMIN_BYPASS_SECRET}
    # Even if limit exceeded, bypass should allow
    with patch("slowapi.Limiter.check_request_limit", side_effect=Exception("Rate limit exceeded")):
        response = client.get("/test", headers=headers)
        assert response.status_code == 200  # Bypassed

# Run with: pytest tests/test_rate_limiting.py