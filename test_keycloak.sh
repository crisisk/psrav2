#!/usr/bin/env bash
# Keycloak Configuration Test Script
# Created: 2025-10-09
# Last Updated: 2025-10-09

set -euo pipefail

# Configuration
PROJECT_DIR=${PROJECT_DIR:-/opt/central-vault}
KC_HTTP_PORT=${KC_HTTP_PORT:-8080}
KEYCLOAK_URL="http://127.0.0.1:${KC_HTTP_PORT}"
KEYCLOAK_ADMIN=${KEYCLOAK_ADMIN:-admin}
KEYCLOAK_ADMIN_PASSWORD=${KEYCLOAK_ADMIN_PASSWORD:-changeme-keycloak-admin}

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

# Get admin token
get_admin_token() {
  curl -s -X POST "${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=${KEYCLOAK_ADMIN}" \
    -d "password=${KEYCLOAK_ADMIN_PASSWORD}" \
    -d "grant_type=password" \
    -d "client_id=admin-cli" | jq -r '.access_token'
}

# Test functions
test_realm() {
  log_info "Testing realm..."
  
  TOKEN=$(get_admin_token)
  
  REALM=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/sevensa" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" | jq -r '.realm')
  
  if [ "$REALM" = "sevensa" ]; then
    log_success "Realm sevensa exists"
    return 0
  else
    log_error "Realm sevensa does not exist"
    return 1
  fi
}

test_clients() {
  log_info "Testing clients..."
  
  TOKEN=$(get_admin_token)
  
  CLIENTS=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/sevensa/clients" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" | jq -r '.[].clientId')
  
  for CLIENT in bao-oidc rentguy-client psra-client wpcs-client ai-client oauth2-proxy; do
    if echo "$CLIENTS" | grep -q "$CLIENT"; then
      log_success "Client $CLIENT exists"
    else
      log_error "Client $CLIENT does not exist"
      return 1
    fi
  done
  
  return 0
}

test_roles() {
  log_info "Testing roles..."
  
  TOKEN=$(get_admin_token)
  
  ROLES=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/sevensa/roles" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" | jq -r '.[].name')
  
  for ROLE in admin rentguy-admin rentguy-user psra-admin psra-user wpcs-admin wpcs-user ai-admin ai-user; do
    if echo "$ROLES" | grep -q "$ROLE"; then
      log_success "Role $ROLE exists"
    else
      log_error "Role $ROLE does not exist"
      return 1
    fi
  done
  
  return 0
}

test_groups() {
  log_info "Testing groups..."
  
  TOKEN=$(get_admin_token)
  
  GROUPS=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/sevensa/groups" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" | jq -r '.[].name')
  
  for GROUP in "Administrators" "RentGuy Users" "RentGuy Administrators" "PSRA Users" "PSRA Administrators" "WPCS Users" "WPCS Administrators" "AI Users" "AI Administrators"; do
    if echo "$GROUPS" | grep -q "$GROUP"; then
      log_success "Group $GROUP exists"
    else
      log_error "Group $GROUP does not exist"
      return 1
    fi
  done
  
  return 0
}

test_admin_user() {
  log_info "Testing admin user..."
  
  TOKEN=$(get_admin_token)
  
  USER=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/sevensa/users?username=admin" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" | jq -r '.[0].username')
  
  if [ "$USER" = "admin" ]; then
    log_success "Admin user exists"
    
    # Check if admin user is in Administrators group
    USER_ID=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/sevensa/users?username=admin" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" | jq -r '.[0].id')
    
    ADMIN_GROUP_ID=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/sevensa/groups?search=Administrators" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" | jq -r '.[0].id')
    
    USER_GROUPS=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/sevensa/users/${USER_ID}/groups" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" | jq -r '.[].id')
    
    if echo "$USER_GROUPS" | grep -q "$ADMIN_GROUP_ID"; then
      log_success "Admin user is in Administrators group"
    else
      log_error "Admin user is not in Administrators group"
      return 1
    fi
    
    return 0
  else
    log_error "Admin user does not exist"
    return 1
  fi
}

test_mfa_flow() {
  log_info "Testing MFA flow..."
  
  TOKEN=$(get_admin_token)
  
  MFA_FLOW=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/sevensa/authentication/flows" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" | jq -r '.[] | select(.alias == "browser-mfa") | .alias')
  
  if [ "$MFA_FLOW" = "browser-mfa" ]; then
    log_success "MFA flow exists"
    
    # Check if OTP form is configured
    EXECUTIONS=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/sevensa/authentication/flows/browser-mfa/executions" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json")
    
    OTP_FORM=$(echo "$EXECUTIONS" | jq -r '.[] | select(.displayName == "OTP Form") | .displayName')
    
    if [ "$OTP_FORM" = "OTP Form" ]; then
      log_success "OTP form is configured"
    else
      log_error "OTP form is not configured"
      return 1
    fi
    
    # Check if browser-mfa is set as default for browser binding
    BINDINGS=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/sevensa/authentication/flows" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" | jq -r '.[] | select(.alias == "browser-mfa") | .alias')
    
    if [ "$BINDINGS" = "browser-mfa" ]; then
      log_success "browser-mfa is set as default for browser binding"
    else
      log_error "browser-mfa is not set as default for browser binding"
      return 1
    fi
    
    return 0
  else
    log_error "MFA flow does not exist"
    return 1
  fi
}

test_client_authentication() {
  log_info "Testing client authentication..."
  
  # Test authentication for each client
  for CLIENT in rentguy-client psra-client wpcs-client ai-client; do
    log_info "Testing authentication for $CLIENT..."
    
    # Get client secret
    TOKEN=$(get_admin_token)
    
    CLIENT_ID=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/sevensa/clients?clientId=${CLIENT}" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" | jq -r '.[0].id')
    
    CLIENT_SECRET=$(curl -s -X GET "${KEYCLOAK_URL}/admin/realms/sevensa/clients/${CLIENT_ID}/client-secret" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" | jq -r '.value')
    
    # Test client credentials grant
    ACCESS_TOKEN=$(curl -s -X POST "${KEYCLOAK_URL}/realms/sevensa/protocol/openid-connect/token" \
      -H "Content-Type: application/x-www-form-urlencoded" \
      -d "grant_type=client_credentials" \
      -d "client_id=${CLIENT}" \
      -d "client_secret=${CLIENT_SECRET}" | jq -r '.access_token // empty')
    
    if [ -n "$ACCESS_TOKEN" ]; then
      log_success "Client authentication successful for $CLIENT"
    else
      log_error "Client authentication failed for $CLIENT"
      return 1
    fi
  done
  
  return 0
}

# Main function
main() {
  log_info "Starting Keycloak configuration tests..."
  
  # Run tests
  test_realm || return 1
  test_clients || return 1
  test_roles || return 1
  test_groups || return 1
  test_admin_user || return 1
  test_mfa_flow || return 1
  test_client_authentication || return 1
  
  log_success "All Keycloak configuration tests passed!"
  return 0
}

# Run main function
cd "${PROJECT_DIR}"
main
exit $?
