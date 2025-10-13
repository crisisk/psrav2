# LangGraph Origin Calculation Engine

## Overview

The LangGraph Origin Calculation Engine is a high-performance, AI-powered system designed to calculate the preferential origin of products based on complex trade rules and regulations. This document outlines the design and implementation of the engine, which will be integrated with the PSRA-LTSD service.

## Business Context

Preferential origin calculation is a critical component of international trade compliance. It determines whether a product qualifies for preferential tariff treatment under various trade agreements. The calculation involves complex rules of origin, which can vary significantly between different trade agreements and product categories.

Traditional rule-based systems for origin calculation have several limitations:

1. **Rigidity**: They cannot easily adapt to new trade agreements or rule changes.
2. **Complexity**: Rules of origin can be extremely complex and nuanced, making them difficult to encode in traditional rule engines.
3. **Performance**: Complex calculations can be slow, especially when dealing with large product catalogs or complex supply chains.
4. **Maintenance**: Keeping rule-based systems up-to-date with changing regulations requires significant ongoing effort.

The LangGraph Origin Calculation Engine addresses these limitations by leveraging AI and graph-based workflows to create a flexible, adaptable, and high-performance solution.

## Architecture

The LangGraph Origin Calculation Engine is built on the following key components:

1. **LangGraph**: A framework for building stateful, multi-step AI workflows using a graph-based approach.
2. **Large Language Models (LLMs)**: Powerful AI models that can understand and reason about complex rules and regulations.
3. **Vector Database**: For storing and retrieving relevant trade agreement rules and precedents.
4. **Redis**: For caching calculation results and managing workflow state.
5. **PostgreSQL**: For storing product data, calculation history, and audit trails.

### High-Level Architecture

```
                                  +-------------------+
                                  |                   |
                                  |   PSRA-LTSD API   |
                                  |                   |
                                  +--------+----------+
                                           |
                                           v
+----------------+              +----------+-----------+
|                |              |                      |
|  Trade Rules   +------------->+  LangGraph Origin    |
|  Database      |              |  Calculation Engine  |
|                |              |                      |
+----------------+              +----------+-----------+
                                           |
                                           v
+----------------+              +----------+-----------+
|                |              |                      |
|  Calculation   |<-------------+  Result Validation   |
|  History       |              |  & Audit Trail      |
|                |              |                      |
+----------------+              +---------------------+
```

## LangGraph Workflow

The LangGraph workflow for origin calculation consists of the following nodes:

1. **Input Validation**: Validates the input data and ensures all required fields are present.
2. **Rule Retrieval**: Retrieves the relevant rules of origin based on the product, country of origin, and destination country.
3. **Material Analysis**: Analyzes the materials and components used in the product to determine their origin and value.
4. **Value Calculation**: Calculates the value of non-originating materials and the ex-works price of the product.
5. **Rule Application**: Applies the rules of origin to determine if the product qualifies for preferential origin.
6. **Result Validation**: Validates the calculation result and ensures it is consistent with previous calculations.
7. **Explanation Generation**: Generates a human-readable explanation of the calculation result.
8. **Output Formatting**: Formats the output according to the API requirements.

### Workflow Graph

```
                       +-------------------+
                       |                   |
                       | Input Validation  |
                       |                   |
                       +--------+----------+
                                |
                                v
                       +--------+----------+
                       |                   |
                       |  Rule Retrieval   |
                       |                   |
                       +--------+----------+
                                |
                                v
                       +--------+----------+
                       |                   |
                       | Material Analysis |
                       |                   |
                       +--------+----------+
                                |
                                v
                       +--------+----------+
                       |                   |
                       | Value Calculation |
                       |                   |
                       +--------+----------+
                                |
                                v
                       +--------+----------+
                       |                   |
                       | Rule Application  |
                       |                   |
                       +--------+----------+
                                |
                                v
                       +--------+----------+
                       |                   |
                       | Result Validation |
                       |                   |
                       +--------+----------+
                                |
                                v
                       +--------+----------+
                       |                   |
                       |    Explanation    |
                       |    Generation     |
                       |                   |
                       +--------+----------+
                                |
                                v
                       +--------+----------+
                       |                   |
                       | Output Formatting |
                       |                   |
                       +--------+----------+
```

## Performance Optimization

To achieve the target performance of sub-2 second response time, the following optimizations will be implemented:

1. **Caching**: Frequently used calculation results will be cached in Redis.
2. **Parallel Processing**: Material analysis and value calculation will be performed in parallel.
3. **Model Optimization**: The LLM will be optimized for low-latency inference.
4. **Vector Search Optimization**: The vector database will be optimized for fast retrieval of relevant rules.
5. **Incremental Calculation**: Only changed components will be recalculated when a product is modified.
6. **Batch Processing**: Multiple origin calculations can be batched together for improved throughput.

## API Endpoints

The LangGraph Origin Calculation Engine will expose the following API endpoints:

### Calculate Origin

```
POST /api/v1/origin/calculate
```

Request:

```json
{
  "product": {
    "id": "12345",
    "name": "Widget",
    "hs_code": "8471.60",
    "materials": [
      {
        "id": "M001",
        "name": "Steel",
        "origin": "CN",
        "value": 10.0,
        "quantity": 2
      },
      {
        "id": "M002",
        "name": "Plastic",
        "origin": "US",
        "value": 5.0,
        "quantity": 3
      }
    ],
    "ex_works_price": 50.0
  },
  "origin_country": "CN",
  "destination_country": "EU",
  "trade_agreement": "EU-CN"
}
```

Response:

