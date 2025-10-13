# High Priority Code Patches

Dit document bevat concrete code patches voor de hoogst geprioriteerde verbeterpunten uit de audit. Deze patches kunnen direct worden geïmplementeerd om de kwaliteit, veiligheid en onderhoudbaarheid van de codebase te verbeteren.

## 1. Secret Rotation voor OpenBao Credentials

### Probleem
De huidige implementatie mist een automatisch rotatiemechanisme voor OpenBao credentials, wat een beveiligingsrisico vormt bij langdurig gebruik van dezelfde credentials.

### Oplossing
Implementeer een periodieke rotation van OpenBao tokens en credentials met behulp van een Kubernetes CronJob of systemd timer.

### Code Patch

#### 1.1 Creëer een Secret Rotation Script

Bestandslocatie: `/home/ubuntu/sevensa_implementation/scripts/openbao/rotate_secrets.sh`

```bash
#!/bin/bash
# OpenBao Secret Rotation Script
# This script rotates OpenBao tokens and credentials periodically

set -e

# Configuration
OPENBAO_ADDR=${OPENBAO_ADDR:-"https://openbao.sevensa.local:8200"}
OPENBAO_TOKEN=${OPENBAO_TOKEN:-""}
ROTATION_LOG="/var/log/openbao/rotation.log"
SERVICES=("rentguy" "psra" "wpcs" "ai-orchestrator")

# Ensure we have a token
if [ -z "$OPENBAO_TOKEN" ]; then
    echo "Error: OPENBAO_TOKEN environment variable is required" | tee -a "$ROTATION_LOG"
    exit 1
fi

# Log start
echo "$(date): Starting secret rotation" | tee -a "$ROTATION_LOG"

# Set up OpenBao client
export OPENBAO_ADDR
export OPENBAO_TOKEN

# Rotate AppRole secrets for each service
for service in "${SERVICES[@]}"; do
    echo "$(date): Rotating AppRole secrets for $service" | tee -a "$ROTATION_LOG"
    
    # Get current role-id
    ROLE_ID=$(openbao read -format=json "auth/approle/role/$service/role-id" | jq -r '.data.role_id')
    
    # Generate new secret-id
    NEW_SECRET_ID=$(openbao write -format=json -f "auth/approle/role/$service/secret-id" | jq -r '.data.secret_id')
    
    # Store new credentials in KV store for service to pick up
    openbao kv put "secret/$service/approle" role_id="$ROLE_ID" secret_id="$NEW_SECRET_ID"
    
    # Update rotation timestamp
    openbao kv patch "secret/$service/metadata" last_rotated="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    
    echo "$(date): Successfully rotated AppRole secrets for $service" | tee -a "$ROTATION_LOG"
done

# Rotate database credentials if using database secrets engine
echo "$(date): Rotating database credentials" | tee -a "$ROTATION_LOG"
for service in "${SERVICES[@]}"; do
    if openbao read "database/config/$service-db" &>/dev/null; then
        echo "$(date): Rotating credentials for $service database" | tee -a "$ROTATION_LOG"
        openbao write -f "database/rotate-role/$service-role"
        echo "$(date): Successfully rotated credentials for $service database" | tee -a "$ROTATION_LOG"
    fi
done

# Rotate encryption keys if using transit engine
echo "$(date): Rotating transit encryption keys" | tee -a "$ROTATION_LOG"
for service in "${SERVICES[@]}"; do
    if openbao read "transit/keys/$service-key" &>/dev/null; then
        echo "$(date): Rotating encryption key for $service" | tee -a "$ROTATION_LOG"
        openbao write -f "transit/keys/$service-key/rotate"
        echo "$(date): Successfully rotated encryption key for $service" | tee -a "$ROTATION_LOG"
    fi
done

echo "$(date): Secret rotation completed successfully" | tee -a "$ROTATION_LOG"
```

#### 1.2 Creëer een Kubernetes CronJob

Bestandslocatie: `/home/ubuntu/sevensa_implementation/code/kubernetes/jobs/secret-rotation-cronjob.yml`

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: openbao-secret-rotation
  namespace: security
spec:
  schedule: "0 0 * * 0"  # Run weekly at midnight on Sunday
  concurrencyPolicy: Forbid
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 3
  jobTemplate:
    spec:
      backoffLimit: 3
      template:
        spec:
          serviceAccountName: openbao-rotation-sa
          containers:
          - name: rotation
            image: openbao:latest
            command:
            - /bin/sh
            - -c
            - /scripts/rotate_secrets.sh
            env:
            - name: OPENBAO_ADDR
              value: "https://openbao.sevensa.local:8200"
            - name: OPENBAO_TOKEN
              valueFrom:
                secretKeyRef:
                  name: openbao-rotation-token
                  key: token
            volumeMounts:
            - name: rotation-script
              mountPath: /scripts
            - name: rotation-logs
              mountPath: /var/log/openbao
          volumes:
          - name: rotation-script
            configMap:
              name: openbao-rotation-script
              defaultMode: 0755
          - name: rotation-logs
            persistentVolumeClaim:
              claimName: openbao-logs-pvc
          restartPolicy: OnFailure
```

#### 1.3 Creëer een Ansible Role voor Secret Rotation

Bestandslocatie: `/home/ubuntu/sevensa_implementation/code/ansible/roles/openbao_rotation/tasks/main.yml`

```yaml
---
- name: Create directory for rotation scripts
  file:
    path: "{{ openbao_scripts_dir }}"
    state: directory
    mode: '0755'
    owner: "{{ openbao_user }}"
    group: "{{ openbao_group }}"

- name: Copy rotation script
  template:
    src: rotate_secrets.sh.j2
    dest: "{{ openbao_scripts_dir }}/rotate_secrets.sh"
    mode: '0755'
    owner: "{{ openbao_user }}"
    group: "{{ openbao_group }}"

- name: Create log directory
  file:
    path: "{{ openbao_log_dir }}"
    state: directory
    mode: '0755'
    owner: "{{ openbao_user }}"
    group: "{{ openbao_group }}"

