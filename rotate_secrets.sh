#!/bin/bash

# OpenBao Secret Rotation Script
# This script automates the rotation of secrets in OpenBao

set -e

# Configuration
OPENBAO_ADDR=${OPENBAO_ADDR:-"https://openbao.sevensa.nl"}
OPENBAO_TOKEN=${OPENBAO_TOKEN:-""}
LOG_FILE="/var/log/openbao/secret_rotation.log"
ROTATION_CONFIG="/etc/openbao/rotation_config.json"
NOTIFICATION_EMAIL="admin@sevensa.nl"
NOTIFICATION_SLACK_WEBHOOK=${SLACK_WEBHOOK:-""}

# Ensure required variables are set
if [ -z "$OPENBAO_TOKEN" ]; then
  echo "Error: OPENBAO_TOKEN environment variable is not set"
  exit 1
fi

# Create log directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

# Function to log messages
log() {
  local timestamp
  timestamp=$(date +"%Y-%m-%d %H:%M:%S")
  echo "[$timestamp] $1" | tee -a "$LOG_FILE"
}

# Function to send notifications
send_notification() {
  local subject="$1"
  local message="$2"
  local status="$3"  # success, warning, or error
  
  # Send email notification
  if [ -n "$NOTIFICATION_EMAIL" ]; then
    echo "$message" | mail -s "[OpenBao] $subject" "$NOTIFICATION_EMAIL"
  fi
  
  # Send Slack notification if webhook is configured
  if [ -n "$NOTIFICATION_SLACK_WEBHOOK" ]; then
    local color
    case "$status" in
      success) color="#36a64f" ;;
      warning) color="#ffcc00" ;;
      error)   color="#ff0000" ;;
      *)       color="#808080" ;;
    esac
    
    curl -s -X POST -H 'Content-type: application/json' \
      --data "{\"attachments\":[{\"color\":\"$color\",\"title\":\"$subject\",\"text\":\"$message\"}]}" \
      "$NOTIFICATION_SLACK_WEBHOOK"
  fi
}

# Function to rotate database credentials
rotate_database_credentials() {
  local db_name="$1"
  local mount_path="$2"
  local role_name="$3"
  
  log "Rotating database credentials for $db_name ($mount_path/$role_name)"
  
  # Rotate the database credentials
  local result
  result=$(curl -s -X POST -H "X-Vault-Token: $OPENBAO_TOKEN" \
    "$OPENBAO_ADDR/v1/$mount_path/rotate-role/$role_name")
  
  if echo "$result" | grep -q "error"; then
    log "Error rotating database credentials for $db_name: $(echo "$result" | jq -r '.errors[]')"
    send_notification "Database Credential Rotation Failed" "Failed to rotate credentials for $db_name database. Error: $(echo "$result" | jq -r '.errors[]')" "error"
    return 1
  fi
  
  log "Successfully rotated database credentials for $db_name"
  return 0
}

# Function to rotate PKI certificates
rotate_pki_certificates() {
  local cert_name="$1"
  local mount_path="$2"
  local role_name="$3"
  local common_name="$4"
  local ttl="$5"
  
  log "Rotating PKI certificate for $cert_name ($mount_path/$role_name)"
  
  # Generate a new certificate
  local result
  result=$(curl -s -X POST -H "X-Vault-Token: $OPENBAO_TOKEN" \
    --data "{\"common_name\":\"$common_name\",\"ttl\":\"$ttl\"}" \
    "$OPENBAO_ADDR/v1/$mount_path/issue/$role_name")
  
  if echo "$result" | grep -q "error"; then
    log "Error rotating PKI certificate for $cert_name: $(echo "$result" | jq -r '.errors[]')"
    send_notification "PKI Certificate Rotation Failed" "Failed to rotate certificate for $cert_name. Error: $(echo "$result" | jq -r '.errors[]')" "error"
    return 1
  fi
  
  # Extract certificate data
  local certificate
  local private_key
  local expiration
  
  certificate=$(echo "$result" | jq -r '.data.certificate')
  private_key=$(echo "$result" | jq -r '.data.private_key')
  expiration=$(echo "$result" | jq -r '.data.expiration')
  
  # Store the new certificate in KV store
  local kv_result
  kv_result=$(curl -s -X POST -H "X-Vault-Token: $OPENBAO_TOKEN" \
    --data "{\"data\":{\"certificate\":\"$certificate\",\"private_key\":\"$private_key\",\"expiration\":$expiration}}" \
    "$OPENBAO_ADDR/v1/kv/certificates/$cert_name")
  
  if echo "$kv_result" | grep -q "error"; then
    log "Error storing PKI certificate for $cert_name in KV store: $(echo "$kv_result" | jq -r '.errors[]')"
    send_notification "PKI Certificate Storage Failed" "Failed to store rotated certificate for $cert_name in KV store. Error: $(echo "$kv_result" | jq -r '.errors[]')" "error"
    return 1
  fi
  
  log "Successfully rotated PKI certificate for $cert_name"
  return 0
}

