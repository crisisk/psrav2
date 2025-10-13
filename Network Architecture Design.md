# Network Architecture Design

## Overview

This document outlines the design for implementing Zero-Trust Network Access (ZTNA) using Docker networks in the Sevensa platform. The design focuses on micro-segmentation to ensure proper isolation between services while allowing controlled communication where necessary.

## Current State

The current network architecture uses a single Docker network for all services, which does not provide proper isolation between services. This design aims to implement micro-segmentation by creating separate networks for each service and controlling communication between them.

## Network Design Principles

1. **Micro-segmentation**: Each service should have its own isolated network.
2. **Least Privilege**: Services should only be able to communicate with other services that they need to interact with.
3. **Defense in Depth**: Multiple layers of security should be implemented to protect services.
4. **Visibility**: Network traffic should be monitored and logged for security analysis.
5. **Scalability**: The network architecture should be able to scale as the platform grows.

## Network Segments

The following network segments will be created:

| Network | Purpose | Connected Services | External Access |
|---------|---------|-------------------|----------------|
| `traefik_network` | Frontend network for Traefik | Traefik, OAuth2 Proxy | Internet |
| `keycloak_network` | Network for Keycloak and its database | Keycloak, PostgreSQL | None |
| `openbao_network` | Network for OpenBao | OpenBao | None |
| `rentguy_network` | Network for RentGuy services | RentGuy Frontend, RentGuy API, RentGuy Database | None |
| `psra_network` | Network for PSRA services | PSRA Frontend, PSRA API, PSRA Database | None |
| `wpcs_network` | Network for WPCS services | WPCS API, WPCS Database | None |
| `ai_network` | Network for AI Orchestration services | LangGraph, N8N, Trading Dashboard, Claude Chat | None |
| `monitoring_network` | Network for monitoring services | Prometheus, Grafana, AlertManager | None |
| `logging_network` | Network for logging services | Loki, Promtail | None |
| `shared_network` | Network for shared services | All services that need to communicate with shared services | None |

## Network Topology

```
                                 Internet
                                     |
                                     v
                              +-------------+
                              |   Traefik   |
                              +-------------+
                                     |
                                     v
                              +-------------+
                              | OAuth2 Proxy |
                              +-------------+
                                     |
            +---------------------+--+--+---------------------+
            |                     |     |                     |
            v                     v     v                     v
    +-------------+        +-------------+            +-------------+
    |   RentGuy   |        |    PSRA     |            |    WPCS     |
    +-------------+        +-------------+            +-------------+
            |                     |                          |
            v                     v                          v
    +-------------+        +-------------+            +-------------+
    | RentGuy DB  |        |  PSRA DB    |            |  WPCS DB    |
    +-------------+        +-------------+            +-------------+
                                     |
                                     v
                              +-------------+
                              |     AI      |
                              +-------------+
                                     |
            +---------------------+--+--+---------------------+
            |                     |     |                     |
            v                     v     v                     v
    +-------------+        +-------------+            +-------------+
    |  LangGraph  |        |    N8N      |            | Claude Chat |
    +-------------+        +-------------+            +-------------+
                                     |
                                     v
                              +-------------+
                              |  OpenBao    |
                              +-------------+
                                     |
                                     v
                              +-------------+
                              |  Keycloak   |
                              +-------------+
                                     |
                                     v
                              +-------------+
                              | PostgreSQL  |
                              +-------------+
                                     |
            +---------------------+--+--+---------------------+
            |                     |                           |
            v                     v                           v
    +-------------+        +-------------+            +-------------+
    | Prometheus  |        |   Grafana   |            | AlertManager|
    +-------------+        +-------------+            +-------------+
            |                     |                           |
            v                     v                           v
    +-------------+        +-------------+            +-------------+
    |    Loki     |        |  Promtail   |            |  Exporters  |
    +-------------+        +-------------+            +-------------+
```

## Network Communication Rules

The following communication rules will be implemented:

1. **Traefik Network**:
   - Traefik can communicate with all service networks
   - OAuth2 Proxy can communicate with Keycloak network

2. **Service Networks**:
   - Each service network can only communicate with its own database network
   - Service networks cannot communicate with each other directly

3. **Shared Services**:
   - All services can communicate with OpenBao network
   - All services can communicate with Keycloak network
   - All services can communicate with monitoring network (for metrics collection)
   - All services can communicate with logging network (for log collection)

## Docker Network Configuration

The Docker network configuration will be implemented using Docker Compose. Each network will be defined with the `external` option set to `true` to ensure that the networks are created separately and can be shared between multiple Docker Compose files.

```yaml
networks:
  traefik_network:
    external: true
  keycloak_network:
    external: true
  openbao_network:
    external: true
  rentguy_network:
    external: true
  psra_network:
    external: true
  wpcs_network:
    external: true
  ai_network:
    external: true
  monitoring_network:
    external: true
  logging_network:
    external: true
  shared_network:
    external: true
```

## Network Initialization

The networks will be initialized using a script that creates each network with the appropriate configuration:

```bash
#!/usr/bin/env bash
# Network initialization script
# Created: 2025-10-09
# Last Updated: 2025-10-09

set -euo pipefail

# Create networks
docker network create traefik_network || true
docker network create keycloak_network || true
docker network create openbao_network || true
docker network create rentguy_network || true
docker network create psra_network || true
docker network create wpcs_network || true
docker network create ai_network || true
docker network create monitoring_network || true
docker network create logging_network || true
docker network create shared_network || true

echo "Networks created successfully"
```

## Service Configuration

