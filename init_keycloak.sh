#!/bin/bash

# Keycloak Bootstrap Script
# This script initializes Keycloak with the necessary configuration for the Sevensa platform

set -e

# Configuration
KEYCLOAK_URL=${KEYCLOAK_URL:-"http://localhost:8080"}
KEYCLOAK_ADMIN=${KEYCLOAK_ADMIN:-"admin"}
KEYCLOAK_ADMIN_PASSWORD=${KEYCLOAK_ADMIN_PASSWORD:-"admin"}
CONFIG_DIR=${CONFIG_DIR:-"/opt/sevensa/keycloak/config"}
LOG_FILE=${LOG_FILE:-"/var/log/sevensa/keycloak_bootstrap.log"}

# Create log directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

# Function to log messages
log() {
  local timestamp
  timestamp=$(date +"%Y-%m-%d %H:%M:%S")
  echo "[$timestamp] $1" | tee -a "$LOG_FILE"
}

# Function to get an admin token
get_admin_token() {
  log "Getting admin token"
  local token
  token=$(curl -s -X POST "${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=${KEYCLOAK_ADMIN}" \
    -d "password=${KEYCLOAK_ADMIN_PASSWORD}" \
    -d "grant_type=password" \
    -d "client_id=admin-cli" | jq -r '.access_token')
  
  if [ -z "$token" ] || [ "$token" = "null" ]; then
    log "Error: Failed to get admin token"
    exit 1
  fi
  
  echo "$token"
}

# Function to check if realm exists
check_realm_exists() {
  local realm="$1"
  local token="$2"
  
  log "Checking if realm $realm exists"
  local status_code
  status_code=$(curl -s -o /dev/null -w "%{http_code}" \
    "${KEYCLOAK_URL}/admin/realms/${realm}" \
    -H "Authorization: Bearer ${token}")
  
  if [ "$status_code" = "200" ]; then
    log "Realm $realm exists"
    return 0
  else
    log "Realm $realm does not exist"
    return 1
  fi
}

# Function to create realm
create_realm() {
  local token="$1"
  
  log "Creating Sevensa realm"
  curl -s -X POST "${KEYCLOAK_URL}/admin/realms" \
    -H "Authorization: Bearer ${token}" \
    -H "Content-Type: application/json" \
    -d @"${CONFIG_DIR}/sevensa-realm.json"
  
  log "Sevensa realm created successfully"
}

# Function to create client
create_client() {
  local realm="$1"
  local client_file="$2"
  local token="$3"
  
  local client_id
  client_id=$(jq -r '.clientId' "$client_file")
  
  log "Creating client $client_id in realm $realm"
  curl -s -X POST "${KEYCLOAK_URL}/admin/realms/${realm}/clients" \
    -H "Authorization: Bearer ${token}" \
    -H "Content-Type: application/json" \
    -d @"$client_file"
  
  log "Client $client_id created successfully"
}

# Function to get client secret
get_client_secret() {
  local realm="$1"
  local client_id="$2"
  local token="$3"
  
  log "Getting client secret for $client_id in realm $realm"
  
  # Get client UUID
  local client_uuid
  client_uuid=$(curl -s "${KEYCLOAK_URL}/admin/realms/${realm}/clients" \
    -H "Authorization: Bearer ${token}" | jq -r ".[] | select(.clientId == \"${client_id}\") | .id")
  
  if [ -z "$client_uuid" ] || [ "$client_uuid" = "null" ]; then
    log "Error: Client $client_id not found"
    return 1
  fi
  
  # Get client secret
  local client_secret
  client_secret=$(curl -s "${KEYCLOAK_URL}/admin/realms/${realm}/clients/${client_uuid}/client-secret" \
    -H "Authorization: Bearer ${token}" | jq -r '.value')
  
  if [ -z "$client_secret" ] || [ "$client_secret" = "null" ]; then
    log "Error: Failed to get client secret for $client_id"
    return 1
  fi
  
  echo "$client_secret"
}

