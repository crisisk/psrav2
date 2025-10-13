# Docker Compose Standardization

This directory contains standardized Docker Compose templates for all Sevensa services. These templates follow best practices for containerization, security, and maintainability.

## Overview

The standardized Docker Compose templates provide a consistent approach to deploying and managing services across the Sevensa platform. They include:

- Service segmentation
- Health checks
- Resource limits
- Logging configuration
- Secret management integration
- Network configuration
- Traefik integration

## Templates

The following templates are available:

- `docker-compose.rentguy.yml`: Template for RentGuy service
- `docker-compose.psra.yml`: Template for PSRA-LTSD service
- `docker-compose.wpcs.yml`: Template for WPCS service
- `docker-compose.ai.yml`: Template for AI Orchestration services

## Key Features

### Service Segmentation

Services are segmented into logical components, each with its own container. This allows for:

- Independent scaling
- Isolated resource management
- Simplified maintenance
- Improved security through isolation

### Health Checks

All services include health checks to ensure they are functioning correctly. Health checks:

- Prevent traffic to unhealthy containers
- Enable automatic recovery
- Provide visibility into service health
- Ensure dependencies are ready before dependent services start

### Resource Limits

Resource limits are defined for all services to:

- Prevent resource starvation
- Ensure fair resource allocation
- Improve stability
- Enable predictable scaling

### Logging Configuration

Standardized logging configuration ensures:

- Consistent log format
- Log rotation to prevent disk space issues
- Appropriate log levels
- Easy integration with centralized logging systems

### Secret Management

Secrets are managed securely using:

- Docker secrets for sensitive information
- OpenBao integration for dynamic secrets
- Vault Agent for secret retrieval
- Secure environment variable handling

### Network Configuration

Network configuration follows security best practices:

- Service-specific internal networks
- External networks only where necessary
- Traefik integration for public-facing services
- Network isolation between services

### Traefik Integration

All public-facing services are integrated with Traefik for:

- Automatic SSL termination
- Load balancing
- Path-based routing
- Security headers

## Usage

### Prerequisites

- Docker Engine 20.10.0 or later
- Docker Compose 2.0.0 or later
- Traefik running as a reverse proxy
- OpenBao for secret management
- Keycloak for authentication

### Directory Structure

Create the following directory structure for each service:

```
/opt/sevensa/<service>/
├── config/           # Configuration files
├── secrets/          # Secret files
├── vault-agent/      # Vault Agent configuration
├── vault-token       # Vault token file
└── docker-compose.yml
```

### Environment Variables

Create a `.env` file in the service directory with the following variables:

```
# General
DOCKER_REGISTRY=registry.sevensa.nl
<SERVICE>_VERSION=latest

# Paths
<SERVICE>_SECRETS_PATH=/opt/sevensa/<service>/secrets
<SERVICE>_VAULT_CONFIG_PATH=/opt/sevensa/<service>/vault-agent
<SERVICE>_VAULT_TOKEN_PATH=/opt/sevensa/<service>/vault-token

# Service-specific variables
...
```

### Secrets

Create the necessary secret files in the `/opt/sevensa/<service>/secrets/` directory:

```bash
echo "your_db_user" > /opt/sevensa/<service>/secrets/db_user.txt
echo "your_db_password" > /opt/sevensa/<service>/secrets/db_password.txt
echo "your_redis_password" > /opt/sevensa/<service>/secrets/redis_password.txt
echo "your_jwt_secret" > /opt/sevensa/<service>/secrets/jwt_secret.txt
echo "your_keycloak_client_secret" > /opt/sevensa/<service>/secrets/keycloak_client_secret.txt
echo "your_smtp_password" > /opt/sevensa/<service>/secrets/smtp_password.txt
```

Set appropriate permissions:

```bash
chmod 600 /opt/sevensa/<service>/secrets/*.txt
```

### Vault Agent Configuration

Create the Vault Agent configuration in the `/opt/sevensa/<service>/vault-agent/` directory:

```hcl
# agent.hcl
exit_after_auth = false
pid_file = "/tmp/vault-agent.pid"

auto_auth {
  method "token" {
    config {
      token_file = "/vault/token"
    }
  }
}

listener "tcp" {
  address = "0.0.0.0:8100"
  tls_disable = true
}

cache {
  use_auto_auth_token = true
}

template {
  source = "/vault/config/db.tmpl"
  destination = "/vault/secrets/db.json"
}

template {
  source = "/vault/config/api.tmpl"
  destination = "/vault/secrets/api.json"
}
```

### Deployment

Deploy a service using:

```bash
cd /opt/sevensa/<service>/
docker-compose -f docker-compose.yml up -d
```

### Monitoring

Monitor service health using:

```bash
docker-compose -f docker-compose.yml ps
docker-compose -f docker-compose.yml logs -f
```

## Best Practices

### Security

- Use the principle of least privilege for container capabilities
- Keep images up to date with security patches
- Use read-only file systems where possible
- Implement network segmentation
- Use secrets for sensitive information
- Implement proper logging and monitoring

### Performance

- Use resource limits appropriate for the service
- Implement caching where appropriate
- Use volume mounts for persistent data
- Configure appropriate health check intervals
- Use multi-stage builds for smaller images

### Maintainability

- Use descriptive container and volume names
- Document environment variables and secrets
- Use consistent naming conventions
- Implement proper logging
- Use version tags for images

## Customization

The templates can be customized for specific environments:

- Development: Add volume mounts for code directories
- Testing: Add test-specific environment variables
- Production: Adjust resource limits and scaling

## Troubleshooting

### Common Issues

- **Container fails to start**: Check logs with `docker-compose logs <service>`
- **Health check fails**: Verify service is running correctly and health check parameters are appropriate
- **Network connectivity issues**: Check network configuration and firewall rules
- **Secret access issues**: Verify secret files exist and have correct permissions

### Logs

Access logs using:

```bash
docker-compose -f docker-compose.yml logs -f <service>
```

### Health Checks

Check health status using:

```bash
docker inspect --format='{{json .State.Health}}' <container_name>
```