Each service will be configured to connect to the appropriate networks:

### Traefik

```yaml
services:
  traefik:
    # ... other configuration ...
    networks:
      - traefik_network
      - rentguy_network
      - psra_network
      - wpcs_network
      - ai_network
```

### OAuth2 Proxy

```yaml
services:
  oauth2-proxy:
    # ... other configuration ...
    networks:
      - traefik_network
      - keycloak_network
```

### RentGuy

```yaml
services:
  rentguy-frontend:
    # ... other configuration ...
    networks:
      - rentguy_network
      - traefik_network
      - shared_network
  
  rentguy-api:
    # ... other configuration ...
    networks:
      - rentguy_network
      - shared_network
  
  rentguy-db:
    # ... other configuration ...
    networks:
      - rentguy_network
```

### PSRA

```yaml
services:
  psra-frontend:
    # ... other configuration ...
    networks:
      - psra_network
      - traefik_network
      - shared_network
  
  psra-api:
    # ... other configuration ...
    networks:
      - psra_network
      - shared_network
  
  psra-db:
    # ... other configuration ...
    networks:
      - psra_network
```

### WPCS

```yaml
services:
  wpcs-api:
    # ... other configuration ...
    networks:
      - wpcs_network
      - traefik_network
      - shared_network
  
  wpcs-db:
    # ... other configuration ...
    networks:
      - wpcs_network
```

### AI Orchestration

```yaml
services:
  langgraph:
    # ... other configuration ...
    networks:
      - ai_network
      - shared_network
  
  n8n:
    # ... other configuration ...
    networks:
      - ai_network
      - traefik_network
      - shared_network
  
  claude-chat:
    # ... other configuration ...
    networks:
      - ai_network
      - traefik_network
      - shared_network
  
  trading-dashboard:
    # ... other configuration ...
    networks:
      - ai_network
      - traefik_network
      - shared_network
```

### OpenBao

```yaml
services:
  openbao:
    # ... other configuration ...
    networks:
      - openbao_network
      - shared_network
```

### Keycloak

```yaml
services:
  keycloak:
    # ... other configuration ...
    networks:
      - keycloak_network
      - shared_network
  
  postgres:
    # ... other configuration ...
    networks:
      - keycloak_network
```

### Monitoring

```yaml
services:
  prometheus:
    # ... other configuration ...
    networks:
      - monitoring_network
      - shared_network
  
  grafana:
    # ... other configuration ...
    networks:
      - monitoring_network
      - traefik_network
      - shared_network
  
  alertmanager:
    # ... other configuration ...
    networks:
      - monitoring_network
      - shared_network
```

### Logging

```yaml
services:
  loki:
    # ... other configuration ...
    networks:
      - logging_network
      - shared_network
  
  promtail:
    # ... other configuration ...
    networks:
      - logging_network
      - shared_network
```

## Network Security

In addition to network segmentation, the following security measures will be implemented:

1. **Network Policies**: Docker network policies will be used to restrict communication between networks.
2. **Encryption**: All communication between services will be encrypted using TLS.
3. **Authentication**: All services will authenticate with each other using mutual TLS or API keys.
4. **Monitoring**: Network traffic will be monitored for suspicious activity.
5. **Logging**: Network events will be logged for security analysis.

## Implementation Approach

The implementation will follow these steps:

1. **Create Network Initialization Script**: Create a script to initialize all networks.
2. **Update Service Docker Compose Files**: Update each service's Docker Compose file to connect to the appropriate networks.
3. **Configure Network Policies**: Configure network policies to restrict communication between networks.
4. **Test Network Connectivity**: Test that services can communicate with the appropriate networks and cannot communicate with restricted networks.

## Ansible Role Extension

The Ansible role will be extended to include the following tasks:

1. **Create Network Initialization Script**: Create a script to initialize all networks.
2. **Run Network Initialization Script**: Run the script to create the networks.
3. **Update Service Docker Compose Files**: Update each service's Docker Compose file to connect to the appropriate networks.

```yaml
# roles/network_segmentation/tasks/main.yml
- name: Create network initialization script
  template:
    src: "initialize_networks.sh.j2"
    dest: "{{ project_dir }}/scripts/initialize_networks.sh"
    mode: "0755"

- name: Run network initialization script
  shell: |
    cd {{ project_dir }} && ./scripts/initialize_networks.sh
  args:
    chdir: "{{ project_dir }}"

- name: Update service Docker Compose files
  template:
    src: "{{ item }}.j2"
    dest: "{{ project_dir }}/{{ item }}"
    mode: "0644"
  loop:
    - docker-compose.traefik.yml
    - docker-compose.oauth2-proxy.yml
    - docker-compose.rentguy.yml
    - docker-compose.psra.yml
    - docker-compose.wpcs.yml
    - docker-compose.ai.yml
    - docker-compose.openbao.yml
    - docker-compose.keycloak.yml
    - docker-compose.monitoring.yml
    - docker-compose.logging.yml
```

## Testing

The network configuration will be tested using the following methods:

1. **Network Existence**: Verify that all networks are created correctly.
2. **Network Connectivity**: Test that services can communicate with the appropriate networks.
3. **Network Isolation**: Test that services cannot communicate with restricted networks.
4. **End-to-End Testing**: Test the entire platform to ensure that all services can communicate as expected.

## Conclusion

This design provides a comprehensive approach to implementing Zero-Trust Network Access (ZTNA) using Docker networks in the Sevensa platform. The micro-segmentation approach ensures proper isolation between services while allowing controlled communication where necessary.
