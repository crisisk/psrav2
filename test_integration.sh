#!/usr/bin/env bash
# Integration Test Script
# Created: 2025-10-09
# Last Updated: 2025-10-09

set -euo pipefail

# Configuration
PROJECT_DIR=${PROJECT_DIR:-/opt/central-vault}
BAO_HTTP_PORT=${BAO_HTTP_PORT:-8200}
KC_HTTP_PORT=${KC_HTTP_PORT:-8080}
VAULT_ADDR="http://127.0.0.1:${BAO_HTTP_PORT}"
KEYCLOAK_URL="http://127.0.0.1:${KC_HTTP_PORT}"
KEYCLOAK_ADMIN=${KEYCLOAK_ADMIN:-admin}
KEYCLOAK_ADMIN_PASSWORD=${KEYCLOAK_ADMIN_PASSWORD:-changeme-keycloak-admin}
ROOT_TOKEN=$(cat ${PROJECT_DIR}/openbao/root.token)
export VAULT_ADDR
export VAULT_TOKEN="${ROOT_TOKEN}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
  echo -e "${YELLOW}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Get admin token from Keycloak
get_admin_token() {
  curl -s -X POST "${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=${KEYCLOAK_ADMIN}" \
    -d "password=${KEYCLOAK_ADMIN_PASSWORD}" \
    -d "grant_type=password" \
    -d "client_id=admin-cli" | jq -r '.access_token'
}

# Test functions
test_oidc_integration() {
  log_info "Testing OIDC integration between Keycloak and OpenBao..."
  
  # Get OIDC configuration from OpenBao
  OIDC_CONFIG=$(docker compose exec -T openbao sh -lc "export VAULT_TOKEN=$ROOT_TOKEN; bao read -format=json auth/oidc/config")
  
  # Extract OIDC discovery URL
  DISCOVERY_URL=$(echo "$OIDC_CONFIG" | jq -r '.data.oidc_discovery_url')
  
  # Check if discovery URL points to Keycloak
  if echo "$DISCOVERY_URL" | grep -q "keycloak"; then
    log_success "OIDC discovery URL points to Keycloak"
  else
    log_error "OIDC discovery URL does not point to Keycloak"
    return 1
  fi
  
  # Get client ID from OpenBao
  CLIENT_ID=$(echo "$OIDC_CONFIG" | jq -r '.data.oidc_client_id')
  
  # Check if client exists in Keycloak
  TOKEN=$(get_admin_token)
  
  CLIENT=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/sevensa/clients?clientId=${CLIENT_ID}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" | jq -r '.[0].clientId')
  
  if [ "$CLIENT" = "$CLIENT_ID" ]; then
    log_success "OIDC client exists in Keycloak"
  else
    log_error "OIDC client does not exist in Keycloak"
    return 1
  fi
  
  return 0
}

test_service_integration() {
  log_info "Testing service integration..."
  
  for SERVICE in rentguy psra wpcs ai; do
    log_info "Testing integration for $SERVICE service..."
    
    # Get AppRole credentials
    ROLE_ID=$(docker compose exec -T openbao sh -lc "export VAULT_TOKEN=$ROOT_TOKEN; bao read -format=json auth/approle/role/${SERVICE}/role-id" | jq -r '.data.role_id')
    SECRET_ID=$(docker compose exec -T openbao sh -lc "export VAULT_TOKEN=$ROOT_TOKEN; bao write -f -format=json auth/approle/role/${SERVICE}/secret-id" | jq -r '.data.secret_id')
    
    # Login with AppRole
    TOKEN=$(docker compose exec -T openbao sh -lc "bao write -format=json auth/approle/login role_id=${ROLE_ID} secret_id=${SECRET_ID}" | jq -r '.auth.client_token')
    
    if [ -n "$TOKEN" ]; then
      log_success "AppRole authentication successful for $SERVICE"
      
      # Test access to KV secrets
      KV_ACCESS=$(docker compose exec -T openbao sh -lc "export VAULT_TOKEN=${TOKEN}; export VAULT_NAMESPACE=${SERVICE}; bao kv get -format=json kv-${SERVICE}/config/app-config" | jq -r '.data.data.environment')
      
      if [ "$KV_ACCESS" = "production" ]; then
        log_success "KV access successful for $SERVICE"
      else
        log_error "KV access failed for $SERVICE"
        return 1
      fi
      
      # Test Transit encryption
      PLAINTEXT="hello world"
      PLAINTEXT_B64=$(echo -n "$PLAINTEXT" | base64)
      
      CIPHERTEXT=$(docker compose exec -T openbao sh -lc "export VAULT_TOKEN=${TOKEN}; export VAULT_NAMESPACE=${SERVICE}; bao write -format=json transit/encrypt/${SERVICE}-key plaintext=${PLAINTEXT_B64}" | jq -r '.data.ciphertext')
      
      if [ -n "$CIPHERTEXT" ]; then
        log_success "Transit encryption successful for $SERVICE"
        
        # Test Transit decryption
        DECRYPTED_B64=$(docker compose exec -T openbao sh -lc "export VAULT_TOKEN=${TOKEN}; export VAULT_NAMESPACE=${SERVICE}; bao write -format=json transit/decrypt/${SERVICE}-key ciphertext=${CIPHERTEXT}" | jq -r '.data.plaintext')
        DECRYPTED=$(echo -n "$DECRYPTED_B64" | base64 -d)
        
        if [ "$DECRYPTED" = "$PLAINTEXT" ]; then
          log_success "Transit decryption successful for $SERVICE"
        else
          log_error "Transit decryption failed for $SERVICE"
          return 1
        fi
      else
        log_error "Transit encryption failed for $SERVICE"
        return 1
      fi
      
      # Test Database credentials (except for AI)
      if [ "$SERVICE" != "ai" ]; then
        DB_ACCESS=$(docker compose exec -T openbao sh -lc "export VAULT_TOKEN=${TOKEN}; export VAULT_NAMESPACE=${SERVICE}; bao read -format=json database/creds/${SERVICE}-role" 2>/dev/null || echo '{"data": {}}')
        
        USERNAME=$(echo "$DB_ACCESS" | jq -r '.data.username // empty')
        
        if [ -n "$USERNAME" ]; then
          log_success "Database access successful for $SERVICE"
        else
          log_error "Database access failed for $SERVICE"
          return 1
        fi
      fi
    else
      log_error "AppRole authentication failed for $SERVICE"
      return 1
    fi
    
    # Get Keycloak client credentials
    TOKEN=$(get_admin_token)
    
    CLIENT_ID=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/sevensa/clients?clientId=${SERVICE}-client" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" | jq -r '.[0].id')
    
    CLIENT_SECRET=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/sevensa/clients/${CLIENT_ID}/client-secret" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" | jq -r '.value')
    
    # Test client credentials grant
    ACCESS_TOKEN=$(curl -s -X POST "${KEYCLOAK_URL}/realms/sevensa/protocol/openid-connect/token" \
      -H "Content-Type: application/x-www-form-urlencoded" \
      -d "grant_type=client_credentials" \
      -d "client_id=${SERVICE}-client" \
      -d "client_secret=${CLIENT_SECRET}" | jq -r '.access_token // empty')
    
    if [ -n "$ACCESS_TOKEN" ]; then
      log_success "Keycloak authentication successful for $SERVICE"
    else
      log_error "Keycloak authentication failed for $SERVICE"
      return 1
    fi
  done
  
  return 0
}

