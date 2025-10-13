# PSRA-LTSD Kubernetes Configuration

This directory contains the Kubernetes configuration for the PSRA-LTSD (Preferential Status and Rules of Origin Application) service, which is the primary service in the Sevensa platform.

## Components

The PSRA-LTSD service consists of the following components:

1. **API Server**: Backend API for the PSRA-LTSD application
2. **Frontend**: Web interface for the PSRA-LTSD application
3. **LangGraph Origin Engine**: AI-powered engine for origin calculation
4. **PostgreSQL Database**: Persistent storage for application data
5. **Redis**: Cache and message broker

## Architecture

The PSRA-LTSD service follows a microservices architecture with the following characteristics:

- **High Availability**: Multiple replicas of each component
- **Horizontal Scaling**: Automatic scaling based on CPU and memory usage
- **Zero-Trust Security**: Network policies for micro-segmentation
- **Persistent Storage**: Dedicated storage for each component
- **Resource Management**: Resource requests and limits for each container

## Configuration Files

- **deployment.yaml**: Deployments for API, Frontend, and Origin Engine
- **service.yaml**: Services for internal communication
- **ingress.yaml**: Ingress for external access
- **configmap.yaml**: Configuration data
- **secret.yaml**: Sensitive data (template)
- **hpa.yaml**: Horizontal Pod Autoscalers
- **pvc.yaml**: Persistent Volume Claims
- **networkpolicy.yaml**: Network policies for security
- **serviceaccount.yaml**: Service account and RBAC
- **database.yaml**: PostgreSQL StatefulSet
- **redis.yaml**: Redis StatefulSet

## Deployment

To deploy the PSRA-LTSD service, follow these steps:

1. Set the required environment variables:

```bash
export DB_PASSWORD="your-db-password"
export REDIS_PASSWORD="your-redis-password"
export JWT_SECRET="your-jwt-secret"
export KEYCLOAK_CLIENT_SECRET="your-keycloak-client-secret"
export OPENBAO_ROLE_ID="your-openbao-role-id"
export OPENBAO_SECRET_ID="your-openbao-secret-id"
export OPENAI_API_KEY="your-openai-api-key"
export TLS_CRT="base64-encoded-tls-certificate"
export TLS_KEY="base64-encoded-tls-key"
```

2. Process the secret template:

```bash
envsubst < secret.yaml > secret.processed.yaml
```

3. Apply the Kubernetes resources:

```bash
kubectl apply -f serviceaccount.yaml
kubectl apply -f configmap.yaml
kubectl apply -f secret.processed.yaml
kubectl apply -f pvc.yaml
kubectl apply -f database.yaml
kubectl apply -f redis.yaml
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f hpa.yaml
kubectl apply -f networkpolicy.yaml
kubectl apply -f ingress.yaml
```

4. Clean up the processed secret:

```bash
rm secret.processed.yaml
```

## LangGraph Origin Engine

The LangGraph Origin Engine is a key component of the PSRA-LTSD service. It provides AI-powered origin calculation using LangGraph, a framework for building stateful, multi-step AI workflows.

### Features

- **Parallel Processing**: Concurrent execution of component and production analyses
- **Caching**: In-memory caching of calculations for improved performance
- **Persistence**: Checkpoint persistence for long-running calculations
- **Structured Output**: Pydantic models for type safety and validation
- **Retry Mechanism**: Exponential backoff for resilience

### Configuration

The LangGraph Origin Engine is configured through environment variables and the `app_config.json` file in the ConfigMap. Key configuration options include:

- **Model**: The OpenAI model to use (default: gpt-4o)
- **Temperature**: The randomness of the model's output (default: 0.1)
- **Max Tokens**: The maximum number of tokens to generate (default: 4096)
- **Cache TTL**: The time-to-live for cached results (default: 86400 seconds)
- **Parallel Processing**: Whether to enable parallel processing (default: true)
- **Checkpoint Persistence**: Whether to persist checkpoints (default: true)

## Scaling

The PSRA-LTSD service is configured for automatic scaling based on CPU and memory usage:

- **API**: 5-20 replicas
- **Frontend**: 5-20 replicas
- **Origin Engine**: 3-15 replicas

## Resource Allocation

The PSRA-LTSD service has the following resource allocations:

- **API**:
  - Requests: 200m CPU, 512Mi memory
  - Limits: 1000m CPU, 1Gi memory

- **Frontend**:
  - Requests: 100m CPU, 256Mi memory
  - Limits: 500m CPU, 512Mi memory

- **Origin Engine**:
  - Requests: 500m CPU, 1Gi memory
  - Limits: 2000m CPU, 2Gi memory

- **Database**:
  - Requests: 500m CPU, 1Gi memory
  - Limits: 2000m CPU, 4Gi memory

- **Redis**:
  - Requests: 200m CPU, 512Mi memory
  - Limits: 1000m CPU, 5Gi memory

## Storage

The PSRA-LTSD service uses the following storage:

- **Database**: 50Gi (fast storage)
- **Database Backup**: 100Gi (shared storage)
- **Redis**: 10Gi (standard storage)
- **Uploads**: 50Gi (shared storage)
- **Cache**: 20Gi (shared storage)

## Security

The PSRA-LTSD service follows a zero-trust security model:

- **Network Policies**: Restrict communication between components
- **RBAC**: Limit permissions for service accounts
- **Secrets**: Store sensitive data in Kubernetes Secrets
- **TLS**: Encrypt all external traffic
- **Pod Security**: Restrict container privileges
