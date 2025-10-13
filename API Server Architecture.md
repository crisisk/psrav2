# API Server Architecture

This document outlines the architecture of the API server for the PSRA-LTSD Enterprise v2 platform.

## Overview

The API server is a FastAPI-based RESTful API that provides a comprehensive interface for interacting with the PSRA-LTSD Enterprise v2 platform. It serves as the backend for the frontend application and provides integration capabilities for external systems.

## Architecture Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│    Frontend     │────▶│    API Server   │────▶│  Origin Engine  │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │  │
                 ┌─────────────┘  └─────────────┐
                 ▼                              ▼
        ┌─────────────────┐              ┌─────────────────┐
        │                 │              │                 │
        │   PostgreSQL    │              │     Redis       │
        │                 │              │                 │
        └─────────────────┘              └─────────────────┘
```

## Components

### Core Components

1. **API Router**: Handles incoming HTTP requests and routes them to the appropriate handlers
2. **Authentication**: Handles user authentication and authorization
3. **Database**: Manages database connections and operations
4. **Cache**: Manages cache connections and operations
5. **Origin Engine Client**: Communicates with the LangGraph Origin Engine
6. **Error Handler**: Handles and formats errors
7. **Logger**: Logs requests, responses, and errors
8. **Middleware**: Handles cross-cutting concerns such as CORS, rate limiting, and request logging

### Feature Modules

1. **Authentication**: User authentication and authorization
2. **Products**: CRUD operations for products and components
3. **Trade Agreements**: Access to trade agreement data and rules
4. **Origin Calculation**: Calculation of product origin and preferential status
5. **Reports**: Generation and retrieval of origin reports
6. **Users**: User and organization management
7. **Integration**: Webhooks and callbacks for integration with external systems

## Data Model

### Core Entities

1. **User**: Represents a user of the platform
2. **Organization**: Represents an organization that uses the platform
3. **Product**: Represents a product for which origin is calculated
4. **Component**: Represents a component of a product
5. **Trade Agreement**: Represents a trade agreement
6. **Origin Calculation**: Represents an origin calculation
7. **Origin Report**: Represents an origin report

### Relationships

1. **User** belongs to an **Organization**
2. **Product** belongs to an **Organization**
3. **Component** belongs to a **Product**
4. **Origin Calculation** is for a **Product** and a **Trade Agreement**
5. **Origin Report** is generated from an **Origin Calculation**

## API Endpoints

### Authentication

- `POST /auth/login`: Authenticate a user
- `POST /auth/refresh`: Refresh an access token
- `POST /auth/logout`: Logout a user
- `GET /auth/me`: Get the current user

### Products

- `GET /products`: List products
- `POST /products`: Create a product
- `GET /products/{id}`: Get a product
- `PUT /products/{id}`: Update a product
- `DELETE /products/{id}`: Delete a product
- `GET /products/{id}/components`: List components of a product
- `POST /products/{id}/components`: Add a component to a product
- `GET /products/{id}/components/{component_id}`: Get a component
- `PUT /products/{id}/components/{component_id}`: Update a component
- `DELETE /products/{id}/components/{component_id}`: Delete a component

### Trade Agreements

- `GET /trade-agreements`: List trade agreements
- `GET /trade-agreements/{id}`: Get a trade agreement
- `GET /trade-agreements/{id}/rules`: List rules of a trade agreement

### Origin Calculation

- `POST /origin-calculations`: Calculate origin
- `GET /origin-calculations/{id}`: Get an origin calculation
- `GET /origin-calculations/{id}/status`: Get the status of an origin calculation
- `POST /origin-calculations/{id}/cancel`: Cancel an origin calculation

### Reports

- `GET /reports`: List reports
- `GET /reports/{id}`: Get a report
- `GET /reports/{id}/download`: Download a report
- `POST /reports/{id}/share`: Share a report

### Users

- `GET /users`: List users
- `POST /users`: Create a user
- `GET /users/{id}`: Get a user
- `PUT /users/{id}`: Update a user
- `DELETE /users/{id}`: Delete a user

### Organizations

- `GET /organizations`: List organizations
- `POST /organizations`: Create an organization
- `GET /organizations/{id}`: Get an organization
- `PUT /organizations/{id}`: Update an organization
- `DELETE /organizations/{id}`: Delete an organization

### Integration

- `POST /webhooks`: Register a webhook
- `GET /webhooks`: List webhooks
- `DELETE /webhooks/{id}`: Delete a webhook
- `GET /api-keys`: List API keys
- `POST /api-keys`: Create an API key
- `DELETE /api-keys/{id}`: Delete an API key

## Authentication and Authorization

The API server uses JWT-based authentication with Keycloak integration. Each request must include a valid JWT token in the `Authorization` header.

### Roles

1. **Admin**: Full access to all endpoints
2. **User**: Access to endpoints for their organization
3. **API**: Access to specific endpoints for integration

### Permissions

1. **Read**: Access to GET endpoints
2. **Write**: Access to POST, PUT, and DELETE endpoints
3. **Execute**: Access to specific action endpoints

## Error Handling

The API server uses a standardized error response format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": {
      "field": "error details"
    }
  }
}
```

### Error Codes

1. **AUTHENTICATION_ERROR**: Authentication failed
2. **AUTHORIZATION_ERROR**: Authorization failed
3. **VALIDATION_ERROR**: Request validation failed
4. **NOT_FOUND**: Resource not found
5. **CONFLICT**: Resource conflict
6. **INTERNAL_ERROR**: Internal server error

## Performance Considerations

1. **Caching**: Frequently accessed data is cached in Redis
2. **Pagination**: List endpoints support pagination
3. **Filtering**: List endpoints support filtering
4. **Sorting**: List endpoints support sorting
5. **Projection**: Endpoints support field projection
6. **Compression**: Responses are compressed
7. **Rate Limiting**: Endpoints are rate limited

## Security Considerations

1. **Authentication**: JWT-based authentication with Keycloak integration
2. **Authorization**: Role-based access control
3. **Input Validation**: All input is validated
4. **Output Sanitization**: All output is sanitized
5. **Rate Limiting**: Endpoints are rate limited
6. **CORS**: Cross-Origin Resource Sharing is configured
7. **HTTPS**: All communication is encrypted
8. **Content Security Policy**: CSP headers are set
9. **XSS Protection**: XSS protection headers are set
10. **CSRF Protection**: CSRF protection is implemented

## Monitoring and Logging

1. **Request Logging**: All requests are logged
2. **Error Logging**: All errors are logged
3. **Performance Metrics**: Performance metrics are collected
4. **Health Checks**: Health check endpoints are provided
5. **Tracing**: Distributed tracing is implemented

## Deployment

The API server is deployed as a Docker container in a Kubernetes cluster. It is horizontally scalable and can be deployed in multiple regions for high availability.
