# Phase 2: Zero-Trust Network Architecture

This directory contains the implementation of Phase 2 of the Sevensa platform improvement plan: Zero-Trust Network Architecture (ZTNA). The implementation follows the principle of "never trust, always verify" and implements micro-segmentation, identity-based access, and continuous verification.

## Overview

The Zero-Trust Network Architecture is designed to provide a secure environment for all services in the Sevensa platform. It is based on the following principles:

1. **Verify explicitly**: Always authenticate and authorize based on all available data points
2. **Use least privilege access**: Limit user access with Just-In-Time and Just-Enough-Access
3. **Assume breach**: Minimize blast radius and segment access, verify end-to-end encryption, and use analytics to improve security posture

## Directory Structure

```
phase2/
├── docs/                          # Documentation
│   └── zero_trust_network_architecture.md
├── keycloak/                      # Keycloak configuration
│   └── sevensa-realm.json
├── networks/                      # Network configuration
│   ├── docker-compose.ai.yml
│   ├── docker-compose.networks.yml
│   ├── docker-compose.psra.yml
│   ├── docker-compose.rentguy.yml
│   └── docker-compose.wpcs.yml
├── oauth2-proxy/                  # OAuth2 Proxy configuration
│   ├── docker-compose.oauth2-proxy.yml
│   └── oauth2-proxy.cfg
├── scripts/                       # Deployment scripts
│   ├── deploy_phase2.sh
│   └── initialize_networks.sh
├── traefik/                       # Traefik configuration
│   ├── docker-compose.traefik.yml
│   ├── dynamic/
│   │   ├── middlewares.yml
│   │   └── tls.yml
│   └── traefik.yml
└── README.md                      # This file
```

## Components

### 1. Network Micro-Segmentation

Network micro-segmentation is implemented using Docker networks to isolate services from each other. Each service has its own internal network, and only required connections between services are allowed.

The network architecture includes:

- **Traefik Public Network**: Used for public-facing services
- **Service-Specific Internal Networks**: Isolated networks for each service
- **Shared Service Networks**: Limited networks for shared services like OpenBao and Keycloak

### 2. Identity-Based Access

Identity-based access is implemented using Keycloak as the Identity Provider (IdP) and OAuth2 Proxy for authentication and authorization. This ensures that:

- All access requires authentication
- Authorization is based on user identity and roles
- Access tokens are short-lived and regularly rotated
- Multi-factor authentication is enforced for sensitive operations

### 3. Continuous Verification

Continuous verification ensures that security is maintained throughout the session. This is implemented using:

- **Short-lived access tokens**: Tokens expire after a short period
- **Continuous token validation**: Tokens are validated on every request
- **Risk-based authentication**: Additional verification for high-risk operations
- **Audit logging**: All access attempts are logged and monitored

## Implementation Details

### Docker Networks

Each service has its own isolated Docker network:

- `traefik-public`: Public-facing network for Traefik
- `rentguy-internal`: Internal network for RentGuy service
- `psra-internal`: Internal network for PSRA service
- `wpcs-internal`: Internal network for WPCS service
- `ai-internal`: Internal network for AI Orchestration services
- `openbao-client`: Network for OpenBao clients
- `keycloak-client`: Network for Keycloak clients

### Traefik Configuration

Traefik is configured as the edge proxy with the following features:

- TLS termination with automatic certificate management
- Integration with OAuth2 Proxy for authentication
- Rate limiting to prevent abuse
- IP filtering for additional security
- Security headers to prevent common web vulnerabilities

### OAuth2 Proxy Configuration

OAuth2 Proxy is configured to:

- Authenticate users against Keycloak
- Enforce session management
- Apply authorization rules based on user roles
- Pass user identity to backend services

### Keycloak Configuration

Keycloak is configured with:

- Realms for different environments
- Client configurations for each service
- Role-based access control
- Multi-factor authentication for sensitive operations
- User federation for integration with existing identity systems

## Deployment

To deploy the Zero-Trust Network Architecture, follow these steps:

1. Ensure Docker and Docker Compose are installed
2. Clone this repository
3. Run the deployment script:

```bash
cd /path/to/sevensa_implementation/phase2
chmod +x scripts/deploy_phase2.sh
./scripts/deploy_phase2.sh
```

The deployment script will:

1. Create the necessary directories
2. Deploy the Docker networks
3. Deploy Traefik
4. Deploy OAuth2 Proxy
5. Configure Keycloak
6. Deploy the services with ZTNA

## Security Considerations

### Network Security

- All internal networks are configured as `internal: true` to prevent direct internet access
- Only necessary ports are exposed
- All communication is encrypted with TLS
- Network policies enforce the principle of least privilege

### Authentication and Authorization

- All access requires authentication
- Authorization is based on user identity and roles
- Access tokens are short-lived and regularly rotated
- Multi-factor authentication is enforced for sensitive operations

### Monitoring and Auditing

- All access attempts are logged
- Suspicious activities trigger alerts
- Regular security audits are performed
- Compliance with security standards is continuously monitored

## Conclusion

The Zero-Trust Network Architecture provides a secure foundation for the Sevensa platform. By implementing micro-segmentation, identity-based access, and continuous verification, the architecture ensures that security is maintained throughout the system.

The implementation follows industry best practices and is designed to be scalable, maintainable, and secure. Regular security audits and continuous monitoring ensure that the security posture is maintained over time.