# Function to create roles
create_roles() {
  local realm="$1"
  local token="$2"
  
  log "Creating roles in realm $realm"
  
  # Create admin role
  curl -s -X POST "${KEYCLOAK_URL}/admin/realms/${realm}/roles" \
    -H "Authorization: Bearer ${token}" \
    -H "Content-Type: application/json" \
    -d '{"name": "admin", "description": "Administrator role"}'
  
  # Create user role
  curl -s -X POST "${KEYCLOAK_URL}/admin/realms/${realm}/roles" \
    -H "Authorization: Bearer ${token}" \
    -H "Content-Type: application/json" \
    -d '{"name": "user", "description": "User role"}'
  
  # Create RentGuy roles
  curl -s -X POST "${KEYCLOAK_URL}/admin/realms/${realm}/roles" \
    -H "Authorization: Bearer ${token}" \
    -H "Content-Type: application/json" \
    -d '{"name": "rentguy-admin", "description": "RentGuy Administrator role"}'
  
  curl -s -X POST "${KEYCLOAK_URL}/admin/realms/${realm}/roles" \
    -H "Authorization: Bearer ${token}" \
    -H "Content-Type: application/json" \
    -d '{"name": "rentguy-user", "description": "RentGuy User role"}'
  
  # Create PSRA roles
  curl -s -X POST "${KEYCLOAK_URL}/admin/realms/${realm}/roles" \
    -H "Authorization: Bearer ${token}" \
    -H "Content-Type: application/json" \
    -d '{"name": "psra-admin", "description": "PSRA Administrator role"}'
  
  curl -s -X POST "${KEYCLOAK_URL}/admin/realms/${realm}/roles" \
    -H "Authorization: Bearer ${token}" \
    -H "Content-Type: application/json" \
    -d '{"name": "psra-user", "description": "PSRA User role"}'
  
  # Create WPCS roles
  curl -s -X POST "${KEYCLOAK_URL}/admin/realms/${realm}/roles" \
    -H "Authorization: Bearer ${token}" \
    -H "Content-Type: application/json" \
    -d '{"name": "wpcs-admin", "description": "WPCS Administrator role"}'
  
  curl -s -X POST "${KEYCLOAK_URL}/admin/realms/${realm}/roles" \
    -H "Authorization: Bearer ${token}" \
    -H "Content-Type: application/json" \
    -d '{"name": "wpcs-user", "description": "WPCS User role"}'
  
  # Create AI roles
  curl -s -X POST "${KEYCLOAK_URL}/admin/realms/${realm}/roles" \
    -H "Authorization: Bearer ${token}" \
    -H "Content-Type: application/json" \
    -d '{"name": "ai-admin", "description": "AI Administrator role"}'
  
  curl -s -X POST "${KEYCLOAK_URL}/admin/realms/${realm}/roles" \
    -H "Authorization: Bearer ${token}" \
    -H "Content-Type: application/json" \
    -d '{"name": "ai-user", "description": "AI User role"}'
  
  log "Roles created successfully"
}

# Function to create groups
create_groups() {
  local realm="$1"
  local token="$2"
  
  log "Creating groups in realm $realm"
  
  # Create Administrators group
  curl -s -X POST "${KEYCLOAK_URL}/admin/realms/${realm}/groups" \
    -H "Authorization: Bearer ${token}" \
    -H "Content-Type: application/json" \
    -d '{"name": "Administrators"}'
  
  # Create Users group
  curl -s -X POST "${KEYCLOAK_URL}/admin/realms/${realm}/groups" \
    -H "Authorization: Bearer ${token}" \
    -H "Content-Type: application/json" \
    -d '{"name": "Users"}'
  
  # Create RentGuy group
  curl -s -X POST "${KEYCLOAK_URL}/admin/realms/${realm}/groups" \
    -H "Authorization: Bearer ${token}" \
    -H "Content-Type: application/json" \
    -d '{"name": "RentGuy"}'
  
  # Create PSRA group
  curl -s -X POST "${KEYCLOAK_URL}/admin/realms/${realm}/groups" \
    -H "Authorization: Bearer ${token}" \
    -H "Content-Type: application/json" \
    -d '{"name": "PSRA"}'
  
  # Create WPCS group
  curl -s -X POST "${KEYCLOAK_URL}/admin/realms/${realm}/groups" \
    -H "Authorization: Bearer ${token}" \
    -H "Content-Type: application/json" \
    -d '{"name": "WPCS"}'
  
  # Create AI group
  curl -s -X POST "${KEYCLOAK_URL}/admin/realms/${realm}/groups" \
    -H "Authorization: Bearer ${token}" \
    -H "Content-Type: application/json" \
    -d '{"name": "AI"}'
  
  log "Groups created successfully"
}

