"""
Optimized Origin Calculation Graph for PSRA-LTSD Enterprise v2

This module implements an optimized version of the LangGraph Origin Engine
with enhanced performance, parallel processing, and advanced caching.
"""

import os
import time
import asyncio
import logging
from typing import Dict, List, Optional, Any, Tuple, Union, Callable
from enum import Enum
from datetime import datetime
from functools import lru_cache
import hashlib
import json

from pydantic import BaseModel, Field, validator
from langchain_core.language_models import BaseChatModel
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from langgraph.checkpoint import MemorySaver
from langgraph.checkpoint.redis import RedisSaver

# Configure logging
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("optimized_origin_calculation_graph")

# Environment configuration
ENABLE_PARALLEL_PROCESSING = os.getenv("ENABLE_PARALLEL_PROCESSING", "true").lower() == "true"
ENABLE_CACHING = os.getenv("ENABLE_CACHING", "true").lower() == "true"
CHECKPOINT_PERSISTENCE = os.getenv("CHECKPOINT_PERSISTENCE", "false").lower() == "true"
MODEL_NAME = os.getenv("MODEL_NAME", "gpt-4o")
CACHE_TTL = int(os.getenv("CACHE_TTL", "86400"))  # 24 hours by default
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Industry-specific model configuration
INDUSTRY_MODELS = {
    "automotive": os.getenv("AUTOMOTIVE_MODEL", MODEL_NAME),
    "electronics": os.getenv("ELECTRONICS_MODEL", MODEL_NAME),
    "textile": os.getenv("TEXTILE_MODEL", MODEL_NAME),
}

# Define data models
class Component(BaseModel):
    """Model for a product component."""
    name: str
    origin: str
    value: float
    hs_code: str
    weight: Optional[float] = None
    quantity: Optional[int] = None
    description: Optional[str] = None

class Manufacturing(BaseModel):
    """Model for manufacturing information."""
    location: str
    processes: List[str]
    value_added: float
    description: Optional[str] = None
    date: Optional[datetime] = None

class Product(BaseModel):
    """Model for a product."""
    name: str
    hs_code: str
    components: List[Component]
    manufacturing: Manufacturing
    industry: Optional[str] = None
    description: Optional[str] = None
    total_value: Optional[float] = None

    @validator("total_value", always=True)
    def calculate_total_value(cls, v, values):
        """Calculate the total value of the product if not provided."""
        if v is not None:
            return v
        
        if "components" not in values or "manufacturing" not in values:
            return None
        
        component_value = sum(c.value for c in values["components"])
        manufacturing_value = values["manufacturing"].value_added
        return component_value + manufacturing_value

class ComponentAnalysis(BaseModel):
    """Model for component analysis results."""
    component_name: str
    origin_country: str
    hs_code: str
    value_contribution: float
    value_percentage: float
    origin_status: str
    preferential_eligibility: bool
    reasoning: str

class ManufacturingAnalysis(BaseModel):
    """Model for manufacturing analysis results."""
    location: str
    processes: List[str]
    value_added: float
    value_added_percentage: float
    substantial_transformation: bool
    qualifying_processes: List[str]
    non_qualifying_processes: List[str]
    reasoning: str

class OriginDetermination(BaseModel):
    """Model for origin determination results."""
    determined_origin: str
    determination_method: str
    confidence_score: float
    applicable_rules: List[str]
    reasoning: str

class PreferentialStatus(BaseModel):
    """Model for preferential status verification results."""
    trade_agreement: str
    preferential_status: bool
    qualifying_rules: List[str]
    documentation_required: List[str]
    reasoning: str

class CalculationResult(BaseModel):
    """Model for the complete calculation result."""
    product_name: str
    hs_code: str
    component_analyses: List[ComponentAnalysis]
    manufacturing_analysis: ManufacturingAnalysis
    origin_determination: OriginDetermination
    preferential_status: PreferentialStatus
    calculation_time: float
    timestamp: datetime = Field(default_factory=datetime.now)

