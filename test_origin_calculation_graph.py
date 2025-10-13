"""
Unit tests for the LangGraph Origin Calculation Graph.
"""

import os
import sys
import json
import pytest
from unittest.mock import MagicMock, patch
from typing import Dict, List, Any

# Add the langgraph directory to the Python path
sys.path.append("/home/ubuntu/sevensa_implementation/kubernetes_migration/services/psra/langgraph")

# Import the module to test
import origin_calculation_graph as ocg
from origin_calculation_graph import (
    Product, TradeAgreement, Component, ManufacturingProcess,
    OriginDetermination, PreferentialStatus, OriginReport,
    initialize, analyze_components, analyze_manufacturing,
    determine_origin, verify_preferential_status, generate_report,
    handle_error, router, calculate_origin
)

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

class TestOriginCalculationGraph:
    """Test the LangGraph Origin Calculation Graph."""
    
    def test_initialize(self, sample_workflow_state):
        """Test the initialize function."""
        # Arrange
        state = sample_workflow_state
        
        # Act
        result = initialize(state)
        
        # Assert
        assert result["current_step"] == "initialized"
        assert "checkpoints" in result
        assert "initialize" in result["checkpoints"]
        assert result["checkpoints"]["initialize"]["status"] == "completed"
    
    def test_initialize_with_validation_error(self, sample_workflow_state):
        """Test the initialize function with validation errors."""
        # Arrange
        state = sample_workflow_state
        state["product"].components = []  # Remove components to trigger validation error
        
        # Act
        result = initialize(state)
        
        # Assert
        assert result["current_step"] == "initialized"
        assert len(result["errors"]) > 0
        assert result["errors"][0]["step"] == "initialize"
        assert "checkpoints" in result
        assert "initialize" in result["checkpoints"]
        assert result["checkpoints"]["initialize"]["status"] == "failed"
    
    def test_analyze_components(self, sample_workflow_state, mock_llm):
        """Test the analyze_components function."""
        # Arrange
        state = sample_workflow_state
        state = initialize(state)
        
        # Act
        result = analyze_components(state)
        
        # Assert
        assert result["current_step"] == "components_analyzed"
        assert result["component_analysis"] is not None
        assert "checkpoints" in result
        assert "analyze_components" in result["checkpoints"]
        assert result["checkpoints"]["analyze_components"]["status"] == "completed"
        
        # Verify LLM was called
        assert mock_llm.invoke.called
    
    def test_analyze_manufacturing(self, sample_workflow_state, mock_llm):
        """Test the analyze_manufacturing function."""
        # Arrange
        state = sample_workflow_state
        state = initialize(state)
        
        # Act
        result = analyze_manufacturing(state)
        
        # Assert
        assert result["current_step"] == "manufacturing_analyzed"
        assert result["manufacturing_analysis"] is not None
        assert "checkpoints" in result
        assert "analyze_manufacturing" in result["checkpoints"]
        assert result["checkpoints"]["analyze_manufacturing"]["status"] == "completed"
        
        # Verify LLM was called
        assert mock_llm.invoke.called
    
    def test_determine_origin(self, sample_workflow_state, mock_llm):
        """Test the determine_origin function."""
        # Arrange
        state = sample_workflow_state
        state = initialize(state)
        state = analyze_components(state)
        state = analyze_manufacturing(state)
        
        # Act
        result = determine_origin(state)
        
        # Assert
        assert result["current_step"] == "origin_determined"
        assert result["origin_determination"] is not None
        assert result["origin_determination"].country_of_origin == "Netherlands"
        assert "checkpoints" in result
        assert "determine_origin" in result["checkpoints"]
        assert result["checkpoints"]["determine_origin"]["status"] == "completed"
        
        # Verify LLM was called
        assert mock_llm.invoke.called
    
    def test_determine_origin_missing_analysis(self, sample_workflow_state):
        """Test the determine_origin function with missing analysis."""
        # Arrange
        state = sample_workflow_state
        state = initialize(state)
        # Skip component and manufacturing analysis
        
        # Act
        result = determine_origin(state)
        
        # Assert
        assert result["current_step"] == "initialized"  # Unchanged
        assert len(result["errors"]) > 0
        assert result["errors"][0]["step"] == "determine_origin"
        assert "checkpoints" in result
        assert "determine_origin" in result["checkpoints"]
        assert result["checkpoints"]["determine_origin"]["status"] == "failed"
    
    def test_verify_preferential_status(self, sample_workflow_state, mock_llm):
        """Test the verify_preferential_status function."""
        # Arrange
        state = sample_workflow_state
        state = initialize(state)
        state = analyze_components(state)
        state = analyze_manufacturing(state)
        state = determine_origin(state)
        
        # Act
        result = verify_preferential_status(state)
        
        # Assert
        assert result["current_step"] == "preferential_status_verified"
        assert result["preferential_status"] is not None
        assert len(result["preferential_status"]) == 2
        assert result["preferential_status"][0].agreement == "EU-Japan EPA"
        assert "checkpoints" in result
        assert "verify_preferential_status" in result["checkpoints"]
        assert result["checkpoints"]["verify_preferential_status"]["status"] == "completed"
        
        # Verify LLM was called
        assert mock_llm.invoke.called
    
    def test_verify_preferential_status_missing_origin(self, sample_workflow_state):
        """Test the verify_preferential_status function with missing origin determination."""
        # Arrange
        state = sample_workflow_state
        state = initialize(state)
        # Skip component, manufacturing, and origin determination
        
        # Act
        result = verify_preferential_status(state)
        
        # Assert
        assert result["current_step"] == "initialized"  # Unchanged
        assert len(result["errors"]) > 0
        assert result["errors"][0]["step"] == "verify_preferential_status"
        assert "checkpoints" in result
        assert "verify_preferential_status" in result["checkpoints"]
        assert result["checkpoints"]["verify_preferential_status"]["status"] == "failed"
    
    def test_generate_report(self, sample_workflow_state):
        """Test the generate_report function."""
        # Arrange
        state = sample_workflow_state
        state = initialize(state)
        state["component_analysis"] = SAMPLE_COMPONENT_ANALYSIS
        state["manufacturing_analysis"] = SAMPLE_MANUFACTURING_ANALYSIS
        state["origin_determination"] = OriginDetermination(**SAMPLE_ORIGIN_DETERMINATION)
        state["preferential_status"] = [PreferentialStatus(**ps) for ps in SAMPLE_PREFERENTIAL_STATUS]
        state["current_step"] = "preferential_status_verified"
        
        # Act
        result = generate_report(state)
        
        # Assert
        assert result["current_step"] == "report_generated"
        assert result["report"] is not None
        assert result["report"].product.name == "Electric Bicycle"
        assert result["report"].origin.country_of_origin == "Netherlands"
        assert len(result["report"].preferential_status) == 2
        assert "checkpoints" in result
        assert "generate_report" in result["checkpoints"]
        assert result["checkpoints"]["generate_report"]["status"] == "completed"
    
    def test_generate_report_missing_data(self, sample_workflow_state):
        """Test the generate_report function with missing data."""
        # Arrange
        state = sample_workflow_state
        state = initialize(state)
        # Skip all analysis steps
        
        # Act
        result = generate_report(state)
        
        # Assert
        assert result["current_step"] == "initialized"  # Unchanged
        assert len(result["errors"]) > 0
        assert result["errors"][0]["step"] == "generate_report"
        assert "checkpoints" in result
        assert "generate_report" in result["checkpoints"]
        assert result["checkpoints"]["generate_report"]["status"] == "failed"
    
    def test_handle_error(self, sample_workflow_state, mock_llm):
        """Test the handle_error function."""
        # Arrange
        state = sample_workflow_state
        state = initialize(state)
        state["errors"] = [{
            "step": "analyze_components",
            "message": "Test error",
            "timestamp": 1635789600
        }]
        
        # Act
        result = handle_error(state)
        
        # Assert
        assert result["current_step"] == "error_handled"
        assert "fallback_analysis" in result
        assert "checkpoints" in result
        assert "handle_error" in result["checkpoints"]
        assert result["checkpoints"]["handle_error"]["status"] == "completed"
        
        # Verify LLM was called
        assert mock_llm.invoke.called
    
    def test_router_initialized(self, sample_workflow_state):
        """Test the router function with initialized state."""
        # Arrange
        state = sample_workflow_state
        state = initialize(state)
        
        # Act
        result = router(state)
        
        # Assert
        if ocg.ENABLE_PARALLEL_PROCESSING:
            assert result == "parallel_analysis"
        else:
            assert result == "analyze_components"
    
    def test_router_components_analyzed(self, sample_workflow_state):
        """Test the router function with components_analyzed state."""
        # Arrange
        state = sample_workflow_state
        state = initialize(state)
        state["current_step"] = "components_analyzed"
        state["component_analysis"] = SAMPLE_COMPONENT_ANALYSIS
        
        # Act
        result = router(state)
        
        # Assert
        if ocg.ENABLE_PARALLEL_PROCESSING:
            if state.get("manufacturing_analysis") is not None:
                assert result == "determine_origin"
            else:
                assert result == "wait_for_parallel"
        else:
            assert result == "analyze_manufacturing"
    
    def test_router_manufacturing_analyzed(self, sample_workflow_state):
        """Test the router function with manufacturing_analyzed state."""
        # Arrange
        state = sample_workflow_state
        state = initialize(state)
        state["current_step"] = "manufacturing_analyzed"
        state["manufacturing_analysis"] = SAMPLE_MANUFACTURING_ANALYSIS
        
        # Act
        result = router(state)
        
        # Assert
        if ocg.ENABLE_PARALLEL_PROCESSING:
            if state.get("component_analysis") is not None:
                assert result == "determine_origin"
            else:
                assert result == "wait_for_parallel"
        else:
            assert result == "determine_origin"
    
    def test_router_origin_determined(self, sample_workflow_state):
        """Test the router function with origin_determined state."""
        # Arrange
        state = sample_workflow_state
        state = initialize(state)
        state["current_step"] = "origin_determined"
        
        # Act
        result = router(state)
        
        # Assert
        assert result == "verify_preferential_status"
    
    def test_router_preferential_status_verified(self, sample_workflow_state):
        """Test the router function with preferential_status_verified state."""
        # Arrange
        state = sample_workflow_state
        state = initialize(state)
        state["current_step"] = "preferential_status_verified"
        
        # Act
        result = router(state)
        
        # Assert
        assert result == "generate_report"
    
    def test_router_report_generated(self, sample_workflow_state):
        """Test the router function with report_generated state."""
        # Arrange
        state = sample_workflow_state
        state = initialize(state)
        state["current_step"] = "report_generated"
        
        # Act
        result = router(state)
        
        # Assert
        assert result == "END"
    
    def test_router_error_handled(self, sample_workflow_state):
        """Test the router function with error_handled state."""
        # Arrange
        state = sample_workflow_state
        state = initialize(state)
        state["current_step"] = "error_handled"
        
        # Act
        result = router(state)
        
        # Assert
        assert result == "END"
    
    def test_router_with_errors(self, sample_workflow_state):
        """Test the router function with errors."""
        # Arrange
        state = sample_workflow_state
        state = initialize(state)
        state["errors"] = [{
            "step": "analyze_components",
            "message": "Test error",
            "timestamp": 1635789600
        }]
        
        # Act
        result = router(state)
        
        # Assert
        assert result == "handle_error"
    
    def test_create_workflow_graph(self):
        """Test the create_workflow_graph function."""
        # Act
        graph = ocg.create_workflow_graph()
        
        # Assert
        assert graph is not None
    
    def test_create_origin_engine(self, mock_checkpoint_saver):
        """Test the create_origin_engine function."""
        # Act
        engine = ocg.create_origin_engine()
        
        # Assert
        assert engine is not None
        assert mock_checkpoint_saver.called
    
    @patch("origin_calculation_graph.create_origin_engine")
    def test_calculate_origin(self, mock_create_engine, sample_product, sample_trade_agreements):
        """Test the calculate_origin function."""
        # Arrange
        # Create a mock engine
        mock_engine = MagicMock()
        mock_create_engine.return_value = mock_engine
        
        # Configure the mock engine
        mock_engine.stream.return_value = [{"intermediate_state": create_sample_workflow_state("report_generated")}]
        mock_engine.get_state.return_value = create_sample_workflow_state("report_generated")
        
        # Convert dict to Product and TradeAgreement objects
        product = Product(**sample_product)
        trade_agreements = [TradeAgreement(**ta) for ta in sample_trade_agreements]
        
        # Act
        result = calculate_origin(product, trade_agreements)
        
        # Assert
        assert result is not None
        assert result.product.name == "Electric Bicycle"
        assert result.origin.country_of_origin == "Netherlands"
        assert len(result.preferential_status) == 2
        
        # Verify engine methods were called
        assert mock_create_engine.called
        assert mock_engine.stream.called
        assert mock_engine.get_state.called
        assert mock_engine.end_session.called
