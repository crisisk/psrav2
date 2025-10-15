import pytest
from unittest.mock import MagicMock
from psra_backend.cache import CacheService
from psra_backend.database import get_db_session

# Factory pattern for test data
class CacheDataFactory:
    @staticmethod
    def create_cache_entry(key="test_key", value="test_value"):
        return {"key": key, "value": value}

@pytest.fixture
def redis_mock():
    redis = MagicMock()
    yield redis

@pytest.fixture
def sample_cache_entry():
    return CacheDataFactory.create_cache_entry()

@pytest.fixture
def sample_cache_entries():
    return [CacheDataFactory.create_cache_entry(f"key{i}", f"value{i}") for i in range(1, 6)]

def test_set_cache_success(redis_mock, sample_cache_entry):
    service = CacheService(redis_mock)
    service.set_cache(sample_cache_entry["key"], sample_cache_entry["value"])
    redis_mock.set.assert_called_once_with("test_key", "test_value")

def test_get_cache_hit(redis_mock, sample_cache_entry):
    redis_mock.get.return_value = "test_value"
    service = CacheService(redis_mock)
    result = service.get_cache("test_key")
    assert result == "test_value"

def test_get_cache_miss(redis_mock):
    redis_mock.get.return_value = None
    service = CacheService(redis_mock)
    result = service.get_cache("missing_key")
    assert result is None

@pytest.mark.asyncio
async def test_set_cache_async(redis_mock, sample_cache_entry):
    service = CacheService(redis_mock)
    await service.set_cache_async(sample_cache_entry["key"], sample_cache_entry["value"])
    redis_mock.set.assert_called_once()

@pytest.mark.asyncio
async def test_get_cache_async_hit(redis_mock):
    redis_mock.get.return_value = "async_value"
    service = CacheService(redis_mock)
    result = await service.get_cache_async("async_key")
    assert result == "async_value"

def test_delete_cache_success(redis_mock):
    service = CacheService(redis_mock)
    service.delete_cache("test_key")
    redis_mock.delete.assert_called_once_with("test_key")

def test_clear_cache(redis_mock):
    service = CacheService(redis_mock)
    service.clear_cache()
    redis_mock.flushall.assert_called_once()

@pytest.mark.asyncio
async def test_bulk_set_cache(redis_mock, sample_cache_entries):
    service = CacheService(redis_mock)
    await service.bulk_set_cache(sample_cache_entries)
    assert redis_mock.set.call_count == 5

@pytest.mark.asyncio
async def test_bulk_get_cache(redis_mock, sample_cache_entries):
    redis_mock.mget.return_value = ["value1", "value2", None]
    service = CacheService(redis_mock)
    results = await service.bulk_get_cache(["key1", "key2", "key3"])
    assert len(results) == 3

def test_cache_expiry(redis_mock, sample_cache_entry):
    service = CacheService(redis_mock)
    service.set_cache_with_expiry(sample_cache_entry["key"], sample_cache_entry["value"], 300)
    redis_mock.setex.assert_called_once_with("test_key", 300, "test_value")

@pytest.mark.asyncio
async def test_cache_connection_error(redis_mock):
    redis_mock.set.side_effect = Exception("Connection failed")
    service = CacheService(redis_mock)
    with pytest.raises(Exception, match="Connection failed"):
        await service.set_cache_async("key", "value")
