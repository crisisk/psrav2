# LangGraph-powered Origin Calculation Engine for PSRA

## Overview

This document outlines the detailed implementation plan for the LangGraph-powered Origin Calculation Engine for the PSRA-LTSD (Preferential Rules of Origin - Long-Term Supplier Declaration) service. This engine will provide high-performance, accurate calculations of product origin based on complex trade rules and supplier declarations.

## Business Context

Preferential origin determination is a critical component in international trade, allowing companies to benefit from reduced or zero tariffs under Free Trade Agreements (FTAs). The calculation process involves complex rules that vary by product, country, and trade agreement. The current implementation likely suffers from:

1. Performance issues with complex calculations
2. Difficulty handling edge cases and rule exceptions
3. Limited ability to explain calculation results
4. Challenges in keeping up with changing trade regulations

The LangGraph-powered Origin Calculation Engine aims to solve these issues by combining structured rule-based calculations with AI reasoning capabilities.

## Technical Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  PSRA-LTSD Application                          │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                Origin Calculation Engine API                    │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                │                               │
                ▼                               ▼
┌───────────────────────────┐   ┌───────────────────────────────┐
│  Rule-Based Calculator    │   │  LangGraph Reasoning Engine   │
│  (Fast Path)              │   │  (Complex Cases)              │
└───────────────┬───────────┘   └───────────────┬───────────────┘
                │                               │
                ▼                               ▼
┌───────────────────────────┐   ┌───────────────────────────────┐
│  Rules Database           │   │  LLM (OpenAI or Local)        │
└───────────────────────────┘   └───────────────────────────────┘
```

### Components

1. **Origin Calculation Engine API**:
   - RESTful API for origin calculation requests
   - Request validation and preprocessing
   - Result caching and optimization
   - Response formatting and explanation generation

2. **Rule-Based Calculator (Fast Path)**:
   - Handles standard cases with deterministic rules
   - Implements common FTA rules (value content, tariff shift, etc.)
   - Optimized for sub-2 second performance
   - Falls back to LangGraph for complex cases

3. **LangGraph Reasoning Engine**:
   - Handles complex cases requiring reasoning
   - Implements multi-step reasoning workflows
   - Provides detailed explanation of calculation steps
   - Integrates with Rule-Based Calculator for hybrid calculations

4. **Rules Database**:
   - Stores FTA rules, product classifications, and country-specific regulations
   - Versioned to handle historical calculations
   - Regularly updated with new trade regulations

5. **LLM Integration**:
   - OpenAI API integration for production
   - Option for local LLM deployment (Llama 3, Mistral) for data sovereignty

## LangGraph Implementation

### Graph Structure

```python
@define
class OriginState:
    """State for the origin calculation graph."""
    # Input data
    product_data: dict  # Product details (HS code, description, components)
    supplier_declarations: list  # List of supplier declarations
    trade_agreement: str  # Target trade agreement
    
    # Calculation state
    calculation_steps: list = field(factory=list)  # List of calculation steps
    current_step: str = "initialize"  # Current step in the calculation
    
    # Results
    origin_country: Optional[str] = None  # Determined origin country
    origin_criteria: Optional[str] = None  # Origin criteria met
    confidence: float = 0.0  # Confidence in the calculation
    explanation: Optional[str] = None  # Explanation of the calculation
```

### Node Functions

```python
def initialize(state: OriginState) -> Literal["fast_path", "complex_path"]:
    """Initialize the calculation and determine the path."""
    # Check if this is a standard case that can be handled by the fast path
    if is_standard_case(state.product_data, state.trade_agreement):
        return "fast_path"
    else:
        return "complex_path"

def fast_path_calculation(state: OriginState) -> Literal["determine_result"]:
    """Perform fast path calculation using rule-based engine."""
    # Apply deterministic rules
    result = apply_rules(
        state.product_data,
        state.supplier_declarations,
        state.trade_agreement
    )
    
    state.calculation_steps.append({
        "step": "fast_path",
        "details": result["details"]
    })
    
    state.origin_country = result["origin_country"]
    state.origin_criteria = result["origin_criteria"]
    state.confidence = result["confidence"]
    
    return "determine_result"

def complex_path_calculation(state: OriginState) -> Literal["determine_result"]:
    """Perform complex path calculation using LLM reasoning."""
    # Prepare context for LLM
    context = prepare_llm_context(
        state.product_data,
        state.supplier_declarations,
        state.trade_agreement
    )
    
    # Call LLM for reasoning
    llm_result = call_llm_with_reasoning(context)
    
    state.calculation_steps.append({
        "step": "complex_path",
        "details": llm_result["reasoning_steps"]
    })
    
    state.origin_country = llm_result["origin_country"]
    state.origin_criteria = llm_result["origin_criteria"]
    state.confidence = llm_result["confidence"]
    
    return "determine_result"

