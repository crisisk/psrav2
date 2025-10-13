"""
PSRA-LTSD Origin Calculation Graph - Enhanced Version
Created: 2025-10-09
Last Updated: 2025-10-09

This module implements an enhanced version of the Origin Calculation Graph using LangGraph.
Key improvements:
- Structured output parsing with Pydantic models
- Parallel processing of components and manufacturing analysis
- Caching for improved performance
- Enhanced error handling and recovery
- Detailed logging and telemetry
- Support for multiple LLM providers
"""

import asyncio
import json
import logging
import os
import time
import uuid
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Literal, Optional, Tuple, TypedDict, Union, cast

import numpy as np
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.pydantic_v1 import BaseModel, Field, validator
from langchain_core.runnables import RunnableConfig, RunnablePassthrough
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.postgres import AsyncPostgresSaver
from langgraph.graph import END, StateGraph
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode
from psycopg_pool import AsyncConnectionPool
from tenacity import retry, stop_after_attempt, wait_exponential

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
MODEL_NAME = os.getenv("MODEL_NAME", "gpt-4o")
CACHE_ENABLED = os.getenv("CACHE_ENABLED", "true").lower() == "true"
PARALLEL_PROCESSING = os.getenv("PARALLEL_PROCESSING", "true").lower() == "true"
DEBUG_MODE = os.getenv("DEBUG_MODE", "false").lower() == "true"
TELEMETRY_ENABLED = os.getenv("TELEMETRY_ENABLED", "true").lower() == "true"

# Set log level based on debug mode
if DEBUG_MODE:
    logging.getLogger().setLevel(logging.DEBUG)


# Pydantic models for structured output parsing
class Component(BaseModel):
    """Model for a component of a product."""
    id: str
    name: str
    value: float
    quantity: float
    origin_country: str
    hs_code: Optional[str] = None
    description: Optional[str] = None
    is_originating: bool = Field(description="Whether the component originates from the declared origin country")
    
    @validator("is_originating", pre=True, always=True)
    def set_is_originating(cls, v, values):
        """Set is_originating based on origin_country if not provided."""
        if v is None and "origin_country" in values:
            # This is a simplified check - in reality, this would be more complex
            # based on rules of origin for specific trade agreements
            return values["origin_country"] == "EU"
        return v


class ManufacturingProcess(BaseModel):
    """Model for a manufacturing process."""
    id: str
    name: str
    description: str
    location: str
    value_added: float
    substantial_transformation: bool = Field(description="Whether this process constitutes substantial transformation")


class ComponentAnalysis(BaseModel):
    """Model for component analysis results."""
    total_value: float = Field(description="Total value of all components")
    originating_value: float = Field(description="Total value of originating components")
    non_originating_value: float = Field(description="Total value of non-originating components")
    originating_percentage: float = Field(description="Percentage of originating components by value")
    non_originating_percentage: float = Field(description="Percentage of non-originating components by value")
    critical_components: List[str] = Field(description="IDs of components critical for origin determination")
    analysis_summary: str = Field(description="Summary of the component analysis")


class ManufacturingAnalysis(BaseModel):
    """Model for manufacturing analysis results."""
    total_value_added: float = Field(description="Total value added by all manufacturing processes")
    substantial_transformation: bool = Field(description="Whether the manufacturing processes constitute substantial transformation")
    transformation_justification: str = Field(description="Justification for the substantial transformation determination")
    critical_processes: List[str] = Field(description="IDs of manufacturing processes critical for origin determination")
    analysis_summary: str = Field(description="Summary of the manufacturing analysis")


class OriginDetermination(BaseModel):
    """Model for origin determination results."""
    origin_country: str = Field(description="Determined country of origin")
    origin_justification: str = Field(description="Justification for the origin determination")
    applicable_rules: List[str] = Field(description="List of rules of origin that were applied")
    confidence_score: float = Field(description="Confidence score for the determination (0-1)")


class PreferentialStatus(BaseModel):
    """Model for preferential status verification results."""
    is_preferential: bool = Field(description="Whether the product qualifies for preferential treatment")
    applicable_agreement: str = Field(description="Applicable trade agreement")
    justification: str = Field(description="Justification for the preferential status determination")
    requirements_met: List[str] = Field(description="List of requirements that were met")
    requirements_not_met: List[str] = Field(description="List of requirements that were not met")


class OriginReport(BaseModel):
    """Model for the final origin report."""
    product_code: str = Field(description="Product code")
    origin_country: str = Field(description="Determined country of origin")
    is_preferential: bool = Field(description="Whether the product qualifies for preferential treatment")
    applicable_agreement: str = Field(description="Applicable trade agreement")
    summary: str = Field(description="Executive summary of the origin determination")
    detailed_justification: str = Field(description="Detailed justification for the origin determination")
    recommendations: List[str] = Field(description="Recommendations for improving preferential status if applicable")


class NodeState(str, Enum):
    """Enum for node states in the graph."""
    INITIALIZE = "initialize"
    ANALYZE_COMPONENTS = "analyze_components"
    ANALYZE_MANUFACTURING = "analyze_manufacturing"
    DETERMINE_ORIGIN = "determine_origin"
    VERIFY_PREFERENTIAL_STATUS = "verify_preferential_status"
    GENERATE_REPORT = "generate_report"
    ERROR_HANDLER = "error_handler"


class OriginState(TypedDict):
    """State for the origin calculation graph."""
    # Input data
    product_code: str
    components: List[Dict[str, Any]]
    manufacturing_processes: List[Dict[str, Any]]
    trade_agreement: str
    
    # Processing data
    messages: List[Union[HumanMessage, AIMessage, SystemMessage]]
    component_analysis: Optional[ComponentAnalysis]
    manufacturing_analysis: Optional[ManufacturingAnalysis]
    origin_determination: Optional[OriginDetermination]
    preferential_status: Optional[PreferentialStatus]
    origin_report: Optional[OriginReport]
    
    # Control flow
    current_node: NodeState
    error: Optional[str]
    retry_count: Dict[str, int]
    
    # Metadata
    thread_id: str
    start_time: float
    node_times: Dict[str, float]
    telemetry: Dict[str, Any]