- name: Set up systemd timer for Docker Compose environment
  block:
    - name: Create systemd service for rotation
      template:
        src: openbao-rotation.service.j2
        dest: /etc/systemd/system/openbao-rotation.service
        mode: '0644'

    - name: Create systemd timer for rotation
      template:
        src: openbao-rotation.timer.j2
        dest: /etc/systemd/system/openbao-rotation.timer
        mode: '0644'

    - name: Enable and start rotation timer
      systemd:
        name: openbao-rotation.timer
        enabled: yes
        state: started
        daemon_reload: yes
  when: not use_kubernetes | default(false)

- name: Set up Kubernetes CronJob for Kubernetes environment
  block:
    - name: Create ConfigMap for rotation script
      k8s:
        state: present
        definition:
          apiVersion: v1
          kind: ConfigMap
          metadata:
            name: openbao-rotation-script
            namespace: "{{ k8s_namespace }}"
          data:
            rotate_secrets.sh: "{{ lookup('template', 'rotate_secrets.sh.j2') }}"

    - name: Create Secret for rotation token
      k8s:
        state: present
        definition:
          apiVersion: v1
          kind: Secret
          metadata:
            name: openbao-rotation-token
            namespace: "{{ k8s_namespace }}"
          type: Opaque
          data:
            token: "{{ openbao_rotation_token | b64encode }}"

    - name: Create CronJob for rotation
      k8s:
        state: present
        definition: "{{ lookup('template', 'secret-rotation-cronjob.yml.j2') | from_yaml }}"
  when: use_kubernetes | default(false)
```

## 2. Standaardisatie van Docker Compose Bestanden

### Probleem
De Docker Compose bestanden in de repository variëren in structuur en missen consistente best practices, wat leidt tot onderhoudsuitdagingen en potentiële configuratiefouten.

### Oplossing
Standaardiseer alle Docker Compose bestanden met een consistente structuur, naamgeving en configuratie.

### Code Patch

#### 2.1 Creëer een Docker Compose Template

Bestandslocatie: `/home/ubuntu/sevensa_implementation/config/templates/docker-compose.template.yml`

```yaml
version: '3.8'

# Standard service template for Sevensa services
# This template should be used as a base for all service Docker Compose files

services:
  # Service name should follow the pattern: {service-name}-{component}
  # Example: rentguy-api, rentguy-db, rentguy-cache
  service-name:
    image: ${IMAGE_REPOSITORY}/${SERVICE_NAME}:${SERVICE_VERSION}
    container_name: ${SERVICE_NAME}
    restart: unless-stopped
    environment:
      # Common environment variables
      - SERVICE_NAME=${SERVICE_NAME}
      - ENVIRONMENT=${ENVIRONMENT:-production}
      - LOG_LEVEL=${LOG_LEVEL:-info}
      # OpenBao integration
      - OPENBAO_ADDR=${OPENBAO_ADDR}
      - OPENBAO_ROLE_ID=${OPENBAO_ROLE_ID}
      - OPENBAO_SECRET_ID=${OPENBAO_SECRET_ID}
      # Service-specific environment variables
      - SERVICE_SPECIFIC_VAR=${SERVICE_SPECIFIC_VAR}
    volumes:
      # Mount configuration
      - ${CONFIG_DIR}/${SERVICE_NAME}/config:/app/config:ro
      # Mount data (if needed)
      - ${DATA_DIR}/${SERVICE_NAME}/data:/app/data
      # Mount logs
      - ${LOG_DIR}/${SERVICE_NAME}/logs:/app/logs
    networks:
      # Always include the service-specific network
      - ${SERVICE_NAME}-network
      # Include shared networks as needed
      - traefik-network
    deploy:
      resources:
        limits:
          cpus: '${CPU_LIMIT:-0.5}'
          memory: ${MEMORY_LIMIT:-512M}
        reservations:
          cpus: '${CPU_RESERVATION:-0.1}'
          memory: ${MEMORY_RESERVATION:-128M}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:${HEALTH_CHECK_PORT:-8080}/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    labels:
      # Common labels
      - "sevensa.service=${SERVICE_NAME}"
      - "sevensa.environment=${ENVIRONMENT:-production}"
      # Traefik labels (if exposed via Traefik)
      - "traefik.enable=${TRAEFIK_ENABLE:-false}"
      - "traefik.http.routers.${SERVICE_NAME}.rule=Host(`${SERVICE_DOMAIN}`)"
      - "traefik.http.routers.${SERVICE_NAME}.entrypoints=websecure"
      - "traefik.http.routers.${SERVICE_NAME}.tls=true"
      - "traefik.http.routers.${SERVICE_NAME}.tls.certresolver=letsencrypt"
      - "traefik.http.services.${SERVICE_NAME}.loadbalancer.server.port=${SERVICE_PORT:-8080}"
      # Prometheus labels (if metrics are exposed)
      - "prometheus.scrape=${PROMETHEUS_SCRAPE:-false}"
      - "prometheus.port=${PROMETHEUS_PORT:-9090}"
      - "prometheus.path=${PROMETHEUS_PATH:-/metrics}"

networks:
  # Service-specific network
  service-name-network:
    name: ${SERVICE_NAME}-network
    driver: bridge
    internal: true
    labels:
      - "sevensa.service=${SERVICE_NAME}"
      - "sevensa.network.type=service"
  
  # Shared networks (external)
  traefik-network:
    external: true
```

#### 2.2 Update RentGuy Docker Compose Bestand

Bestandslocatie: `/home/ubuntu/sevensa_implementation/config/networks/docker-compose.rentguy.yml`

```yaml
version: '3.8'