def determine_result(state: OriginState) -> Literal["generate_explanation", "verification"]:
    """Determine if the result needs verification."""
    if state.confidence < 0.8:
        return "verification"
    else:
        return "generate_explanation"

def verification(state: OriginState) -> Literal["generate_explanation"]:
    """Verify the calculation result for low-confidence cases."""
    # Apply additional verification steps
    verification_result = verify_calculation(
        state.product_data,
        state.supplier_declarations,
        state.trade_agreement,
        state.origin_country,
        state.origin_criteria
    )
    
    state.calculation_steps.append({
        "step": "verification",
        "details": verification_result["details"]
    })
    
    # Update confidence based on verification
    state.confidence = verification_result["confidence"]
    
    return "generate_explanation"

def generate_explanation(state: OriginState) -> Literal["end"]:
    """Generate a human-readable explanation of the calculation."""
    explanation = generate_human_readable_explanation(
        state.product_data,
        state.supplier_declarations,
        state.trade_agreement,
        state.origin_country,
        state.origin_criteria,
        state.calculation_steps
    )
    
    state.explanation = explanation
    
    return "end"
```

### Graph Definition

```python
def build_origin_calculation_graph():
    """Build the origin calculation graph."""
    # Define the nodes
    nodes = {
        "initialize": initialize,
        "fast_path_calculation": fast_path_calculation,
        "complex_path_calculation": complex_path_calculation,
        "determine_result": determine_result,
        "verification": verification,
        "generate_explanation": generate_explanation,
    }
    
    # Define the edges
    edges = {
        "initialize": {
            "fast_path": "fast_path_calculation",
            "complex_path": "complex_path_calculation",
        },
        "fast_path_calculation": "determine_result",
        "complex_path_calculation": "determine_result",
        "determine_result": {
            "generate_explanation": "generate_explanation",
            "verification": "verification",
        },
        "verification": "generate_explanation",
        "generate_explanation": "end",
    }
    
    # Build the graph
    return StateGraph(nodes=nodes, edges=edges)
