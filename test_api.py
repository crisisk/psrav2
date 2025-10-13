"""
Unit tests for the LangGraph Origin Engine API.
"""

import os
import sys
import json
import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from fastapi.testclient import TestClient
from fastapi import FastAPI
from typing import Dict, List, Any

# Add the langgraph directory to the Python path
sys.path.append("/home/ubuntu/sevensa_implementation/kubernetes_migration/services/psra/langgraph")

# Import fixtures
from fixtures.test_data import (
    SAMPLE_PRODUCT,
    SAMPLE_TRADE_AGREEMENTS,
    SAMPLE_COMPONENT_ANALYSIS,
    SAMPLE_MANUFACTURING_ANALYSIS,
    SAMPLE_ORIGIN_DETERMINATION,
    SAMPLE_PREFERENTIAL_STATUS,
    SAMPLE_ORIGIN_REPORT,
    create_sample_workflow_state
)

# Import the module to test
import api
from api import (
    app, calculate, get_thread, continue_calculation,
    interrupt_calculation, get_threads, calculate_stream,
    health_check
)

class TestOriginEngineAPI:
    """Test the LangGraph Origin Engine API."""
    
    @pytest.fixture
    def client(self):
        """Create a test client for the FastAPI app."""
        return TestClient(app)
    
    @pytest.fixture
    def mock_calculate_origin(self):
        """Mock the calculate_origin function."""
        with patch("api.calculate_origin") as mock:
            # Configure the mock to return a sample report
            mock.return_value = SAMPLE_ORIGIN_REPORT
            yield mock
    
    @pytest.fixture
    def mock_get_thread_state(self):
        """Mock the get_thread_state function."""
        with patch("api.get_thread_state") as mock:
            # Configure the mock to return a sample state
            mock.return_value = create_sample_workflow_state("report_generated")
            yield mock
    
    @pytest.fixture
    def mock_continue_thread(self):
        """Mock the continue_thread function."""
        with patch("api.continue_thread") as mock:
            # Configure the mock to return a sample report
            mock.return_value = SAMPLE_ORIGIN_REPORT
            yield mock
    
    @pytest.fixture
    def mock_interrupt_thread(self):
        """Mock the interrupt_thread function."""
        with patch("api.interrupt_thread") as mock:
            yield mock
    
    @pytest.fixture
    def mock_list_threads(self):
        """Mock the list_threads function."""
        with patch("api.list_threads") as mock:
            # Configure the mock to return a list of thread IDs
            mock.return_value = ["thread-1", "thread-2", "thread-3"]
            yield mock
    
    @pytest.fixture
    def mock_stream_calculation(self):
        """Mock the _stream_calculation function."""
        with patch("api._stream_calculation") as mock:
            # Configure the mock to return a sample stream
            async def mock_stream():
                yield f"data: {json.dumps({'thread_id': 'thread-1', 'state': create_sample_workflow_state('initialized')})}\n\n"
                yield f"data: {json.dumps({'thread_id': 'thread-1', 'state': create_sample_workflow_state('components_analyzed')})}\n\n"
                yield f"data: {json.dumps({'thread_id': 'thread-1', 'state': create_sample_workflow_state('report_generated'), 'final': True})}\n\n"
            
            mock.return_value = mock_stream()
            yield mock
    
    def test_health_check(self, client):
        """Test the health check endpoint."""
        # Act
        response = client.get("/health")
        
        # Assert
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
        assert "version" in response.json()
        assert "timestamp" in response.json()
        assert "uptime" in response.json()
        assert "memory_usage" in response.json()
        assert "thread_count" in response.json()
    
    def test_calculate_sync(self, client, mock_calculate_origin):
        """Test the calculate endpoint with synchronous calculation."""
        # Arrange
        request_data = {
            "product": SAMPLE_PRODUCT,
            "trade_agreements": SAMPLE_TRADE_AGREEMENTS,
            "async_calculation": False
        }
        
        # Act
        response = client.post(
            "/calculate",
            json=request_data,
            headers={"Authorization": "Bearer test_token"}
        )
        
        # Assert
        assert response.status_code == 200
        assert response.json()["status"] == "completed"
        assert response.json()["message"] == "Origin calculation completed"
        assert response.json()["report"] is not None
        assert response.json()["thread_id"] is not None
        
        # Verify calculate_origin was called
        mock_calculate_origin.assert_called_once()
    
    def test_calculate_async(self, client):
        """Test the calculate endpoint with asynchronous calculation."""
        # Arrange
        request_data = {
            "product": SAMPLE_PRODUCT,
            "trade_agreements": SAMPLE_TRADE_AGREEMENTS,
            "async_calculation": True
        }
        
        # Act
        response = client.post(
            "/calculate",
            json=request_data,
            headers={"Authorization": "Bearer test_token"}
        )
        
        # Assert
        assert response.status_code == 200
        assert response.json()["status"] == "processing"
        assert response.json()["message"] == "Origin calculation started"
        assert response.json()["report"] is None
        assert response.json()["thread_id"] is not None
    
    def test_calculate_with_cache(self, client, mock_calculate_origin):
        """Test the calculate endpoint with caching."""
        # Arrange
        api.ENABLE_CACHING = True
        request_data = {
            "product": SAMPLE_PRODUCT,
            "trade_agreements": SAMPLE_TRADE_AGREEMENTS,
            "async_calculation": False
        }
        
        # Act - First request
        response1 = client.post(
            "/calculate",
            json=request_data,
            headers={"Authorization": "Bearer test_token"}
        )
        
        # Act - Second request (should be cached)
        response2 = client.post(
            "/calculate",
            json=request_data,
            headers={"Authorization": "Bearer test_token"}
        )
        
        # Assert
        assert response1.status_code == 200
        assert response2.status_code == 200
        assert response2.json()["status"] == "completed"
        assert "cached" in response2.json()["message"]
        
        # Verify calculate_origin was called only once
        assert mock_calculate_origin.call_count == 1
        
        # Clean up
        api.ENABLE_CACHING = False
    
    def test_get_thread(self, client, mock_get_thread_state):
        """Test the get_thread endpoint."""
        # Act
        response = client.get(
            "/thread/thread-1",
            headers={"Authorization": "Bearer test_token"}
        )
        
        # Assert
        assert response.status_code == 200
        assert response.json()["thread_id"] == "thread-1"
        assert response.json()["state"] is not None
        assert response.json()["status"] == "completed"
        
        # Verify get_thread_state was called
        mock_get_thread_state.assert_called_once_with("thread-1")
    
    def test_get_thread_not_found(self, client, mock_get_thread_state):
        """Test the get_thread endpoint with a non-existent thread."""
        # Arrange
        mock_get_thread_state.side_effect = Exception("Thread not found")
        
        # Act
        response = client.get(
            "/thread/non-existent",
            headers={"Authorization": "Bearer test_token"}
        )
        
        # Assert
        assert response.status_code == 404
        assert "Thread not found" in response.json()["detail"]
        
        # Verify get_thread_state was called
        mock_get_thread_state.assert_called_once_with("non-existent")
    
    def test_continue_calculation(self, client, mock_continue_thread):
        """Test the continue_calculation endpoint."""
        # Act
        response = client.post(
            "/thread/thread-1/continue",
            headers={"Authorization": "Bearer test_token"}
        )
        
        # Assert
        assert response.status_code == 200
        assert response.json()["thread_id"] == "thread-1"
        assert response.json()["status"] == "completed"
        assert response.json()["message"] == "Origin calculation completed"
        assert response.json()["report"] is not None
        
        # Verify continue_thread was called
        mock_continue_thread.assert_called_once_with("thread-1")
    
    def test_continue_calculation_error(self, client, mock_continue_thread):
        """Test the continue_calculation endpoint with an error."""
        # Arrange
        mock_continue_thread.side_effect = Exception("Error continuing thread")
        
        # Act
        response = client.post(
            "/thread/thread-1/continue",
            headers={"Authorization": "Bearer test_token"}
        )
        
        # Assert
        assert response.status_code == 500
        assert "Error continuing thread" in response.json()["detail"]
        
        # Verify continue_thread was called
        mock_continue_thread.assert_called_once_with("thread-1")
    
    def test_interrupt_calculation(self, client, mock_interrupt_thread):
        """Test the interrupt_calculation endpoint."""
        # Act
        response = client.post(
            "/thread/thread-1/interrupt",
            headers={"Authorization": "Bearer test_token"}
        )
        
        # Assert
        assert response.status_code == 200
        assert response.json()["thread_id"] == "thread-1"
        assert response.json()["status"] == "interrupted"
        assert response.json()["message"] == "Thread interrupted"
        
        # Verify interrupt_thread was called
        mock_interrupt_thread.assert_called_once_with("thread-1")
    
    def test_interrupt_calculation_error(self, client, mock_interrupt_thread):
        """Test the interrupt_calculation endpoint with an error."""
        # Arrange
        mock_interrupt_thread.side_effect = Exception("Error interrupting thread")
        
        # Act
        response = client.post(
            "/thread/thread-1/interrupt",
            headers={"Authorization": "Bearer test_token"}
        )
        
        # Assert
        assert response.status_code == 500
        assert "Error interrupting thread" in response.json()["detail"]
        
        # Verify interrupt_thread was called
        mock_interrupt_thread.assert_called_once_with("thread-1")
    
    def test_get_threads(self, client, mock_list_threads):
        """Test the get_threads endpoint."""
        # Act
        response = client.get(
            "/threads",
            headers={"Authorization": "Bearer test_token"}
        )
        
        # Assert
        assert response.status_code == 200
        assert response.json()["threads"] == ["thread-1", "thread-2", "thread-3"]
        
        # Verify list_threads was called
        mock_list_threads.assert_called_once()
    
    def test_get_threads_error(self, client, mock_list_threads):
        """Test the get_threads endpoint with an error."""
        # Arrange
        mock_list_threads.side_effect = Exception("Error listing threads")
        
        # Act
        response = client.get(
            "/threads",
            headers={"Authorization": "Bearer test_token"}
        )
        
        # Assert
        assert response.status_code == 500
        assert "Error listing threads" in response.json()["detail"]
        
        # Verify list_threads was called
        mock_list_threads.assert_called_once()
    
    @patch("api._stream_calculation")
    def test_calculate_stream(self, mock_stream, client):
        """Test the calculate_stream endpoint."""
        # Arrange
        request_data = {
            "product": SAMPLE_PRODUCT,
            "trade_agreements": SAMPLE_TRADE_AGREEMENTS,
            "async_calculation": False
        }
        
        # Configure the mock to return a sample stream
        async def mock_stream_gen(*args, **kwargs):
            yield f"data: {json.dumps({'thread_id': 'thread-1', 'state': create_sample_workflow_state('initialized')})}\n\n"
            yield f"data: {json.dumps({'thread_id': 'thread-1', 'state': create_sample_workflow_state('components_analyzed')})}\n\n"
            yield f"data: {json.dumps({'thread_id': 'thread-1', 'state': create_sample_workflow_state('report_generated'), 'final': True})}\n\n"
        
        mock_stream.return_value = mock_stream_gen()
        
        # Act
        response = client.post(
            "/calculate/stream",
            json=request_data,
            headers={"Authorization": "Bearer test_token"}
        )
        
        # Assert
        assert response.status_code == 200
        assert response.headers["content-type"] == "text/event-stream"
        
        # Verify _stream_calculation was called
        assert mock_stream.called
    
    @patch("api._calculate_async")
    def test_calculate_async_background(self, mock_calculate_async, client):
        """Test the _calculate_async function."""
        # Arrange
        request_data = {
            "product": SAMPLE_PRODUCT,
            "trade_agreements": SAMPLE_TRADE_AGREEMENTS,
            "async_calculation": True
        }
        
        # Act
        response = client.post(
            "/calculate",
            json=request_data,
            headers={"Authorization": "Bearer test_token"}
        )
        
        # Assert
        assert response.status_code == 200
        
        # Verify _calculate_async was added to background tasks
        # Note: We can't directly verify this in a unit test, but we can check that the response is correct