```json
{
  "result": {
    "qualifies": true,
    "origin": "CN",
    "rule_applied": "CTH + Max 40% non-originating materials",
    "non_originating_value": 15.0,
    "non_originating_percentage": 30.0,
    "explanation": "The product qualifies for preferential origin under the EU-CN trade agreement because it meets the following criteria: 1) All non-originating materials have undergone a change in tariff heading (CTH), and 2) The value of non-originating materials does not exceed 40% of the ex-works price."
  },
  "calculation_id": "calc-12345",
  "timestamp": "2025-10-09T12:34:56Z",
  "performance": {
    "total_time_ms": 1250,
    "rule_retrieval_time_ms": 150,
    "calculation_time_ms": 950,
    "explanation_time_ms": 150
  }
}
```

### Get Calculation History

```
GET /api/v1/origin/history/{product_id}
```

Response:

```json
{
  "product_id": "12345",
  "calculations": [
    {
      "calculation_id": "calc-12345",
      "timestamp": "2025-10-09T12:34:56Z",
      "qualifies": true,
      "origin": "CN",
      "trade_agreement": "EU-CN",
      "destination_country": "EU"
    },
    {
      "calculation_id": "calc-12344",
      "timestamp": "2025-10-08T10:22:33Z",
      "qualifies": false,
      "origin": "US",
      "trade_agreement": "EU-US",
      "destination_country": "EU"
    }
  ]
}
```

### Get Calculation Details

```
GET /api/v1/origin/calculation/{calculation_id}
```

Response:

```json
{
  "calculation_id": "calc-12345",
  "timestamp": "2025-10-09T12:34:56Z",
  "product": {
    "id": "12345",
    "name": "Widget",
    "hs_code": "8471.60",
    "materials": [
      {
        "id": "M001",
        "name": "Steel",
        "origin": "CN",
        "value": 10.0,
        "quantity": 2
      },
      {
        "id": "M002",
        "name": "Plastic",
        "origin": "US",
        "value": 5.0,
        "quantity": 3
      }
    ],
    "ex_works_price": 50.0
  },
  "origin_country": "CN",
  "destination_country": "EU",
  "trade_agreement": "EU-CN",
  "result": {
    "qualifies": true,
    "origin": "CN",
    "rule_applied": "CTH + Max 40% non-originating materials",
    "non_originating_value": 15.0,
    "non_originating_percentage": 30.0,
    "explanation": "The product qualifies for preferential origin under the EU-CN trade agreement because it meets the following criteria: 1) All non-originating materials have undergone a change in tariff heading (CTH), and 2) The value of non-originating materials does not exceed 40% of the ex-works price."
  },
  "audit_trail": [
    {
      "step": "Input Validation",
      "timestamp": "2025-10-09T12:34:55.100Z",
      "status": "success"
    },
    {
      "step": "Rule Retrieval",
      "timestamp": "2025-10-09T12:34:55.250Z",
      "status": "success",
      "details": "Retrieved rules for HS code 8471.60 under EU-CN trade agreement"
    },
    {
      "step": "Material Analysis",
      "timestamp": "2025-10-09T12:34:55.500Z",
      "status": "success",
      "details": "Analyzed 2 materials: 1 originating, 1 non-originating"
    },
    {
      "step": "Value Calculation",
      "timestamp": "2025-10-09T12:34:55.700Z",
      "status": "success",
      "details": "Non-originating value: 15.0, Non-originating percentage: 30.0%"
    },
    {
      "step": "Rule Application",
      "timestamp": "2025-10-09T12:34:55.900Z",
      "status": "success",
      "details": "Applied rule: CTH + Max 40% non-originating materials"
    },
    {
      "step": "Result Validation",
      "timestamp": "2025-10-09T12:34:56.000Z",
      "status": "success"
    },
    {
      "step": "Explanation Generation",
      "timestamp": "2025-10-09T12:34:56.150Z",
      "status": "success"
    },
    {
      "step": "Output Formatting",
      "timestamp": "2025-10-09T12:34:56.200Z",
      "status": "success"
    }
  ],
  "performance": {
    "total_time_ms": 1250,
    "rule_retrieval_time_ms": 150,
    "calculation_time_ms": 950,
    "explanation_time_ms": 150
  }
}
```

## Implementation Plan

The implementation of the LangGraph Origin Calculation Engine will be divided into the following phases:

### Phase 1: Setup and Infrastructure

1. Set up the development environment
2. Configure the LangGraph framework
3. Set up the vector database
4. Configure Redis for caching
5. Set up the PostgreSQL database

### Phase 2: Core Engine Development

1. Implement the LangGraph workflow nodes
2. Develop the rule retrieval system
3. Implement the material analysis logic
4. Develop the value calculation logic
5. Implement the rule application logic

### Phase 3: API and Integration

1. Develop the API endpoints
2. Implement the integration with PSRA-LTSD
3. Set up authentication and authorization
4. Implement error handling and logging

### Phase 4: Performance Optimization

1. Implement caching
2. Optimize the LLM for low-latency inference
3. Implement parallel processing
4. Optimize the vector database for fast retrieval
5. Implement incremental calculation

### Phase 5: Testing and Deployment

1. Develop unit tests
2. Implement integration tests
3. Perform performance testing
4. Deploy to staging environment
5. Deploy to production environment

## Conclusion

The LangGraph Origin Calculation Engine represents a significant advancement in preferential origin calculation. By leveraging AI and graph-based workflows, it provides a flexible, adaptable, and high-performance solution that can handle the complexity of international trade regulations. The target performance of sub-2 second response time will be achieved through a combination of caching, parallel processing, model optimization, and other performance enhancements.
