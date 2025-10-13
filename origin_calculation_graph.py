"""
PSRA-LTSD Origin Calculation Graph
Created: 2025-10-09
Last Updated: 2025-10-09
"""

import json
import logging
import os
import uuid
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple, TypedDict, Union

from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnableConfig
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.postgres import AsyncPostgresSaver
from langgraph.graph import END, StateGraph
from langgraph.graph.message import add_messages
from psycopg_pool import AsyncConnectionPool

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
MODEL_NAME = os.getenv("MODEL_NAME", "gpt-4o")


class NodeState(str, Enum):
    """Enum for node states in the graph."""
    ANALYZE_COMPONENTS = "analyze_components"
    ANALYZE_MANUFACTURING = "analyze_manufacturing"
    DETERMINE_ORIGIN = "determine_origin"
    VERIFY_PREFERENTIAL_STATUS = "verify_preferential_status"
    GENERATE_REPORT = "generate_report"


class OriginState(TypedDict):
    """State for the origin calculation graph."""
    product_code: str
    components: List[Dict[str, Any]]
    manufacturing_processes: List[Dict[str, Any]]
    messages: List[Union[HumanMessage, AIMessage]]
    component_analysis: Optional[Dict[str, Any]]
    manufacturing_analysis: Optional[Dict[str, Any]]
    origin_country: Optional[str]
    origin_justification: Optional[str]
    preferential_status: Optional[bool]
    preferential_justification: Optional[str]
    thread_id: str
    current_node: NodeState


