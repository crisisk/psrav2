# Phase 2: Implement Zero-Trust Network Access (ZTNA)

## Overview

This phase focuses on implementing Zero-Trust Network Access (ZTNA) for the Sevensa platform. We'll create isolated network segments for each service, implement proper network policies, and configure Traefik as the central reverse proxy with OIDC authentication via Keycloak.

## Timeline

- **Week 1-2**: Network Segmentation with Docker Networks
- **Week 3-4**: Traefik Integration with SSO

## Detailed Implementation Steps

### Week 1-2: Network Segmentation with Docker Networks

#### 1.1 Create Network Architecture Design

First, we'll create a detailed network architecture design that outlines the network segments and their relationships:

```
                                  +----------------+
                                  |    Internet    |
                                  +--------+-------+
                                           |
                                           v
                                  +--------+-------+
                                  |    Traefik     |
                                  +----------------+
                                  |  traefik-net   |
                                  +----------------+
                                           |
                +------------+-------------+-------------+------------+
                |            |             |             |            |
                v            v             v             v            v
        +-------+---+ +------+----+ +------+----+ +------+----+ +----+-----+
        | rentguy-net| | psra-net  | | wpcs-net  | |   ai-net  | |keycloak-net|
        +-----------+ +-----------+ +-----------+ +-----------+ +-----------+
                |            |             |             |            |
                v            v             v             v            v
        +-------+---+ +------+----+ +------+----+ +------+----+
        |rentguy-db-net| |psra-db-net| |wpcs-db-net| |  vault-net |
        +-----------+ +-----------+ +-----------+ +-----------+
```

#### 1.2 Create Docker Network Configuration

Create a Docker Compose file for network configuration:

```yaml
# roles/network_segmentation/templates/docker-compose.networks.yml.j2
version: '3.8'

networks:
  # Main network for Traefik
  traefik-net:
    name: traefik-net
    driver: bridge
    ipam:
      driver: default
      config:
        - subnet: 172.20.0.0/24
  
  # RentGuy networks
  rentguy-net:
    name: rentguy-net
    driver: bridge
    internal: true
    ipam:
      driver: default
      config:
        - subnet: 172.20.1.0/24
  
  rentguy-db-net:
    name: rentguy-db-net
    driver: bridge
    internal: true
    ipam:
      driver: default
      config:
        - subnet: 172.20.2.0/24
  
  # PSRA networks
  psra-net:
    name: psra-net
    driver: bridge
    internal: true
    ipam:
      driver: default
      config:
        - subnet: 172.20.3.0/24
  
  psra-db-net:
    name: psra-db-net
    driver: bridge
    internal: true
    ipam:
      driver: default
      config:
        - subnet: 172.20.4.0/24
  
  # WPCS networks
  wpcs-net:
    name: wpcs-net
    driver: bridge
    internal: true
    ipam:
      driver: default
      config:
        - subnet: 172.20.5.0/24
  
  wpcs-db-net:
    name: wpcs-db-net
    driver: bridge
    internal: true
    ipam:
      driver: default
      config:
        - subnet: 172.20.6.0/24
  
  # AI networks
  ai-net:
    name: ai-net
    driver: bridge
    internal: true
    ipam:
      driver: default
      config:
        - subnet: 172.20.7.0/24
  
  # Keycloak network
  keycloak-net:
    name: keycloak-net
    driver: bridge
    internal: true
    ipam:
      driver: default
      config:
        - subnet: 172.20.8.0/24
  
  # Vault network
  vault-net:
    name: vault-net
    driver: bridge
    internal: true
    ipam:
      driver: default
      config:
        - subnet: 172.20.9.0/24
  
  # Monitoring network
  monitoring-net:
    name: monitoring-net
    driver: bridge
    internal: true
    ipam:
      driver: default
      config:
        - subnet: 172.20.10.0/24
  
  # Logging network
  logging-net:
    name: logging-net
    driver: bridge
    internal: true
    ipam:
      driver: default
      config:
        - subnet: 172.20.11.0/24
```

#### 1.3 Create Network Initialization Script

Create a script to initialize the Docker networks:

