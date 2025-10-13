#!/bin/bash

# API Key Generator Script
# Generates a secure API key with the format: sev_<service>_<environment>_<random>

# Configuration
SERVICE=${1:-"api"}
ENVIRONMENT=${2:-"prod"}
KEY_LENGTH=32

# Generate a random string
random_string() {
  local length=$1
  cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w "$length" | head -n 1
}

# Generate the API key
generate_api_key() {
  local service=$1
  local environment=$2
  local random=$(random_string "$KEY_LENGTH")
  
  echo "sev_${service}_${environment}_${random}"
}

# Output the generated API key
generate_api_key "$SERVICE" "$ENVIRONMENT"