# Function to rotate KV secrets
rotate_kv_secrets() {
  local secret_name="$1"
  local mount_path="$2"
  local path="$3"
  local generator_script="$4"
  
  log "Rotating KV secret for $secret_name ($mount_path/$path)"
  
  # Generate new secret value using the specified generator script
  if [ ! -f "$generator_script" ]; then
    log "Error: Generator script $generator_script not found"
    send_notification "KV Secret Rotation Failed" "Generator script $generator_script for $secret_name not found" "error"
    return 1
  fi
  
  local new_secret
  new_secret=$("$generator_script")
  
  if [ $? -ne 0 ]; then
    log "Error generating new secret for $secret_name"
    send_notification "KV Secret Generation Failed" "Failed to generate new secret for $secret_name" "error"
    return 1
  fi
  
  # Get the current secret to preserve other fields
  local current_secret
  current_secret=$(curl -s -H "X-Vault-Token: $OPENBAO_TOKEN" \
    "$OPENBAO_ADDR/v1/$mount_path/data/$path")
  
  if echo "$current_secret" | grep -q "error"; then
    log "Error retrieving current secret for $secret_name: $(echo "$current_secret" | jq -r '.errors[]')"
    send_notification "KV Secret Retrieval Failed" "Failed to retrieve current secret for $secret_name. Error: $(echo "$current_secret" | jq -r '.errors[]')" "error"
    return 1
  fi
  
  # Extract current data and merge with new secret
  local current_data
  current_data=$(echo "$current_secret" | jq -r '.data.data')
  
  # Merge current data with new secret
  local updated_data
  updated_data=$(echo "$current_data" | jq --arg new_value "$new_secret" '. + {password: $new_value, rotated_at: now|tostring}')
  
  # Store the updated secret
  local result
  result=$(curl -s -X POST -H "X-Vault-Token: $OPENBAO_TOKEN" \
    --data "{\"data\":$updated_data}" \
    "$OPENBAO_ADDR/v1/$mount_path/data/$path")
  
  if echo "$result" | grep -q "error"; then
    log "Error updating KV secret for $secret_name: $(echo "$result" | jq -r '.errors[]')"
    send_notification "KV Secret Update Failed" "Failed to update secret for $secret_name. Error: $(echo "$result" | jq -r '.errors[]')" "error"
    return 1
  fi
  
  log "Successfully rotated KV secret for $secret_name"
  return 0
}

# Function to rotate transit keys
rotate_transit_keys() {
  local key_name="$1"
  local mount_path="$2"
  
  log "Rotating transit key $key_name ($mount_path)"
  
  # Rotate the transit key
  local result
  result=$(curl -s -X POST -H "X-Vault-Token: $OPENBAO_TOKEN" \
    "$OPENBAO_ADDR/v1/$mount_path/keys/$key_name/rotate")
  
  if echo "$result" | grep -q "error"; then
    log "Error rotating transit key $key_name: $(echo "$result" | jq -r '.errors[]')"
    send_notification "Transit Key Rotation Failed" "Failed to rotate transit key $key_name. Error: $(echo "$result" | jq -r '.errors[]')" "error"
    return 1
  fi
  
  log "Successfully rotated transit key $key_name"
  return 0
}

