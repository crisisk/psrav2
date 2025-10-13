# Zero-Trust Network Architecture

This document outlines the Zero-Trust Network Architecture (ZTNA) implementation for the Sevensa platform. The architecture follows the principle of "never trust, always verify" and implements micro-segmentation, identity-based access, and continuous verification.

## Overview

The Zero-Trust Network Architecture is designed to provide a secure environment for all services in the Sevensa platform. It is based on the following principles:

1. **Verify explicitly**: Always authenticate and authorize based on all available data points
2. **Use least privilege access**: Limit user access with Just-In-Time and Just-Enough-Access
3. **Assume breach**: Minimize blast radius and segment access, verify end-to-end encryption, and use analytics to improve security posture

## Architecture Components

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

## Network Topology

The network topology is designed to enforce the Zero-Trust principles:

```
                                  ┌─────────────────┐
                                  │                 │
                                  │    Internet     │
                                  │                 │
                                  └────────┬────────┘
                                           │
                                           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                           Traefik (Edge Proxy)                          │
│                                                                         │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                            OAuth2 Proxy                                 │
│                                                                         │
└────────────┬──────────────────────┬──────────────────────┬──────────────┘
             │                      │                      │
             ▼                      ▼                      ▼
┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐
│                    │  │                    │  │                    │
│  RentGuy Service   │  │   PSRA Service     │  │   WPCS Service     │
│                    │  │                    │  │                    │
└────────┬───────────┘  └────────┬───────────┘  └────────┬───────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐
│                    │  │                    │  │                    │
│  RentGuy Database  │  │   PSRA Database    │  │   WPCS Database    │
│                    │  │                    │  │                    │
└────────────────────┘  └────────────────────┘  └────────────────────┘
```

## Service-to-Service Communication

Service-to-service communication follows the Zero-Trust principles:

1. **Authentication**: Services authenticate to each other using service accounts
2. **Authorization**: Access is granted based on service roles and permissions
3. **Encryption**: All communication is encrypted using TLS
4. **Auditing**: All service-to-service communication is logged and monitored

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
