#!/usr/bin/env bash
# Network Test Script
# Created: 2025-10-09
# Last Updated: 2025-10-09

# This script tests the network configuration for the Sevensa platform.
# It verifies that all networks are created correctly and that services
# can communicate with the appropriate networks.

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

# Test functions
test_network_existence() {
  log_info "Testing network existence..."
  
  for NETWORK in traefik_network keycloak_network openbao_network rentguy_network psra_network wpcs_network ai_network monitoring_network logging_network shared_network; do
    if docker network inspect "${NETWORK}" &>/dev/null; then
      log_success "Network ${NETWORK} exists"
    else
      log_error "Network ${NETWORK} does not exist"
      return 1
    fi
  done
  
  return 0
}

test_network_isolation() {
  log_info "Testing network isolation..."
  
  # Create test containers
  log_info "Creating test containers..."
  
  for NETWORK in traefik_network keycloak_network openbao_network rentguy_network psra_network wpcs_network ai_network monitoring_network logging_network shared_network; do
    docker run -d --name "test-${NETWORK}" --network "${NETWORK}" alpine:latest sleep 3600
  done
  
  # Test connectivity
  log_info "Testing connectivity..."
  
  # Test that shared_network can connect to all networks
  for NETWORK in traefik_network keycloak_network openbao_network rentguy_network psra_network wpcs_network ai_network monitoring_network logging_network; do
    if docker exec "test-shared_network" ping -c 1 "test-${NETWORK}" &>/dev/null; then
      log_error "test-shared_network can connect to test-${NETWORK}, but it should not be able to"
      return 1
    else
      log_success "test-shared_network cannot connect to test-${NETWORK}, as expected"
    fi
  done
  
  # Test that service networks cannot connect to each other
  for NETWORK1 in rentguy_network psra_network wpcs_network ai_network; do
    for NETWORK2 in rentguy_network psra_network wpcs_network ai_network; do
      if [ "${NETWORK1}" != "${NETWORK2}" ]; then
        if docker exec "test-${NETWORK1}" ping -c 1 "test-${NETWORK2}" &>/dev/null; then
          log_error "test-${NETWORK1} can connect to test-${NETWORK2}, but it should not be able to"
          return 1
        else
          log_success "test-${NETWORK1} cannot connect to test-${NETWORK2}, as expected"
        fi
      fi
    done
  done
  
  # Clean up test containers
  log_info "Cleaning up test containers..."
  
  for NETWORK in traefik_network keycloak_network openbao_network rentguy_network psra_network wpcs_network ai_network monitoring_network logging_network shared_network; do
    docker rm -f "test-${NETWORK}"
  done
  
  return 0
}

test_docker_compose_files() {
  log_info "Testing Docker Compose files..."
  
  for FILE in docker-compose.rentguy.yml docker-compose.psra.yml docker-compose.wpcs.yml docker-compose.ai.yml docker-compose.openbao.yml docker-compose.keycloak.yml; do
    if [ -f "${PROJECT_DIR}/networks/${FILE}" ]; then
      if docker-compose -f "${PROJECT_DIR}/networks/${FILE}" config &>/dev/null; then
        log_success "Docker Compose file ${FILE} is valid"
      else
        log_error "Docker Compose file ${FILE} is invalid"
        return 1
      fi
    else
      log_error "Docker Compose file ${FILE} does not exist"
      return 1
    fi
  done
  
  return 0
}

# Main function
main() {
  log_info "Starting network tests..."
  
  # Run tests
  test_network_existence || return 1
  test_network_isolation || return 1
  test_docker_compose_files || return 1
  
  log_success "All network tests passed!"
  return 0
}

# Set project directory
PROJECT_DIR=${PROJECT_DIR:-/opt/central-vault}

# Run main function
cd "${PROJECT_DIR}"
main
exit $?
