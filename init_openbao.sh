#!/bin/bash

# OpenBao Bootstrap Script
# This script initializes OpenBao with the necessary configuration for the Sevensa platform

set -e

# Configuration
OPENBAO_ADDR=${OPENBAO_ADDR:-"http://localhost:8200"}
OPENBAO_TOKEN=${OPENBAO_TOKEN:-""}
CONFIG_DIR=${CONFIG_DIR:-"/opt/sevensa/openbao/config"}
POLICIES_DIR=${CONFIG_DIR}/policies
LOG_FILE=${LOG_FILE:-"/var/log/sevensa/openbao_bootstrap.log"}

# Create log directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

# Function to log messages
log() {
  local timestamp
  timestamp=$(date +"%Y-%m-%d %H:%M:%S")
  echo "[$timestamp] $1" | tee -a "$LOG_FILE"
}

# Function to check if OpenBao is initialized
check_initialized() {
  log "Checking if OpenBao is initialized"
  local initialized
  initialized=$(curl -s "${OPENBAO_ADDR}/v1/sys/init" | jq -r '.initialized')
  if [ "$initialized" = "true" ]; then
    log "OpenBao is already initialized"
    return 0
  else
    log "OpenBao is not initialized"
    return 1
  fi
}

# Function to initialize OpenBao
initialize_openbao() {
  log "Initializing OpenBao"
  local init_response
  init_response=$(curl -s -X PUT "${OPENBAO_ADDR}/v1/sys/init" \
    -d '{"secret_shares": 5, "secret_threshold": 3}')
  
  # Extract keys and token
  local keys
  local root_token
  keys=$(echo "$init_response" | jq -r '.keys_base64[]')
  root_token=$(echo "$init_response" | jq -r '.root_token')
  
  # Save keys and token to files
  log "Saving keys and token to files"
  mkdir -p "${CONFIG_DIR}/keys"
  echo "$keys" > "${CONFIG_DIR}/keys/keys.txt"
  echo "$root_token" > "${CONFIG_DIR}/keys/root_token.txt"
  
  # Set permissions
  chmod 600 "${CONFIG_DIR}/keys/keys.txt"
  chmod 600 "${CONFIG_DIR}/keys/root_token.txt"
  
  # Set token for further operations
  OPENBAO_TOKEN="$root_token"
  
  log "OpenBao initialized successfully"
}

# Function to unseal OpenBao
unseal_openbao() {
  log "Unsealing OpenBao"
  local keys
  keys=$(cat "${CONFIG_DIR}/keys/keys.txt")
  
  # Use the first 3 keys to unseal
  local i=0
  for key in $keys; do
    if [ "$i" -lt 3 ]; then
      log "Applying unseal key $((i+1))"
      curl -s -X PUT "${OPENBAO_ADDR}/v1/sys/unseal" \
        -d "{\"key\": \"$key\"}"
      i=$((i+1))
    else
      break
    fi
  done
  
  log "OpenBao unsealed successfully"
}

# Function to enable audit logging
enable_audit_logging() {
  log "Enabling audit logging"
  curl -s -X PUT "${OPENBAO_ADDR}/v1/sys/audit/file" \
    -H "X-Vault-Token: ${OPENBAO_TOKEN}" \
    -d '{"type": "file", "options": {"file_path": "/var/log/openbao/audit.log"}}'
  
  log "Audit logging enabled successfully"
}

# Function to enable KV v2 secrets engine
enable_kv_secrets_engine() {
  log "Enabling KV v2 secrets engine"
  curl -s -X POST "${OPENBAO_ADDR}/v1/sys/mounts/kv" \
    -H "X-Vault-Token: ${OPENBAO_TOKEN}" \
    -d '{"type": "kv", "options": {"version": "2"}}'
  
  log "KV v2 secrets engine enabled successfully"
}

# Function to enable Transit secrets engine
enable_transit_secrets_engine() {
  log "Enabling Transit secrets engine"
  curl -s -X POST "${OPENBAO_ADDR}/v1/sys/mounts/transit" \
    -H "X-Vault-Token: ${OPENBAO_TOKEN}" \
    -d '{"type": "transit"}'
  
  log "Transit secrets engine enabled successfully"
}

