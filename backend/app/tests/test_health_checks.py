import pytest
from unittest.mock import patch
from app.health.health_checks import get_health_checks, aggregate_health
from app.health.dependency_checks import check_database, check_redis, check_ml_services, check_disk_space, check_memory

@pytest.fixture
def mock_checks():
    return {
        'database': {'healthy': True},
        'redis': {'healthy': True},
        'ml_services': {'healthy': True},
        'disk_space': {'healthy': True},
        'memory': {'healthy': True},
    }

def test_aggregate_health_all_healthy(mock_checks):
    assert aggregate_health(mock_checks) == True

def test_aggregate_health_some_unhealthy(mock_checks):
    mock_checks['database']['healthy'] = False
    assert aggregate_health(mock_checks) == False

@patch('app.health.dependency_checks.check_database')
@patch('app.health.dependency_checks.check_redis')
@patch('app.health.dependency_checks.check_ml_services')
@patch('app.health.dependency_checks.check_disk_space')
@patch('app.health.dependency_checks.check_memory')
def test_get_health_checks(mock_mem, mock_disk, mock_ml, mock_redis, mock_db):
    mock_db.return_value = {'healthy': True}
    mock_redis.return_value = {'healthy': True}
    mock_ml.return_value = {'healthy': True}
    mock_disk.return_value = {'healthy': True}
    mock_mem.return_value = {'healthy': True}
    
    checks = get_health_checks()['checks']
    assert all(check['healthy'] for check in checks.values())

# Add more tests for individual checks, caching, and endpoints as needed.