class CalculationState(BaseModel):
    """Model for the calculation state in the graph."""
    product: Product
    trade_agreement: str
    component_analyses: Optional[List[ComponentAnalysis]] = None
    manufacturing_analysis: Optional[ManufacturingAnalysis] = None
    origin_determination: Optional[OriginDetermination] = None
    preferential_status: Optional[PreferentialStatus] = None
    error: Optional[str] = None
    start_time: float = Field(default_factory=time.time)
    calculation_time: Optional[float] = None
    cache_hit: bool = False
    industry_specific_model_used: Optional[str] = None

class CalculationStep(str, Enum):
    """Enum for calculation steps."""
    INITIALIZE = "initialize"
    ANALYZE_COMPONENTS = "analyze_components"
    ANALYZE_MANUFACTURING = "analyze_manufacturing"
    DETERMINE_ORIGIN = "determine_origin"
    VERIFY_PREFERENTIAL_STATUS = "verify_preferential_status"
    ERROR = "error"

# Cache implementation
class CalculationCache:
    """Cache for origin calculations."""
    
    def __init__(self):
        """Initialize the cache."""
        self.memory_cache = {}
        self.redis_client = None
        
        if ENABLE_CACHING:
            logger.info("Initializing calculation cache")
            
            # Initialize Redis client if Redis URL is provided
            if CHECKPOINT_PERSISTENCE and REDIS_URL:
                try:
                    import redis
                    self.redis_client = redis.from_url(REDIS_URL)
                    logger.info("Connected to Redis cache")
                except ImportError:
                    logger.warning("Redis package not installed, falling back to memory cache")
                except Exception as e:
                    logger.warning(f"Failed to connect to Redis: {e}")
    
    def _generate_cache_key(self, product: Product, trade_agreement: str) -> str:
        """Generate a cache key for the calculation."""
        # Create a deterministic representation of the input
        cache_input = {
            "product": product.dict(exclude={"description"}),
            "trade_agreement": trade_agreement
        }
        
        # Generate a hash of the input
        cache_key = hashlib.sha256(json.dumps(cache_input, sort_keys=True).encode()).hexdigest()
        return cache_key
    
    def get(self, product: Product, trade_agreement: str) -> Optional[CalculationResult]:
        """Get a calculation result from the cache."""
        if not ENABLE_CACHING:
            return None
        
        cache_key = self._generate_cache_key(product, trade_agreement)
        
        # Try memory cache first
        if cache_key in self.memory_cache:
            logger.info(f"Cache hit (memory): {cache_key}")
            return self.memory_cache[cache_key]
        
        # Try Redis cache if available
        if self.redis_client:
            try:
                cached_data = self.redis_client.get(f"origin_calc:{cache_key}")
                if cached_data:
                    logger.info(f"Cache hit (Redis): {cache_key}")
                    return CalculationResult.parse_raw(cached_data)
            except Exception as e:
                logger.warning(f"Redis cache error: {e}")
        
        logger.info(f"Cache miss: {cache_key}")
        return None
    
    def set(self, product: Product, trade_agreement: str, result: CalculationResult) -> None:
        """Set a calculation result in the cache."""
        if not ENABLE_CACHING:
            return
        
        cache_key = self._generate_cache_key(product, trade_agreement)
        
        # Set in memory cache
        self.memory_cache[cache_key] = result
        
        # Set in Redis cache if available
        if self.redis_client:
            try:
                self.redis_client.setex(
                    f"origin_calc:{cache_key}",
                    CACHE_TTL,
                    result.json()
                )
            except Exception as e:
                logger.warning(f"Redis cache error: {e}")

# Initialize cache
calculation_cache = CalculationCache()

# LLM initialization
def get_llm(industry: Optional[str] = None) -> BaseChatModel:
    """Get the appropriate LLM based on the industry."""
    model_name = INDUSTRY_MODELS.get(industry, MODEL_NAME) if industry else MODEL_NAME
    
    return ChatOpenAI(
        model=model_name,
        temperature=0.1,
        streaming=False
    )

