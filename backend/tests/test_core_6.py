import pytest
from unittest.mock import MagicMock
from psra_backend.health import HealthService
from psra_backend.database import get_db_session

# Factory pattern for test data
class HealthStatusFactory:
    @staticmethod
    def create_healthy_status():
        return {"database": "ok", "cache": "ok", "overall": "healthy"}
    
    @staticmethod
    def create_unhealthy_status():
        return {"database": "error", "cache": "ok", "overall": "unhealthy"}

@pytest.fixture
def db_session():
    session = MagicMock()
    yield session
    session.close()

@pytest.fixture
def redis_mock():
    redis = MagicMock()
    yield redis

@pytest.fixture
def sample_healthy_status():
    return HealthStatusFactory.create_healthy_status()

@pytest.fixture
def sample_unhealthy_status():
    return HealthStatusFactory.create_unhealthy_status()

def test_health_check_database_ok(db_session, redis_mock, sample_healthy_status):
    service = HealthService(db_session, redis_mock)
    status = service.check_health()
    assert status["database"] == "ok"

def test_health_check_database_error(db_session, redis_mock):
    db_session.execute.side_effect = Exception("DB error")
    service = HealthService(db_session, redis_mock)
    status = service.check_health()
    assert status["database"] == "error"

def test_health_check_cache_ok(db_session, redis_mock, sample_healthy_status):
    service = HealthService(db_session, redis_mock)
    status = service.check_health()
    assert status["cache"] == "ok"

def test_health_check_cache_error(db_session, redis_mock):
    redis_mock.ping.side_effect = Exception("Cache error")
    service = HealthService(db_session, redis_mock)
    status = service.check_health()
    assert status["cache"] == "error"

@pytest.mark.asyncio
async def test_async_health_check(db_session, redis_mock, sample_healthy_status):
    service = HealthService(db_session, redis_mock)
    status = await service.check_health_async()
    assert status["overall"] == "healthy"

@pytest.mark.asyncio
async def test_async_health_check_unhealthy(db_session, redis_mock, sample_unhealthy_status):
    db_session.execute.side_effect = Exception("DB error")
    service = HealthService(db_session, redis_mock)
    status = await service.check_health_async()
    assert status["overall"] == "unhealthy"

def test_health_endpoint_response(db_session, redis_mock, sample_healthy_status):
    service = HealthService(db_session, redis_mock)
    response = service.get_health_endpoint()
    assert response.status_code == 200
    assert "healthy" in response.json()

def test_health_endpoint_unhealthy_response(db_session, redis_mock):
    db_session.execute.side_effect = Exception("DB error")
    service = HealthService(db_session, redis_mock)
    response = service.get_health_endpoint()
    assert response.status_code == 503
    assert "unhealthy" in response.json()

@pytest.mark.asyncio
async def test_detailed_health_check(db_session, redis_mock):
    service = HealthService(db_session, redis_mock)
    details = await service.detailed_health_check()
    assert "uptime" in details
    assert "version" in details

def test_health_check_with_dependencies(db_session, redis_mock, mocker):
    mock_dep = mocker.patch("psra_backend.health.check_external_dependency")
    mock_dep.return_value = True
    service = HealthService(db_session, redis_mock)
    status = service.check_health()
    assert "dependencies" in status

@pytest.mark.asyncio
async def test_health_check_timeout(db_session, redis_mock, mocker):
    mocker.patch("psra_backend.health.time.sleep", side_effect=Exception("Timeout"))
    service = HealthService(db_session, redis_mock)
    with pytest.raises(Exception, match="Timeout"):
        await service.check_health_with_timeout(1)