# Main function to process the rotation config
process_rotation_config() {
  if [ ! -f "$ROTATION_CONFIG" ]; then
    log "Error: Rotation configuration file $ROTATION_CONFIG not found"
    send_notification "Secret Rotation Failed" "Rotation configuration file $ROTATION_CONFIG not found" "error"
    exit 1
  fi
  
  log "Starting secret rotation process"
  send_notification "Secret Rotation Started" "Starting scheduled secret rotation process" "info"
  
  local success_count=0
  local failure_count=0
  local total_count=0
  
  # Process database credentials
  local db_credentials
  db_credentials=$(jq -c '.database_credentials[]' "$ROTATION_CONFIG" 2>/dev/null || echo "")
  
  if [ -n "$db_credentials" ]; then
    while read -r credential; do
      local db_name
      local mount_path
      local role_name
      
      db_name=$(echo "$credential" | jq -r '.name')
      mount_path=$(echo "$credential" | jq -r '.mount_path')
      role_name=$(echo "$credential" | jq -r '.role_name')
      
      if rotate_database_credentials "$db_name" "$mount_path" "$role_name"; then
        ((success_count++))
      else
        ((failure_count++))
      fi
      ((total_count++))
    done <<< "$db_credentials"
  fi
  
  # Process PKI certificates
  local pki_certificates
  pki_certificates=$(jq -c '.pki_certificates[]' "$ROTATION_CONFIG" 2>/dev/null || echo "")
  
  if [ -n "$pki_certificates" ]; then
    while read -r certificate; do
      local cert_name
      local mount_path
      local role_name
      local common_name
      local ttl
      
      cert_name=$(echo "$certificate" | jq -r '.name')
      mount_path=$(echo "$certificate" | jq -r '.mount_path')
      role_name=$(echo "$certificate" | jq -r '.role_name')
      common_name=$(echo "$certificate" | jq -r '.common_name')
      ttl=$(echo "$certificate" | jq -r '.ttl')
      
      if rotate_pki_certificates "$cert_name" "$mount_path" "$role_name" "$common_name" "$ttl"; then
        ((success_count++))
      else
        ((failure_count++))
      fi
      ((total_count++))
    done <<< "$pki_certificates"
  fi
  
  # Process KV secrets
  local kv_secrets
  kv_secrets=$(jq -c '.kv_secrets[]' "$ROTATION_CONFIG" 2>/dev/null || echo "")
  
  if [ -n "$kv_secrets" ]; then
    while read -r secret; do
      local secret_name
      local mount_path
      local path
      local generator_script
      
      secret_name=$(echo "$secret" | jq -r '.name')
      mount_path=$(echo "$secret" | jq -r '.mount_path')
      path=$(echo "$secret" | jq -r '.path')
      generator_script=$(echo "$secret" | jq -r '.generator_script')
      
      if rotate_kv_secrets "$secret_name" "$mount_path" "$path" "$generator_script"; then
        ((success_count++))
      else
        ((failure_count++))
      fi
      ((total_count++))
    done <<< "$kv_secrets"
  fi
  
  # Process transit keys
  local transit_keys
  transit_keys=$(jq -c '.transit_keys[]' "$ROTATION_CONFIG" 2>/dev/null || echo "")
  
  if [ -n "$transit_keys" ]; then
    while read -r key; do
      local key_name
      local mount_path
      
      key_name=$(echo "$key" | jq -r '.name')
      mount_path=$(echo "$key" | jq -r '.mount_path')
      
      if rotate_transit_keys "$key_name" "$mount_path"; then
        ((success_count++))
      else
        ((failure_count++))
      fi
      ((total_count++))
    done <<< "$transit_keys"
  fi
  
  # Send summary notification
  local status
  local subject
  
  if [ "$failure_count" -eq 0 ]; then
    status="success"
    subject="Secret Rotation Completed Successfully"
  elif [ "$failure_count" -lt "$total_count" ]; then
    status="warning"
    subject="Secret Rotation Completed with Warnings"
  else
    status="error"
    subject="Secret Rotation Failed"
  fi
  
  local message="Secret rotation process completed.\n\nTotal secrets processed: $total_count\nSuccessful rotations: $success_count\nFailed rotations: $failure_count\n\nSee $LOG_FILE for details."
  
  log "$message"
  send_notification "$subject" "$message" "$status"
  
  if [ "$failure_count" -gt 0 ]; then
    exit 1
  fi
  
  exit 0
}

# Execute the main function
process_rotation_config