# Graph node implementations
async def initialize(state: CalculationState) -> Dict[str, Any]:
    """Initialize the calculation and check cache."""
    logger.info(f"Initializing calculation for {state.product.name}")
    
    # Check cache
    cached_result = calculation_cache.get(state.product, state.trade_agreement)
    if cached_result:
        # Calculate the time saved by using the cache
        calculation_time = cached_result.calculation_time
        
        return {
            "component_analyses": cached_result.component_analyses,
            "manufacturing_analysis": cached_result.manufacturing_analysis,
            "origin_determination": cached_result.origin_determination,
            "preferential_status": cached_result.preferential_status,
            "calculation_time": calculation_time,
            "cache_hit": True
        }
    
    # Determine if an industry-specific model should be used
    industry = state.product.industry
    if industry and industry in INDUSTRY_MODELS:
        logger.info(f"Using industry-specific model for {industry}")
        return {"industry_specific_model_used": industry}
    
    return {}

async def analyze_components(state: CalculationState) -> Dict[str, Any]:
    """Analyze the components of the product."""
    logger.info(f"Analyzing components for {state.product.name}")
    
    # Skip if we have a cache hit
    if state.cache_hit:
        return {}
    
    # Get the appropriate LLM
    llm = get_llm(state.industry_specific_model_used)
    
    # Create a prompt for component analysis
    component_prompt = ChatPromptTemplate.from_messages([
        SystemMessage(content="""You are an expert in international trade compliance and origin determination.
        Analyze each component of the product to determine its origin status and preferential eligibility.
        Consider the HS code, value contribution, and origin country of each component.
        Provide detailed reasoning for your analysis."""),
        HumanMessage(content="""
        Product: {product_name}
        HS Code: {product_hs_code}
        Trade Agreement: {trade_agreement}
        
        Components:
        {components}
        
        Analyze each component and provide:
        1. Origin country
        2. Value contribution and percentage
        3. Origin status
        4. Preferential eligibility under the trade agreement
        5. Detailed reasoning
        
        Format your response as a structured list of component analyses.
        """)
    ])
    
    # Create a parser for the component analysis
    component_parser = PydanticOutputParser(pydantic_object=List[ComponentAnalysis])
    
    # Prepare the components for the prompt
    components_text = "\n".join([
        f"- {c.name}: Origin: {c.origin}, Value: {c.value}, HS Code: {c.hs_code}" 
        for c in state.product.components
    ])
    
    # Calculate total value for percentage calculations
    total_value = state.product.total_value or sum(c.value for c in state.product.components) + state.product.manufacturing.value_added
    
    # Process components in parallel if enabled
    if ENABLE_PARALLEL_PROCESSING and len(state.product.components) > 1:
        logger.info(f"Processing {len(state.product.components)} components in parallel")
        
        async def process_component(component: Component) -> ComponentAnalysis:
            # Calculate value percentage
            value_percentage = (component.value / total_value) * 100
            
            # Create component-specific prompt
            component_specific_prompt = ChatPromptTemplate.from_messages([
                SystemMessage(content="""You are an expert in international trade compliance and origin determination.
                Analyze this component to determine its origin status and preferential eligibility.
                Consider the HS code, value contribution, and origin country.
                Provide detailed reasoning for your analysis."""),
                HumanMessage(content=f"""
                Product: {state.product.name}
                Product HS Code: {state.product.hs_code}
                Trade Agreement: {state.trade_agreement}
                
                Component: {component.name}
                Origin: {component.origin}
                Value: {component.value} ({value_percentage:.2f}% of total)
                HS Code: {component.hs_code}
                
                Analyze this component and provide:
                1. Origin status
                2. Preferential eligibility under the trade agreement
                3. Detailed reasoning
                """)
            ])
            
            # Get response from LLM
            response = await llm.ainvoke(component_specific_prompt.format_messages())
            
            # Parse the response
            try:
                # Create a ComponentAnalysis object
                return ComponentAnalysis(
                    component_name=component.name,
                    origin_country=component.origin,
                    hs_code=component.hs_code,
                    value_contribution=component.value,
                    value_percentage=value_percentage,
                    origin_status=response.content.split("Origin status:")[1].split("\n")[0].strip(),
                    preferential_eligibility="eligible" in response.content.lower() or "qualifies" in response.content.lower(),
                    reasoning=response.content
                )
            except Exception as e:
                logger.error(f"Error parsing component analysis: {e}")
                return ComponentAnalysis(
                    component_name=component.name,
                    origin_country=component.origin,
                    hs_code=component.hs_code,
                    value_contribution=component.value,
                    value_percentage=value_percentage,
                    origin_status="Unknown",
                    preferential_eligibility=False,
                    reasoning=f"Error analyzing component: {e}"
                )
        
        # Process all components in parallel
        tasks = [process_component(component) for component in state.product.components]
        component_analyses = await asyncio.gather(*tasks)
        
    else:
        # Process components sequentially
        logger.info("Processing components sequentially")
        
        # Format the prompt
        formatted_prompt = component_prompt.format_messages(
            product_name=state.product.name,
            product_hs_code=state.product.hs_code,
            trade_agreement=state.trade_agreement,
            components=components_text
        )
        
        # Get response from LLM
        response = await llm.ainvoke(formatted_prompt)
        
        # Parse the response
        try:
            component_analyses = component_parser.parse(response.content)
        except Exception as e:
            logger.error(f"Error parsing component analyses: {e}")
            
            # Fallback: create basic analyses
            component_analyses = []
            for component in state.product.components:
                value_percentage = (component.value / total_value) * 100
                component_analyses.append(
                    ComponentAnalysis(
                        component_name=component.name,
                        origin_country=component.origin,
                        hs_code=component.hs_code,
                        value_contribution=component.value,
                        value_percentage=value_percentage,
                        origin_status="Unknown",
                        preferential_eligibility=False,
                        reasoning=f"Error analyzing component: {e}"
                    )
                )
    
    return {"component_analyses": component_analyses}