# Function to enable PKI secrets engine
enable_pki_secrets_engine() {
  log "Enabling PKI secrets engine"
  curl -s -X POST "${OPENBAO_ADDR}/v1/sys/mounts/pki" \
    -H "X-Vault-Token: ${OPENBAO_TOKEN}" \
    -d '{"type": "pki", "config": {"max_lease_ttl": "87600h"}}'
  
  log "PKI secrets engine enabled successfully"
}

# Function to enable Database secrets engine
enable_database_secrets_engine() {
  log "Enabling Database secrets engine"
  curl -s -X POST "${OPENBAO_ADDR}/v1/sys/mounts/database" \
    -H "X-Vault-Token: ${OPENBAO_TOKEN}" \
    -d '{"type": "database"}'
  
  log "Database secrets engine enabled successfully"
}

# Function to enable AppRole auth method
enable_approle_auth_method() {
  log "Enabling AppRole auth method"
  curl -s -X POST "${OPENBAO_ADDR}/v1/sys/auth/approle" \
    -H "X-Vault-Token: ${OPENBAO_TOKEN}" \
    -d '{"type": "approle"}'
  
  log "AppRole auth method enabled successfully"
}

# Function to create policies
create_policies() {
  log "Creating policies"
  
  # Create admin policy
  log "Creating admin policy"
  curl -s -X PUT "${OPENBAO_ADDR}/v1/sys/policies/acl/admin" \
    -H "X-Vault-Token: ${OPENBAO_TOKEN}" \
    -d @"${POLICIES_DIR}/admin-policy.hcl"
  
  # Create RentGuy policy
  log "Creating RentGuy policy"
  curl -s -X PUT "${OPENBAO_ADDR}/v1/sys/policies/acl/rentguy" \
    -H "X-Vault-Token: ${OPENBAO_TOKEN}" \
    -d @"${POLICIES_DIR}/rentguy-policy.hcl"
  
  # Create PSRA policy
  log "Creating PSRA policy"
  curl -s -X PUT "${OPENBAO_ADDR}/v1/sys/policies/acl/psra" \
    -H "X-Vault-Token: ${OPENBAO_TOKEN}" \
    -d @"${POLICIES_DIR}/psra-policy.hcl"
  
  # Create WPCS policy
  log "Creating WPCS policy"
  curl -s -X PUT "${OPENBAO_ADDR}/v1/sys/policies/acl/wpcs" \
    -H "X-Vault-Token: ${OPENBAO_TOKEN}" \
    -d @"${POLICIES_DIR}/wpcs-policy.hcl"
  
  # Create AI policy
  log "Creating AI policy"
  curl -s -X PUT "${OPENBAO_ADDR}/v1/sys/policies/acl/ai" \
    -H "X-Vault-Token: ${OPENBAO_TOKEN}" \
    -d @"${POLICIES_DIR}/ai-policy.hcl"
  
  log "Policies created successfully"
}

# Function to create AppRoles
create_approles() {
  log "Creating AppRoles"
  
  # Create RentGuy AppRole
  log "Creating RentGuy AppRole"
  curl -s -X POST "${OPENBAO_ADDR}/v1/auth/approle/role/rentguy" \
    -H "X-Vault-Token: ${OPENBAO_TOKEN}" \
    -d '{"policies": ["rentguy"], "token_ttl": "1h", "token_max_ttl": "24h"}'
  
  # Create PSRA AppRole
  log "Creating PSRA AppRole"
  curl -s -X POST "${OPENBAO_ADDR}/v1/auth/approle/role/psra" \
    -H "X-Vault-Token: ${OPENBAO_TOKEN}" \
    -d '{"policies": ["psra"], "token_ttl": "1h", "token_max_ttl": "24h"}'
  
  # Create WPCS AppRole
  log "Creating WPCS AppRole"
  curl -s -X POST "${OPENBAO_ADDR}/v1/auth/approle/role/wpcs" \
    -H "X-Vault-Token: ${OPENBAO_TOKEN}" \
    -d '{"policies": ["wpcs"], "token_ttl": "1h", "token_max_ttl": "24h"}'
  
  # Create AI AppRole
  log "Creating AI AppRole"
  curl -s -X POST "${OPENBAO_ADDR}/v1/auth/approle/role/ai" \
    -H "X-Vault-Token: ${OPENBAO_TOKEN}" \
    -d '{"policies": ["ai"], "token_ttl": "1h", "token_max_ttl": "24h"}'
  
  log "AppRoles created successfully"
}