test_end_to_end() {
  log_info "Testing end-to-end integration..."
  
  for SERVICE in rentguy psra wpcs ai; do
    log_info "Testing end-to-end integration for $SERVICE service..."
    
    # Create a test user in Keycloak
    TOKEN=$(get_admin_token)
    
    # Create user
    USER_ID=$(curl -s -X POST "${KEYCLOAK_URL}/admin/realms/sevensa/users" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      -d '{
        "username": "'${SERVICE}'-test",
        "enabled": true,
        "emailVerified": true,
        "firstName": "Test",
        "lastName": "User",
        "email": "'${SERVICE}'-test@example.com",
        "credentials": [
          {
            "type": "password",
            "value": "password",
            "temporary": false
          }
        ]
      }' \
      -w '%{http_code}' | grep -o '[0-9]\{3\}$')
    
    if [ "$USER_ID" = "201" ]; then
      log_success "User created for $SERVICE"
      
      # Get user ID
      USER_ID=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/sevensa/users?username=${SERVICE}-test" \
        -H "Authorization: Bearer ${TOKEN}" \
        -H "Content-Type: application/json" | jq -r '.[0].id')
      
      # Add user to group
      GROUP_ID=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/sevensa/groups?search=${SERVICE} Users" \
        -H "Authorization: Bearer ${TOKEN}" \
        -H "Content-Type: application/json" | jq -r '.[0].id')
      
      GROUP_RESULT=$(curl -s -X PUT "${KEYCLOAK_URL}/admin/realms/sevensa/users/${USER_ID}/groups/${GROUP_ID}" \
        -H "Authorization: Bearer ${TOKEN}" \
        -H "Content-Type: application/json" \
        -w '%{http_code}' | grep -o '[0-9]\{3\}$')
      
      if [ "$GROUP_RESULT" = "204" ]; then
        log_success "User added to group for $SERVICE"
        
        # Get token for user
        USER_TOKEN=$(curl -s -X POST "${KEYCLOAK_URL}/realms/sevensa/protocol/openid-connect/token" \
          -H "Content-Type: application/x-www-form-urlencoded" \
          -d "grant_type=password" \
          -d "client_id=${SERVICE}-client" \
          -d "client_secret=${CLIENT_SECRET}" \
          -d "username=${SERVICE}-test" \
          -d "password=password" | jq -r '.access_token // empty')
        
        if [ -n "$USER_TOKEN" ]; then
          log_success "User authentication successful for $SERVICE"
          
          # Clean up
          curl -s -X DELETE "${KEYCLOAK_URL}/admin/realms/sevensa/users/${USER_ID}" \
            -H "Authorization: Bearer ${TOKEN}" \
            -H "Content-Type: application/json"
        else
          log_error "User authentication failed for $SERVICE"
          return 1
        fi
      else
        log_error "Failed to add user to group for $SERVICE"
        return 1
      fi
    else
      log_error "Failed to create user for $SERVICE"
      return 1
    fi
  done
  
  return 0
}

# Main function
main() {
  log_info "Starting integration tests..."
  
  # Run tests
  test_oidc_integration || return 1
  test_service_integration || return 1
  test_end_to_end || return 1
  
  log_success "All integration tests passed!"
  return 0
}

# Run main function
cd "${PROJECT_DIR}"
main
exit $?
