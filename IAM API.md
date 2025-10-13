# IAM API

The IAM API provides a unified interface for identity and access management in the Sevensa platform. It integrates with Keycloak for identity management and OpenBao for secret management.

## Features

- User management (create, read, update, delete)
- Role management
- Group management
- Authentication and authorization
- Integration with Keycloak and OpenBao

## API Endpoints

### Authentication

- `POST /token`: Get an access token
- `GET /users/me`: Get the current user

### User Management

- `GET /users`: Get all users
- `POST /users`: Create a new user
- `GET /users/{username}`: Get a user by username
- `PUT /users/{username}`: Update a user
- `DELETE /users/{username}`: Delete a user

### Role Management

- `GET /roles`: Get all roles

### Group Management

- `GET /groups`: Get all groups

### Health Check

- `GET /health`: Health check endpoint

## Configuration

The API is configured using environment variables:

- `KEYCLOAK_URL`: URL of the Keycloak server
- `KEYCLOAK_REALM`: Keycloak realm
- `KEYCLOAK_CLIENT_ID`: Keycloak client ID
- `KEYCLOAK_CLIENT_SECRET`: Keycloak client secret
- `OPENBAO_URL`: URL of the OpenBao server
- `OPENBAO_TOKEN`: OpenBao token

## Deployment

The API is deployed using Docker Compose:

```bash
docker-compose up -d
```

## Development

To run the API locally:

```bash
uvicorn app:app --reload
```

## API Documentation

The API documentation is available at `/docs` when the API is running.
