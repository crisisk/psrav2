# PSRA-LTSD Origin Calculation Engine

## Overview

The PSRA-LTSD Origin Calculation Engine is a LangGraph-powered system for determining the origin of products based on their components and manufacturing processes. It applies the rules of origin from relevant trade agreements to determine if a product qualifies for preferential treatment.

This engine is designed to provide:

- **Sub-2 second response times** for origin calculations
- **Accurate and consistent** origin determinations
- **Transparent reasoning** with detailed justifications
- **Resilient processing** with error handling and fallbacks
- **Scalable architecture** for high-volume processing

## Architecture

The Origin Calculation Engine is built using LangGraph, a framework for building stateful, multi-step AI workflows. The system consists of the following components:

1. **LangGraph Workflow**: A directed graph of processing nodes that analyze components, manufacturing processes, determine origin, verify preferential status, and generate reports.

2. **FastAPI Service**: A REST API that exposes the LangGraph workflow to clients, with both synchronous and streaming endpoints.

3. **PostgreSQL Database**: Stores checkpoints for the LangGraph workflow, enabling stateful conversations and recovery.

4. **LLM Integration**: Uses OpenAI's GPT-4o model for advanced reasoning about origin rules.

## Features

- **Structured Output**: All outputs are structured using Pydantic models for consistent parsing and validation.
- **Parallel Processing**: Component and manufacturing analyses can run in parallel for improved performance.
- **Caching**: Results are cached to improve performance for repeated calculations.
- **Error Handling**: Comprehensive error handling with retry logic and fallbacks.
- **Telemetry**: Detailed logging and performance metrics for monitoring and optimization.
- **Streaming**: Real-time streaming of calculation steps for interactive UIs.

## Workflow

The origin calculation workflow consists of the following steps:

1. **Initialize**: Set up the calculation context and validate input data.
2. **Analyze Components**: Analyze the components of the product to determine their origin and value.
3. **Analyze Manufacturing**: Analyze the manufacturing processes to determine if they constitute substantial transformation.
4. **Determine Origin**: Apply the rules of origin to determine the country of origin.
5. **Verify Preferential Status**: Check if the product qualifies for preferential treatment under the relevant trade agreement.
6. **Generate Report**: Create a comprehensive origin report with all findings and recommendations.

## API Endpoints

### Calculate Origin (Synchronous)

```
POST /calculate
```

Request:
```json
{
  "product_code": "ABC123",
  "components": [
    {
      "id": "comp1",
      "name": "Component 1",
      "value": 100,
      "quantity": 2,
      "origin_country": "EU"
    },
    {
      "id": "comp2",
      "name": "Component 2",
      "value": 50,
      "quantity": 1,
      "origin_country": "CN"
    }
  ],
  "manufacturing_processes": [
    {
      "id": "proc1",
      "name": "Assembly",
      "description": "Final assembly of components",
      "location": "EU",
      "value_added": 75,
      "substantial_transformation": true
    }
  ],
  "trade_agreement": "EU-UK TCA"
}
```

Response:
```json
{
  "origin_country": "EU",
  "origin_justification": "The product qualifies as EU origin under the substantial transformation rule...",
  "preferential_status": true,
  "thread_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

### Calculate Origin (Streaming)

```
POST /calculate/stream
```

Request: Same as synchronous endpoint

Response: Server-Sent Events (SSE) stream with updates for each step of the calculation process.

### Thread Management

```
GET /threads/{thread_id}
DELETE /threads/{thread_id}
```

## Performance Optimization

The Origin Calculation Engine is optimized for sub-2 second response times through:

1. **Parallel Processing**: Component and manufacturing analyses run in parallel.
2. **Caching**: Frequently used calculations are cached.
3. **Structured Prompts**: LLM prompts are structured for efficient processing.
4. **Fallback Mechanisms**: Simplified calculations are used when errors occur.
5. **Database Connection Pooling**: Efficient database connections for checkpoints.

## Deployment

The Origin Calculation Engine is designed to be deployed in a Kubernetes cluster using the provided Kubernetes manifests and Helm charts. The system is horizontally scalable and can be configured for high availability.

### Prerequisites

- Kubernetes cluster
- PostgreSQL database
- OpenAI API key

### Environment Variables

- `OPENAI_API_KEY`: API key for OpenAI
- `MODEL_NAME`: LLM model to use (default: "gpt-4o")
- `CACHE_ENABLED`: Enable caching (default: "true")
- `PARALLEL_PROCESSING`: Enable parallel processing (default: "true")
- `DEBUG_MODE`: Enable debug logging (default: "false")
- `TELEMETRY_ENABLED`: Enable telemetry (default: "true")
- `POSTGRES_HOST`: PostgreSQL host
- `POSTGRES_PORT`: PostgreSQL port
- `POSTGRES_DB`: PostgreSQL database name
- `POSTGRES_USER`: PostgreSQL username
- `POSTGRES_PASSWORD`: PostgreSQL password
- `DB_MAX_CONNECTIONS`: Maximum database connections (default: 10)

## Development

### Setup

1. Clone the repository
2. Install dependencies: `poetry install`
3. Set up environment variables
4. Run the API: `poetry run uvicorn src.api.main:app --reload`

### Testing

Run tests with: `poetry run pytest`

## License

Proprietary - Sevensa B.V. © 2025