```

## Implementation Plan

### Phase 1: Foundation (Weeks 1-2)

1. **Setup Development Environment**
   - Create Python project structure
   - Set up virtual environment and dependencies
   - Configure development tools (linting, testing)

2. **Implement Core Data Models**
   - Define product data model
   - Define supplier declaration model
   - Define calculation result model

3. **Implement Rule-Based Calculator**
   - Implement basic rule types (value content, tariff shift)
   - Create rule application engine
   - Implement rule database interface

4. **Create API Foundation**
   - Define API endpoints
   - Implement request validation
   - Set up basic response formatting

### Phase 2: LangGraph Integration (Weeks 3-4)

1. **Set Up LangGraph Framework**
   - Install and configure LangGraph
   - Create basic graph structure
   - Implement state management

2. **Implement Node Functions**
   - Implement initialization logic
   - Create fast path integration
   - Develop complex path reasoning

3. **Develop LLM Integration**
   - Create LLM prompt templates
   - Implement context preparation
   - Set up result parsing

4. **Implement Verification Logic**
   - Create verification strategies
   - Implement confidence scoring
   - Develop fallback mechanisms

### Phase 3: Optimization and Testing (Weeks 5-6)

1. **Performance Optimization**
   - Implement caching strategies
   - Optimize rule application
   - Tune LLM prompts for efficiency

2. **Comprehensive Testing**
   - Create unit tests for all components
   - Develop integration tests
   - Perform performance benchmarking

3. **Edge Case Handling**
   - Identify and document edge cases
   - Implement special case handlers
   - Test with complex scenarios

4. **Documentation**
   - Create API documentation
   - Document calculation logic
   - Prepare user guides

### Phase 4: Integration and Deployment (Weeks 7-8)

1. **PSRA-LTSD Integration**
   - Integrate with PSRA-LTSD API
   - Implement authentication and authorization
   - Create service interfaces

2. **Deployment Configuration**
   - Create Docker configuration
   - Set up monitoring and logging
   - Configure scaling parameters

3. **Production Deployment**
   - Deploy to staging environment
   - Perform load testing
   - Deploy to production

4. **Post-Deployment Validation**
   - Monitor performance metrics
   - Validate calculation accuracy
   - Collect user feedback

## Technical Requirements

### Performance Requirements

- **Response Time**: Sub-2 second performance for standard calculations
- **Throughput**: Support for at least 100 calculations per minute
- **Scalability**: Horizontal scaling capability for increased load

### Integration Requirements

- **API**: RESTful API with OpenAPI specification
- **Authentication**: OAuth2 integration with Keycloak
- **Logging**: Structured logging with correlation IDs
- **Monitoring**: Prometheus metrics for performance monitoring

### Security Requirements

- **Data Protection**: Encryption of sensitive data
- **Access Control**: Role-based access control
- **Audit Trail**: Logging of all calculation requests and results

## Implementation Details

### API Endpoints

```
POST /api/v1/origin/calculate
GET /api/v1/origin/calculation/{id}
GET /api/v1/origin/rules/{trade_agreement}
```

### Example Request

```json
{
  "product": {
    "hs_code": "8708.99",
    "description": "Automotive brake assembly",
    "components": [
      {
        "hs_code": "7320.20",
        "description": "Helical springs",
        "value": 25.0,
        "origin_country": "DE"
      },
      {
        "hs_code": "8708.30",
        "description": "Brake pads",
        "value": 40.0,
        "origin_country": "CN"
      },
      {
        "hs_code": "7616.99",
        "description": "Aluminum housing",
        "value": 35.0,
        "origin_country": "US"
      }
    ],
    "manufacturing_country": "NL",
    "ex_works_price": 150.0
  },
  "supplier_declarations": [
    {
      "supplier_id": "SUP123",
      "component_hs_code": "7320.20",
      "origin_status": "EU",
      "valid_from": "2023-01-01",
      "valid_to": "2023-12-31"
    }
  ],
  "trade_agreement": "EU-UK"
}
```

### Example Response

```json
{
  "calculation_id": "calc-123456",
  "product": {
    "hs_code": "8708.99",
    "description": "Automotive brake assembly"
  },
  "result": {
    "origin_country": "EU",
    "origin_criteria": "Value Content",
    "confidence": 0.95,
    "explanation": "The product qualifies as EU origin under the EU-UK Trade Agreement based on the Value Content rule. The non-originating materials (CN brake pads) constitute 26.7% of the ex-works price, which is below the 45% threshold specified in the agreement."
  },
  "calculation_steps": [
    {
      "step": "fast_path",
      "rule_type": "Value Content",
      "details": {
        "ex_works_price": 150.0,
        "non_originating_value": 40.0,
        "non_originating_percentage": 26.7,
        "threshold": 45.0,
        "result": "PASS"
      }
    }
  ],
  "timestamp": "2023-06-15T14:32:10Z"
}
```

## Code Samples

### Fast Path Rule Application

```python
def apply_value_content_rule(product_data, supplier_declarations, rule_config):
    """Apply the value content rule to determine origin."""
    # Calculate ex-works price
    ex_works_price = product_data["ex_works_price"]
    
    # Calculate non-originating value
    non_originating_value = 0.0
    for component in product_data["components"]:
        # Check if component has a supplier declaration
        has_declaration = any(
            sd["component_hs_code"] == component["hs_code"]
            for sd in supplier_declarations
        )
        
        # If no declaration and not from manufacturing country, consider non-originating
        if not has_declaration and component["origin_country"] != product_data["manufacturing_country"]:
            non_originating_value += component["value"]
    
    # Calculate percentage
    non_originating_percentage = (non_originating_value / ex_works_price) * 100
    
    # Check against threshold
    threshold = rule_config["threshold"]
    result = "PASS" if non_originating_percentage <= threshold else "FAIL"
    
    return {
        "origin_country": product_data["manufacturing_country"] if result == "PASS" else None,
        "origin_criteria": "Value Content" if result == "PASS" else None,
        "confidence": 0.95 if result == "PASS" else 0.9,
        "details": {
            "ex_works_price": ex_works_price,
            "non_originating_value": non_originating_value,
            "non_originating_percentage": round(non_originating_percentage, 1),
            "threshold": threshold,
            "result": result
        }
    }
```

### LLM Reasoning Integration

```python
def call_llm_with_reasoning(context):
    """Call LLM for complex origin reasoning."""
    # Prepare the prompt
    prompt = f"""
    You are an expert in international trade and preferential origin determination.
    
    Product Information:
    - HS Code: {context['product']['hs_code']}
    - Description: {context['product']['description']}
    - Manufacturing Country: {context['product']['manufacturing_country']}
    - Ex-Works Price: {context['product']['ex_works_price']}
    
    Components:
    {format_components(context['product']['components'])}
    
    Supplier Declarations:
    {format_supplier_declarations(context['supplier_declarations'])}
    
    Trade Agreement: {context['trade_agreement']}
    
    Rules of Origin for this HS code under the trade agreement:
    {format_rules(context['rules'])}
    
    Task: Determine if the product qualifies for preferential origin under the trade agreement.
    
    Please follow these steps:
    1. Analyze the applicable rules for this product
    2. Evaluate each component's origin status
    3. Apply the relevant rule(s) step by step
    4. Determine the final origin status
    5. Provide your confidence level in the determination
    
    Format your response as follows:
    
    Reasoning Steps:
    [Detailed step-by-step reasoning]
    
    Origin Country: [Country code or 'NON-ORIGINATING']
    Origin Criteria: [Rule type that was met, e.g., 'Value Content', 'Tariff Shift', etc.]
    Confidence: [Value between 0 and 1]
    """
    
    # Call the LLM
    response = call_llm(prompt)
    
    # Parse the response
    parsed_response = parse_llm_response(response)
    
    return parsed_response
