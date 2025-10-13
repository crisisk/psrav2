#!/bin/bash

# Kubernetes Migration Deployment Script
# This script deploys the Kubernetes migration components

set -e

# Configuration
LOG_FILE=${LOG_FILE:-"/var/log/sevensa/k8s_migration.log"}

# Create log directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

# Function to log messages
log() {
  local timestamp
  timestamp=$(date +"%Y-%m-%d %H:%M:%S")
  echo "[$timestamp] $1" | tee -a "$LOG_FILE"
}

# Function to check if command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
  log "Checking prerequisites"
  
  # Check if kubectl is installed
  if ! command_exists kubectl; then
    log "Error: kubectl is not installed"
    exit 1
  fi
  
  # Check if helm is installed
  if ! command_exists helm; then
    log "Error: helm is not installed"
    exit 1
  fi
  
  # Check if kubectl can connect to the cluster
  if ! kubectl cluster-info &>/dev/null; then
    log "Error: kubectl cannot connect to the cluster"
    exit 1
  fi
  
  log "Prerequisites check passed"
}

# Function to deploy infrastructure components
deploy_infrastructure() {
  log "Deploying infrastructure components"
  
  # Create namespaces
  log "Creating namespaces"
  kubectl apply -f infrastructure/namespaces.yaml
  
  # Create storage classes
  log "Creating storage classes"
  kubectl apply -f infrastructure/storage-class.yaml
  
  # Add Helm repositories
  log "Adding Helm repositories"
  helm repo add traefik https://helm.traefik.io/traefik
  helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
  helm repo add grafana https://grafana.github.io/helm-charts
  helm repo add argo https://argoproj.github.io/argo-helm
  helm repo update
  
  # Install Traefik
  log "Installing Traefik"
  helm upgrade --install traefik traefik/traefik -n traefik -f infrastructure/traefik-values.yaml
  
  # Wait for Traefik to be ready
  log "Waiting for Traefik to be ready"
  kubectl -n traefik rollout status deployment/traefik
  
  # Install Prometheus
  log "Installing Prometheus"
  helm upgrade --install prometheus prometheus-community/kube-prometheus-stack -n monitoring -f infrastructure/prometheus-values.yaml
  
  # Wait for Prometheus to be ready
  log "Waiting for Prometheus to be ready"
  kubectl -n monitoring rollout status deployment/prometheus-grafana
  
  # Install Loki
  log "Installing Loki"
  helm upgrade --install loki grafana/loki-stack -n logging -f infrastructure/loki-values.yaml
  
  # Wait for Loki to be ready
  log "Waiting for Loki to be ready"
  kubectl -n logging rollout status statefulset/loki
  
  # Install ArgoCD
  log "Installing ArgoCD"
  helm upgrade --install argocd argo/argo-cd -n argocd -f infrastructure/argocd-values.yaml
  
  # Wait for ArgoCD to be ready
  log "Waiting for ArgoCD to be ready"
  kubectl -n argocd rollout status deployment/argocd-server
  
  log "Infrastructure components deployed successfully"
}

# Function to check required environment variables
check_env_vars() {
  local service=$1
  local missing=0
  
  log "Checking environment variables for $service"
  
  case $service in
    psra)
      if [ -z "$DB_PASSWORD" ]; then
        log "Error: DB_PASSWORD is not set"
        missing=1
      fi
      if [ -z "$REDIS_PASSWORD" ]; then
        log "Error: REDIS_PASSWORD is not set"
        missing=1
      fi
      if [ -z "$JWT_SECRET" ]; then
        log "Error: JWT_SECRET is not set"
        missing=1
      fi
      if [ -z "$KEYCLOAK_CLIENT_SECRET" ]; then
        log "Error: KEYCLOAK_CLIENT_SECRET is not set"
        missing=1
      fi
      if [ -z "$OPENBAO_ROLE_ID" ]; then
        log "Error: OPENBAO_ROLE_ID is not set"
        missing=1
      fi
      if [ -z "$OPENBAO_SECRET_ID" ]; then
        log "Error: OPENBAO_SECRET_ID is not set"
        missing=1
      fi
      if [ -z "$OPENAI_API_KEY" ]; then
        log "Error: OPENAI_API_KEY is not set"
        missing=1
      fi
      ;;
    rentguy)
      if [ -z "$DB_PASSWORD" ]; then
        log "Error: DB_PASSWORD is not set"
        missing=1
      fi
      if [ -z "$REDIS_PASSWORD" ]; then
        log "Error: REDIS_PASSWORD is not set"
        missing=1
      fi
      if [ -z "$JWT_SECRET" ]; then
        log "Error: JWT_SECRET is not set"
        missing=1
      fi
      if [ -z "$KEYCLOAK_CLIENT_SECRET" ]; then
        log "Error: KEYCLOAK_CLIENT_SECRET is not set"
        missing=1
      fi
      if [ -z "$OPENBAO_ROLE_ID" ]; then
        log "Error: OPENBAO_ROLE_ID is not set"
        missing=1
      fi
      if [ -z "$OPENBAO_SECRET_ID" ]; then
        log "Error: OPENBAO_SECRET_ID is not set"
        missing=1
      fi
      ;;
    *)
      log "Error: Unknown service $service"
      exit 1
      ;;
  esac
  
  if [ $missing -eq 1 ]; then
    log "Error: Required environment variables are not set for $service"
    exit 1
  fi
  
  log "Environment variables check passed for $service"
}

