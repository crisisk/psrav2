# LangGraph Origin Engine

## Overview

The LangGraph Origin Engine is an AI-powered engine for calculating product origin and preferential status under trade agreements. It uses LangGraph to implement a sophisticated workflow for origin calculation, with support for parallel processing, caching, and checkpoint persistence.

## Key Features

- **AI-Powered Origin Calculation**: Uses advanced language models to analyze product components and manufacturing processes
- **Parallel Processing**: Performs component and manufacturing analyses in parallel for improved performance
- **Caching**: Implements caching for improved performance on repeated calculations
- **Checkpoint Persistence**: Saves calculation state for recovery and auditing
- **Structured Output**: Returns structured results using Pydantic models
- **Error Handling**: Comprehensive error handling with fallback mechanisms
- **API Integration**: RESTful API for easy integration with other systems

## Architecture

The LangGraph Origin Engine consists of two main components:

1. **Origin Calculation Graph** (`origin_calculation_graph.py`): Implements the LangGraph workflow for origin calculation
2. **API** (`api.py`): Provides RESTful endpoints for interacting with the Origin Engine

### Origin Calculation Graph

The Origin Calculation Graph implements a five-step workflow:

1. **Initialize**: Validates input data and prepares for calculation
2. **Analyze Components**: Analyzes product components and their origins
3. **Analyze Manufacturing**: Analyzes manufacturing processes and transformations
4. **Determine Origin**: Determines the origin of the product based on component and manufacturing analyses
5. **Verify Preferential Status**: Verifies preferential status under applicable trade agreements

### API

The API provides the following endpoints:

- `POST /calculate`: Calculates origin and preferential status
- `POST /calculate/stream`: Streams calculation results in real-time
- `GET /thread/{thread_id}`: Retrieves calculation results for a specific thread
- `GET /health`: Health check endpoint

## Usage

### API Example

```python
import requests

url = "https://psra-api.sevensa.nl/origin/calculate"
payload = {
    "product": {
        "name": "Electric Motor",
        "hs_code": "8501.10",
        "components": [
            {
                "name": "Copper Wire",
                "origin": "China",
                "value": 20.0,
                "hs_code": "7408.19"
            },
            {
                "name": "Steel Frame",
                "origin": "Germany",
                "value": 15.0,
                "hs_code": "7326.90"
            },
            {
                "name": "Plastic Housing",
                "origin": "Vietnam",
                "value": 5.0,
                "hs_code": "3926.90"
            }
        ],
        "manufacturing": {
            "location": "Netherlands",
            "processes": [
                "Assembly of components",
                "Testing and quality control",
                "Packaging"
            ],
            "value_added": 10.0
        }
    },
    "trade_agreement": "EU-UK-TCA"
}

response = requests.post(url, json=payload)
result = response.json()
print(result)
```

## Performance

The LangGraph Origin Engine is designed for high performance:

- **Response Time**: Sub-2 second response time for typical calculations
- **Throughput**: Capable of processing hundreds of calculations per minute
- **Scalability**: Horizontally scalable for increased throughput

## Deployment

The LangGraph Origin Engine is deployed as a containerized service in Kubernetes. See the `Dockerfile` and Kubernetes configuration in the repository for deployment details.

## Development

### Prerequisites

- Python 3.11+
- Poetry or pip

### Installation

```bash
# Using pip
pip install -r requirements.txt

# Using Poetry
poetry install
```

### Running Tests

```bash
pytest tests/
```

### Local Development

```bash
uvicorn api:app --reload
```

## License

Proprietary - All rights reserved