async def analyze_manufacturing(state: CalculationState) -> Dict[str, Any]:
    """Analyze the manufacturing processes of the product."""
    logger.info(f"Analyzing manufacturing for {state.product.name}")
    
    # Skip if we have a cache hit
    if state.cache_hit:
        return {}
    
    # Get the appropriate LLM
    llm = get_llm(state.industry_specific_model_used)
    
    # Create a prompt for manufacturing analysis
    manufacturing_prompt = ChatPromptTemplate.from_messages([
        SystemMessage(content="""You are an expert in international trade compliance and origin determination.
        Analyze the manufacturing processes to determine if they constitute substantial transformation.
        Consider the location, processes, and value added.
        Identify qualifying and non-qualifying processes under the trade agreement.
        Provide detailed reasoning for your analysis."""),
        HumanMessage(content="""
        Product: {product_name}
        HS Code: {product_hs_code}
        Trade Agreement: {trade_agreement}
        
        Manufacturing:
        Location: {manufacturing_location}
        Processes: {manufacturing_processes}
        Value Added: {manufacturing_value_added} ({value_added_percentage:.2f}% of total)
        
        Analyze the manufacturing processes and provide:
        1. Whether they constitute substantial transformation
        2. Qualifying processes under the trade agreement
        3. Non-qualifying processes under the trade agreement
        4. Detailed reasoning
        """)
    ])
    
    # Calculate total value for percentage calculations
    total_value = state.product.total_value or sum(c.value for c in state.product.components) + state.product.manufacturing.value_added
    value_added_percentage = (state.product.manufacturing.value_added / total_value) * 100
    
    # Format the prompt
    formatted_prompt = manufacturing_prompt.format_messages(
        product_name=state.product.name,
        product_hs_code=state.product.hs_code,
        trade_agreement=state.trade_agreement,
        manufacturing_location=state.product.manufacturing.location,
        manufacturing_processes=", ".join(state.product.manufacturing.processes),
        manufacturing_value_added=state.product.manufacturing.value_added,
        value_added_percentage=value_added_percentage
    )
    
    # Get response from LLM
    response = await llm.ainvoke(formatted_prompt)
    
    # Parse the response
    try:
        # Extract information from the response
        substantial_transformation = "substantial transformation" in response.content.lower() and "not" not in response.content.lower()
        
        # Extract qualifying processes
        qualifying_processes = []
        if "qualifying processes" in response.content.lower():
            qualifying_section = response.content.lower().split("qualifying processes")[1].split("non-qualifying processes")[0]
            for process in state.product.manufacturing.processes:
                if process.lower() in qualifying_section:
                    qualifying_processes.append(process)
        
        # Extract non-qualifying processes
        non_qualifying_processes = []
        if "non-qualifying processes" in response.content.lower():
            non_qualifying_section = response.content.lower().split("non-qualifying processes")[1].split("reasoning")[0]
            for process in state.product.manufacturing.processes:
                if process.lower() in non_qualifying_section:
                    non_qualifying_processes.append(process)
        
        # Create ManufacturingAnalysis object
        manufacturing_analysis = ManufacturingAnalysis(
            location=state.product.manufacturing.location,
            processes=state.product.manufacturing.processes,
            value_added=state.product.manufacturing.value_added,
            value_added_percentage=value_added_percentage,
            substantial_transformation=substantial_transformation,
            qualifying_processes=qualifying_processes,
            non_qualifying_processes=non_qualifying_processes,
            reasoning=response.content
        )
    except Exception as e:
        logger.error(f"Error parsing manufacturing analysis: {e}")
        manufacturing_analysis = ManufacturingAnalysis(
            location=state.product.manufacturing.location,
            processes=state.product.manufacturing.processes,
            value_added=state.product.manufacturing.value_added,
            value_added_percentage=value_added_percentage,
            substantial_transformation=False,
            qualifying_processes=[],
            non_qualifying_processes=[],
            reasoning=f"Error analyzing manufacturing: {e}"
        )
    
    return {"manufacturing_analysis": manufacturing_analysis}