```bash
# roles/network_segmentation/templates/initialize_networks.sh.j2
#!/bin/bash

set -e

echo "Initializing Zero-Trust Network Access (ZTNA) Docker networks..."

# Create networks
{% for network in networks %}
docker network create --driver=bridge --subnet={{ network.subnet }} {% if network.internal %}--internal{% endif %} {{ network.name }} || echo "{{ network.name }} already exists"
{% endfor %}

echo "All ZTNA networks have been initialized."
echo "Network list:"
docker network ls | grep -E '{{ networks | map(attribute='name') | join('|') }}'
```

#### 1.4 Create Ansible Role for Network Segmentation

Create an Ansible role for network segmentation:

```yaml
# roles/network_segmentation/tasks/main.yml
- name: Create project directories
  file:
    path: "{{ item }}"
    state: directory
    mode: "0755"
  loop:
    - "{{ project_dir }}/networks"

- name: Template Docker Compose networks file
  template:
    src: "docker-compose.networks.yml.j2"
    dest: "{{ project_dir }}/networks/docker-compose.networks.yml"
    mode: "0644"

- name: Template network initialization script
  template:
    src: "initialize_networks.sh.j2"
    dest: "{{ project_dir }}/networks/initialize_networks.sh"
    mode: "0755"
  vars:
    networks:
      - { name: "traefik-net", subnet: "172.20.0.0/24", internal: false }
      - { name: "rentguy-net", subnet: "172.20.1.0/24", internal: true }
      - { name: "rentguy-db-net", subnet: "172.20.2.0/24", internal: true }
      - { name: "psra-net", subnet: "172.20.3.0/24", internal: true }
      - { name: "psra-db-net", subnet: "172.20.4.0/24", internal: true }
      - { name: "wpcs-net", subnet: "172.20.5.0/24", internal: true }
      - { name: "wpcs-db-net", subnet: "172.20.6.0/24", internal: true }
      - { name: "ai-net", subnet: "172.20.7.0/24", internal: true }
      - { name: "keycloak-net", subnet: "172.20.8.0/24", internal: true }
      - { name: "vault-net", subnet: "172.20.9.0/24", internal: true }
      - { name: "monitoring-net", subnet: "172.20.10.0/24", internal: true }
      - { name: "logging-net", subnet: "172.20.11.0/24", internal: true }

- name: Initialize networks
  command: "{{ project_dir }}/networks/initialize_networks.sh"
  args:
    chdir: "{{ project_dir }}/networks"
```

#### 1.5 Update Service Docker Compose Files

Update the Docker Compose files for each service to use the new networks. Here's an example for RentGuy:

