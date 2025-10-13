#!/usr/bin/env bash
# OpenBao Configuration Test Script
# Created: 2025-10-09
# Last Updated: 2025-10-09

set -euo pipefail

# Configuration
PROJECT_DIR=${PROJECT_DIR:-/opt/central-vault}
BAO_HTTP_PORT=${BAO_HTTP_PORT:-8200}
VAULT_ADDR="http://127.0.0.1:${BAO_HTTP_PORT}"
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

# Test functions
test_namespaces() {
  log_info "Testing namespaces..."
  
  NAMESPACES=$(docker compose exec -T openbao bao namespace list -format=json | jq -r '.[] | .path')
  
  for NS in sevensa rentguy psra wpcs ai; do
    if echo "$NAMESPACES" | grep -q "$NS"; then
      log_success "Namespace $NS exists"
    else
      log_error "Namespace $NS does not exist"
      return 1
    fi
  done
  
  return 0
}

test_policies() {
  log_info "Testing policies..."
  
  POLICIES=$(docker compose exec -T openbao bao policy list -format=json | jq -r '.[]')
  
  for POLICY in admin-policy rentguy-policy psra-policy wpcs-policy ai-policy; do
    if echo "$POLICIES" | grep -q "$POLICY"; then
      log_success "Policy $POLICY exists"
    else
      log_error "Policy $POLICY does not exist"
      return 1
    fi
  done
  
  return 0
}

test_auth_methods() {
  log_info "Testing auth methods..."
  
  AUTH_METHODS=$(docker compose exec -T openbao bao auth list -format=json | jq -r 'keys[]')
  
  for METHOD in oidc/ approle/; do
    if echo "$AUTH_METHODS" | grep -q "$METHOD"; then
      log_success "Auth method $METHOD exists"
    else
      log_error "Auth method $METHOD does not exist"
      return 1
    fi
  done
  
  return 0
}

test_secret_engines() {
  log_info "Testing secret engines..."
  
  for NS in rentguy psra wpcs ai; do
    log_info "Testing secret engines in namespace $NS..."
    
    SECRET_ENGINES=$(docker compose exec -T openbao sh -lc "export VAULT_TOKEN=$ROOT_TOKEN; export VAULT_NAMESPACE=$NS; bao secrets list -format=json" | jq -r 'keys[]')
    
    # Test KV v2
    if echo "$SECRET_ENGINES" | grep -q "kv-$NS/"; then
      log_success "KV v2 secret engine exists in namespace $NS"
    else
      log_error "KV v2 secret engine does not exist in namespace $NS"
      return 1
    fi
    
    # Test Transit
    if echo "$SECRET_ENGINES" | grep -q "transit/"; then
      log_success "Transit secret engine exists in namespace $NS"
    else
      log_error "Transit secret engine does not exist in namespace $NS"
      return 1
    fi
    
    # Test Database (not required for AI)
    if [ "$NS" != "ai" ]; then
      if echo "$SECRET_ENGINES" | grep -q "database/"; then
        log_success "Database secret engine exists in namespace $NS"
      else
        log_error "Database secret engine does not exist in namespace $NS"
        return 1
      fi
    fi
  done
  
  return 0
}

test_transit_encryption() {
  log_info "Testing Transit encryption..."
  
  for NS in rentguy psra wpcs ai; do
    log_info "Testing Transit encryption in namespace $NS..."
    
    # Test encryption
    PLAINTEXT="hello world"
    PLAINTEXT_B64=$(echo -n "$PLAINTEXT" | base64)
    
    CIPHERTEXT=$(docker compose exec -T openbao sh -lc "export VAULT_TOKEN=$ROOT_TOKEN; export VAULT_NAMESPACE=$NS; bao write -format=json transit/encrypt/${NS}-key plaintext=${PLAINTEXT_B64}" | jq -r '.data.ciphertext')
    
    if [ -n "$CIPHERTEXT" ]; then
      log_success "Transit encryption successful in namespace $NS"
    else
      log_error "Transit encryption failed in namespace $NS"
      return 1
    fi
    
    # Test decryption
    DECRYPTED_B64=$(docker compose exec -T openbao sh -lc "export VAULT_TOKEN=$ROOT_TOKEN; export VAULT_NAMESPACE=$NS; bao write -format=json transit/decrypt/${NS}-key ciphertext=${CIPHERTEXT}" | jq -r '.data.plaintext')
    DECRYPTED=$(echo -n "$DECRYPTED_B64" | base64 -d)
    
    if [ "$DECRYPTED" = "$PLAINTEXT" ]; then
      log_success "Transit decryption successful in namespace $NS"
    else
      log_error "Transit decryption failed in namespace $NS"
      return 1
    fi
  done
  
  return 0
}

test_database_credentials() {
  log_info "Testing Database credentials..."
  
  for NS in rentguy psra wpcs; do
    log_info "Testing Database credentials in namespace $NS..."
    
    # Test credential generation
    CREDS=$(docker compose exec -T openbao sh -lc "export VAULT_TOKEN=$ROOT_TOKEN; export VAULT_NAMESPACE=$NS; bao read -format=json database/creds/${NS}-role" 2>/dev/null || echo '{"data": {}}')
    
    USERNAME=$(echo "$CREDS" | jq -r '.data.username // empty')
    PASSWORD=$(echo "$CREDS" | jq -r '.data.password // empty')
    
    if [ -n "$USERNAME" ] && [ -n "$PASSWORD" ]; then
      log_success "Database credential generation successful in namespace $NS"
    else
      log_error "Database credential generation failed in namespace $NS"
      return 1
    fi
  done
  
  return 0
}

test_approle_authentication() {
  log_info "Testing AppRole authentication..."
  
  for NS in rentguy psra wpcs ai; do
    log_info "Testing AppRole authentication for $NS..."
    
    # Get role ID
    ROLE_ID=$(docker compose exec -T openbao sh -lc "export VAULT_TOKEN=$ROOT_TOKEN; bao read -format=json auth/approle/role/${NS}/role-id" | jq -r '.data.role_id')
    
    # Create secret ID
    SECRET_ID=$(docker compose exec -T openbao sh -lc "export VAULT_TOKEN=$ROOT_TOKEN; bao write -f -format=json auth/approle/role/${NS}/secret-id" | jq -r '.data.secret_id')
    
    # Login with AppRole
    TOKEN=$(docker compose exec -T openbao sh -lc "bao write -format=json auth/approle/login role_id=${ROLE_ID} secret_id=${SECRET_ID}" | jq -r '.auth.client_token')
    
    if [ -n "$TOKEN" ]; then
      log_success "AppRole authentication successful for $NS"
      
      # Test policy enforcement
      POLICY=$(docker compose exec -T openbao sh -lc "export VAULT_TOKEN=${TOKEN}; bao token lookup -format=json" | jq -r '.data.policies[]' | grep -v default)
      
      if [ "$POLICY" = "${NS}-policy" ]; then
        log_success "Policy enforcement successful for $NS"
      else
        log_error "Policy enforcement failed for $NS"
        return 1
      fi
    else
      log_error "AppRole authentication failed for $NS"
      return 1
    fi
  done
  
  return 0
}

# Main function
main() {
  log_info "Starting OpenBao configuration tests..."
  
  # Run tests
  test_namespaces || return 1
  test_policies || return 1
  test_auth_methods || return 1
  test_secret_engines || return 1
  test_transit_encryption || return 1
  test_database_credentials || return 1
  test_approle_authentication || return 1
  
  log_success "All OpenBao configuration tests passed!"
  return 0
}

# Run main function
cd "${PROJECT_DIR}"
main
exit $?