async def determine_origin(state: CalculationState) -> Dict[str, Any]:
    """Determine the origin of the product."""
    logger.info(f"Determining origin for {state.product.name}")
    
    # Skip if we have a cache hit
    if state.cache_hit:
        return {}
    
    # Get the appropriate LLM
    llm = get_llm(state.industry_specific_model_used)
    
    # Create a prompt for origin determination
    origin_prompt = ChatPromptTemplate.from_messages([
        SystemMessage(content="""You are an expert in international trade compliance and origin determination.
        Determine the origin of the product based on the component analyses and manufacturing analysis.
        Consider the applicable rules of origin under the trade agreement.
        Provide a confidence score and detailed reasoning for your determination."""),
        HumanMessage(content="""
        Product: {product_name}
        HS Code: {product_hs_code}
        Trade Agreement: {trade_agreement}
        
        Component Analyses:
        {component_analyses}
        
        Manufacturing Analysis:
        {manufacturing_analysis}
        
        Determine the origin of the product and provide:
        1. The determined origin country
        2. The determination method (e.g., substantial transformation, regional value content)
        3. Confidence score (0-100%)
        4. Applicable rules of origin
        5. Detailed reasoning
        """)
    ])
    
    # Format component analyses for the prompt
    component_analyses_text = "\n".join([
        f"- {ca.component_name}: Origin: {ca.origin_country}, Value: {ca.value_contribution} ({ca.value_percentage:.2f}%), Status: {ca.origin_status}"
        for ca in state.component_analyses
    ])
    
    # Format manufacturing analysis for the prompt
    manufacturing_analysis_text = f"""
    Location: {state.manufacturing_analysis.location}
    Value Added: {state.manufacturing_analysis.value_added} ({state.manufacturing_analysis.value_added_percentage:.2f}%)
    Substantial Transformation: {"Yes" if state.manufacturing_analysis.substantial_transformation else "No"}
    Qualifying Processes: {", ".join(state.manufacturing_analysis.qualifying_processes)}
    Non-Qualifying Processes: {", ".join(state.manufacturing_analysis.non_qualifying_processes)}
    """
    
    # Format the prompt
    formatted_prompt = origin_prompt.format_messages(
        product_name=state.product.name,
        product_hs_code=state.product.hs_code,
        trade_agreement=state.trade_agreement,
        component_analyses=component_analyses_text,
        manufacturing_analysis=manufacturing_analysis_text
    )
    
    # Get response from LLM
    response = await llm.ainvoke(formatted_prompt)
    
    # Parse the response
    try:
        # Extract information from the response
        origin_country = None
        determination_method = None
        confidence_score = 0.0
        applicable_rules = []
        
        # Extract origin country
        if "origin country" in response.content.lower() or "determined origin" in response.content.lower():
            for line in response.content.split("\n"):
                if "origin country" in line.lower() or "determined origin" in line.lower():
                    origin_country = line.split(":")[-1].strip()
                    break
        
        # Extract determination method
        if "determination method" in response.content.lower():
            for line in response.content.split("\n"):
                if "determination method" in line.lower():
                    determination_method = line.split(":")[-1].strip()
                    break
        
        # Extract confidence score
        if "confidence score" in response.content.lower():
            for line in response.content.split("\n"):
                if "confidence score" in line.lower():
                    score_text = line.split(":")[-1].strip()
                    # Extract numeric value
                    import re
                    match = re.search(r'(\d+)', score_text)
                    if match:
                        confidence_score = float(match.group(1))
                        # Convert to 0-1 scale if necessary
                        if confidence_score > 1:
                            confidence_score /= 100
                    break
        
        # Extract applicable rules
        if "applicable rules" in response.content.lower():
            rules_section = response.content.lower().split("applicable rules")[1].split("reasoning")[0]
            # Extract rules as a list
            rules_list = [rule.strip() for rule in rules_section.split("-") if rule.strip()]
            if not rules_list:  # If splitting by dash didn't work, try by newline
                rules_list = [rule.strip() for rule in rules_section.split("\n") if rule.strip()]
            applicable_rules = rules_list
        
        # If we couldn't extract the origin country, use the manufacturing location as a fallback
        if not origin_country:
            origin_country = state.manufacturing_analysis.location
        
        # If we couldn't extract the determination method, use a default
        if not determination_method:
            determination_method = "Combined analysis"
        
        # Create OriginDetermination object
        origin_determination = OriginDetermination(
            determined_origin=origin_country,
            determination_method=determination_method,
            confidence_score=confidence_score,
            applicable_rules=applicable_rules,
            reasoning=response.content
        )
    except Exception as e:
        logger.error(f"Error parsing origin determination: {e}")
        origin_determination = OriginDetermination(
            determined_origin=state.manufacturing_analysis.location,  # Fallback to manufacturing location
            determination_method="Error in determination",
            confidence_score=0.0,
            applicable_rules=[],
            reasoning=f"Error determining origin: {e}"
        )
    
    return {"origin_determination": origin_determination}