# Function to create initial admin user
create_admin_user() {
  local realm="$1"
  local token="$2"
  
  log "Creating admin user in realm $realm"
  
  # Create admin user
  curl -s -X POST "${KEYCLOAK_URL}/admin/realms/${realm}/users" \
    -H "Authorization: Bearer ${token}" \
    -H "Content-Type: application/json" \
    -d '{
      "username": "admin",
      "email": "admin@sevensa.nl",
      "firstName": "Admin",
      "lastName": "User",
      "enabled": true,
      "emailVerified": true,
      "credentials": [
        {
          "type": "password",
          "value": "admin",
          "temporary": true
        }
      ]
    }'
  
  # Get admin user ID
  local admin_id
  admin_id=$(curl -s "${KEYCLOAK_URL}/admin/realms/${realm}/users?username=admin" \
    -H "Authorization: Bearer ${token}" | jq -r '.[0].id')
  
  if [ -z "$admin_id" ] || [ "$admin_id" = "null" ]; then
    log "Error: Admin user not found"
    return 1
  fi
  
  # Get admin role ID
  local admin_role_id
  admin_role_id=$(curl -s "${KEYCLOAK_URL}/admin/realms/${realm}/roles" \
    -H "Authorization: Bearer ${token}" | jq -r '.[] | select(.name == "admin") | .id')
  
  if [ -z "$admin_role_id" ] || [ "$admin_role_id" = "null" ]; then
    log "Error: Admin role not found"
    return 1
  fi
  
  # Assign admin role to admin user
  curl -s -X POST "${KEYCLOAK_URL}/admin/realms/${realm}/users/${admin_id}/role-mappings/realm" \
    -H "Authorization: Bearer ${token}" \
    -H "Content-Type: application/json" \
    -d "[{\"id\": \"${admin_role_id}\", \"name\": \"admin\"}]"
  
  # Get Administrators group ID
  local admin_group_id
  admin_group_id=$(curl -s "${KEYCLOAK_URL}/admin/realms/${realm}/groups" \
    -H "Authorization: Bearer ${token}" | jq -r '.[] | select(.name == "Administrators") | .id')
  
  if [ -z "$admin_group_id" ] || [ "$admin_group_id" = "null" ]; then
    log "Error: Administrators group not found"
    return 1
  fi
  
  # Add admin user to Administrators group
  curl -s -X PUT "${KEYCLOAK_URL}/admin/realms/${realm}/users/${admin_id}/groups/${admin_group_id}" \
    -H "Authorization: Bearer ${token}"
  
  log "Admin user created successfully"
}

# Function to configure authentication
configure_authentication() {
  local realm="$1"
  local token="$2"
  
  log "Configuring authentication in realm $realm"
  
  # Enable OTP for admin users
  curl -s -X PUT "${KEYCLOAK_URL}/admin/realms/${realm}/authentication/required-actions/CONFIGURE_TOTP" \
    -H "Authorization: Bearer ${token}" \
    -H "Content-Type: application/json" \
    -d '{"alias": "Configure OTP", "defaultAction": false, "enabled": true, "name": "Configure OTP", "priority": 10, "providerId": "CONFIGURE_TOTP"}'
  
  # Create OTP policy for admin users
  curl -s -X PUT "${KEYCLOAK_URL}/admin/realms/${realm}" \
    -H "Authorization: Bearer ${token}" \
    -H "Content-Type: application/json" \
    -d '{
      "otpPolicyType": "totp",
      "otpPolicyAlgorithm": "HmacSHA1",
      "otpPolicyInitialCounter": 0,
      "otpPolicyDigits": 6,
      "otpPolicyLookAheadWindow": 1,
      "otpPolicyPeriod": 30
    }'
  
  log "Authentication configured successfully"
}

# Function to save client secrets
save_client_secrets() {
  local realm="$1"
  local token="$2"
  
  log "Saving client secrets"
  
  # Create directory for client secrets
  mkdir -p "${CONFIG_DIR}/secrets"
  
  # Save RentGuy client secret
  local rentguy_secret
  rentguy_secret=$(get_client_secret "$realm" "rentguy-client" "$token")
  echo "$rentguy_secret" > "${CONFIG_DIR}/secrets/rentguy-client-secret.txt"
  
  # Save PSRA client secret
  local psra_secret
  psra_secret=$(get_client_secret "$realm" "psra-client" "$token")
  echo "$psra_secret" > "${CONFIG_DIR}/secrets/psra-client-secret.txt"
  
  # Save WPCS client secret
  local wpcs_secret
  wpcs_secret=$(get_client_secret "$realm" "wpcs-client" "$token")
  echo "$wpcs_secret" > "${CONFIG_DIR}/secrets/wpcs-client-secret.txt"
  
  # Save AI client secret
  local ai_secret
  ai_secret=$(get_client_secret "$realm" "ai-client" "$token")
  echo "$ai_secret" > "${CONFIG_DIR}/secrets/ai-client-secret.txt"
  
  # Set permissions
  chmod 600 "${CONFIG_DIR}/secrets/"*.txt
  
  log "Client secrets saved successfully"
}

# Main function
main() {
  log "Starting Keycloak bootstrap"
  
  # Get admin token
  local token
  token=$(get_admin_token)
  
  # Check if realm exists
  if ! check_realm_exists "sevensa" "$token"; then
    # Create realm
    create_realm "$token"
    
    # Create clients
    create_client "sevensa" "${CONFIG_DIR}/rentguy-client.json" "$token"
    create_client "sevensa" "${CONFIG_DIR}/psra-client.json" "$token"
    create_client "sevensa" "${CONFIG_DIR}/wpcs-client.json" "$token"
    create_client "sevensa" "${CONFIG_DIR}/ai-client.json" "$token"
    
    # Create roles
    create_roles "sevensa" "$token"
    
    # Create groups
    create_groups "sevensa" "$token"
    
    # Create admin user
    create_admin_user "sevensa" "$token"
    
    # Configure authentication
    configure_authentication "sevensa" "$token"
  else
    log "Sevensa realm already exists, skipping creation"
  fi
  
  # Save client secrets
  save_client_secrets "sevensa" "$token"
  
  log "Keycloak bootstrap completed successfully"
}

# Execute main function
main
