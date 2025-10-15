"""
Unit tests for the timeout configuration system.
"""

import pytest
import time
import logging
from unittest.mock import patch

from app.core.timeout_config import get_timeout, TIMEOUTS
from app.core.timeout_decorator import timeout_decorator
from app.core.timeout_context import timeout_context

# Mock logger to capture logs
@pytest.fixture
def caplog(caplog):
    caplog.set_level(logging.ERROR)
    return caplog

class TestTimeoutConfig:
    def test_get_timeout_valid(self):
        assert get_timeout('http', 'connection') == TIMEOUTS['http']['connection']
        assert get_timeout('database', 'query') == TIMEOUTS['database']['query']

    def test_get_timeout_invalid_service(self):
        with pytest.raises(KeyError):
            get_timeout('invalid', 'query')

    def test_get_timeout_invalid_operation(self):
        with pytest.raises(KeyError):
            get_timeout('http', 'invalid')

class TestTimeoutDecorator:
    def test_decorator_success(self):
        @timeout_decorator(2)
        def quick_func():
            time.sleep(1)
            return "done"

        result = quick_func()
        assert result == "done"

    def test_decorator_timeout(self, caplog):
        @timeout_decorator(1)
        def slow_func():
            time.sleep(2)
            return "done"

        with pytest.raises(TimeoutError, match="timed out after 1 seconds"):
            slow_func()

        assert "timed out after 1 seconds" in caplog.text

class TestTimeoutContext:
    def test_context_success(self):
        with timeout_context(2):
            time.sleep(1)
            result = "done"
        assert result == "done"

    def test_context_timeout(self, caplog):
        with pytest.raises(TimeoutError, match="Timed out after 1 seconds"):
            with timeout_context(1):
                time.sleep(2)

        assert "timed out after 1 seconds" in caplog.text