async def verify_preferential_status(state: CalculationState) -> Dict[str, Any]:
    """Verify the preferential status of the product under the trade agreement."""
    logger.info(f"Verifying preferential status for {state.product.name}")
    
    # Skip if we have a cache hit
    if state.cache_hit:
        return {}
    
    # Get the appropriate LLM
    llm = get_llm(state.industry_specific_model_used)
    
    # Create a prompt for preferential status verification
    preferential_prompt = ChatPromptTemplate.from_messages([
        SystemMessage(content="""You are an expert in international trade compliance and preferential origin determination.
        Verify the preferential status of the product under the specified trade agreement.
        Consider the origin determination, component analyses, and manufacturing analysis.
        Identify the qualifying rules and required documentation.
        Provide detailed reasoning for your verification."""),
        HumanMessage(content="""
        Product: {product_name}
        HS Code: {product_hs_code}
        Trade Agreement: {trade_agreement}
        
        Origin Determination:
        {origin_determination}
        
        Component Analyses:
        {component_analyses}
        
        Manufacturing Analysis:
        {manufacturing_analysis}
        
        Verify the preferential status and provide:
        1. Whether the product qualifies for preferential treatment
        2. The qualifying rules under the trade agreement
        3. Required documentation for preferential treatment
        4. Detailed reasoning
        """)
    ])
    
    # Format origin determination for the prompt
    origin_determination_text = f"""
    Determined Origin: {state.origin_determination.determined_origin}
    Determination Method: {state.origin_determination.determination_method}
    Confidence Score: {state.origin_determination.confidence_score * 100:.2f}%
    Applicable Rules: {", ".join(state.origin_determination.applicable_rules)}
    """
    
    # Format component analyses for the prompt
    component_analyses_text = "\n".join([
        f"- {ca.component_name}: Origin: {ca.origin_country}, Value: {ca.value_contribution} ({ca.value_percentage:.2f}%), Status: {ca.origin_status}"
        for ca in state.component_analyses
    ])
    
    # Format manufacturing analysis for the prompt
    manufacturing_analysis_text = f"""
    Location: {state.manufacturing_analysis.location}
    Value Added: {state.manufacturing_analysis.value_added} ({state.manufacturing_analysis.value_added_percentage:.2f}%)
    Substantial Transformation: {"Yes" if state.manufacturing_analysis.substantial_transformation else "No"}
    Qualifying Processes: {", ".join(state.manufacturing_analysis.qualifying_processes)}
    Non-Qualifying Processes: {", ".join(state.manufacturing_analysis.non_qualifying_processes)}
    """
    
    # Format the prompt
    formatted_prompt = preferential_prompt.format_messages(
        product_name=state.product.name,
        product_hs_code=state.product.hs_code,
        trade_agreement=state.trade_agreement,
        origin_determination=origin_determination_text,
        component_analyses=component_analyses_text,
        manufacturing_analysis=manufacturing_analysis_text
    )
    
    # Get response from LLM
    response = await llm.ainvoke(formatted_prompt)
    
    # Parse the response
    try:
        # Extract information from the response
        preferential_status_value = False
        qualifying_rules = []
        documentation_required = []
        
        # Extract preferential status
        if "preferential treatment" in response.content.lower() or "preferential status" in response.content.lower():
            preferential_status_value = (
                "qualifies" in response.content.lower() or 
                "eligible" in response.content.lower()
            ) and not (
                "not qualify" in response.content.lower() or 
                "not eligible" in response.content.lower() or
                "does not qualify" in response.content.lower() or
                "is not eligible" in response.content.lower()
            )
        
        # Extract qualifying rules
        if "qualifying rules" in response.content.lower():
            rules_section = response.content.lower().split("qualifying rules")[1].split("required documentation")[0]
            # Extract rules as a list
            rules_list = [rule.strip() for rule in rules_section.split("-") if rule.strip()]
            if not rules_list:  # If splitting by dash didn't work, try by newline
                rules_list = [rule.strip() for rule in rules_section.split("\n") if rule.strip()]
            qualifying_rules = rules_list
        
        # Extract required documentation
        if "required documentation" in response.content.lower():
            docs_section = response.content.lower().split("required documentation")[1].split("reasoning")[0]
            # Extract documentation as a list
            docs_list = [doc.strip() for doc in docs_section.split("-") if doc.strip()]
            if not docs_list:  # If splitting by dash didn't work, try by newline
                docs_list = [doc.strip() for doc in docs_section.split("\n") if doc.strip()]
            documentation_required = docs_list
        
        # Create PreferentialStatus object
        preferential_status = PreferentialStatus(
            trade_agreement=state.trade_agreement,
            preferential_status=preferential_status_value,
            qualifying_rules=qualifying_rules,
            documentation_required=documentation_required,
            reasoning=response.content
        )
    except Exception as e:
        logger.error(f"Error parsing preferential status: {e}")
        preferential_status = PreferentialStatus(
            trade_agreement=state.trade_agreement,
            preferential_status=False,
            qualifying_rules=[],
            documentation_required=[],
            reasoning=f"Error verifying preferential status: {e}"
        )
    
    # Calculate the total calculation time
    calculation_time = time.time() - state.start_time
    
    # Create the final result for caching
    result = CalculationResult(
        product_name=state.product.name,
        hs_code=state.product.hs_code,
        component_analyses=state.component_analyses,
        manufacturing_analysis=state.manufacturing_analysis,
        origin_determination=state.origin_determination,
        preferential_status=preferential_status,
        calculation_time=calculation_time,
        timestamp=datetime.now()
    )
    
    # Cache the result
    calculation_cache.set(state.product, state.trade_agreement, result)
    
    return {
        "preferential_status": preferential_status,
        "calculation_time": calculation_time
    }