```yaml
# roles/rentguy/templates/docker-compose.yml.j2
version: '3.8'

services:
  rentguy-frontend:
    image: ${DOCKER_REGISTRY}/rentguy-frontend:latest
    container_name: rentguy-frontend
    environment:
      - NODE_ENV=production
      - API_URL=https://rentguy.sevensa.nl/api
      - KEYCLOAK_URL=https://auth.sevensa.nl/auth
      - KEYCLOAK_REALM=sevensa
      - KEYCLOAK_CLIENT_ID=rentguy-client
      - ONBOARDING_URL=https://onboarding.rentguy.sevensa.nl
    networks:
      - rentguy-net
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.rentguy-frontend.rule=Host(`rentguy.sevensa.nl`)"
      - "traefik.http.routers.rentguy-frontend.entrypoints=websecure"
      - "traefik.http.routers.rentguy-frontend.tls=true"
      - "traefik.http.services.rentguy-frontend.loadbalancer.server.port=80"
      # OIDC authentication middleware
      - "traefik.http.routers.rentguy-frontend.middlewares=rentguy-auth"
    restart: unless-stopped
    depends_on:
      - rentguy-api

  rentguy-api:
    image: ${DOCKER_REGISTRY}/rentguy-api:latest
    container_name: rentguy-api
    environment:
      - NODE_ENV=production
      - PORT=3000
      - VAULT_ADDR=http://openbao:${BAO_HTTP_PORT}
      - VAULT_NAMESPACE=rentguy
      - VAULT_ROLE_ID=${RENTGUY_VAULT_ROLE_ID}
      - VAULT_SECRET_ID=${RENTGUY_VAULT_SECRET_ID}
      - KEYCLOAK_URL=http://keycloak:${KEYCLOAK_HTTP_PORT}/auth
      - KEYCLOAK_REALM=sevensa
      - KEYCLOAK_CLIENT_ID=rentguy-client
      - KEYCLOAK_CLIENT_SECRET=${RENTGUY_CLIENT_SECRET}
    volumes:
      - rentguy-uploads:/app/uploads
    networks:
      - rentguy-net
      - rentguy-db-net
      - vault-net
      - keycloak-net
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.rentguy-api.rule=Host(`rentguy.sevensa.nl`) && PathPrefix(`/api`)"
      - "traefik.http.routers.rentguy-api.entrypoints=websecure"
      - "traefik.http.routers.rentguy-api.tls=true"
      - "traefik.http.services.rentguy-api.loadbalancer.server.port=3000"
      # JWT validation middleware
      - "traefik.http.routers.rentguy-api.middlewares=rentguy-api-auth"
    restart: unless-stopped
    depends_on:
      - rentguy-db
      - rentguy-redis

  rentguy-db:
    image: postgres:14
    container_name: rentguy-db
    environment:
      - POSTGRES_USER=rentguy
      - POSTGRES_PASSWORD=${RENTGUY_DB_PASSWORD}
      - POSTGRES_DB=rentguy
    volumes:
      - rentguy-db-data:/var/lib/postgresql/data
    networks:
      - rentguy-db-net
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U rentguy -d rentguy"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

  rentguy-redis:
    image: redis:7-alpine
    container_name: rentguy-redis
    command: redis-server --requirepass ${RENTGUY_REDIS_PASSWORD}
    volumes:
      - rentguy-redis-data:/data
    networks:
      - rentguy-db-net
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

networks:
  rentguy-net:
    external: true
  rentguy-db-net:
    external: true
  vault-net:
    external: true
  keycloak-net:
    external: true

volumes:
  rentguy-db-data:
    name: rentguy-db-data
  rentguy-redis-data:
    name: rentguy-redis-data
  rentguy-uploads:
    name: rentguy-uploads
```

Create similar Docker Compose files for PSRA, WPCS, and AI services.

### Week 3-4: Traefik Integration with SSO

#### 2.1 Create Traefik Static Configuration

Create a static configuration file for Traefik:

```yaml
# roles/traefik/templates/traefik.static.yml.j2
global:
  checkNewVersion: false
  sendAnonymousUsage: false

log:
  level: INFO
  format: json

accessLog:
  format: json
  filePath: /var/log/traefik/access.log

api:
  dashboard: true
  insecure: false

providers:
  docker:
    endpoint: "unix:///var/run/docker.sock"
    exposedByDefault: false
    network: traefik-net
  file:
    directory: /etc/traefik/dynamic
    watch: true

entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https
  websecure:
    address: ":443"
    http:
      tls:
        certResolver: letsencrypt

certificatesResolvers:
  letsencrypt:
    acme:
      email: {{ acme_email }}
      storage: /etc/traefik/acme/acme.json
      tlsChallenge: {}

metrics:
  prometheus:
    addEntryPointsLabels: true
    addServicesLabels: true
    buckets:
      - 0.1
      - 0.3
      - 1.2
      - 5.0
```

#### 2.2 Create Traefik Dynamic Configuration for OAuth2 Proxy

Create a dynamic configuration file for Traefik with OAuth2 Proxy:

```yaml
# roles/traefik/templates/traefik_dynamic.oauth2.sevensa.yml.j2
http:
  middlewares:
    # OAuth2 authentication middleware
    oauth2-auth:
      forwardAuth:
        address: "http://oauth2-proxy:4180"
        trustForwardHeader: true
        authResponseHeaders:
          - X-Auth-Request-User
          - X-Auth-Request-Email
          - X-Auth-Request-Access-Token
          - X-Auth-Request-User-Groups
    
    # RentGuy authentication middleware
    rentguy-auth:
      forwardAuth:
        address: "http://oauth2-proxy:4180"
        trustForwardHeader: true
        authResponseHeaders:
          - X-Auth-Request-User
          - X-Auth-Request-Email
          - X-Auth-Request-Access-Token
          - X-Auth-Request-User-Groups
    
    # PSRA authentication middleware
    psra-auth:
      forwardAuth:
        address: "http://oauth2-proxy:4180"
        trustForwardHeader: true
        authResponseHeaders:
          - X-Auth-Request-User
          - X-Auth-Request-Email
          - X-Auth-Request-Access-Token
          - X-Auth-Request-User-Groups
    
    # WPCS authentication middleware
    wpcs-auth:
      forwardAuth:
        address: "http://oauth2-proxy:4180"
        trustForwardHeader: true
        authResponseHeaders:
          - X-Auth-Request-User
          - X-Auth-Request-Email
          - X-Auth-Request-Access-Token
          - X-Auth-Request-User-Groups
    
    # AI authentication middleware
    ai-auth:
      forwardAuth:
        address: "http://oauth2-proxy:4180"
        trustForwardHeader: true
        authResponseHeaders:
          - X-Auth-Request-User
          - X-Auth-Request-Email
          - X-Auth-Request-Access-Token
          - X-Auth-Request-User-Groups
    
    # Admin authentication middleware
    admin-auth:
      forwardAuth:
        address: "http://oauth2-proxy:4180"
        trustForwardHeader: true
        authResponseHeaders:
          - X-Auth-Request-User
          - X-Auth-Request-Email
          - X-Auth-Request-Access-Token
          - X-Auth-Request-User-Groups
  
  routers:
    # Traefik dashboard
    traefik-dashboard:
      rule: "Host(`traefik.sevensa.nl`)"
      service: api@internal
      entryPoints:
        - websecure
      middlewares:
        - admin-auth
      tls:
        certResolver: letsencrypt
    
    # OAuth2 Proxy
    oauth2-proxy:
      rule: "Host(`auth.sevensa.nl`)"
      service: oauth2-proxy
      entryPoints:
        - websecure
      tls:
        certResolver: letsencrypt
  
  services:
    oauth2-proxy:
      loadBalancer:
        servers:
          - url: "http://oauth2-proxy:4180"
```

#### 2.3 Create OAuth2 Proxy Configuration

Create a Docker Compose file for OAuth2 Proxy:

```yaml
# roles/traefik/templates/oauth2-proxy.compose.yml.j2
version: '3.8'

services:
  oauth2-proxy:
    image: quay.io/oauth2-proxy/oauth2-proxy:v7.4.0
    container_name: oauth2-proxy
    command:
      - --provider=keycloak
      - --client-id={{ oauth2_client_id }}
      - --client-secret={{ oauth2_client_secret }}
      - --redirect-url=https://auth.sevensa.nl/oauth2/callback
      - --oidc-issuer-url=http://keycloak:{{ kc_http_port }}/auth/realms/sevensa
      - --cookie-secret={{ oauth2_cookie_secret }}
      - --cookie-secure=true
      - --cookie-domain=.sevensa.nl
      - --email-domain=*
      - --upstream=static://202
      - --http-address=0.0.0.0:4180
      - --skip-provider-button=true
      - --pass-authorization-header=true
      - --pass-access-token=true
      - --pass-user-headers=true
      - --set-authorization-header=true
      - --set-xauthrequest=true
      - --session-cookie-minimal=true
      - --whitelist-domain=.sevensa.nl
      - --scope=openid profile email
    environment:
      - OAUTH2_PROXY_SILENCE_PING_LOGGING=true
    networks:
      - traefik-net
      - keycloak-net
    restart: unless-stopped

networks:
  traefik-net:
    external: true
  keycloak-net:
    external: true
```

#### 2.4 Create Traefik Docker Compose File

Create a Docker Compose file for Traefik:

```yaml
# roles/traefik/templates/traefik.compose.yml.j2
version: '3.8'

services:
  traefik:
    image: traefik:v2.10
    container_name: traefik
    command:
      - "--configFile=/etc/traefik/traefik.yml"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik.static.yml:/etc/traefik/traefik.yml:ro
      - ./dynamic:/etc/traefik/dynamic:ro
      - ./acme:/etc/traefik/acme
      - ./logs:/var/log/traefik
    networks:
      - traefik-net
      - rentguy-net
      - psra-net
      - wpcs-net
      - ai-net
      - keycloak-net
      - vault-net
      - monitoring-net
      - logging-net
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.traefik.rule=Host(`traefik.sevensa.nl`)"
      - "traefik.http.routers.traefik.service=api@internal"
      - "traefik.http.routers.traefik.entrypoints=websecure"
      - "traefik.http.routers.traefik.tls=true"
      - "traefik.http.routers.traefik.tls.certresolver=letsencrypt"
      - "traefik.http.routers.traefik.middlewares=admin-auth"
    restart: unless-stopped

networks:
  traefik-net:
    external: true
  rentguy-net:
    external: true
  psra-net:
    external: true
  wpcs-net:
    external: true
  ai-net:
    external: true
  keycloak-net:
    external: true
  vault-net:
    external: true
  monitoring-net:
    external: true
  logging-net:
    external: true
```

#### 2.5 Create Ansible Role for Traefik

Create an Ansible role for Traefik:

```yaml
# roles/traefik/tasks/main.yml
- name: Create project directories
  file:
    path: "{{ item }}"
    state: directory
    mode: "0755"
  loop:
    - "{{ project_dir }}/traefik"
    - "{{ project_dir }}/traefik/dynamic"
    - "{{ project_dir }}/traefik/acme"
    - "{{ project_dir }}/traefik/logs"

- name: Template Traefik static configuration
  template:
    src: "traefik.static.yml.j2"
    dest: "{{ project_dir }}/traefik/traefik.static.yml"
    mode: "0644"
  vars:
    acme_email: "{{ lookup('env', 'ACME_EMAIL') | default('admin@sevensa.nl', true) }}"

- name: Template Traefik dynamic configuration
  template:
    src: "traefik_dynamic.oauth2.sevensa.yml.j2"
    dest: "{{ project_dir }}/traefik/dynamic/traefik_dynamic.oauth2.sevensa.yml"
    mode: "0644"

- name: Template OAuth2 Proxy Docker Compose file
  template:
    src: "oauth2-proxy.compose.yml.j2"
    dest: "{{ project_dir }}/traefik/oauth2-proxy.compose.yml"
    mode: "0644"
  vars:
    oauth2_client_id: "{{ lookup('env', 'OAUTH2_CLIENT_ID') | default('oauth2-proxy', true) }}"
    oauth2_client_secret: "{{ lookup('env', 'OAUTH2_CLIENT_SECRET') | default('changeme-oauth2-proxy', true) }}"
    oauth2_cookie_secret: "{{ lookup('env', 'OAUTH2_COOKIE_SECRET') | default('changeme-cookie-secret', true) }}"

- name: Template Traefik Docker Compose file
  template:
    src: "traefik.compose.yml.j2"
    dest: "{{ project_dir }}/traefik/traefik.compose.yml"
    mode: "0644"

- name: Create OAuth2 Proxy client in Keycloak
  shell: |
    export KEYCLOAK_URL="http://127.0.0.1:{{ kc_http_port }}"
    export KEYCLOAK_ADMIN="{{ keycloak_admin }}"
    export KEYCLOAK_ADMIN_PASSWORD="{{ keycloak_admin_password }}"
    
    # Get admin token
    TOKEN=$(curl -s -X POST "${KEYCLOAK_URL}/auth/realms/master/protocol/openid-connect/token" \
      -H "Content-Type: application/x-www-form-urlencoded" \
      -d "username=${KEYCLOAK_ADMIN}" \
      -d "password=${KEYCLOAK_ADMIN_PASSWORD}" \
      -d "grant_type=password" \
      -d "client_id=admin-cli" | jq -r .access_token)
    
    # Check if client exists
    CLIENT_ID=$(curl -s -X GET "${KEYCLOAK_URL}/auth/admin/realms/sevensa/clients" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" | jq -r '.[] | select(.clientId == "oauth2-proxy") | .id')
    
    if [ -z "$CLIENT_ID" ]; then
      # Create client
      curl -s -X POST "${KEYCLOAK_URL}/auth/admin/realms/sevensa/clients" \
        -H "Authorization: Bearer ${TOKEN}" \
        -H "Content-Type: application/json" \
        -d '{
          "clientId": "oauth2-proxy",
          "name": "OAuth2 Proxy",
          "description": "OAuth2 Proxy for Traefik",
          "rootUrl": "https://auth.sevensa.nl",
          "adminUrl": "https://auth.sevensa.nl",
          "baseUrl": "https://auth.sevensa.nl",
          "surrogateAuthRequired": false,
          "enabled": true,
          "alwaysDisplayInConsole": false,
          "clientAuthenticatorType": "client-secret",
          "secret": "{{ oauth2_client_secret }}",
          "redirectUris": [
            "https://auth.sevensa.nl/oauth2/callback"
          ],
          "webOrigins": [
            "https://auth.sevensa.nl"
          ],
          "notBefore": 0,
          "bearerOnly": false,
          "consentRequired": false,
          "standardFlowEnabled": true,
          "implicitFlowEnabled": false,
          "directAccessGrantsEnabled": true,
          "serviceAccountsEnabled": false,
          "publicClient": false,
          "frontchannelLogout": false,
          "protocol": "openid-connect",
          "attributes": {},
          "authenticationFlowBindingOverrides": {},
          "fullScopeAllowed": true,
          "nodeReRegistrationTimeout": -1,
          "defaultClientScopes": [
            "web-origins",
            "roles",
            "profile",
            "email"
          ],
          "optionalClientScopes": [
            "address",
            "phone",
            "offline_access"
          ]
        }'
      echo "OAuth2 Proxy client created"
    else
      echo "OAuth2 Proxy client already exists"
    fi
  args:
    chdir: "{{ project_dir }}"
  vars:
    keycloak_admin: "{{ lookup('env', 'KEYCLOAK_ADMIN') | default('admin', true) }}"
    keycloak_admin_password: "{{ lookup('env', 'KEYCLOAK_ADMIN_PASSWORD') | default('changeme-keycloak-admin', true) }}"
    oauth2_client_secret: "{{ lookup('env', 'OAUTH2_CLIENT_SECRET') | default('changeme-oauth2-proxy', true) }}"

- name: Start OAuth2 Proxy
  community.docker.docker_compose_v2:
    project_src: "{{ project_dir }}/traefik"
    files:
      - oauth2-proxy.compose.yml
    state: present

- name: Start Traefik
  community.docker.docker_compose_v2:
    project_src: "{{ project_dir }}/traefik"
    files:
      - traefik.compose.yml
    state: present
```