services:
  rentguy-api:
    image: ${IMAGE_REPOSITORY}/rentguy-api:${RENTGUY_VERSION}
    container_name: rentguy-api
    restart: unless-stopped
    environment:
      # Common environment variables
      - SERVICE_NAME=rentguy-api
      - ENVIRONMENT=${ENVIRONMENT:-production}
      - LOG_LEVEL=${LOG_LEVEL:-info}
      # OpenBao integration
      - OPENBAO_ADDR=${OPENBAO_ADDR}
      - OPENBAO_ROLE_ID=${RENTGUY_OPENBAO_ROLE_ID}
      - OPENBAO_SECRET_ID=${RENTGUY_OPENBAO_SECRET_ID}
      # Service-specific environment variables
      - DATABASE_HOST=rentguy-db
      - DATABASE_PORT=5432
      - REDIS_HOST=rentguy-cache
      - REDIS_PORT=6379
    volumes:
      - ${CONFIG_DIR}/rentguy/config:/app/config:ro
      - ${DATA_DIR}/rentguy/data:/app/data
      - ${LOG_DIR}/rentguy/logs:/app/logs
    networks:
      - rentguy-network
      - traefik-network
    deploy:
      resources:
        limits:
          cpus: '${RENTGUY_API_CPU_LIMIT:-1.0}'
          memory: ${RENTGUY_API_MEMORY_LIMIT:-1G}
        reservations:
          cpus: '${RENTGUY_API_CPU_RESERVATION:-0.2}'
          memory: ${RENTGUY_API_MEMORY_RESERVATION:-256M}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    labels:
      # Common labels
      - "sevensa.service=rentguy-api"
      - "sevensa.environment=${ENVIRONMENT:-production}"
      # Traefik labels
      - "traefik.enable=true"
      - "traefik.http.routers.rentguy-api.rule=Host(`rentguy.sevensa.nl`)"
      - "traefik.http.routers.rentguy-api.entrypoints=websecure"
      - "traefik.http.routers.rentguy-api.tls=true"
      - "traefik.http.routers.rentguy-api.tls.certresolver=letsencrypt"
      - "traefik.http.services.rentguy-api.loadbalancer.server.port=8080"
      # Prometheus labels
      - "prometheus.scrape=true"
      - "prometheus.port=9090"
      - "prometheus.path=/metrics"

  rentguy-frontend:
    image: ${IMAGE_REPOSITORY}/rentguy-frontend:${RENTGUY_VERSION}
    container_name: rentguy-frontend
    restart: unless-stopped
    environment:
      - SERVICE_NAME=rentguy-frontend
      - ENVIRONMENT=${ENVIRONMENT:-production}
      - API_URL=https://rentguy.sevensa.nl/api
    networks:
      - rentguy-network
      - traefik-network
    deploy:
      resources:
        limits:
          cpus: '${RENTGUY_FRONTEND_CPU_LIMIT:-0.5}'
          memory: ${RENTGUY_FRONTEND_MEMORY_LIMIT:-512M}
        reservations:
          cpus: '${RENTGUY_FRONTEND_CPU_RESERVATION:-0.1}'
          memory: ${RENTGUY_FRONTEND_MEMORY_RESERVATION:-128M}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 20s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    labels:
      - "sevensa.service=rentguy-frontend"
      - "sevensa.environment=${ENVIRONMENT:-production}"
      - "traefik.enable=true"
      - "traefik.http.routers.rentguy-frontend.rule=Host(`rentguy.sevensa.nl`) && PathPrefix(`/`)"
      - "traefik.http.routers.rentguy-frontend.entrypoints=websecure"
      - "traefik.http.routers.rentguy-frontend.tls=true"
      - "traefik.http.routers.rentguy-frontend.tls.certresolver=letsencrypt"
      - "traefik.http.services.rentguy-frontend.loadbalancer.server.port=80"

  rentguy-db:
    image: postgres:14-alpine
    container_name: rentguy-db
    restart: unless-stopped
    environment:
      - POSTGRES_PASSWORD_FILE=/run/secrets/postgres-password
      - POSTGRES_USER=rentguy
      - POSTGRES_DB=rentguy
    volumes:
      - ${DATA_DIR}/rentguy/db:/var/lib/postgresql/data
    networks:
      - rentguy-network
    deploy:
      resources:
        limits:
          cpus: '${RENTGUY_DB_CPU_LIMIT:-1.0}'
          memory: ${RENTGUY_DB_MEMORY_LIMIT:-1G}
        reservations:
          cpus: '${RENTGUY_DB_CPU_RESERVATION:-0.2}'
          memory: ${RENTGUY_DB_MEMORY_RESERVATION:-256M}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U rentguy"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 40s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    secrets:
      - postgres-password
    labels:
      - "sevensa.service=rentguy-db"
      - "sevensa.environment=${ENVIRONMENT:-production}"

  rentguy-cache:
    image: redis:7-alpine
    container_name: rentguy-cache
    restart: unless-stopped
    command: ["redis-server", "--appendonly", "yes", "--requirepass", "${REDIS_PASSWORD}"]
    volumes:
      - ${DATA_DIR}/rentguy/redis:/data
    networks:
      - rentguy-network
    deploy:
      resources:
        limits:
          cpus: '${RENTGUY_CACHE_CPU_LIMIT:-0.5}'
          memory: ${RENTGUY_CACHE_MEMORY_LIMIT:-512M}
        reservations:
          cpus: '${RENTGUY_CACHE_CPU_RESERVATION:-0.1}'
          memory: ${RENTGUY_CACHE_MEMORY_RESERVATION:-128M}
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 20s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    labels:
      - "sevensa.service=rentguy-cache"
      - "sevensa.environment=${ENVIRONMENT:-production}"

networks:
  rentguy-network:
    name: rentguy-network
    driver: bridge
    internal: true
    labels:
      - "sevensa.service=rentguy"
      - "sevensa.network.type=service"
  
  traefik-network:
    external: true

secrets:
  postgres-password:
    file: ${SECRETS_DIR}/rentguy/postgres-password.txt