# Function to deploy PSRA service
deploy_psra() {
  log "Deploying PSRA service"
  
  # Check environment variables
  check_env_vars psra
  
  # Process secret template
  log "Processing secret template"
  envsubst < services/psra/secret.yaml > services/psra/secret.processed.yaml
  
  # Apply PSRA resources
  log "Applying PSRA resources"
  kubectl apply -f services/psra/serviceaccount.yaml
  kubectl apply -f services/psra/configmap.yaml
  kubectl apply -f services/psra/secret.processed.yaml
  kubectl apply -f services/psra/pvc.yaml
  kubectl apply -f services/psra/database.yaml
  kubectl apply -f services/psra/redis.yaml
  kubectl apply -f services/psra/deployment.yaml
  kubectl apply -f services/psra/service.yaml
  kubectl apply -f services/psra/hpa.yaml
  kubectl apply -f services/psra/networkpolicy.yaml
  kubectl apply -f services/psra/ingress.yaml
  
  # Clean up processed secret
  rm services/psra/secret.processed.yaml
  
  # Wait for PSRA to be ready
  log "Waiting for PSRA to be ready"
  kubectl -n sevensa-psra rollout status deployment/psra-api
  kubectl -n sevensa-psra rollout status deployment/psra-frontend
  kubectl -n sevensa-psra rollout status deployment/langgraph-origin-engine
  
  log "PSRA service deployed successfully"
}

# Function to deploy RentGuy service
deploy_rentguy() {
  log "Deploying RentGuy service"
  
  # Check environment variables
  check_env_vars rentguy
  
  # Process secret template
  log "Processing secret template"
  envsubst < services/rentguy/secret.yaml > services/rentguy/secret.processed.yaml
  
  # Apply RentGuy resources
  log "Applying RentGuy resources"
  kubectl apply -f services/rentguy/serviceaccount.yaml
  kubectl apply -f services/rentguy/configmap.yaml
  kubectl apply -f services/rentguy/secret.processed.yaml
  kubectl apply -f services/rentguy/pvc.yaml
  kubectl apply -f services/rentguy/database.yaml
  kubectl apply -f services/rentguy/redis.yaml
  kubectl apply -f services/rentguy/deployment.yaml
  kubectl apply -f services/rentguy/service.yaml
  kubectl apply -f services/rentguy/hpa.yaml
  kubectl apply -f services/rentguy/networkpolicy.yaml
  kubectl apply -f services/rentguy/ingress.yaml
  
  # Clean up processed secret
  rm services/rentguy/secret.processed.yaml
  
  # Wait for RentGuy to be ready
  log "Waiting for RentGuy to be ready"
  kubectl -n sevensa-rentguy rollout status deployment/rentguy-api
  kubectl -n sevensa-rentguy rollout status deployment/rentguy-frontend
  
  log "RentGuy service deployed successfully"
}

# Function to deploy all services
deploy_all() {
  log "Deploying all services"
  
  # Deploy PSRA (primary service)
  deploy_psra
  
  # Deploy RentGuy
  deploy_rentguy
  
  # Deploy other services
  # TODO: Add deployment of other services
  
  log "All services deployed successfully"
}

# Function to deploy a specific service
deploy_service() {
  local service=$1
  
  case $service in
    psra)
      deploy_psra
      ;;
    rentguy)
      deploy_rentguy
      ;;
    *)
      log "Error: Unknown service $service"
      exit 1
      ;;
  esac
}

# Main function
main() {
  log "Starting Kubernetes migration deployment"
  
  # Check prerequisites
  check_prerequisites
  
  # Parse command line arguments
  if [ $# -eq 0 ]; then
    # No arguments, deploy everything
    deploy_infrastructure
    deploy_all
  else
    case $1 in
      infrastructure)
        deploy_infrastructure
        ;;
      psra)
        deploy_psra
        ;;
      rentguy)
        deploy_rentguy
        ;;
      all)
        deploy_all
        ;;
      *)
        log "Error: Unknown argument $1"
        log "Usage: $0 [infrastructure|psra|rentguy|all]"
        exit 1
        ;;
    esac
  fi
  
  log "Kubernetes migration deployment completed successfully"
}

# Execute main function with command line arguments
main "$@"