```

### API Implementation

```python
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import uuid
import datetime

app = FastAPI(title="Origin Calculation Engine API")

# Initialize the LangGraph
origin_graph = build_origin_calculation_graph()

class Component(BaseModel):
    hs_code: str
    description: str
    value: float
    origin_country: str

class Product(BaseModel):
    hs_code: str
    description: str
    components: List[Component]
    manufacturing_country: str
    ex_works_price: float

class SupplierDeclaration(BaseModel):
    supplier_id: str
    component_hs_code: str
    origin_status: str
    valid_from: str
    valid_to: str

class CalculationRequest(BaseModel):
    product: Product
    supplier_declarations: List[SupplierDeclaration]
    trade_agreement: str

class CalculationResult(BaseModel):
    calculation_id: str
    product: dict
    result: dict
    calculation_steps: List[dict]
    timestamp: str

@app.post("/api/v1/origin/calculate", response_model=CalculationResult)
async def calculate_origin(request: CalculationRequest):
    try:
        # Initialize the state
        state = OriginState(
            product_data=request.product.dict(),
            supplier_declarations=[sd.dict() for sd in request.supplier_declarations],
            trade_agreement=request.trade_agreement
        )
        
        # Run the graph
        result = origin_graph.run(state)
        
        # Create the response
        calculation_id = f"calc-{uuid.uuid4().hex[:6]}"
        timestamp = datetime.datetime.now().isoformat()
        
        return CalculationResult(
            calculation_id=calculation_id,
            product={
                "hs_code": request.product.hs_code,
                "description": request.product.description
            },
            result={
                "origin_country": result.origin_country,
                "origin_criteria": result.origin_criteria,
                "confidence": result.confidence,
                "explanation": result.explanation
            },
            calculation_steps=result.calculation_steps,
            timestamp=timestamp
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Kubernetes Cluster                         │
│                                                                 │
│  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐│
│  │  API Service    │   │  Calculator     │   │  LangGraph      ││
│  │  (3+ replicas)  │   │  (3+ replicas)  │   │  (2+ replicas)  ││
│  └────────┬────────┘   └────────┬────────┘   └────────┬────────┘│
│           │                     │                     │         │
│  ┌────────┴─────────────────────┴─────────────────────┴────────┐│
│  │                      Redis Cache                            ││
│  └────────┬─────────────────────┬─────────────────────┬────────┘│
│           │                     │                     │         │
│  ┌────────┴────────┐   ┌────────┴────────┐   ┌───────┴────────┐│
│  │  Rules Database │   │  OpenAI API     │   │  Monitoring    ││
│  │  (PostgreSQL)   │   │  Integration    │   │  (Prometheus)  ││
│  └─────────────────┘   └─────────────────┘   └────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Monitoring and Metrics

### Key Performance Indicators

1. **Response Time**:
   - Average calculation time
   - 95th percentile calculation time
   - Time spent in each calculation step

2. **Throughput**:
   - Calculations per minute
   - Requests per second
   - Error rate

3. **Resource Usage**:
   - CPU usage per component
   - Memory usage per component
   - Network I/O

4. **Quality Metrics**:
   - Confidence distribution
   - Fast path vs. complex path ratio
   - Verification rate

### Prometheus Metrics

```python
from prometheus_client import Counter, Histogram, Gauge

# Counters
calculation_total = Counter(
    'origin_calculation_total',
    'Total number of origin calculations',
    ['trade_agreement', 'path']
)

calculation_errors = Counter(
    'origin_calculation_errors',
    'Total number of origin calculation errors',
    ['trade_agreement', 'error_type']
)

# Histograms
calculation_duration = Histogram(
    'origin_calculation_duration_seconds',
    'Duration of origin calculations in seconds',
    ['trade_agreement', 'path'],
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0]
)

# Gauges
confidence_gauge = Gauge(
    'origin_calculation_confidence',
    'Confidence level of origin calculations',
    ['trade_agreement']
)
```

## Conclusion

The LangGraph-powered Origin Calculation Engine represents a significant advancement in preferential origin determination for the PSRA-LTSD service. By combining rule-based calculations with AI reasoning capabilities, it will provide:

1. **High Performance**: Sub-2 second response time for standard calculations
2. **Accuracy**: Improved handling of complex cases and edge scenarios
3. **Explainability**: Detailed explanations of calculation steps and decisions
4. **Adaptability**: Easier updates for changing trade regulations

The implementation plan outlined in this document provides a clear roadmap for developing, testing, and deploying this engine, ensuring a successful integration with the PSRA-LTSD service.
