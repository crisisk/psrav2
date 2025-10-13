#!/usr/bin/env bash
# Network Initialization Script
# Created: 2025-10-09
# Last Updated: 2025-10-09

# This script initializes all Docker networks used by the Sevensa platform.
# It creates each network with the appropriate configuration and ensures
# that the networks are properly isolated from each other.

set -euo pipefail

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

# Create networks
create_network() {
  local network_name=$1
  local network_driver=${2:-bridge}
  local network_subnet=${3:-}
  
  log_info "Creating network: ${network_name}"
  
  if docker network inspect "${network_name}" &>/dev/null; then
    log_info "Network ${network_name} already exists"
  else
    if [ -n "${network_subnet}" ]; then
      docker network create --driver "${network_driver}" --subnet "${network_subnet}" "${network_name}"
    else
      docker network create --driver "${network_driver}" "${network_name}"
    fi
    log_success "Network ${network_name} created successfully"
  fi
}

# Main function
main() {
  log_info "Initializing Docker networks for Sevensa platform"
  
  # Create networks
  create_network "traefik_network" "bridge" "172.20.0.0/24"
  create_network "keycloak_network" "bridge" "172.20.1.0/24"
  create_network "openbao_network" "bridge" "172.20.2.0/24"
  create_network "rentguy_network" "bridge" "172.20.3.0/24"
  create_network "psra_network" "bridge" "172.20.4.0/24"
  create_network "wpcs_network" "bridge" "172.20.5.0/24"
  create_network "ai_network" "bridge" "172.20.6.0/24"
  create_network "monitoring_network" "bridge" "172.20.7.0/24"
  create_network "logging_network" "bridge" "172.20.8.0/24"
  create_network "shared_network" "bridge" "172.20.9.0/24"
  
  log_success "All networks initialized successfully"
  
  # List networks
  log_info "Docker networks:"
  docker network ls | grep -E 'traefik_network|keycloak_network|openbao_network|rentguy_network|psra_network|wpcs_network|ai_network|monitoring_network|logging_network|shared_network'
}

# Run main function
main