#### 2.6 Update Site Playbook

Update the site playbook to include the new roles:

```yaml
# site.yml
- name: Setup Central Vault (OpenBao + Keycloak)
  hosts: central_vault
  become: true
  vars:
    ansible_python_interpreter: /usr/bin/python3
  roles:
    - central_vault

- name: Setup Network Segmentation
  hosts: central_vault
  become: true
  vars:
    ansible_python_interpreter: /usr/bin/python3
    project_dir: /opt/ztna
  roles:
    - network_segmentation

- name: Setup Traefik with SSO
  hosts: central_vault
  become: true
  vars:
    ansible_python_interpreter: /usr/bin/python3
    project_dir: /opt/ztna
  roles:
    - traefik
```

## Deliverables

1. Network Segmentation:
   - Docker network configuration for isolated network segments
   - Network initialization script
   - Updated Docker Compose files for services

2. Traefik Integration with SSO:
   - Traefik static configuration
   - Traefik dynamic configuration for OAuth2 Proxy
   - OAuth2 Proxy configuration
   - Keycloak client for OAuth2 Proxy

## Success Criteria

1. All services are properly isolated in their own network segments
2. Services can only communicate with other services through defined network paths
3. Traefik is properly configured as the central reverse proxy
4. OAuth2 Proxy is properly configured for SSO with Keycloak
5. All services are accessible through their respective domains
6. Authentication and authorization are properly enforced for all services