class OriginCalculationGraph:
    """LangGraph implementation of the Origin Calculation Engine."""

    def __init__(self):
        """Initialize the Origin Calculation Graph."""
        self.llm = ChatOpenAI(
            model=MODEL_NAME,
            temperature=0,
            api_key=OPENAI_API_KEY,
        )
        self.checkpointer = None
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
        workflow.add_node(
            NodeState.ANALYZE_COMPONENTS, self._analyze_components
        )
        workflow.add_node(
            NodeState.ANALYZE_MANUFACTURING, self._analyze_manufacturing
        )
        workflow.add_node(
            NodeState.DETERMINE_ORIGIN, self._determine_origin
        )
        workflow.add_node(
            NodeState.VERIFY_PREFERENTIAL_STATUS, self._verify_preferential_status
        )
        workflow.add_node(
            NodeState.GENERATE_REPORT, self._generate_report
        )
        
        # Define edges
        workflow.add_edge(
            NodeState.ANALYZE_COMPONENTS, 
            NodeState.ANALYZE_MANUFACTURING
        )
        workflow.add_edge(
            NodeState.ANALYZE_MANUFACTURING, 
            NodeState.DETERMINE_ORIGIN
        )
        workflow.add_edge(
            NodeState.DETERMINE_ORIGIN, 
            NodeState.VERIFY_PREFERENTIAL_STATUS
        )
        workflow.add_edge(
            NodeState.VERIFY_PREFERENTIAL_STATUS, 
            NodeState.GENERATE_REPORT
        )
        workflow.add_edge(
            NodeState.GENERATE_REPORT, 
            END
        )
        
        # Set the entry point
        workflow.set_entry_point(NodeState.ANALYZE_COMPONENTS)
        
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
            input_data: Input data containing product_code, components, and manufacturing_processes
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
            "product_code": input_data["product_code"],
            "components": input_data["components"],
            "manufacturing_processes": input_data["manufacturing_processes"],
            "messages": [],
            "component_analysis": None,
            "manufacturing_analysis": None,
            "origin_country": None,
            "origin_justification": None,
            "preferential_status": None,
            "preferential_justification": None,
            "thread_id": thread_id,
            "current_node": NodeState.ANALYZE_COMPONENTS,
        }
        
        # Add checkpointer to config if available
        if self.checkpointer is not None:
            config["checkpointer"] = self.checkpointer
            config["thread_id"] = thread_id
        
        # Invoke the graph
        result = await self.graph.ainvoke(state, config)
        return result

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
            input_data: Input data containing product_code, components, and manufacturing_processes
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
            "product_code": input_data["product_code"],
            "components": input_data["components"],
            "manufacturing_processes": input_data["manufacturing_processes"],
            "messages": [],
            "component_analysis": None,
            "manufacturing_analysis": None,
            "origin_country": None,
            "origin_justification": None,
            "preferential_status": None,
            "preferential_justification": None,
            "thread_id": thread_id,
            "current_node": NodeState.ANALYZE_COMPONENTS,
        }
        
        # Add checkpointer to config if available
        if self.checkpointer is not None:
            config["checkpointer"] = self.checkpointer
            config["thread_id"] = thread_id
        
        # Stream the graph execution
        async for update in self.graph.astream(
            state, 
            config, 
            stream_mode=stream_mode,
        ):
            yield update

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

    async def _analyze_components(self, state: OriginState) -> OriginState:
        """
        Analyze the components of the product.
        
        Args:
            state: Current state
            
        Returns:
            Updated state with component analysis
        """
        # Create a prompt for component analysis
        prompt = ChatPromptTemplate.from_messages([
            MessagesPlaceholder(variable_name="messages"),
            (
                "human", 
                "Analyze the following components for product {product_code}:\n\n"
                "{components_json}\n\n"
                "Determine the value and origin of each component. "
                "Calculate the total value of non-originating materials."
            ),
        ])
        
        # Format the components as JSON
        components_json = json.dumps(state["components"], indent=2)
        
        # Chain the prompt with the LLM
        chain = prompt | self.llm
        
        # Invoke the chain
        response = await chain.ainvoke({
            "messages": state["messages"],
            "product_code": state["product_code"],
            "components_json": components_json,
        })
        
        # Parse the response to extract component analysis
        # In a real implementation, this would be more sophisticated
        component_analysis = {
            "total_value": sum(component.get("value", 0) for component in state["components"]),
            "non_originating_value": sum(
                component.get("value", 0) 
                for component in state["components"] 
                if component.get("origin_country") != "EU"
            ),
            "analysis": response.content,
        }
        
        # Update the state
        new_messages = add_messages(
            state["messages"],
            [
                HumanMessage(content=f"Analyze components for product {state['product_code']}"),
                response,
            ],
        )
        
        return {
            **state,
            "messages": new_messages,
            "component_analysis": component_analysis,
            "current_node": NodeState.ANALYZE_MANUFACTURING,
        }

    async def _analyze_manufacturing(self, state: OriginState) -> OriginState:
        """
        Analyze the manufacturing processes of the product.
        
        Args:
            state: Current state
            
        Returns:
            Updated state with manufacturing analysis
        """
        # Create a prompt for manufacturing analysis
        prompt = ChatPromptTemplate.from_messages([
            MessagesPlaceholder(variable_name="messages"),
            (
                "human", 
                "Analyze the following manufacturing processes for product {product_code}:\n\n"
                "{manufacturing_json}\n\n"
                "Determine if these processes constitute substantial transformation. "
                "Consider the complexity, value added, and change in tariff classification."
            ),
        ])
        
        # Format the manufacturing processes as JSON
        manufacturing_json = json.dumps(state["manufacturing_processes"], indent=2)
        
        # Chain the prompt with the LLM
        chain = prompt | self.llm
        
        # Invoke the chain
        response = await chain.ainvoke({
            "messages": state["messages"],
            "product_code": state["product_code"],
            "manufacturing_json": manufacturing_json,
        })
        
        # Parse the response to extract manufacturing analysis
        # In a real implementation, this would be more sophisticated
        manufacturing_analysis = {
            "substantial_transformation": any(
                process.get("substantial_transformation", False) 
                for process in state["manufacturing_processes"]
            ),
            "value_added": sum(
                process.get("value_added", 0) 
                for process in state["manufacturing_processes"]
            ),
            "analysis": response.content,
        }
        
        # Update the state
        new_messages = add_messages(
            state["messages"],
            [
                HumanMessage(content=f"Analyze manufacturing processes for product {state['product_code']}"),
                response,
            ],
        )
        
        return {
            **state,
            "messages": new_messages,
            "manufacturing_analysis": manufacturing_analysis,
            "current_node": NodeState.DETERMINE_ORIGIN,
        }

    async def _determine_origin(self, state: OriginState) -> OriginState:
        """
        Determine the origin of the product.
        
        Args:
            state: Current state
            
        Returns:
            Updated state with origin determination
        """
        # Create a prompt for origin determination
        prompt = ChatPromptTemplate.from_messages([
            MessagesPlaceholder(variable_name="messages"),
            (
                "human", 
                "Based on the component analysis and manufacturing analysis, "
                "determine the origin of product {product_code}.\n\n"
                "Component Analysis: {component_analysis}\n\n"
                "Manufacturing Analysis: {manufacturing_analysis}\n\n"
                "Apply the rules of origin to determine the country of origin. "
                "Consider substantial transformation, value-added criteria, and change in tariff classification."
            ),
        ])
        
        # Chain the prompt with the LLM
        chain = prompt | self.llm
        
        # Invoke the chain
        response = await chain.ainvoke({
            "messages": state["messages"],
            "product_code": state["product_code"],
            "component_analysis": json.dumps(state["component_analysis"], indent=2),
            "manufacturing_analysis": json.dumps(state["manufacturing_analysis"], indent=2),
        })
        
        # Parse the response to extract origin determination
        # In a real implementation, this would use a more sophisticated parsing approach
        # For now, we'll assume the LLM provides a structured response
        origin_country = "EU"  # Default, would be extracted from the response
        origin_justification = response.content
        
        # Update the state
        new_messages = add_messages(
            state["messages"],
            [
                HumanMessage(content=f"Determine origin for product {state['product_code']}"),
                response,
            ],
        )
        
        return {
            **state,
            "messages": new_messages,
            "origin_country": origin_country,
            "origin_justification": origin_justification,
            "current_node": NodeState.VERIFY_PREFERENTIAL_STATUS,
        }

    async def _verify_preferential_status(self, state: OriginState) -> OriginState:
        """
        Verify the preferential status of the product.
        
        Args:
            state: Current state
            
        Returns:
            Updated state with preferential status verification
        """
        # Create a prompt for preferential status verification
        prompt = ChatPromptTemplate.from_messages([
            MessagesPlaceholder(variable_name="messages"),
            (
                "human", 
                "Based on the origin determination, verify if product {product_code} "
                "qualifies for preferential treatment.\n\n"
                "Origin Country: {origin_country}\n\n"
                "Origin Justification: {origin_justification}\n\n"
                "Consider applicable trade agreements and specific rules of origin."
            ),
        ])
        
        # Chain the prompt with the LLM
        chain = prompt | self.llm
        
        # Invoke the chain
        response = await chain.ainvoke({
            "messages": state["messages"],
            "product_code": state["product_code"],
            "origin_country": state["origin_country"],
            "origin_justification": state["origin_justification"],
        })
        
        # Parse the response to extract preferential status
        # In a real implementation, this would use a more sophisticated parsing approach
        # For now, we'll assume the LLM provides a structured response
        preferential_status = True  # Default, would be extracted from the response
        preferential_justification = response.content
        
        # Update the state
        new_messages = add_messages(
            state["messages"],
            [
                HumanMessage(content=f"Verify preferential status for product {state['product_code']}"),
                response,
            ],
        )
        
        return {
            **state,
            "messages": new_messages,
            "preferential_status": preferential_status,
            "preferential_justification": preferential_justification,
            "current_node": NodeState.GENERATE_REPORT,
        }

    async def _generate_report(self, state: OriginState) -> OriginState:
        """
        Generate a final report.
        
        Args:
            state: Current state
            
        Returns:
            Updated state with final report
        """
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
                "- Origin determination: {origin_country}\n"
                "- Preferential status: {preferential_status}\n"
                "- Justifications for both determinations\n\n"
                "Format the report in a clear, professional manner suitable for customs documentation."
            ),
        ])
        
        # Chain the prompt with the LLM
        chain = prompt | self.llm
        
        # Invoke the chain
        response = await chain.ainvoke({
            "messages": state["messages"],
            "product_code": state["product_code"],
            "origin_country": state["origin_country"],
            "preferential_status": "Yes" if state["preferential_status"] else "No",
        })
        
        # Update the state
        new_messages = add_messages(
            state["messages"],
            [
                HumanMessage(content=f"Generate origin report for product {state['product_code']}"),
                response,
            ],
        )
        
        # The final state includes all the information needed for the response
        return {
            **state,
            "messages": new_messages,
        }