async def handle_error(state: CalculationState) -> Dict[str, Any]:
    """Handle errors in the calculation."""
    logger.error(f"Error in calculation for {state.product.name}: {state.error}")
    
    # Calculate the calculation time
    calculation_time = time.time() - state.start_time
    
    return {"calculation_time": calculation_time}

# Define the state graph
def create_graph() -> StateGraph:
    """Create the state graph for the origin calculation."""
    # Create a workflow builder
    workflow = StateGraph(CalculationState)
    
    # Add nodes to the graph
    workflow.add_node(CalculationStep.INITIALIZE, initialize)
    workflow.add_node(CalculationStep.ANALYZE_COMPONENTS, analyze_components)
    workflow.add_node(CalculationStep.ANALYZE_MANUFACTURING, analyze_manufacturing)
    workflow.add_node(CalculationStep.DETERMINE_ORIGIN, determine_origin)
    workflow.add_node(CalculationStep.VERIFY_PREFERENTIAL_STATUS, verify_preferential_status)
    workflow.add_node(CalculationStep.ERROR, handle_error)
    
    # Define the edges
    workflow.add_edge(CalculationStep.INITIALIZE, CalculationStep.ANALYZE_COMPONENTS)
    workflow.add_edge(CalculationStep.ANALYZE_COMPONENTS, CalculationStep.ANALYZE_MANUFACTURING)
    workflow.add_edge(CalculationStep.ANALYZE_MANUFACTURING, CalculationStep.DETERMINE_ORIGIN)
    workflow.add_edge(CalculationStep.DETERMINE_ORIGIN, CalculationStep.VERIFY_PREFERENTIAL_STATUS)
    workflow.add_edge(CalculationStep.VERIFY_PREFERENTIAL_STATUS, END)
    
    # Add conditional edges
    workflow.add_conditional_edges(
        CalculationStep.INITIALIZE,
        lambda state: CalculationStep.VERIFY_PREFERENTIAL_STATUS if state.cache_hit else CalculationStep.ANALYZE_COMPONENTS
    )
    
    # Set the entry point
    workflow.set_entry_point(CalculationStep.INITIALIZE)
    
    # Compile the graph
    return workflow.compile()