# Function to create Transit keys
create_transit_keys() {
  log "Creating Transit keys"
  
  # Create RentGuy Transit keys
  log "Creating RentGuy Transit keys"
  curl -s -X POST "${OPENBAO_ADDR}/v1/transit/keys/rentguy-encryption" \
    -H "X-Vault-Token: ${OPENBAO_TOKEN}" \
    -d '{"type": "aes256-gcm96"}'
  
  curl -s -X POST "${OPENBAO_ADDR}/v1/transit/keys/rentguy-signing" \
    -H "X-Vault-Token: ${OPENBAO_TOKEN}" \
    -d '{"type": "ed25519"}'
  
  # Create PSRA Transit keys
  log "Creating PSRA Transit keys"
  curl -s -X POST "${OPENBAO_ADDR}/v1/transit/keys/psra-encryption" \
    -H "X-Vault-Token: ${OPENBAO_TOKEN}" \
    -d '{"type": "aes256-gcm96"}'
  
  curl -s -X POST "${OPENBAO_ADDR}/v1/transit/keys/psra-signing" \
    -H "X-Vault-Token: ${OPENBAO_TOKEN}" \
    -d '{"type": "ed25519"}'
  
  curl -s -X POST "${OPENBAO_ADDR}/v1/transit/keys/psra-origin-engine" \
    -H "X-Vault-Token: ${OPENBAO_TOKEN}" \
    -d '{"type": "aes256-gcm96"}'
  
  # Create WPCS Transit keys
  log "Creating WPCS Transit keys"
  curl -s -X POST "${OPENBAO_ADDR}/v1/transit/keys/wpcs-encryption" \
    -H "X-Vault-Token: ${OPENBAO_TOKEN}" \
    -d '{"type": "aes256-gcm96"}'
  
  curl -s -X POST "${OPENBAO_ADDR}/v1/transit/keys/wpcs-signing" \
    -H "X-Vault-Token: ${OPENBAO_TOKEN}" \
    -d '{"type": "ed25519"}'
  
  curl -s -X POST "${OPENBAO_ADDR}/v1/transit/keys/wpcs-site-manager" \
    -H "X-Vault-Token: ${OPENBAO_TOKEN}" \
    -d '{"type": "aes256-gcm96"}'
  
  # Create AI Transit keys
  log "Creating AI Transit keys"
  curl -s -X POST "${OPENBAO_ADDR}/v1/transit/keys/ai-encryption" \
    -H "X-Vault-Token: ${OPENBAO_TOKEN}" \
    -d '{"type": "aes256-gcm96"}'
  
  curl -s -X POST "${OPENBAO_ADDR}/v1/transit/keys/ai-signing" \
    -H "X-Vault-Token: ${OPENBAO_TOKEN}" \
    -d '{"type": "ed25519"}'
  
  curl -s -X POST "${OPENBAO_ADDR}/v1/transit/keys/ai-langgraph" \
    -H "X-Vault-Token: ${OPENBAO_TOKEN}" \
    -d '{"type": "aes256-gcm96"}'
  
  curl -s -X POST "${OPENBAO_ADDR}/v1/transit/keys/ai-n8n" \
    -H "X-Vault-Token: ${OPENBAO_TOKEN}" \
    -d '{"type": "aes256-gcm96"}'
  
  log "Transit keys created successfully"
}

