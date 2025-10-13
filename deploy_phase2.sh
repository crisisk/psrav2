#!/bin/bash

# Deployment Script for Phase 2: Zero-Trust Network Architecture
# This script deploys the Zero-Trust Network Architecture for the Sevensa platform

set -e

# Configuration
BASE_DIR="/opt/sevensa"
NETWORKS_DIR="${BASE_DIR}/networks"
TRAEFIK_DIR="${BASE_DIR}/traefik"
OAUTH2_PROXY_DIR="${BASE_DIR}/oauth2-proxy"
KEYCLOAK_DIR="${BASE_DIR}/keycloak"
SECRETS_DIR="${BASE_DIR}/secrets"
LOG_FILE="/var/log/sevensa/phase2_deployment.log"

# Create log directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

# Function to log messages
log() {
  local timestamp
  timestamp=$(date +"%Y-%m-%d %H:%M:%S")
  echo "[$timestamp] $1" | tee -a "$LOG_FILE"
}

# Function to create directory if it doesn't exist
create_dir() {
  local dir="$1"
  if [ ! -d "$dir" ]; then
    log "Creating directory: $dir"
    mkdir -p "$dir"
  fi
}

# Function to copy files
copy_files() {
  local src="$1"
  local dest="$2"
  log "Copying files from $src to $dest"
  cp -r "$src"/* "$dest"/
}

# Function to generate a random password
generate_password() {
  local length="$1"
  tr -dc 'A-Za-z0-9!#$%&()*+,-./:;<=>?@[\]^_`{|}~' < /dev/urandom | head -c "$length"
}

# Function to create a secret file
create_secret() {
  local secret_file="$1"
  local secret_value="$2"
  
  if [ ! -f "$secret_file" ]; then
    log "Creating secret file: $secret_file"
    echo "$secret_value" > "$secret_file"
    chmod 600 "$secret_file"
  else
    log "Secret file already exists: $secret_file"
  fi
}

# Function to deploy networks
deploy_networks() {
  log "Deploying networks"
  
  # Create networks directory
  create_dir "$NETWORKS_DIR"
  
  # Copy networks configuration
  copy_files "/home/ubuntu/sevensa_implementation/phase2/networks" "$NETWORKS_DIR"
  
  # Make scripts executable
  chmod +x "$NETWORKS_DIR"/initialize_networks.sh
  
  # Initialize networks
  log "Initializing networks"
  "$NETWORKS_DIR"/initialize_networks.sh create
  
  # Verify network isolation
  log "Verifying network isolation"
  "$NETWORKS_DIR"/initialize_networks.sh verify
}

# Function to deploy Traefik
deploy_traefik() {
  log "Deploying Traefik"
  
  # Create Traefik directories
  create_dir "$TRAEFIK_DIR"
  create_dir "$TRAEFIK_DIR/dynamic"
  create_dir "$TRAEFIK_DIR/data"
  create_dir "$TRAEFIK_DIR/certs"
  create_dir "$TRAEFIK_DIR/logs"
  
  # Copy Traefik configuration
  copy_files "/home/ubuntu/sevensa_implementation/phase2/traefik" "$TRAEFIK_DIR"
  
  # Generate default certificate if it doesn't exist
  if [ ! -f "$TRAEFIK_DIR/certs/default.crt" ]; then
    log "Generating default certificate"
    openssl req -x509 -nodes -days 365 -newkey rsa:4096 \
      -keyout "$TRAEFIK_DIR/certs/default.key" \
      -out "$TRAEFIK_DIR/certs/default.crt" \
      -subj "/CN=sevensa.nl/O=Sevensa/C=NL"
  fi
  
  # Deploy Traefik
  log "Starting Traefik"
  docker-compose -f "$TRAEFIK_DIR/docker-compose.traefik.yml" up -d
}

# Function to deploy OAuth2 Proxy
deploy_oauth2_proxy() {
  log "Deploying OAuth2 Proxy"
  
  # Create OAuth2 Proxy directories
  create_dir "$OAUTH2_PROXY_DIR"
  create_dir "$OAUTH2_PROXY_DIR/templates"
  create_dir "$OAUTH2_PROXY_DIR/secrets"
  
  # Copy OAuth2 Proxy configuration
  copy_files "/home/ubuntu/sevensa_implementation/phase2/oauth2-proxy" "$OAUTH2_PROXY_DIR"
  
  # Generate OAuth2 Proxy secrets if they don't exist
  create_secret "$OAUTH2_PROXY_DIR/secrets/client_secret.txt" "$(generate_password 32)"
  create_secret "$OAUTH2_PROXY_DIR/secrets/cookie_secret.txt" "$(generate_password 32)"
  
  # Deploy OAuth2 Proxy
  log "Starting OAuth2 Proxy"
  docker-compose -f "$OAUTH2_PROXY_DIR/docker-compose.oauth2-proxy.yml" up -d
}

# Function to deploy Keycloak configuration
deploy_keycloak_config() {
  log "Deploying Keycloak configuration"
  
  # Create Keycloak directory
  create_dir "$KEYCLOAK_DIR"
  
  # Copy Keycloak configuration
  copy_files "/home/ubuntu/sevensa_implementation/phase2/keycloak" "$KEYCLOAK_DIR"
  
  # Import Keycloak realm
  log "Importing Keycloak realm"
  # This would typically be done using the Keycloak API or CLI
  # For now, we'll just log that it would be done
  log "Keycloak realm would be imported here"
}

# Function to deploy service with ZTNA
deploy_service() {
  local service="$1"
  local service_dir="${BASE_DIR}/${service}"
  local secrets_dir="${SECRETS_DIR}/${service}"
  
  log "Deploying $service with ZTNA"
  
  # Create service directories
  create_dir "$service_dir"
  create_dir "$service_dir/data"
  create_dir "$secrets_dir"
  
  # Generate service secrets if they don't exist
  create_secret "$secrets_dir/db_password.txt" "$(generate_password 32)"
  create_secret "$secrets_dir/redis_password.txt" "$(generate_password 32)"
  create_secret "$secrets_dir/jwt_secret.txt" "$(generate_password 64)"
  create_secret "$secrets_dir/keycloak_client_secret.txt" "$(generate_password 32)"
  
  # Additional secrets for specific services
  if [ "$service" = "psra" ] || [ "$service" = "ai" ]; then
    create_secret "$secrets_dir/openai_api_key.txt" "sk-example-openai-api-key"
  fi
  
  if [ "$service" = "wpcs" ]; then
    create_secret "$secrets_dir/db_root_password.txt" "$(generate_password 32)"
  fi
  
  if [ "$service" = "ai" ]; then
    create_secret "$secrets_dir/n8n_encryption_key.txt" "$(generate_password 32)"
    create_secret "$secrets_dir/n8n_admin_password.txt" "$(generate_password 16)"
  fi
  
  # Copy service configuration
  cp "$NETWORKS_DIR/docker-compose.${service}.yml" "$service_dir/"
  
  # Deploy service
  log "Starting $service"
  docker-compose -f "$service_dir/docker-compose.${service}.yml" up -d
}

# Main function
main() {
  log "Starting Phase 2 deployment: Zero-Trust Network Architecture"
  
  # Create base directories
  create_dir "$BASE_DIR"
  create_dir "$SECRETS_DIR"
  
  # Deploy networks
  deploy_networks
  
  # Deploy Traefik
  deploy_traefik
  
  # Deploy OAuth2 Proxy
  deploy_oauth2_proxy
  
  # Deploy Keycloak configuration
  deploy_keycloak_config
  
  # Deploy services with ZTNA
  deploy_service "rentguy"
  deploy_service "psra"
  deploy_service "wpcs"
  deploy_service "ai"
  
  log "Phase 2 deployment completed successfully"
}

# Execute main function
main
