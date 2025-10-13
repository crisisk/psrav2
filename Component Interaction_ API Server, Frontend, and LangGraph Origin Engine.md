# Component Interaction: API Server, Frontend, and LangGraph Origin Engine

This document details the interaction between the three main components of the PSRA-LTSD Enterprise v2 platform: the API Server, Frontend, and LangGraph Origin Engine.

## Architecture Overview

The PSRA-LTSD Enterprise v2 platform follows a modern, microservices-based architecture with three main components:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│    Frontend     │────▶│    API Server   │────▶│  Origin Engine  │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
       React.js              FastAPI              LangGraph/LLM
```

1. **Frontend**: A React-based single-page application that provides the user interface
2. **API Server**: A FastAPI-based RESTful API that handles business logic and data management
3. **LangGraph Origin Engine**: A specialized service for AI-powered origin calculation

## Communication Flow

### 1. User Interaction Flow

The typical flow for a user interaction is as follows:

1. User interacts with the Frontend (e.g., submits a product for origin calculation)
2. Frontend sends a request to the API Server
3. API Server processes the request and may communicate with the LangGraph Origin Engine
4. API Server returns a response to the Frontend
5. Frontend updates the UI based on the response

### 2. Authentication Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│  Frontend   │────▶│  API Server │────▶│  Keycloak   │
│             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │                   │                   │
       │◀──────────────────┼───────────────────┘
       │                   │
       └───────────────────▶
```

1. User enters credentials in the Frontend
2. Frontend sends credentials to the API Server
3. API Server validates credentials with Keycloak
4. Keycloak returns a JWT token
5. API Server returns the token to the Frontend
6. Frontend stores the token and includes it in subsequent requests

### 3. Origin Calculation Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│             │     │             │     │                 │
│  Frontend   │────▶│  API Server │────▶│  Origin Engine  │
│             │     │             │     │                 │
└─────────────┘     └─────────────┘     └─────────────────┘
       ▲                   ▲                   │
       │                   │                   │
       │                   └───────────────────┘
       │                   │
       └───────────────────┘
```

1. User submits a product for origin calculation in the Frontend
2. Frontend sends the product data to the API Server
3. API Server validates the data and creates an origin calculation record
4. API Server sends the calculation request to the LangGraph Origin Engine
5. LangGraph Origin Engine performs the calculation (potentially asynchronously)
6. LangGraph Origin Engine returns the result to the API Server
7. API Server updates the calculation record and returns the result to the Frontend
8. Frontend displays the result to the user

## API Interfaces

### 1. Frontend to API Server Interface

The Frontend communicates with the API Server using RESTful HTTP requests. All requests include:

- **Authentication**: JWT token in the `Authorization` header
- **Content Type**: JSON in the `Content-Type` header
- **Request ID**: Unique ID in the `X-Request-ID` header for tracing

Example request:

```http
POST /api/v1/origin-calculations HTTP/1.1
Host: api.psra-ltsd.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
X-Request-ID: 550e8400-e29b-41d4-a716-446655440000

{
  "product_id": "123",
  "trade_agreement_id": "456",
  "calculation_type": "standard"
}
```

### 2. API Server to LangGraph Origin Engine Interface

The API Server communicates with the LangGraph Origin Engine using its RESTful API. All requests include:

- **Authentication**: API key in the `X-API-Key` header
- **Content Type**: JSON in the `Content-Type` header
- **Request ID**: Unique ID in the `X-Request-ID` header for tracing

Example request:

```http
POST /calculate HTTP/1.1
Host: origin-engine.psra-ltsd.com
X-API-Key: your-api-key
Content-Type: application/json
X-Request-ID: 550e8400-e29b-41d4-a716-446655440000

{
  "product": {
    "hs_code": "8471.30",
    "description": "Laptop computer",
    "components": [
      {
        "name": "CPU",
        "hs_code": "8542.31",
        "origin_country": "Taiwan"
      },
      {
        "name": "Memory",
        "hs_code": "8542.32",
        "origin_country": "South Korea"
      }
    ],
    "manufacturing_processes": [
      "Assembly of components",
      "Software installation",
      "Quality testing"
    ],
    "country_of_manufacture": "China"
  },
  "trade_agreement": {
    "code": "CPTPP",
    "name": "Comprehensive and Progressive Agreement for Trans-Pacific Partnership",
    "parties": ["Australia", "Brunei", "Canada", "Chile", "Japan", "Malaysia", "Mexico", "New Zealand", "Peru", "Singapore", "Vietnam"]
  }
}
```

## Data Flow

### 1. Product Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│  Frontend   │────▶│  API Server │────▶│  Database   │
│             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
```

1. User creates or updates a product in the Frontend
2. Frontend sends the product data to the API Server
3. API Server validates the data and stores it in the database
4. API Server returns the stored product to the Frontend
5. Frontend updates the UI with the stored product

### 2. Origin Calculation Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│             │     │             │     │                 │
│  Frontend   │────▶│  API Server │────▶│  Origin Engine  │
│             │     │             │     │                 │
└─────────────┘     └─────────────┘     └─────────────────┘
                          │                     │
                          ▼                     │
                    ┌─────────────┐             │
                    │             │             │
                    │  Database   │◀────────────┘
                    │             │
                    └─────────────┘