class OriginCalculationGraph:
    """Enhanced LangGraph implementation of the Origin Calculation Engine."""

    def __init__(self):
        """Initialize the Origin Calculation Graph."""
        self.llm = ChatOpenAI(
            model=MODEL_NAME,
            temperature=0,
            api_key=OPENAI_API_KEY,
        )
        self.checkpointer = None
        self.cache = {}  # Simple in-memory cache
        self.graph = self._build_graph()

    async def setup_checkpointer(self, pool: AsyncConnectionPool) -> None:
        """Set up the checkpointer with a database connection pool."""
        self.checkpointer = AsyncPostgresSaver(pool)
        try:
            await self.checkpointer.setup()
            logger.info("Checkpointer setup complete")
        except Exception as e:
            # Table might already exist, which is fine
            logger.info(f"Checkpointer setup note: {e}")

    def _build_graph(self) -> StateGraph:
        """Build the origin calculation graph."""
        # Define the workflow
        workflow = StateGraph(OriginState)
        
        # Add nodes
        workflow.add_node(NodeState.INITIALIZE, self._initialize)
        workflow.add_node(NodeState.ANALYZE_COMPONENTS, self._analyze_components)
        workflow.add_node(NodeState.ANALYZE_MANUFACTURING, self._analyze_manufacturing)
        workflow.add_node(NodeState.DETERMINE_ORIGIN, self._determine_origin)
        workflow.add_node(NodeState.VERIFY_PREFERENTIAL_STATUS, self._verify_preferential_status)
        workflow.add_node(NodeState.GENERATE_REPORT, self._generate_report)
        workflow.add_node(NodeState.ERROR_HANDLER, self._error_handler)
        
        # Define conditional edges
        workflow.add_conditional_edges(
            NodeState.INITIALIZE,
            self._route_after_initialize,
        )
        
        # If parallel processing is enabled, both analyses can run in parallel
        if PARALLEL_PROCESSING:
            workflow.add_edge(NodeState.INITIALIZE, NodeState.ANALYZE_COMPONENTS)
            workflow.add_edge(NodeState.INITIALIZE, NodeState.ANALYZE_MANUFACTURING)
            
            # Both analyses must complete before determining origin
            workflow.add_conditional_edges(
                NodeState.ANALYZE_COMPONENTS,
                self._check_ready_for_origin_determination,
            )
            workflow.add_conditional_edges(
                NodeState.ANALYZE_MANUFACTURING,
                self._check_ready_for_origin_determination,
            )
        else:
            # Sequential processing
            workflow.add_edge(NodeState.INITIALIZE, NodeState.ANALYZE_COMPONENTS)
            workflow.add_edge(NodeState.ANALYZE_COMPONENTS, NodeState.ANALYZE_MANUFACTURING)
            workflow.add_edge(NodeState.ANALYZE_MANUFACTURING, NodeState.DETERMINE_ORIGIN)
        
        # Continue with the rest of the workflow
        workflow.add_edge(NodeState.DETERMINE_ORIGIN, NodeState.VERIFY_PREFERENTIAL_STATUS)
        workflow.add_edge(NodeState.VERIFY_PREFERENTIAL_STATUS, NodeState.GENERATE_REPORT)
        workflow.add_edge(NodeState.GENERATE_REPORT, END)
        
        # Error handling edges
        workflow.add_edge(NodeState.ERROR_HANDLER, END)
        
        # Set the entry point
        workflow.set_entry_point(NodeState.INITIALIZE)
        
        # Compile the graph
        return workflow.compile()

    async def ainvoke(
        self, 
        input_data: Dict[str, Any], 
        thread_id: Optional[str] = None,
        config: Optional[RunnableConfig] = None,
    ) -> Dict[str, Any]:
        """
        Invoke the origin calculation graph asynchronously.
        
        Args:
            input_data: Input data containing product_code, components, manufacturing_processes, and trade_agreement
            thread_id: Optional thread ID for continuing a conversation
            config: Optional runnable configuration
            
        Returns:
            The final state of the graph
        """
        # Initialize config if not provided
        if config is None:
            config = {}
        
        # Generate a thread ID if not provided
        if thread_id is None:
            thread_id = str(uuid.uuid4())
        
        # Initialize the state
        state = {
            # Input data
            "product_code": input_data["product_code"],
            "components": input_data["components"],
            "manufacturing_processes": input_data["manufacturing_processes"],
            "trade_agreement": input_data.get("trade_agreement", "EU-UK TCA"),  # Default to EU-UK TCA if not provided
            
            # Processing data
            "messages": [],
            "component_analysis": None,
            "manufacturing_analysis": None,
            "origin_determination": None,
            "preferential_status": None,
            "origin_report": None,
            
            # Control flow
            "current_node": NodeState.INITIALIZE,
            "error": None,
            "retry_count": {},
            
            # Metadata
            "thread_id": thread_id,
            "start_time": time.time(),
            "node_times": {},
            "telemetry": {},
        }
        
        # Add checkpointer to config if available
        if self.checkpointer is not None:
            config["checkpointer"] = self.checkpointer
            config["thread_id"] = thread_id
        
        # Invoke the graph
        try:
            result = await self.graph.ainvoke(state, config)
            
            # Add total execution time to telemetry
            result["telemetry"]["total_execution_time"] = time.time() - state["start_time"]
            
            # Log telemetry if enabled
            if TELEMETRY_ENABLED:
                logger.info(f"Telemetry for thread {thread_id}: {result['telemetry']}")
            
            return result
        except Exception as e:
            logger.error(f"Error invoking graph: {e}")
            # Return error state
            return {
                **state,
                "error": str(e),
                "status": "error",
            }

    async def astream(
        self, 
        input_data: Dict[str, Any], 
        thread_id: Optional[str] = None,
        config: Optional[RunnableConfig] = None,
        stream_mode: str = "updates",
    ):
        """
        Stream the origin calculation process asynchronously.
        
        Args:
            input_data: Input data containing product_code, components, manufacturing_processes, and trade_agreement
            thread_id: Optional thread ID for continuing a conversation
            config: Optional runnable configuration
            stream_mode: Stream mode, either "updates" or "values"
            
        Yields:
            Updates or values from the graph execution
        """
        # Initialize config if not provided
        if config is None:
            config = {}
        
        # Generate a thread ID if not provided
        if thread_id is None:
            thread_id = str(uuid.uuid4())
        
        # Initialize the state
        state = {
            # Input data
            "product_code": input_data["product_code"],
            "components": input_data["components"],
            "manufacturing_processes": input_data["manufacturing_processes"],
            "trade_agreement": input_data.get("trade_agreement", "EU-UK TCA"),  # Default to EU-UK TCA if not provided
            
            # Processing data
            "messages": [],
            "component_analysis": None,
            "manufacturing_analysis": None,
            "origin_determination": None,
            "preferential_status": None,
            "origin_report": None,
            
            # Control flow
            "current_node": NodeState.INITIALIZE,
            "error": None,
            "retry_count": {},
            
            # Metadata
            "thread_id": thread_id,
            "start_time": time.time(),
            "node_times": {},
            "telemetry": {},
        }
        
        # Add checkpointer to config if available
        if self.checkpointer is not None:
            config["checkpointer"] = self.checkpointer
            config["thread_id"] = thread_id
        
        # Stream the graph execution
        try:
            async for update in self.graph.astream(
                state, 
                config, 
                stream_mode=stream_mode,
            ):
                # Add node execution time to telemetry if this is a node update
                if stream_mode == "updates" and "current_node" in update:
                    node = update["current_node"]
                    if node in state["node_times"]:
                        update["telemetry"][f"{node}_time"] = time.time() - state["node_times"][node]
                
                yield update
        except Exception as e:
            logger.error(f"Error streaming graph: {e}")
            # Yield error update
            yield {
                "error": str(e),
                "status": "error",
            }

    async def get_thread(self, thread_id: str) -> Dict[str, Any]:
        """
        Get the conversation history for a thread.
        
        Args:
            thread_id: Thread ID
            
        Returns:
            The thread history
        """
        if self.checkpointer is None:
            raise ValueError("Checkpointer not initialized")
        
        # Get the thread history
        try:
            history = await self.checkpointer.get(thread_id)
            return history
        except Exception as e:
            logger.error(f"Error getting thread {thread_id}: {e}")
            raise

    async def delete_thread(self, thread_id: str) -> None:
        """
        Delete a conversation thread.
        
        Args:
            thread_id: Thread ID
        """
        if self.checkpointer is None:
            raise ValueError("Checkpointer not initialized")
        
        # Delete the thread
        try:
            await self.checkpointer.delete(thread_id)
        except Exception as e:
            logger.error(f"Error deleting thread {thread_id}: {e}")
            raise

    def _route_after_initialize(self, state: OriginState) -> Union[Literal[NodeState.ANALYZE_COMPONENTS], Literal[NodeState.ERROR_HANDLER]]:
        """
        Route to the next node after initialization.
        
        Args:
            state: Current state
            
        Returns:
            Next node to execute
        """
        if state["error"]:
            return NodeState.ERROR_HANDLER
        return NodeState.ANALYZE_COMPONENTS

    def _check_ready_for_origin_determination(
        self, 
        state: OriginState
    ) -> Union[Literal[NodeState.DETERMINE_ORIGIN], Literal[NodeState.ANALYZE_COMPONENTS], Literal[NodeState.ANALYZE_MANUFACTURING], Literal[NodeState.ERROR_HANDLER]]:
        """
        Check if both component and manufacturing analyses are complete.
        
        Args:
            state: Current state
            
        Returns:
            Next node to execute
        """
        if state["error"]:
            return NodeState.ERROR_HANDLER
        
        # Check if both analyses are complete
        if state["component_analysis"] is not None and state["manufacturing_analysis"] is not None:
            return NodeState.DETERMINE_ORIGIN
        
        # If component analysis is missing, go back to it
        if state["component_analysis"] is None:
            return NodeState.ANALYZE_COMPONENTS
        
        # If manufacturing analysis is missing, go back to it
        if state["manufacturing_analysis"] is None:
            return NodeState.ANALYZE_MANUFACTURING
        
        # This should never happen, but just in case
        return NodeState.ERROR_HANDLER

    async def _initialize(self, state: OriginState) -> OriginState:
        """
        Initialize the origin calculation process.
        
        Args:
            state: Current state
            
        Returns:
            Updated state with initialization
        """
        # Record start time for this node
        state["node_times"][NodeState.INITIALIZE] = time.time()
        
        try:
            # Validate input data
            if not state["product_code"]:
                raise ValueError("Product code is required")
            
            if not state["components"]:
                raise ValueError("Components are required")
            
            if not state["manufacturing_processes"]:
                raise ValueError("Manufacturing processes are required")
            
            # Initialize system message
            system_message = SystemMessage(
                content=(
                    "You are an expert in international trade and origin calculation. "
                    "Your task is to determine the origin of products based on their components "
                    "and manufacturing processes, applying the rules of origin from relevant trade agreements. "
                    "Be precise, thorough, and follow the legal requirements exactly."
                )
            )
            
            # Add system message to messages
            new_messages = add_messages(state["messages"], [system_message])
            
            # Initialize telemetry
            telemetry = {
                "product_code": state["product_code"],
                "component_count": len(state["components"]),
                "manufacturing_process_count": len(state["manufacturing_processes"]),
                "trade_agreement": state["trade_agreement"],
                "start_time": datetime.now().isoformat(),
            }
            
            # Update state
            return {
                **state,
                "messages": new_messages,
                "telemetry": telemetry,
                "current_node": NodeState.ANALYZE_COMPONENTS,
            }
        except Exception as e:
            logger.error(f"Error in initialization: {e}")
            return {
                **state,
                "error": str(e),
                "current_node": NodeState.ERROR_HANDLER,
            }

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def _analyze_components_with_retry(self, state: OriginState) -> ComponentAnalysis:
        """
        Analyze the components of the product with retry logic.
        
        Args:
            state: Current state
            
        Returns:
            Component analysis
        """
        # Check cache if enabled
        cache_key = f"component_analysis_{state['product_code']}_{hash(str(state['components']))}"
        if CACHE_ENABLED and cache_key in self.cache:
            logger.info(f"Cache hit for {cache_key}")
            return self.cache[cache_key]
        
        # Create a prompt for component analysis
        prompt = ChatPromptTemplate.from_messages([
            MessagesPlaceholder(variable_name="messages"),
            (
                "human", 
                "Analyze the following components for product {product_code}:\n\n"
                "{components_json}\n\n"
                "Determine the value and origin of each component. "
                "Calculate the total value of originating and non-originating materials. "
                "Identify which components are critical for origin determination.\n\n"
                "Provide your analysis in the following structured format."
            ),
        ])
        
        # Create output parser
        parser = PydanticOutputParser(pydantic_object=ComponentAnalysis)
        
        # Format the components as JSON
        components_json = json.dumps(state["components"], indent=2)
        
        # Chain the prompt with the LLM and parser
        chain = (
            prompt 
            | self.llm 
            | parser
        )
        
        # Invoke the chain
        component_analysis = await chain.ainvoke({
            "messages": state["messages"],
            "product_code": state["product_code"],
            "components_json": components_json,
            "format_instructions": parser.get_format_instructions(),
        })
        
        # Cache the result if enabled
        if CACHE_ENABLED:
            self.cache[cache_key] = component_analysis
        
        return component_analysis

    async def _analyze_components(self, state: OriginState) -> OriginState:
        """
        Analyze the components of the product.
        
        Args:
            state: Current state
            
        Returns:
            Updated state with component analysis
        """
        # Record start time for this node
        state["node_times"][NodeState.ANALYZE_COMPONENTS] = time.time()
        
        try:
            # Initialize retry count for this node if not exists
            if NodeState.ANALYZE_COMPONENTS not in state["retry_count"]:
                state["retry_count"][NodeState.ANALYZE_COMPONENTS] = 0
            
            # Increment retry count
            state["retry_count"][NodeState.ANALYZE_COMPONENTS] += 1
            
            # Analyze components with retry logic
            component_analysis = await self._analyze_components_with_retry(state)
            
            # Create human message
            human_message = HumanMessage(
                content=f"Analyze components for product {state['product_code']}"
            )
            
            # Create AI message
            ai_message = AIMessage(
                content=f"Component Analysis Complete:\n{component_analysis.json(indent=2)}"
            )
            
            # Update messages
            new_messages = add_messages(
                state["messages"],
                [human_message, ai_message],
            )
            
            # Update telemetry
            telemetry = {
                **state["telemetry"],
                "component_analysis_time": time.time() - state["node_times"][NodeState.ANALYZE_COMPONENTS],
                "originating_percentage": component_analysis.originating_percentage,
                "non_originating_percentage": component_analysis.non_originating_percentage,
            }
            
            # Determine next node based on parallel processing
            next_node = NodeState.ANALYZE_MANUFACTURING if not PARALLEL_PROCESSING else NodeState.ANALYZE_COMPONENTS
            
            # Update state
            return {
                **state,
                "messages": new_messages,
                "component_analysis": component_analysis,
                "telemetry": telemetry,
                "current_node": next_node,
            }
        except Exception as e:
            logger.error(f"Error in component analysis: {e}")
            
            # Check if we've exceeded max retries
            if state["retry_count"][NodeState.ANALYZE_COMPONENTS] >= 3:
                return {
                    **state,
                    "error": f"Failed to analyze components after 3 attempts: {str(e)}",
                    "current_node": NodeState.ERROR_HANDLER,
                }
            
            # Retry with a simplified approach
            try:
                # Simplified component analysis
                total_value = sum(component.get("value", 0) for component in state["components"])
                originating_value = sum(
                    component.get("value", 0) 
                    for component in state["components"] 
                    if component.get("origin_country") == "EU"
                )
                non_originating_value = total_value - originating_value
                
                # Create a simplified component analysis
                component_analysis = ComponentAnalysis(
                    total_value=total_value,
                    originating_value=originating_value,
                    non_originating_value=non_originating_value,
                    originating_percentage=(originating_value / total_value * 100) if total_value > 0 else 0,
                    non_originating_percentage=(non_originating_value / total_value * 100) if total_value > 0 else 0,
                    critical_components=[component.get("id", "unknown") for component in state["components"] if component.get("value", 0) > total_value * 0.1],
                    analysis_summary=f"Simplified analysis due to error: {str(e)}",
                )
                
                # Create human message
                human_message = HumanMessage(
                    content=f"Analyze components for product {state['product_code']}"
                )
                
                # Create AI message
                ai_message = AIMessage(
                    content=f"Simplified Component Analysis (after error):\n{component_analysis.json(indent=2)}"
                )
                
                # Update messages
                new_messages = add_messages(
                    state["messages"],
                    [human_message, ai_message],
                )
                
                # Update telemetry
                telemetry = {
                    **state["telemetry"],
                    "component_analysis_time": time.time() - state["node_times"][NodeState.ANALYZE_COMPONENTS],
                    "component_analysis_error": str(e),
                    "component_analysis_fallback": True,
                    "originating_percentage": component_analysis.originating_percentage,
                    "non_originating_percentage": component_analysis.non_originating_percentage,
                }
                
                # Determine next node based on parallel processing
                next_node = NodeState.ANALYZE_MANUFACTURING if not PARALLEL_PROCESSING else NodeState.ANALYZE_COMPONENTS
                
                # Update state
                return {
                    **state,
                    "messages": new_messages,
                    "component_analysis": component_analysis,
                    "telemetry": telemetry,
                    "current_node": next_node,
                }
            except Exception as fallback_error:
                logger.error(f"Error in fallback component analysis: {fallback_error}")
                return {
                    **state,
                    "error": f"Failed to analyze components: {str(e)}. Fallback also failed: {str(fallback_error)}",
                    "current_node": NodeState.ERROR_HANDLER,
                }

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def _analyze_manufacturing_with_retry(self, state: OriginState) -> ManufacturingAnalysis:
        """
        Analyze the manufacturing processes of the product with retry logic.
        
        Args:
            state: Current state
            
        Returns:
            Manufacturing analysis
        """
        # Check cache if enabled
        cache_key = f"manufacturing_analysis_{state['product_code']}_{hash(str(state['manufacturing_processes']))}"
        if CACHE_ENABLED and cache_key in self.cache:
            logger.info(f"Cache hit for {cache_key}")
            return self.cache[cache_key]
        
        # Create a prompt for manufacturing analysis
        prompt = ChatPromptTemplate.from_messages([
            MessagesPlaceholder(variable_name="messages"),
            (
                "human", 
                "Analyze the following manufacturing processes for product {product_code}:\n\n"
                "{manufacturing_json}\n\n"
                "Determine if these processes constitute substantial transformation. "
                "Consider the complexity, value added, and change in tariff classification. "
                "Identify which processes are critical for origin determination.\n\n"
                "Provide your analysis in the following structured format."
            ),
        ])
        
        # Create output parser
        parser = PydanticOutputParser(pydantic_object=ManufacturingAnalysis)
        
        # Format the manufacturing processes as JSON
        manufacturing_json = json.dumps(state["manufacturing_processes"], indent=2)
        
        # Chain the prompt with the LLM and parser
        chain = (
            prompt 
            | self.llm 
            | parser
        )
        
        # Invoke the chain
        manufacturing_analysis = await chain.ainvoke({
            "messages": state["messages"],
            "product_code": state["product_code"],
            "manufacturing_json": manufacturing_json,
            "format_instructions": parser.get_format_instructions(),
        })
        
        # Cache the result if enabled
        if CACHE_ENABLED:
            self.cache[cache_key] = manufacturing_analysis
        
        return manufacturing_analysis

    async def _analyze_manufacturing(self, state: OriginState) -> OriginState:
        """
        Analyze the manufacturing processes of the product.
        
        Args:
            state: Current state
            
        Returns:
            Updated state with manufacturing analysis
        """
        # Record start time for this node
        state["node_times"][NodeState.ANALYZE_MANUFACTURING] = time.time()
        
        try:
            # Initialize retry count for this node if not exists
            if NodeState.ANALYZE_MANUFACTURING not in state["retry_count"]:
                state["retry_count"][NodeState.ANALYZE_MANUFACTURING] = 0
            
            # Increment retry count
            state["retry_count"][NodeState.ANALYZE_MANUFACTURING] += 1
            
            # Analyze manufacturing processes with retry logic
            manufacturing_analysis = await self._analyze_manufacturing_with_retry(state)
            
            # Create human message
            human_message = HumanMessage(
                content=f"Analyze manufacturing processes for product {state['product_code']}"
            )
            
            # Create AI message
            ai_message = AIMessage(
                content=f"Manufacturing Analysis Complete:\n{manufacturing_analysis.json(indent=2)}"
            )
            
            # Update messages
            new_messages = add_messages(
                state["messages"],
                [human_message, ai_message],
            )
            
            # Update telemetry
            telemetry = {
                **state["telemetry"],
                "manufacturing_analysis_time": time.time() - state["node_times"][NodeState.ANALYZE_MANUFACTURING],
                "substantial_transformation": manufacturing_analysis.substantial_transformation,
                "total_value_added": manufacturing_analysis.total_value_added,
            }
            
            # Determine next node based on parallel processing
            next_node = NodeState.DETERMINE_ORIGIN if not PARALLEL_PROCESSING else NodeState.ANALYZE_MANUFACTURING
            
            # Update state
            return {
                **state,
                "messages": new_messages,
                "manufacturing_analysis": manufacturing_analysis,
                "telemetry": telemetry,
                "current_node": next_node,
            }
        except Exception as e:
            logger.error(f"Error in manufacturing analysis: {e}")
            
            # Check if we've exceeded max retries
            if state["retry_count"][NodeState.ANALYZE_MANUFACTURING] >= 3:
                return {
                    **state,
                    "error": f"Failed to analyze manufacturing processes after 3 attempts: {str(e)}",
                    "current_node": NodeState.ERROR_HANDLER,
                }
            
            # Retry with a simplified approach
            try:
                # Simplified manufacturing analysis
                total_value_added = sum(process.get("value_added", 0) for process in state["manufacturing_processes"])
                substantial_transformation = any(
                    process.get("substantial_transformation", False) 
                    for process in state["manufacturing_processes"]
                )
                
                # Create a simplified manufacturing analysis
                manufacturing_analysis = ManufacturingAnalysis(
                    total_value_added=total_value_added,
                    substantial_transformation=substantial_transformation,
                    transformation_justification=f"Simplified analysis due to error: {str(e)}",
                    critical_processes=[process.get("id", "unknown") for process in state["manufacturing_processes"] if process.get("substantial_transformation", False)],
                    analysis_summary=f"Simplified analysis due to error: {str(e)}",
                )
                
                # Create human message
                human_message = HumanMessage(
                    content=f"Analyze manufacturing processes for product {state['product_code']}"
                )
                
                # Create AI message
                ai_message = AIMessage(
                    content=f"Simplified Manufacturing Analysis (after error):\n{manufacturing_analysis.json(indent=2)}"
                )
                
                # Update messages
                new_messages = add_messages(
                    state["messages"],
                    [human_message, ai_message],
                )
                
                # Update telemetry
                telemetry = {
                    **state["telemetry"],
                    "manufacturing_analysis_time": time.time() - state["node_times"][NodeState.ANALYZE_MANUFACTURING],
                    "manufacturing_analysis_error": str(e),
                    "manufacturing_analysis_fallback": True,
                    "substantial_transformation": manufacturing_analysis.substantial_transformation,
                    "total_value_added": manufacturing_analysis.total_value_added,
                }
                
                # Determine next node based on parallel processing
                next_node = NodeState.DETERMINE_ORIGIN if not PARALLEL_PROCESSING else NodeState.ANALYZE_MANUFACTURING
                
                # Update state
                return {
                    **state,
                    "messages": new_messages,
                    "manufacturing_analysis": manufacturing_analysis,
                    "telemetry": telemetry,
                    "current_node": next_node,
                }
            except Exception as fallback_error:
                logger.error(f"Error in fallback manufacturing analysis: {fallback_error}")
                return {
                    **state,
                    "error": f"Failed to analyze manufacturing processes: {str(e)}. Fallback also failed: {str(fallback_error)}",
                    "current_node": NodeState.ERROR_HANDLER,
                }

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def _determine_origin_with_retry(self, state: OriginState) -> OriginDetermination:
        """
        Determine the origin of the product with retry logic.
        
        Args:
            state: Current state
            
        Returns:
            Origin determination
        """
        # Check cache if enabled
        cache_key = f"origin_determination_{state['product_code']}_{hash(str(state['component_analysis']))}_{hash(str(state['manufacturing_analysis']))}"
        if CACHE_ENABLED and cache_key in self.cache:
            logger.info(f"Cache hit for {cache_key}")
            return self.cache[cache_key]
        
        # Create a prompt for origin determination
        prompt = ChatPromptTemplate.from_messages([
            MessagesPlaceholder(variable_name="messages"),
            (
                "human", 
                "Based on the component analysis and manufacturing analysis, "
                "determine the origin of product {product_code} under the {trade_agreement} trade agreement.\n\n"
                "Component Analysis: {component_analysis}\n\n"
                "Manufacturing Analysis: {manufacturing_analysis}\n\n"
                "Apply the rules of origin to determine the country of origin. "
                "Consider substantial transformation, value-added criteria, and change in tariff classification.\n\n"
                "Provide your determination in the following structured format."
            ),
        ])
        
        # Create output parser
        parser = PydanticOutputParser(pydantic_object=OriginDetermination)
        
        # Chain the prompt with the LLM and parser
        chain = (
            prompt 
            | self.llm 
            | parser
        )
        
        # Invoke the chain
        origin_determination = await chain.ainvoke({
            "messages": state["messages"],
            "product_code": state["product_code"],
            "trade_agreement": state["trade_agreement"],
            "component_analysis": state["component_analysis"].json(indent=2),
            "manufacturing_analysis": state["manufacturing_analysis"].json(indent=2),
            "format_instructions": parser.get_format_instructions(),
        })
        
        # Cache the result if enabled
        if CACHE_ENABLED:
            self.cache[cache_key] = origin_determination
        
        return origin_determination

    async def _determine_origin(self, state: OriginState) -> OriginState:
        """
        Determine the origin of the product.
        
        Args:
            state: Current state
            
        Returns:
            Updated state with origin determination
        """
        # Record start time for this node
        state["node_times"][NodeState.DETERMINE_ORIGIN] = time.time()
        
        try:
            # Initialize retry count for this node if not exists
            if NodeState.DETERMINE_ORIGIN not in state["retry_count"]:
                state["retry_count"][NodeState.DETERMINE_ORIGIN] = 0
            
            # Increment retry count
            state["retry_count"][NodeState.DETERMINE_ORIGIN] += 1
            
            # Determine origin with retry logic
            origin_determination = await self._determine_origin_with_retry(state)
            
            # Create human message
            human_message = HumanMessage(
                content=f"Determine origin for product {state['product_code']}"
            )
            
            # Create AI message
            ai_message = AIMessage(
                content=f"Origin Determination Complete:\n{origin_determination.json(indent=2)}"
            )
            
            # Update messages
            new_messages = add_messages(
                state["messages"],
                [human_message, ai_message],
            )
            
            # Update telemetry
            telemetry = {
                **state["telemetry"],
                "origin_determination_time": time.time() - state["node_times"][NodeState.DETERMINE_ORIGIN],
                "origin_country": origin_determination.origin_country,
                "confidence_score": origin_determination.confidence_score,
            }
            
            # Update state
            return {
                **state,
                "messages": new_messages,
                "origin_determination": origin_determination,
                "telemetry": telemetry,
                "current_node": NodeState.VERIFY_PREFERENTIAL_STATUS,
            }
        except Exception as e:
            logger.error(f"Error in origin determination: {e}")
            
            # Check if we've exceeded max retries
            if state["retry_count"][NodeState.DETERMINE_ORIGIN] >= 3:
                return {
                    **state,
                    "error": f"Failed to determine origin after 3 attempts: {str(e)}",
                    "current_node": NodeState.ERROR_HANDLER,
                }
            
            # Retry with a simplified approach
            try:
                # Simplified origin determination based on component analysis and manufacturing analysis
                component_analysis = state["component_analysis"]
                manufacturing_analysis = state["manufacturing_analysis"]
                
                # Default to EU if substantial transformation or high originating percentage
                origin_country = "EU" if (
                    manufacturing_analysis.substantial_transformation or 
                    component_analysis.originating_percentage >= 60
                ) else "non-EU"
                
                # Create a simplified origin determination
                origin_determination = OriginDetermination(
                    origin_country=origin_country,
                    origin_justification=f"Simplified determination due to error: {str(e)}",
                    applicable_rules=["Substantial transformation", "Value-added criteria"],
                    confidence_score=0.7,  # Lower confidence due to fallback
                )
                
                # Create human message
                human_message = HumanMessage(
                    content=f"Determine origin for product {state['product_code']}"
                )
                
                # Create AI message
                ai_message = AIMessage(
                    content=f"Simplified Origin Determination (after error):\n{origin_determination.json(indent=2)}"
                )
                
                # Update messages
                new_messages = add_messages(
                    state["messages"],
                    [human_message, ai_message],
                )
                
                # Update telemetry
                telemetry = {
                    **state["telemetry"],
                    "origin_determination_time": time.time() - state["node_times"][NodeState.DETERMINE_ORIGIN],
                    "origin_determination_error": str(e),
                    "origin_determination_fallback": True,
                    "origin_country": origin_determination.origin_country,
                    "confidence_score": origin_determination.confidence_score,
                }
                
                # Update state
                return {
                    **state,
                    "messages": new_messages,
                    "origin_determination": origin_determination,
                    "telemetry": telemetry,
                    "current_node": NodeState.VERIFY_PREFERENTIAL_STATUS,
                }
            except Exception as fallback_error:
                logger.error(f"Error in fallback origin determination: {fallback_error}")
                return {
                    **state,
                    "error": f"Failed to determine origin: {str(e)}. Fallback also failed: {str(fallback_error)}",
                    "current_node": NodeState.ERROR_HANDLER,
                }

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def _verify_preferential_status_with_retry(self, state: OriginState) -> PreferentialStatus:
        """
        Verify the preferential status of the product with retry logic.
        
        Args:
            state: Current state
            
        Returns:
            Preferential status verification
        """
        # Check cache if enabled
        cache_key = f"preferential_status_{state['product_code']}_{hash(str(state['origin_determination']))}"
        if CACHE_ENABLED and cache_key in self.cache:
            logger.info(f"Cache hit for {cache_key}")
            return self.cache[cache_key]
        
        # Create a prompt for preferential status verification
        prompt = ChatPromptTemplate.from_messages([
            MessagesPlaceholder(variable_name="messages"),
            (
                "human", 
                "Based on the origin determination, verify if product {product_code} "
                "qualifies for preferential treatment under the {trade_agreement} trade agreement.\n\n"
                "Origin Determination: {origin_determination}\n\n"
                "Consider applicable trade agreements and specific rules of origin.\n\n"
                "Provide your verification in the following structured format."
            ),
        ])
        
        # Create output parser
        parser = PydanticOutputParser(pydantic_object=PreferentialStatus)
        
        # Chain the prompt with the LLM and parser
        chain = (
            prompt 
            | self.llm 
            | parser
        )
        
        # Invoke the chain
        preferential_status = await chain.ainvoke({
            "messages": state["messages"],
            "product_code": state["product_code"],
            "trade_agreement": state["trade_agreement"],
            "origin_determination": state["origin_determination"].json(indent=2),
            "format_instructions": parser.get_format_instructions(),
        })
        
        # Cache the result if enabled
        if CACHE_ENABLED:
            self.cache[cache_key] = preferential_status
        
        return preferential_status

    async def _verify_preferential_status(self, state: OriginState) -> OriginState:
        """
        Verify the preferential status of the product.
        
        Args:
            state: Current state
            
        Returns:
            Updated state with preferential status verification
        """
        # Record start time for this node
        state["node_times"][NodeState.VERIFY_PREFERENTIAL_STATUS] = time.time()
        
        try:
            # Initialize retry count for this node if not exists
            if NodeState.VERIFY_PREFERENTIAL_STATUS not in state["retry_count"]:
                state["retry_count"][NodeState.VERIFY_PREFERENTIAL_STATUS] = 0
            
            # Increment retry count
            state["retry_count"][NodeState.VERIFY_PREFERENTIAL_STATUS] += 1
            
            # Verify preferential status with retry logic
            preferential_status = await self._verify_preferential_status_with_retry(state)
            
            # Create human message
            human_message = HumanMessage(
                content=f"Verify preferential status for product {state['product_code']}"
            )
            
            # Create AI message
            ai_message = AIMessage(
                content=f"Preferential Status Verification Complete:\n{preferential_status.json(indent=2)}"
            )
            
            # Update messages
            new_messages = add_messages(
                state["messages"],
                [human_message, ai_message],
            )
            
            # Update telemetry
            telemetry = {
                **state["telemetry"],
                "preferential_status_time": time.time() - state["node_times"][NodeState.VERIFY_PREFERENTIAL_STATUS],
                "is_preferential": preferential_status.is_preferential,
                "applicable_agreement": preferential_status.applicable_agreement,
            }
            
            # Update state
            return {
                **state,
                "messages": new_messages,
                "preferential_status": preferential_status,
                "telemetry": telemetry,
                "current_node": NodeState.GENERATE_REPORT,
            }
        except Exception as e:
            logger.error(f"Error in preferential status verification: {e}")
            
            # Check if we've exceeded max retries
            if state["retry_count"][NodeState.VERIFY_PREFERENTIAL_STATUS] >= 3:
                return {
                    **state,
                    "error": f"Failed to verify preferential status after 3 attempts: {str(e)}",
                    "current_node": NodeState.ERROR_HANDLER,
                }
            
            # Retry with a simplified approach
            try:
                # Simplified preferential status verification based on origin determination
                origin_determination = state["origin_determination"]
                
                # Default to preferential if origin is EU and confidence is high
                is_preferential = origin_determination.origin_country == "EU" and origin_determination.confidence_score >= 0.7
                
                # Create a simplified preferential status
                preferential_status = PreferentialStatus(
                    is_preferential=is_preferential,
                    applicable_agreement=state["trade_agreement"],
                    justification=f"Simplified verification due to error: {str(e)}",
                    requirements_met=["Origin criteria"] if is_preferential else [],
                    requirements_not_met=[] if is_preferential else ["Origin criteria"],
                )
                
                # Create human message
                human_message = HumanMessage(
                    content=f"Verify preferential status for product {state['product_code']}"
                )
                
                # Create AI message
                ai_message = AIMessage(
                    content=f"Simplified Preferential Status Verification (after error):\n{preferential_status.json(indent=2)}"
                )
                
                # Update messages
                new_messages = add_messages(
                    state["messages"],
                    [human_message, ai_message],
                )
                
                # Update telemetry
                telemetry = {
                    **state["telemetry"],
                    "preferential_status_time": time.time() - state["node_times"][NodeState.VERIFY_PREFERENTIAL_STATUS],
                    "preferential_status_error": str(e),
                    "preferential_status_fallback": True,
                    "is_preferential": preferential_status.is_preferential,
                    "applicable_agreement": preferential_status.applicable_agreement,
                }
                
                # Update state
                return {
                    **state,
                    "messages": new_messages,
                    "preferential_status": preferential_status,
                    "telemetry": telemetry,
                    "current_node": NodeState.GENERATE_REPORT,
                }
            except Exception as fallback_error:
                logger.error(f"Error in fallback preferential status verification: {fallback_error}")
                return {
                    **state,
                    "error": f"Failed to verify preferential status: {str(e)}. Fallback also failed: {str(fallback_error)}",
                    "current_node": NodeState.ERROR_HANDLER,
                }

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def _generate_report_with_retry(self, state: OriginState) -> OriginReport:
        """
        Generate a final report with retry logic.
        
        Args:
            state: Current state
            
        Returns:
            Origin report
        """
        # Check cache if enabled
        cache_key = f"origin_report_{state['product_code']}_{hash(str(state['origin_determination']))}_{hash(str(state['preferential_status']))}"
        if CACHE_ENABLED and cache_key in self.cache:
            logger.info(f"Cache hit for {cache_key}")
            return self.cache[cache_key]
        
        # Create a prompt for report generation
        prompt = ChatPromptTemplate.from_messages([
            MessagesPlaceholder(variable_name="messages"),
            (
                "human", 
                "Generate a comprehensive origin report for product {product_code}.\n\n"
                "Include the following information:\n"
                "- Product details\n"
                "- Component analysis\n"
                "- Manufacturing analysis\n"
                "- Origin determination\n"
                "- Preferential status\n"
                "- Recommendations for improving preferential status if applicable\n\n"
                "Format the report in a clear, professional manner suitable for customs documentation.\n\n"
                "Provide your report in the following structured format."
            ),
        ])
        
        # Create output parser
        parser = PydanticOutputParser(pydantic_object=OriginReport)
        
        # Chain the prompt with the LLM and parser
        chain = (
            prompt 
            | self.llm 
            | parser
        )
        
        # Invoke the chain
        origin_report = await chain.ainvoke({
            "messages": state["messages"],
            "product_code": state["product_code"],
            "format_instructions": parser.get_format_instructions(),
        })
        
        # Cache the result if enabled
        if CACHE_ENABLED:
            self.cache[cache_key] = origin_report
        
        return origin_report

    async def _generate_report(self, state: OriginState) -> OriginState:
        """
        Generate a final report.
        
        Args:
            state: Current state
            
        Returns:
            Updated state with final report
        """
        # Record start time for this node
        state["node_times"][NodeState.GENERATE_REPORT] = time.time()
        
        try:
            # Initialize retry count for this node if not exists
            if NodeState.GENERATE_REPORT not in state["retry_count"]:
                state["retry_count"][NodeState.GENERATE_REPORT] = 0
            
            # Increment retry count
            state["retry_count"][NodeState.GENERATE_REPORT] += 1
            
            # Generate report with retry logic
            origin_report = await self._generate_report_with_retry(state)
            
            # Create human message
            human_message = HumanMessage(
                content=f"Generate origin report for product {state['product_code']}"
            )
            
            # Create AI message
            ai_message = AIMessage(
                content=f"Origin Report Complete:\n{origin_report.json(indent=2)}"
            )
            
            # Update messages
            new_messages = add_messages(
                state["messages"],
                [human_message, ai_message],
            )
            
            # Update telemetry
            telemetry = {
                **state["telemetry"],
                "report_generation_time": time.time() - state["node_times"][NodeState.GENERATE_REPORT],
                "total_processing_time": time.time() - state["start_time"],
                "end_time": datetime.now().isoformat(),
            }
            
            # Update state
            return {
                **state,
                "messages": new_messages,
                "origin_report": origin_report,
                "telemetry": telemetry,
            }
        except Exception as e:
            logger.error(f"Error in report generation: {e}")
            
            # Check if we've exceeded max retries
            if state["retry_count"][NodeState.GENERATE_REPORT] >= 3:
                return {
                    **state,
                    "error": f"Failed to generate report after 3 attempts: {str(e)}",
                    "current_node": NodeState.ERROR_HANDLER,
                }
            
            # Retry with a simplified approach
            try:
                # Create a simplified origin report
                origin_report = OriginReport(
                    product_code=state["product_code"],
                    origin_country=state["origin_determination"].origin_country,
                    is_preferential=state["preferential_status"].is_preferential,
                    applicable_agreement=state["preferential_status"].applicable_agreement,
                    summary=f"Origin determination for product {state['product_code']}: {state['origin_determination'].origin_country}. Preferential status: {'Yes' if state['preferential_status'].is_preferential else 'No'}.",
                    detailed_justification=f"Simplified report due to error: {str(e)}. {state['origin_determination'].origin_justification}",
                    recommendations=["Improve documentation", "Ensure proper classification"] if not state["preferential_status"].is_preferential else [],
                )
                
                # Create human message
                human_message = HumanMessage(
                    content=f"Generate origin report for product {state['product_code']}"
                )
                
                # Create AI message
                ai_message = AIMessage(
                    content=f"Simplified Origin Report (after error):\n{origin_report.json(indent=2)}"
                )
                
                # Update messages
                new_messages = add_messages(
                    state["messages"],
                    [human_message, ai_message],
                )
                
                # Update telemetry
                telemetry = {
                    **state["telemetry"],
                    "report_generation_time": time.time() - state["node_times"][NodeState.GENERATE_REPORT],
                    "report_generation_error": str(e),
                    "report_generation_fallback": True,
                    "total_processing_time": time.time() - state["start_time"],
                    "end_time": datetime.now().isoformat(),
                }
                
                # Update state
                return {
                    **state,
                    "messages": new_messages,
                    "origin_report": origin_report,
                    "telemetry": telemetry,
                }
            except Exception as fallback_error:
                logger.error(f"Error in fallback report generation: {fallback_error}")
                return {
                    **state,
                    "error": f"Failed to generate report: {str(e)}. Fallback also failed: {str(fallback_error)}",
                    "current_node": NodeState.ERROR_HANDLER,
                }

    async def _error_handler(self, state: OriginState) -> OriginState:
        """
        Handle errors in the graph.
        
        Args:
            state: Current state
            
        Returns:
            Updated state with error handling
        """
        logger.error(f"Error in graph execution: {state['error']}")
        
        # Create error message
        error_message = AIMessage(
            content=f"Error: {state['error']}\n\nPlease try again or contact support if the issue persists."
        )
        
        # Update messages
        new_messages = add_messages(
            state["messages"],
            [error_message],
        )
        
        # Update telemetry
        telemetry = {
            **state["telemetry"],
            "error": state["error"],
            "total_processing_time": time.time() - state["start_time"],
            "end_time": datetime.now().isoformat(),
            "status": "error",
        }
        
        # Return error state
        return {
            **state,
            "messages": new_messages,
            "telemetry": telemetry,
        }