# Function to create PKI roles
create_pki_roles() {
  log "Creating PKI roles"
  
  # Generate root CA
  log "Generating root CA"
  curl -s -X POST "${OPENBAO_ADDR}/v1/pki/root/generate/internal" \
    -H "X-Vault-Token: ${OPENBAO_TOKEN}" \
    -d '{"common_name": "Sevensa Root CA", "ttl": "87600h"}'
  
  # Configure PKI URLs
  log "Configuring PKI URLs"
  curl -s -X POST "${OPENBAO_ADDR}/v1/pki/config/urls" \
    -H "X-Vault-Token: ${OPENBAO_TOKEN}" \
    -d "{\"issuing_certificates\": \"${OPENBAO_ADDR}/v1/pki/ca\", \"crl_distribution_points\": \"${OPENBAO_ADDR}/v1/pki/crl\"}"
  
  # Create RentGuy PKI role
  log "Creating RentGuy PKI role"
  curl -s -X POST "${OPENBAO_ADDR}/v1/pki/roles/rentguy-service" \
    -H "X-Vault-Token: ${OPENBAO_TOKEN}" \
    -d '{"allowed_domains": "rentguy.sevensa.nl,onboarding.rentguy.sevensa.nl", "allow_subdomains": true, "max_ttl": "720h"}'
  
  # Create PSRA PKI role
  log "Creating PSRA PKI role"
  curl -s -X POST "${OPENBAO_ADDR}/v1/pki/roles/psra-service" \
    -H "X-Vault-Token: ${OPENBAO_TOKEN}" \
    -d '{"allowed_domains": "psra.sevensa.nl", "allow_subdomains": true, "max_ttl": "720h"}'
  
  # Create WPCS PKI role
  log "Creating WPCS PKI role"
  curl -s -X POST "${OPENBAO_ADDR}/v1/pki/roles/wpcs-service" \
    -H "X-Vault-Token: ${OPENBAO_TOKEN}" \
    -d '{"allowed_domains": "wpcs.sevensa.nl,*.wpcs.sevensa.nl", "allow_subdomains": true, "max_ttl": "720h"}'
  
  # Create AI PKI role
  log "Creating AI PKI role"
  curl -s -X POST "${OPENBAO_ADDR}/v1/pki/roles/ai-service" \
    -H "X-Vault-Token: ${OPENBAO_TOKEN}" \
    -d '{"allowed_domains": "ai.sevensa.nl", "allow_subdomains": true, "max_ttl": "720h"}'
  
  log "PKI roles created successfully"
}

# Function to create initial KV secrets
create_initial_secrets() {
  log "Creating initial KV secrets"
  
  # Create RentGuy secrets
  log "Creating RentGuy secrets"
  curl -s -X POST "${OPENBAO_ADDR}/v1/kv/data/rentguy/config" \
    -H "X-Vault-Token: ${OPENBAO_TOKEN}" \
    -d '{"data": {"environment": "production", "log_level": "info"}}'
  
  # Create PSRA secrets
  log "Creating PSRA secrets"
  curl -s -X POST "${OPENBAO_ADDR}/v1/kv/data/psra/config" \
    -H "X-Vault-Token: ${OPENBAO_TOKEN}" \
    -d '{"data": {"environment": "production", "log_level": "info"}}'
  
  # Create WPCS secrets
  log "Creating WPCS secrets"
  curl -s -X POST "${OPENBAO_ADDR}/v1/kv/data/wpcs/config" \
    -H "X-Vault-Token: ${OPENBAO_TOKEN}" \
    -d '{"data": {"environment": "production", "log_level": "info"}}'
  
  # Create AI secrets
  log "Creating AI secrets"
  curl -s -X POST "${OPENBAO_ADDR}/v1/kv/data/ai/config" \
    -H "X-Vault-Token: ${OPENBAO_TOKEN}" \
    -d '{"data": {"environment": "production", "log_level": "info"}}'
  
  log "Initial KV secrets created successfully"
}

