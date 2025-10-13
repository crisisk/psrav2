"""
Pytest configuration for PSRA-LTSD unit tests.
"""

import os
import sys
import json
import pytest
from unittest.mock import MagicMock, patch
from typing import Dict, List, Any, Generator

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
    create_sample_workflow_state,
    MOCK_LLM_RESPONSES
)

@pytest.fixture
def mock_llm() -> Generator[MagicMock, None, None]:
    """Mock the LLM for testing."""
    with patch("origin_calculation_graph.get_llm") as mock:
        # Create a mock LLM
        mock_llm_instance = MagicMock()
        
        # Configure the mock to return appropriate responses
        def mock_invoke(messages):
            # Determine which function is being called based on the messages
            message_content = messages[1].content
            
            if "analyze the following components" in message_content:
                response_content = MOCK_LLM_RESPONSES["analyze_components"]
            elif "analyze the following manufacturing processes" in message_content:
                response_content = MOCK_LLM_RESPONSES["analyze_manufacturing"]
            elif "determine the country of origin" in message_content:
                response_content = MOCK_LLM_RESPONSES["determine_origin"]
            elif "determine if the product" in message_content and "qualifies for preferential treatment" in message_content:
                response_content = MOCK_LLM_RESPONSES["verify_preferential_status"]
            else:
                response_content = "{}"
            
            # Create a mock response
            mock_response = MagicMock()
            mock_response.content = response_content
            return mock_response
        
        mock_llm_instance.invoke.side_effect = mock_invoke
        mock.return_value = mock_llm_instance
        
        yield mock_llm_instance

@pytest.fixture
def mock_checkpoint_saver() -> Generator[MagicMock, None, None]:
    """Mock the checkpoint saver for testing."""
    with patch("origin_calculation_graph.get_checkpoint_saver") as mock:
        # Create a mock checkpoint saver
        mock_saver = MagicMock()
        mock.return_value = mock_saver
        
        yield mock_saver

@pytest.fixture
def sample_product() -> Dict[str, Any]:
    """Return a sample product for testing."""
    return SAMPLE_PRODUCT

@pytest.fixture
def sample_trade_agreements() -> List[Dict[str, Any]]:
    """Return sample trade agreements for testing."""
    return SAMPLE_TRADE_AGREEMENTS

@pytest.fixture
def sample_workflow_state() -> Dict[str, Any]:
    """Return a sample workflow state for testing."""
    return create_sample_workflow_state()

@pytest.fixture
def sample_origin_report() -> Dict[str, Any]:
    """Return a sample origin report for testing."""
    return SAMPLE_ORIGIN_REPORT

@pytest.fixture
def mock_fastapi_app() -> Generator[MagicMock, None, None]:
    """Mock the FastAPI app for testing."""
    with patch("fastapi.FastAPI") as mock:
        # Create a mock FastAPI app
        mock_app = MagicMock()
        mock.return_value = mock_app
        
        yield mock_app