```

#### 2.3 Creëer een Docker Compose Validator Script

Bestandslocatie: `/home/ubuntu/sevensa_implementation/scripts/docker/validate_compose.py`

```python
#!/usr/bin/env python3
"""
Docker Compose Validator Script

This script validates Docker Compose files against the Sevensa standards.
It checks for required fields, consistent naming, and best practices.
"""

import os
import sys
import yaml
import argparse
from pathlib import Path
from typing import Dict, List, Any, Optional

# Define validation rules
REQUIRED_SERVICE_FIELDS = [
    "image", "container_name", "restart", "networks", "healthcheck", "logging"
]

REQUIRED_HEALTHCHECK_FIELDS = ["test", "interval", "timeout", "retries"]

REQUIRED_LABELS = [
    "sevensa.service", "sevensa.environment"
]

def parse_args() -> argparse.Namespace:
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="Validate Docker Compose files")
    parser.add_argument("files", nargs="+", help="Docker Compose files to validate")
    parser.add_argument("--strict", action="store_true", help="Enable strict validation")
    return parser.parse_args()

def load_compose_file(file_path: str) -> Dict[str, Any]:
    """Load a Docker Compose file."""
    try:
        with open(file_path, "r") as f:
            return yaml.safe_load(f)
    except Exception as e:
        print(f"Error loading {file_path}: {e}")
        sys.exit(1)

def validate_service(service_name: str, service_config: Dict[str, Any], strict: bool = False) -> List[str]:
    """Validate a service configuration."""
    errors = []
    
    # Check required fields
    for field in REQUIRED_SERVICE_FIELDS:
        if field not in service_config:
            errors.append(f"Service '{service_name}' is missing required field '{field}'")
    
    # Check container naming convention
    if "container_name" in service_config:
        container_name = service_config["container_name"]
        if not container_name.startswith(service_name.split("-")[0]):
            errors.append(f"Container name '{container_name}' should start with service prefix")
    
    # Check healthcheck
    if "healthcheck" in service_config:
        healthcheck = service_config["healthcheck"]
        for field in REQUIRED_HEALTHCHECK_FIELDS:
            if field not in healthcheck:
                errors.append(f"Service '{service_name}' healthcheck is missing required field '{field}'")
    
    # Check labels
    if "labels" in service_config:
        labels = service_config["labels"]
        if isinstance(labels, list):
            label_dict = {}
            for label in labels:
                if "=" in label:
                    key, value = label.split("=", 1)
                    label_dict[key] = value
            labels = label_dict
        
        for required_label in REQUIRED_LABELS:
            if required_label not in labels:
                errors.append(f"Service '{service_name}' is missing required label '{required_label}'")
    else:
        errors.append(f"Service '{service_name}' is missing labels")
    
    # Check resource limits in strict mode
    if strict and "deploy" in service_config:
        deploy = service_config["deploy"]
        if "resources" not in deploy:
            errors.append(f"Service '{service_name}' is missing resource limits")
        elif "limits" not in deploy["resources"]:
            errors.append(f"Service '{service_name}' is missing resource limits")
    
    return errors

def validate_networks(networks: Optional[Dict[str, Any]]) -> List[str]:
    """Validate network configurations."""
    errors = []
    
    if not networks:
        errors.append("No networks defined")
        return errors
    
    for network_name, network_config in networks.items():
        if network_config is None:
            continue
            
        if "external" not in network_config and "driver" not in network_config:
            errors.append(f"Network '{network_name}' is missing 'driver' or 'external' property")
        
        if "labels" not in network_config and "external" not in network_config:
            errors.append(f"Network '{network_name}' is missing labels")
    
    return errors

def validate_compose_file(file_path: str, strict: bool = False) -> List[str]:
    """Validate a Docker Compose file."""
    compose_config = load_compose_file(file_path)
    errors = []
    
    # Check version
    if "version" not in compose_config:
        errors.append("Missing 'version' field")
    elif compose_config["version"] != "3.8":
        errors.append(f"Version should be '3.8', found '{compose_config['version']}'")
    
    # Check services
    if "services" not in compose_config:
        errors.append("Missing 'services' section")
        return errors
    
    for service_name, service_config in compose_config["services"].items():
        errors.extend(validate_service(service_name, service_config, strict))
    
    # Check networks
    if "networks" in compose_config:
        errors.extend(validate_networks(compose_config["networks"]))
    else:
        errors.append("Missing 'networks' section")
    
    return errors

def main() -> None:
    """Main function."""
    args = parse_args()
    
    all_valid = True
    for file_path in args.files:
        print(f"Validating {file_path}...")
        errors = validate_compose_file(file_path, args.strict)
        
        if errors:
            all_valid = False
            print(f"Found {len(errors)} errors in {file_path}:")
            for error in errors:
                print(f"  - {error}")
        else:
            print(f"✅ {file_path} is valid")
        
        print()
    
    if not all_valid:
        sys.exit(1)

if __name__ == "__main__":
    main()
```

## 3. Distributed Tracing voor LangGraph Origin Engine

### Probleem
De LangGraph Origin Engine mist distributed tracing, wat het moeilijk maakt om performance bottlenecks te identificeren en end-to-end request flows te volgen.

### Oplossing
Implementeer OpenTelemetry voor distributed tracing in de LangGraph Origin Engine.

### Code Patch

#### 3.1 Update LangGraph Origin Engine met OpenTelemetry

Bestandslocatie: `/home/ubuntu/sevensa_implementation/code/langgraph/src/api/main.py`

```python
"""
PSRA-LTSD Origin Calculation Engine API
Created: 2025-10-09
Last Updated: 2025-10-09

This module implements the FastAPI application for the Origin Calculation Engine.
"""

import json
import logging
import os
import time
import uuid
from typing import Dict, List, Optional, Any, Union

import redis
from fastapi import FastAPI, HTTPException, Depends, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field
from psycopg_pool import AsyncConnectionPool

# OpenTelemetry imports
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.redis import RedisInstrumentor
from opentelemetry.instrumentation.psycopg import PsycopgInstrumentor
from opentelemetry.sdk.resources import SERVICE_NAME, Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

