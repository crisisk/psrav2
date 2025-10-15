import pytest
from unittest.mock import patch, MagicMock
from app.feature_flags.flags import FeatureFlag, FlagRegistry, FlagRule
from app.feature_flags.evaluator import FlagEvaluator
import redis

@pytest.fixture
def mock_redis():
    return MagicMock(spec=redis.Redis)

@pytest.fixture
def evaluator(mock_redis):
    return FlagEvaluator(mock_redis)

def test_flag_evaluation_percentage(evaluator):
    flag = FeatureFlag(name="test", rollout_percentage=50)
    FlagRegistry.add(flag)
    with patch('random.randint', return_value=25):  # Within 50%
        result = evaluator.evaluate("test", "user1", "tenant1")
        assert result["enabled"] is True
    with patch('random.randint', return_value=75):  # Outside 50%
        result = evaluator.evaluate("test", "user1", "tenant1")
        assert result["enabled"] is False

def test_flag_evaluation_targeting(evaluator):
    flag = FeatureFlag(name="test", rules=[FlagRule(type="user_target", value=["user1"])])
    FlagRegistry.add(flag)
    result = evaluator.evaluate("test", "user1", "tenant1")
    assert result["enabled"] is True
    result = evaluator.evaluate("test", "user2", "tenant1")
    assert result["enabled"] is False

def test_flag_dependencies(evaluator):
    dep_flag = FeatureFlag(name="dep", enabled=False)
    flag = FeatureFlag(name="test", dependencies=["dep"])
    FlagRegistry.add(dep_flag)
    FlagRegistry.add(flag)
    result = evaluator.evaluate("test", "user1", "tenant1")
    assert result["enabled"] is False

def test_flag_variants(evaluator):
    flag = FeatureFlag(name="test", variants={"a": 50, "b": 50})
    FlagRegistry.add(flag)
    with patch('random.randint', return_value=25):  # Variant A
        result = evaluator.evaluate("test", "user1", "tenant1")
        assert result["variant"] == "a"

def test_kill_switch(evaluator):
    flag = FeatureFlag(name="test", kill_switch=True)
    FlagRegistry.add(flag)
    result = evaluator.evaluate("test", "user1", "tenant1")
    assert result["enabled"] is False

def test_caching(evaluator, mock_redis):
    flag = FeatureFlag(name="test")
    FlagRegistry.add(flag)
    mock_redis.get.return_value = None  # Cache miss
    result = evaluator.evaluate("test", "user1", "tenant1")
    mock_redis.setex.assert_called_once()
    mock_redis.get.return_value = '{"enabled": true, "variant": null}'  # Cache hit
    result = evaluator.evaluate("test", "user1", "tenant1")
    assert result["enabled"] is True

# API tests (using FastAPI TestClient)
from fastapi.testclient import TestClient
from app.api.feature_flags import app

client = TestClient(app)

def test_list_flags():
    response = client.get("/flags", auth=("admin", "password"))
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_create_flag():
    data = {"name": "new_flag", "rollout_percentage": 10}
    response = client.post("/flags", json=data, auth=("admin", "password"))
    assert response.status_code == 200
    assert response.json()["name"] == "new_flag"

def test_evaluate_flag():
    response = client.post("/flags/new_flag/evaluate?user_id=user1&tenant_id=tenant1", auth=("admin", "password"))
    assert response.status_code == 200
    assert "enabled" in response.json()