# Function to get AppRole credentials
get_approle_credentials() {
  log "Getting AppRole credentials"
  
  # Create directory for AppRole credentials
  mkdir -p "${CONFIG_DIR}/approle"
  
  # Get RentGuy AppRole credentials
  log "Getting RentGuy AppRole credentials"
  local rentguy_role_id
  local rentguy_secret_id
  rentguy_role_id=$(curl -s -X GET "${OPENBAO_ADDR}/v1/auth/approle/role/rentguy/role-id" \
    -H "X-Vault-Token: ${OPENBAO_TOKEN}" | jq -r '.data.role_id')
  rentguy_secret_id=$(curl -s -X POST "${OPENBAO_ADDR}/v1/auth/approle/role/rentguy/secret-id" \
    -H "X-Vault-Token: ${OPENBAO_TOKEN}" | jq -r '.data.secret_id')
  
  echo "role_id: $rentguy_role_id" > "${CONFIG_DIR}/approle/rentguy.yml"
  echo "secret_id: $rentguy_secret_id" >> "${CONFIG_DIR}/approle/rentguy.yml"
  
  # Get PSRA AppRole credentials
  log "Getting PSRA AppRole credentials"
  local psra_role_id
  local psra_secret_id
  psra_role_id=$(curl -s -X GET "${OPENBAO_ADDR}/v1/auth/approle/role/psra/role-id" \
    -H "X-Vault-Token: ${OPENBAO_TOKEN}" | jq -r '.data.role_id')
  psra_secret_id=$(curl -s -X POST "${OPENBAO_ADDR}/v1/auth/approle/role/psra/secret-id" \
    -H "X-Vault-Token: ${OPENBAO_TOKEN}" | jq -r '.data.secret_id')
  
  echo "role_id: $psra_role_id" > "${CONFIG_DIR}/approle/psra.yml"
  echo "secret_id: $psra_secret_id" >> "${CONFIG_DIR}/approle/psra.yml"
  
  # Get WPCS AppRole credentials
  log "Getting WPCS AppRole credentials"
  local wpcs_role_id
  local wpcs_secret_id
  wpcs_role_id=$(curl -s -X GET "${OPENBAO_ADDR}/v1/auth/approle/role/wpcs/role-id" \
    -H "X-Vault-Token: ${OPENBAO_TOKEN}" | jq -r '.data.role_id')
  wpcs_secret_id=$(curl -s -X POST "${OPENBAO_ADDR}/v1/auth/approle/role/wpcs/secret-id" \
    -H "X-Vault-Token: ${OPENBAO_TOKEN}" | jq -r '.data.secret_id')
  
  echo "role_id: $wpcs_role_id" > "${CONFIG_DIR}/approle/wpcs.yml"
  echo "secret_id: $wpcs_secret_id" >> "${CONFIG_DIR}/approle/wpcs.yml"
  
  # Get AI AppRole credentials
  log "Getting AI AppRole credentials"
  local ai_role_id
  local ai_secret_id
  ai_role_id=$(curl -s -X GET "${OPENBAO_ADDR}/v1/auth/approle/role/ai/role-id" \
    -H "X-Vault-Token: ${OPENBAO_TOKEN}" | jq -r '.data.role_id')
  ai_secret_id=$(curl -s -X POST "${OPENBAO_ADDR}/v1/auth/approle/role/ai/secret-id" \
    -H "X-Vault-Token: ${OPENBAO_TOKEN}" | jq -r '.data.secret_id')
  
  echo "role_id: $ai_role_id" > "${CONFIG_DIR}/approle/ai.yml"
  echo "secret_id: $ai_secret_id" >> "${CONFIG_DIR}/approle/ai.yml"
  
  # Set permissions
  chmod 600 "${CONFIG_DIR}/approle/"*.yml
  
  log "AppRole credentials retrieved successfully"
}

# Main function
main() {
  log "Starting OpenBao bootstrap"
  
  # Check if OpenBao is initialized
  if ! check_initialized; then
    # Initialize OpenBao
    initialize_openbao
    
    # Unseal OpenBao
    unseal_openbao
  else
    # Load token from file
    if [ -f "${CONFIG_DIR}/keys/root_token.txt" ]; then
      OPENBAO_TOKEN=$(cat "${CONFIG_DIR}/keys/root_token.txt")
    else
      log "Error: OpenBao is initialized but root token is not available"
      exit 1
    fi
    
    # Check if OpenBao is sealed
    local sealed
    sealed=$(curl -s "${OPENBAO_ADDR}/v1/sys/seal-status" | jq -r '.sealed')
    if [ "$sealed" = "true" ]; then
      # Unseal OpenBao
      unseal_openbao
    fi
  fi
  
  # Enable audit logging
  enable_audit_logging
  
  # Enable secrets engines
  enable_kv_secrets_engine
  enable_transit_secrets_engine
  enable_pki_secrets_engine
  enable_database_secrets_engine
  
  # Enable auth methods
  enable_approle_auth_method
  
  # Create policies
  create_policies
  
  # Create AppRoles
  create_approles
  
  # Create Transit keys
  create_transit_keys
  
  # Create PKI roles
  create_pki_roles
  
  # Create initial secrets
  create_initial_secrets
  
  # Get AppRole credentials
  get_approle_credentials
  
  log "OpenBao bootstrap completed successfully"
}

# Execute main function
main