# Create a checkpoint saver
def create_checkpoint_saver():
    """Create a checkpoint saver based on configuration."""
    if CHECKPOINT_PERSISTENCE and REDIS_URL:
        try:
            return RedisSaver(REDIS_URL, ttl=CACHE_TTL)
        except Exception as e:
            logger.warning(f"Failed to create Redis checkpoint saver: {e}")
            return MemorySaver()
    else:
        return MemorySaver()

# Create the graph with checkpointing
graph = create_graph()
checkpoint_saver = create_checkpoint_saver()
graph_with_checkpointing = graph.with_checkpointer(checkpoint_saver)

# Main calculation function
async def calculate_origin(
    product: Product,
    trade_agreement: str,
    thread_id: Optional[str] = None
) -> CalculationResult:
    """Calculate the origin and preferential status of a product."""
    logger.info(f"Starting origin calculation for {product.name}")
    
    # Create the initial state
    state = CalculationState(
        product=product,
        trade_agreement=trade_agreement,
        start_time=time.time()
    )
    
    try:
        # Run the graph
        result = await graph_with_checkpointing.ainvoke(state, {"configurable": {"thread_id": thread_id}})
        
        # Create the calculation result
        calculation_result = CalculationResult(
            product_name=product.name,
            hs_code=product.hs_code,
            component_analyses=result.component_analyses,
            manufacturing_analysis=result.manufacturing_analysis,
            origin_determination=result.origin_determination,
            preferential_status=result.preferential_status,
            calculation_time=result.calculation_time,
            timestamp=datetime.now()
        )
        
        logger.info(f"Completed origin calculation for {product.name} in {result.calculation_time:.2f} seconds")
        return calculation_result
    
    except Exception as e:
        logger.error(f"Error in origin calculation: {e}")
        raise