```

1. User submits a product for origin calculation in the Frontend
2. Frontend sends the calculation request to the API Server
3. API Server retrieves the product and trade agreement data from the database
4. API Server creates an origin calculation record in the database
5. API Server sends the calculation request to the LangGraph Origin Engine
6. LangGraph Origin Engine performs the calculation
7. LangGraph Origin Engine returns the result to the API Server
8. API Server updates the calculation record in the database
9. API Server returns the result to the Frontend
10. Frontend displays the result to the user

## Asynchronous Processing

For long-running calculations, the platform uses asynchronous processing:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│             │     │             │     │                 │
│  Frontend   │────▶│  API Server │────▶│  Origin Engine  │
│             │     │             │     │                 │
└─────────────┘     └─────────────┘     └─────────────────┘
       │                   │                     │
       │                   │                     │
       │◀──────────────────┘                     │
       │                                         │
       │                   ┌─────────────┐       │
       │                   │             │       │
       │                   │  Database   │◀──────┘
       │                   │             │
       │                   └─────────────┘
       │                         │
       │                         │
       │◀────────────────────────┘
```

1. User submits a product for origin calculation in the Frontend
2. Frontend sends the calculation request to the API Server
3. API Server creates an origin calculation record with status "pending"
4. API Server returns the calculation ID to the Frontend
5. Frontend displays a loading indicator and polls for updates
6. API Server sends the calculation request to the LangGraph Origin Engine
7. LangGraph Origin Engine performs the calculation asynchronously
8. LangGraph Origin Engine updates the calculation record in the database with status "completed"
9. Frontend polls the API Server for the calculation status
10. API Server returns the updated status and result
11. Frontend displays the result to the user

## Streaming Updates

For complex calculations, the platform supports streaming updates:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│             │     │             │     │                 │
│  Frontend   │────▶│  API Server │────▶│  Origin Engine  │
│             │     │             │     │                 │
└─────────────┘     └─────────────┘     └─────────────────┘
       ▲                   ▲                   │
       │                   │                   │
       │◀ ─ ─ ─ ─ ─ ─ ─ ─ ┼ ─ ─ ─ ─ ─ ─ ─ ─ ─┘
       │      SSE/WS       │      SSE/WS
```

1. User submits a product for origin calculation in the Frontend
2. Frontend establishes a WebSocket or SSE connection with the API Server
3. API Server sends the calculation request to the LangGraph Origin Engine
4. LangGraph Origin Engine establishes a streaming connection with the API Server
5. LangGraph Origin Engine streams calculation updates to the API Server
6. API Server forwards the updates to the Frontend
7. Frontend displays real-time updates to the user

## Error Handling

The platform implements comprehensive error handling:

1. **Frontend Errors**:
   - Form validation errors are handled client-side
   - Network errors are caught and displayed to the user
   - Unexpected errors are logged and reported to the user

2. **API Server Errors**:
   - Input validation errors return 400 Bad Request
   - Authentication errors return 401 Unauthorized
   - Authorization errors return 403 Forbidden
   - Not found errors return 404 Not Found
   - Server errors return 500 Internal Server Error
   - All errors are logged with request IDs for tracing

3. **LangGraph Origin Engine Errors**:
   - Calculation errors are returned to the API Server
   - Timeout errors are handled with appropriate retries
   - All errors are logged with request IDs for tracing

## Caching Strategy

The platform implements a multi-level caching strategy:

1. **Frontend Caching**:
   - React Query for API response caching
   - Local storage for user preferences
   - Memory cache for frequently accessed data

2. **API Server Caching**:
   - Redis cache for API responses
   - Cache invalidation on data updates
   - Configurable TTL for different data types

3. **LangGraph Origin Engine Caching**:
   - Memory cache for frequently accessed data
   - Redis cache for distributed caching
   - Semantic cache for similar calculations
   - Predictive cache for anticipated calculations

## Security Considerations

The platform implements comprehensive security measures:

1. **Authentication and Authorization**:
   - JWT-based authentication with Keycloak
   - Role-based access control
   - API key authentication for service-to-service communication

2. **Data Protection**:
   - HTTPS for all communication
   - Data encryption at rest
   - Input validation and output sanitization

3. **Network Security**:
   - Micro-segmentation with network policies
   - Rate limiting for API endpoints
   - CORS configuration for Frontend-API communication

## Monitoring and Observability

The platform implements comprehensive monitoring and observability:

1. **Logging**:
   - Structured logging with correlation IDs
   - Centralized log collection with Loki
   - Log analysis with Grafana

2. **Metrics**:
   - Application metrics with Prometheus
   - Business metrics for origin calculations
   - Performance metrics for API endpoints

3. **Tracing**:
   - Distributed tracing with OpenTelemetry
   - Request tracing across all components
   - Performance bottleneck identification

4. **Alerting**:
   - Alert rules for critical errors
   - Alert rules for performance degradation
   - Alert notifications via email and Slack

## Deployment and Scaling

The platform is deployed as containerized services in Kubernetes:

1. **Frontend**:
   - Static files served from CDN
   - Multiple replicas for high availability
   - Horizontal scaling based on traffic

2. **API Server**:
   - Multiple replicas for high availability
   - Horizontal scaling based on CPU and memory usage
   - Database connection pooling

3. **LangGraph Origin Engine**:
   - Multiple replicas for high availability
   - Horizontal scaling based on calculation queue length
   - Resource limits for LLM inference

## Conclusion

The interaction between the Frontend, API Server, and LangGraph Origin Engine is designed to provide a seamless user experience while ensuring high performance, reliability, and security. The microservices architecture allows for independent scaling and deployment of each component, while the standardized interfaces ensure smooth communication between them.