# Import the LangGraph Origin Calculation Engine
from src.graph.origin_calculation_graph_v2 import OriginCalculationGraph

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Environment variables
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
POSTGRES_DB = os.getenv("POSTGRES_DB", "langgraph")
POSTGRES_USER = os.getenv("POSTGRES_USER", "postgres")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "postgres")
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = os.getenv("REDIS_PORT", "6379")
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", "")
REDIS_DB = os.getenv("REDIS_DB", "0")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")
OTLP_ENDPOINT = os.getenv("OTLP_ENDPOINT", "http://jaeger:4317")
SERVICE_VERSION = os.getenv("SERVICE_VERSION", "v1")

# Setup OpenTelemetry
resource = Resource(attributes={
    SERVICE_NAME: "origin-calculation-engine",
    "service.version": SERVICE_VERSION,
    "deployment.environment": os.getenv("ENVIRONMENT", "production"),
})

trace_provider = TracerProvider(resource=resource)
otlp_exporter = OTLPSpanExporter(endpoint=OTLP_ENDPOINT, insecure=True)
trace_provider.add_span_processor(BatchSpanProcessor(otlp_exporter))
trace.set_tracer_provider(trace_provider)

tracer = trace.get_tracer(__name__)

# Create FastAPI app
app = FastAPI(
    title="Origin Calculation Engine API",
    description="API for calculating product origin based on components and manufacturing processes",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instrument FastAPI
FastAPIInstrumentor.instrument_app(app)

# Redis client for caching
redis_client = redis.Redis(
    host=REDIS_HOST,
    port=int(REDIS_PORT),
    password=REDIS_PASSWORD,
    db=int(REDIS_DB),
    decode_responses=True,
)

# Instrument Redis
RedisInstrumentor().instrument()

# Postgres connection pool
postgres_dsn = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
pool = AsyncConnectionPool(postgres_dsn, min_size=5, max_size=20)

# Instrument Psycopg
PsycopgInstrumentor().instrument()

# Create the Origin Calculation Graph
origin_graph = OriginCalculationGraph()

# Pydantic models
class Material(BaseModel):
    id: str
    name: str
    origin: str
    value: float
    quantity: float

class Product(BaseModel):
    id: str
    name: str
    hs_code: str
    materials: List[Material]
    ex_works_price: float

class ManufacturingProcess(BaseModel):
    id: str
    name: str
    description: str
    location: str
    value_added: float
    substantial_transformation: bool = False

class OriginCalculationRequest(BaseModel):
    product: Product
    origin_country: str
    destination_country: str
    trade_agreement: str

class OriginResult(BaseModel):
    qualifies: bool
    origin: str
    rule_applied: str
    non_originating_value: float
    non_originating_percentage: float
    explanation: str

class PerformanceMetrics(BaseModel):
    total_time_ms: int
    rule_retrieval_time_ms: int
    calculation_time_ms: int
    explanation_time_ms: int

class OriginCalculationResponse(BaseModel):
    result: OriginResult
    calculation_id: str
    timestamp: str
    performance: PerformanceMetrics

@app.on_event("startup")
async def startup_event():
    """Initialize the application on startup."""
    with tracer.start_as_current_span("app_startup"):
        # Setup the checkpointer
        await origin_graph.setup_checkpointer(pool)
        logger.info("Application started")

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown."""
    with tracer.start_as_current_span("app_shutdown"):
        # Close the connection pool
        await pool.close()
        logger.info("Application shutdown")

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    with tracer.start_as_current_span("health_check"):
        # Check Redis connection
        try:
            redis_client.ping()
        except Exception as e:
            logger.error(f"Redis health check failed: {e}")
            return JSONResponse(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                content={"status": "unhealthy", "details": {"redis": str(e)}},
            )
        
        # Check Postgres connection
        try:
            async with pool.connection() as conn:
                await conn.execute("SELECT 1")
        except Exception as e:
            logger.error(f"Postgres health check failed: {e}")
            return JSONResponse(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                content={"status": "unhealthy", "details": {"postgres": str(e)}},
            )
        
        return {"status": "healthy"}

@app.post("/api/v1/origin/calculate", response_model=OriginCalculationResponse)
async def calculate_origin(request: OriginCalculationRequest):
    """Calculate the origin of a product."""
    with tracer.start_as_current_span("calculate_origin") as span:
        span.set_attribute("product.id", request.product.id)
        span.set_attribute("product.hs_code", request.product.hs_code)
        span.set_attribute("origin_country", request.origin_country)
        span.set_attribute("destination_country", request.destination_country)
        span.set_attribute("trade_agreement", request.trade_agreement)
        
        start_time = time.time()
        
        # Check cache first
        cache_key = f"origin:{request.product.id}:{request.origin_country}:{request.destination_country}:{request.trade_agreement}"
        with tracer.start_as_current_span("check_cache"):
            cached_result = redis_client.get(cache_key)
            if cached_result:
                logger.info(f"Cache hit for {cache_key}")
                span.set_attribute("cache.hit", True)
                return json.loads(cached_result)
        
        span.set_attribute("cache.hit", False)
        
        # Convert request to input format for the graph
        with tracer.start_as_current_span("prepare_input"):
            input_data = {
                "product_code": request.product.id,
                "components": [
                    {
                        "id": material.id,
                        "name": material.name,
                        "value": material.value,
                        "quantity": material.quantity,
                        "origin_country": material.origin,
                    }
                    for material in request.product.materials
                ],
                "manufacturing_processes": [
                    {
                        "id": process.id,
                        "name": process.name,
                        "description": process.description,
                        "location": process.location,
                        "value_added": process.value_added,
                        "substantial_transformation": process.substantial_transformation,
                    }
                    for process in request.manufacturing_processes
                ],
                "trade_agreement": request.trade_agreement,
            }
        
        # Invoke the graph
        with tracer.start_as_current_span("invoke_graph"):
            try:
                result = await origin_graph.ainvoke(input_data)
            except Exception as e:
                logger.error(f"Error invoking graph: {e}")
                span.record_exception(e)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Error calculating origin: {str(e)}",
                )
        
        # Check for errors
        if result.get("error"):
            logger.error(f"Error in graph execution: {result['error']}")
            span.set_attribute("error", True)
            span.set_attribute("error.message", result["error"])
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error calculating origin: {result['error']}",
            )
        
        # Extract the origin report
        with tracer.start_as_current_span("format_response"):
            origin_report = result.get("origin_report")
            if not origin_report:
                logger.error("No origin report in result")
                span.set_attribute("error", True)
                span.set_attribute("error.message", "No origin report in result")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Error calculating origin: No origin report generated",
                )
            
            # Calculate performance metrics
            end_time = time.time()
            total_time_ms = int((end_time - start_time) * 1000)
            
            telemetry = result.get("telemetry", {})
            rule_retrieval_time_ms = int(telemetry.get("rule_retrieval_time", 0) * 1000)
            calculation_time_ms = int(telemetry.get("total_processing_time", 0) * 1000)
            explanation_time_ms = int(telemetry.get("report_generation_time", 0) * 1000)
            
            # Create response
            response = {
                "result": {
                    "qualifies": origin_report.is_preferential,
                    "origin": origin_report.origin_country,
                    "rule_applied": ", ".join(result.get("origin_determination", {}).get("applicable_rules", [])),
                    "non_originating_value": result.get("component_analysis", {}).get("non_originating_value", 0),
                    "non_originating_percentage": result.get("component_analysis", {}).get("non_originating_percentage", 0),
                    "explanation": origin_report.detailed_justification,
                },
                "calculation_id": result.get("thread_id", str(uuid.uuid4())),
                "timestamp": result.get("telemetry", {}).get("end_time", time.strftime("%Y-%m-%dT%H:%M:%SZ")),
                "performance": {
                    "total_time_ms": total_time_ms,
                    "rule_retrieval_time_ms": rule_retrieval_time_ms,
                    "calculation_time_ms": calculation_time_ms,
                    "explanation_time_ms": explanation_time_ms,
                },
            }
            
            # Cache the result
            with tracer.start_as_current_span("cache_result"):
                redis_client.setex(
                    cache_key,
                    3600,  # Cache for 1 hour
                    json.dumps(response),
                )
            
            span.set_attribute("total_time_ms", total_time_ms)
            return response

@app.post("/api/v1/origin/calculate/stream")
async def calculate_origin_stream(request: OriginCalculationRequest):
    """Calculate the origin of a product with streaming updates."""
    with tracer.start_as_current_span("calculate_origin_stream") as span:
        span.set_attribute("product.id", request.product.id)
        span.set_attribute("product.hs_code", request.product.hs_code)
        span.set_attribute("origin_country", request.origin_country)
        span.set_attribute("destination_country", request.destination_country)
        span.set_attribute("trade_agreement", request.trade_agreement)
        
        # Convert request to input format for the graph
        with tracer.start_as_current_span("prepare_input"):
            input_data = {
                "product_code": request.product.id,
                "components": [
                    {
                        "id": material.id,
                        "name": material.name,
                        "value": material.value,
                        "quantity": material.quantity,
                        "origin_country": material.origin,
                    }
                    for material in request.product.materials
                ],
                "manufacturing_processes": [
                    {
                        "id": process.id,
                        "name": process.name,
                        "description": process.description,
                        "location": process.location,
                        "value_added": process.value_added,
                        "substantial_transformation": process.substantial_transformation,
                    }
                    for process in request.manufacturing_processes
                ],
                "trade_agreement": request.trade_agreement,
            }
        
        async def event_generator():
            try:
                async for update in origin_graph.astream(input_data):
                    with tracer.start_as_current_span("process_stream_update"):
                        # Format the update as a server-sent event
                        yield f"data: {json.dumps(update)}\n\n"
            except Exception as e:
                logger.error(f"Error in stream: {e}")
                span.record_exception(e)
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
        
        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
        )

@app.get("/api/v1/origin/history/{product_id}")
async def get_calculation_history(product_id: str):
    """Get the calculation history for a product."""
    with tracer.start_as_current_span("get_calculation_history") as span:
        span.set_attribute("product.id", product_id)
        
        # Query the database for calculation history
        with tracer.start_as_current_span("query_database"):
            try:
                async with pool.connection() as conn:
                    result = await conn.fetch(
                        """
                        SELECT 
                            id, 
                            created_at, 
                            data->'origin_report'->>'origin_country' as origin,
                            data->'origin_report'->>'is_preferential' as qualifies,
                            data->'trade_agreement' as trade_agreement,
                            data->'destination_country' as destination_country
                        FROM langgraph_checkpoints
                        WHERE data->>'product_code' = $1
                        ORDER BY created_at DESC
                        LIMIT 100
                        """,
                        product_id,
                    )
            except Exception as e:
                logger.error(f"Error querying calculation history: {e}")
                span.record_exception(e)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Error retrieving calculation history: {str(e)}",
                )
        
        # Format the response
        with tracer.start_as_current_span("format_response"):
            calculations = [
                {
                    "calculation_id": str(row["id"]),
                    "timestamp": row["created_at"].isoformat(),
                    "qualifies": row["qualifies"] == "true",
                    "origin": row["origin"],
                    "trade_agreement": row["trade_agreement"],
                    "destination_country": row["destination_country"],
                }
                for row in result
            ]
            
            return {
                "product_id": product_id,
                "calculations": calculations,
            }

@app.get("/api/v1/origin/calculation/{calculation_id}")
async def get_calculation_details(calculation_id: str):
    """Get the details of a specific calculation."""
    with tracer.start_as_current_span("get_calculation_details") as span:
        span.set_attribute("calculation.id", calculation_id)
        
        # Get the thread from the checkpointer
        with tracer.start_as_current_span("get_thread"):
            try:
                thread = await origin_graph.get_thread(calculation_id)
            except Exception as e:
                logger.error(f"Error getting thread {calculation_id}: {e}")
                span.record_exception(e)
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Calculation not found: {str(e)}",
                )
        
        # Format the response
        with tracer.start_as_current_span("format_response"):
            # Extract the relevant data
            product_code = thread.get("product_code", "")
            components = thread.get("components", [])
            manufacturing_processes = thread.get("manufacturing_processes", [])
            trade_agreement = thread.get("trade_agreement", "")
            origin_determination = thread.get("origin_determination", {})
            preferential_status = thread.get("preferential_status", {})
            origin_report = thread.get("origin_report", {})
            telemetry = thread.get("telemetry", {})
            node_times = thread.get("node_times", {})
            
            # Create the audit trail
            audit_trail = []
            for node, start_time in node_times.items():
                node_time = telemetry.get(f"{node}_time", 0)
                end_time = start_time + node_time
                
                audit_trail.append({
                    "step": node,
                    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S.%fZ", time.gmtime(start_time)),
                    "status": "success" if node_time > 0 else "unknown",
                    "details": telemetry.get(f"{node}_details", ""),
                })
            
            # Sort audit trail by timestamp
            audit_trail.sort(key=lambda x: x["timestamp"])
            
            # Calculate performance metrics
            total_time_ms = int(telemetry.get("total_processing_time", 0) * 1000)
            rule_retrieval_time_ms = int(telemetry.get("rule_retrieval_time", 0) * 1000)
            calculation_time_ms = int((telemetry.get("component_analysis_time", 0) + telemetry.get("manufacturing_analysis_time", 0) + telemetry.get("origin_determination_time", 0)) * 1000)
            explanation_time_ms = int(telemetry.get("report_generation_time", 0) * 1000)
            
            # Create the response
            return {
                "calculation_id": calculation_id,
                "timestamp": telemetry.get("end_time", ""),
                "product": {
                    "id": product_code,
                    "name": f"Product {product_code}",
                    "hs_code": components[0].get("hs_code", "") if components else "",
                    "materials": [
                        {
                            "id": component.get("id", ""),
                            "name": component.get("name", ""),
                            "origin": component.get("origin_country", ""),
                            "value": component.get("value", 0),
                            "quantity": component.get("quantity", 0),
                        }
                        for component in components
                    ],
                    "ex_works_price": sum(component.get("value", 0) * component.get("quantity", 0) for component in components),
                },
                "origin_country": origin_determination.get("origin_country", ""),
                "destination_country": thread.get("destination_country", ""),
                "trade_agreement": trade_agreement,
                "result": {
                    "qualifies": preferential_status.get("is_preferential", False),
                    "origin": origin_determination.get("origin_country", ""),
                    "rule_applied": ", ".join(origin_determination.get("applicable_rules", [])),
                    "non_originating_value": thread.get("component_analysis", {}).get("non_originating_value", 0),
                    "non_originating_percentage": thread.get("component_analysis", {}).get("non_originating_percentage", 0),
                    "explanation": origin_report.get("detailed_justification", ""),
                },
                "audit_trail": audit_trail,
                "performance": {
                    "total_time_ms": total_time_ms,
                    "rule_retrieval_time_ms": rule_retrieval_time_ms,
                    "calculation_time_ms": calculation_time_ms,
                    "explanation_time_ms": explanation_time_ms,
                },
            }

@app.get("/metrics")
async def get_metrics():
    """Get application metrics."""
    with tracer.start_as_current_span("get_metrics"):
        # This endpoint will be scraped by Prometheus
        # The metrics are automatically collected by the OpenTelemetry instrumentation
        return Response(content="", media_type="text/plain")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

#### 3.2 Update Docker Compose File for LangGraph with Jaeger

Bestandslocatie: `/home/ubuntu/sevensa_implementation/code/langgraph/docker-compose.yml`

```yaml
version: '3.8'

services:
  langgraph-api:
    image: ${IMAGE_REPOSITORY}/langgraph-api:${LANGGRAPH_VERSION}
    container_name: langgraph-api
    build:
      context: .
      dockerfile: Dockerfile
    restart: unless-stopped
    environment:
      # Common environment variables
      - SERVICE_NAME=langgraph-api
      - ENVIRONMENT=${ENVIRONMENT:-production}
      - LOG_LEVEL=${LOG_LEVEL:-info}
      # OpenBao integration
      - OPENBAO_ADDR=${OPENBAO_ADDR}
      - OPENBAO_ROLE_ID=${LANGGRAPH_OPENBAO_ROLE_ID}
      - OPENBAO_SECRET_ID=${LANGGRAPH_OPENBAO_SECRET_ID}
      # Database configuration
      - POSTGRES_HOST=langgraph-db
      - POSTGRES_PORT=5432
      - POSTGRES_DB=langgraph
      - POSTGRES_USER=langgraph
      - POSTGRES_PASSWORD=${LANGGRAPH_DB_PASSWORD}
      # Redis configuration
      - REDIS_HOST=langgraph-cache
      - REDIS_PORT=6379
      - REDIS_PASSWORD=${LANGGRAPH_REDIS_PASSWORD}
      - REDIS_DB=0
      # OpenAI configuration
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - MODEL_NAME=${LANGGRAPH_MODEL_NAME:-gpt-4o}
      # Feature flags
      - CACHE_ENABLED=true
      - PARALLEL_PROCESSING=true
      - DEBUG_MODE=${DEBUG_MODE:-false}
      - TELEMETRY_ENABLED=true
      # OpenTelemetry configuration
      - OTLP_ENDPOINT=http://jaeger:4317
      - SERVICE_VERSION=${LANGGRAPH_VERSION}
    volumes:
      - ${CONFIG_DIR}/langgraph/config:/app/config:ro
      - ${LOG_DIR}/langgraph/logs:/app/logs
    networks:
      - langgraph-network
      - traefik-network
      - monitoring-network
    depends_on:
      - langgraph-db
      - langgraph-cache
      - jaeger
    deploy:
      resources:
        limits:
          cpus: '${LANGGRAPH_API_CPU_LIMIT:-1.0}'
          memory: ${LANGGRAPH_API_MEMORY_LIMIT:-2G}
        reservations:
          cpus: '${LANGGRAPH_API_CPU_RESERVATION:-0.2}'
          memory: ${LANGGRAPH_API_MEMORY_RESERVATION:-512M}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    labels:
      # Common labels
      - "sevensa.service=langgraph-api"
      - "sevensa.environment=${ENVIRONMENT:-production}"
      # Traefik labels
      - "traefik.enable=true"
      - "traefik.http.routers.langgraph-api.rule=Host(`psra.sevensa.nl`) && PathPrefix(`/api/v1/origin`)"
      - "traefik.http.routers.langgraph-api.entrypoints=websecure"
      - "traefik.http.routers.langgraph-api.tls=true"
      - "traefik.http.routers.langgraph-api.tls.certresolver=letsencrypt"
      - "traefik.http.services.langgraph-api.loadbalancer.server.port=8000"
      # Prometheus labels
      - "prometheus.scrape=true"
      - "prometheus.port=8000"
      - "prometheus.path=/metrics"

  langgraph-db:
    image: postgres:14-alpine
    container_name: langgraph-db
    restart: unless-stopped
    environment:
      - POSTGRES_PASSWORD=${LANGGRAPH_DB_PASSWORD}
      - POSTGRES_USER=langgraph
      - POSTGRES_DB=langgraph
    volumes:
      - ${DATA_DIR}/langgraph/db:/var/lib/postgresql/data
    networks:
      - langgraph-network
    deploy:
      resources:
        limits:
          cpus: '${LANGGRAPH_DB_CPU_LIMIT:-1.0}'
          memory: ${LANGGRAPH_DB_MEMORY_LIMIT:-1G}
        reservations:
          cpus: '${LANGGRAPH_DB_CPU_RESERVATION:-0.2}'
          memory: ${LANGGRAPH_DB_MEMORY_RESERVATION:-256M}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U langgraph"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 40s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    labels:
      - "sevensa.service=langgraph-db"
      - "sevensa.environment=${ENVIRONMENT:-production}"

  langgraph-cache:
    image: redis:7-alpine
    container_name: langgraph-cache
    restart: unless-stopped
    command: ["redis-server", "--appendonly", "yes", "--requirepass", "${LANGGRAPH_REDIS_PASSWORD}"]
    volumes:
      - ${DATA_DIR}/langgraph/redis:/data
    networks:
      - langgraph-network
    deploy:
      resources:
        limits:
          cpus: '${LANGGRAPH_CACHE_CPU_LIMIT:-0.5}'
          memory: ${LANGGRAPH_CACHE_MEMORY_LIMIT:-512M}
        reservations:
          cpus: '${LANGGRAPH_CACHE_CPU_RESERVATION:-0.1}'
          memory: ${LANGGRAPH_CACHE_MEMORY_RESERVATION:-128M}
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${LANGGRAPH_REDIS_PASSWORD}", "ping"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 20s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    labels:
      - "sevensa.service=langgraph-cache"
      - "sevensa.environment=${ENVIRONMENT:-production}"

  jaeger:
    image: jaegertracing/all-in-one:latest
    container_name: langgraph-jaeger
    restart: unless-stopped
    environment:
      - COLLECTOR_OTLP_ENABLED=true
    ports:
      - "16686:16686"  # UI
      - "4317:4317"    # OTLP gRPC
      - "4318:4318"    # OTLP HTTP
    networks:
      - langgraph-network
      - monitoring-network
    deploy:
      resources:
        limits:
          cpus: '${JAEGER_CPU_LIMIT:-0.5}'
          memory: ${JAEGER_MEMORY_LIMIT:-512M}
        reservations:
          cpus: '${JAEGER_CPU_RESERVATION:-0.1}'
          memory: ${JAEGER_MEMORY_RESERVATION:-128M}
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    labels:
      - "sevensa.service=langgraph-jaeger"
      - "sevensa.environment=${ENVIRONMENT:-production}"
      - "traefik.enable=true"
      - "traefik.http.routers.jaeger.rule=Host(`jaeger.sevensa.nl`)"
      - "traefik.http.routers.jaeger.entrypoints=websecure"
      - "traefik.http.routers.jaeger.tls=true"
      - "traefik.http.routers.jaeger.tls.certresolver=letsencrypt"
      - "traefik.http.services.jaeger.loadbalancer.server.port=16686"

networks:
  langgraph-network:
    name: langgraph-network
    driver: bridge
    internal: true
    labels:
      - "sevensa.service=langgraph"
      - "sevensa.network.type=service"
  
  traefik-network:
    external: true
  
  monitoring-network:
    external: true
```

#### 3.3 Update requirements.txt for LangGraph with OpenTelemetry

Bestandslocatie: `/home/ubuntu/sevensa_implementation/code/langgraph/requirements.txt`

```
# Core dependencies
fastapi>=0.104.0
uvicorn>=0.23.2
pydantic>=2.4.2
langchain>=0.0.335
langchain-core>=0.1.7
langgraph>=0.0.20
langchain-openai>=0.0.2
psycopg>=3.1.12
psycopg-pool>=3.1.8
redis>=5.0.0
tenacity>=8.2.3
numpy>=1.24.3

# OpenTelemetry dependencies
opentelemetry-api>=1.20.0
opentelemetry-sdk>=1.20.0
opentelemetry-exporter-otlp>=1.20.0
opentelemetry-instrumentation-fastapi>=0.40b0
opentelemetry-instrumentation-redis>=0.40b0
opentelemetry-instrumentation-psycopg>=0.40b0

# Development dependencies
pytest>=7.4.0
pytest-asyncio>=0.21.1
black>=23.7.0
isort>=5.12.0
mypy>=1.5.1
```
