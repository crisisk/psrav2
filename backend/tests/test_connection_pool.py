import pytest
from unittest.mock import patch, MagicMock
from app.database.connection_pool import engine, get_connection_with_retry, get_db_session
from sqlalchemy.exc import TimeoutError

@patch('app.database.connection_pool.create_engine')
def test_engine_configuration(mock_create_engine):
    # Test that engine is created with correct pool params
    from app.database.connection_pool import DATABASE_URL, POOL_SIZE, MAX_OVERFLOW, POOL_TIMEOUT, POOL_RECYCLE
    mock_engine = MagicMock()
    mock_create_engine.return_value = mock_engine
    
    # Re-import to trigger creation
    import importlib
    import app.database.connection_pool
    importlib.reload(app.database.connection_pool)
    
    mock_create_engine.assert_called_once()
    args, kwargs = mock_create_engine.call_args
    assert kwargs['pool_size'] == POOL_SIZE
    assert kwargs['max_overflow'] == MAX_OVERFLOW
    assert kwargs['pool_timeout'] == POOL_TIMEOUT
    assert kwargs['pool_recycle'] == POOL_RECYCLE
    assert kwargs['pool_pre_ping'] == True

def test_get_connection_with_retry_success():
    # Mock successful connection
    with patch.object(engine, 'connect', return_value=MagicMock()):
        conn = get_connection_with_retry()
        assert conn is not None

def test_get_connection_with_retry_exhaustion():
    # Mock pool exhaustion
    with patch.object(engine, 'connect', side_effect=TimeoutError("pool is exhausted")):
        with pytest.raises(RuntimeError, match="Failed to acquire connection"):
            get_connection_with_retry(max_retries=2)

def test_get_db_session():
    session = get_db_session()
    assert session is not None
    session.close()  # Clean up