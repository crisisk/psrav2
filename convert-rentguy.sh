#!/bin/bash
# RentGuy Docker Compose to Kubernetes Conversion Script
# Created: 2025-10-09
# Last Updated: 2025-10-09

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Log function
log() {
  local level=$1
  local message=$2
  local color=$NC
  
  case $level in
    "INFO") color=$BLUE ;;
    "SUCCESS") color=$GREEN ;;
    "WARNING") color=$YELLOW ;;
    "ERROR") color=$RED ;;
  esac
  
  echo -e "${color}[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $message${NC}"
}

# Check if kompose is installed
if ! command -v kompose &> /dev/null; then
  log "ERROR" "kompose is not installed. Please install it first."
  log "INFO" "You can install it by running: curl -L https://github.com/kubernetes/kompose/releases/download/v1.33.0/kompose-linux-amd64 -o kompose && chmod +x kompose && sudo mv kompose /usr/local/bin/"
  exit 1
fi

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
  log "ERROR" "kubectl is not installed. Please install it first."
  exit 1
fi

# Check if docker-compose file exists
DOCKER_COMPOSE_FILE="/home/ubuntu/rentguy_deployment/docker-compose.yml"
if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
  log "ERROR" "Docker Compose file not found at $DOCKER_COMPOSE_FILE"
  exit 1
fi

# Create output directory
OUTPUT_DIR="/home/ubuntu/sevensa_implementation/code/kubernetes/rentguy"
mkdir -p $OUTPUT_DIR
log "INFO" "Created output directory: $OUTPUT_DIR"

# Copy docker-compose file to output directory
cp $DOCKER_COMPOSE_FILE $OUTPUT_DIR/docker-compose.yml
log "INFO" "Copied docker-compose file to output directory"

# Change to output directory
cd $OUTPUT_DIR
log "INFO" "Changed to output directory: $OUTPUT_DIR"

# Convert docker-compose file to Kubernetes resources
log "INFO" "Converting docker-compose file to Kubernetes resources..."
kompose convert -f docker-compose.yml --controller deployment --namespace rentguy --with-kompose-annotation=false

# Add namespace to all resources
log "INFO" "Adding namespace to all resources..."
for file in *.yaml; do
  if ! grep -q "namespace: rentguy" $file; then
    sed -i '/metadata:/a \ \ namespace: rentguy' $file
  fi
done

# Add resource limits and requests to all deployments
log "INFO" "Adding resource limits and requests to all deployments..."
for file in *-deployment.yaml; do
  if ! grep -q "resources:" $file; then
    sed -i '/containers:/a \ \ \ \ \ \ \ \ resources:\n\ \ \ \ \ \ \ \ \ \ requests:\n\ \ \ \ \ \ \ \ \ \ \ \ memory: "256Mi"\n\ \ \ \ \ \ \ \ \ \ \ \ cpu: "100m"\n\ \ \ \ \ \ \ \ \ \ limits:\n\ \ \ \ \ \ \ \ \ \ \ \ memory: "512Mi"\n\ \ \ \ \ \ \ \ \ \ \ \ cpu: "500m"' $file
  fi
done

# Add health checks to API deployment
log "INFO" "Adding health checks to API deployment..."
if [ -f "rentguy-api-deployment.yaml" ]; then
  if ! grep -q "livenessProbe:" rentguy-api-deployment.yaml; then
    sed -i '/resources:/a \ \ \ \ \ \ \ \ livenessProbe:\n\ \ \ \ \ \ \ \ \ \ httpGet:\n\ \ \ \ \ \ \ \ \ \ \ \ path: /health\n\ \ \ \ \ \ \ \ \ \ \ \ port: 3000\n\ \ \ \ \ \ \ \ \ \ initialDelaySeconds: 30\n\ \ \ \ \ \ \ \ \ \ periodSeconds: 10\n\ \ \ \ \ \ \ \ readinessProbe:\n\ \ \ \ \ \ \ \ \ \ httpGet:\n\ \ \ \ \ \ \ \ \ \ \ \ path: /ready\n\ \ \ \ \ \ \ \ \ \ \ \ port: 3000\n\ \ \ \ \ \ \ \ \ \ initialDelaySeconds: 5\n\ \ \ \ \ \ \ \ \ \ periodSeconds: 5' rentguy-api-deployment.yaml
  fi
fi

# Create namespace file
log "INFO" "Creating namespace file..."
cat > rentguy-namespace.yaml << EOF
apiVersion: v1
kind: Namespace
metadata:
  name: rentguy
  labels:
    name: rentguy
EOF

# Create network policy file
log "INFO" "Creating network policy file..."
cat > rentguy-network-policy.yaml << EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: rentguy-network-policy
  namespace: rentguy
spec:
  podSelector:
    matchLabels:
      app: rentguy
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress
    - podSelector:
        matchLabels:
          app: traefik
    ports:
    - protocol: TCP
      port: 80
  - from:
    - podSelector:
        matchLabels:
          app: rentguy
    ports:
    - protocol: TCP
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: rentguy
    ports:
    - protocol: TCP
  - to:
    - namespaceSelector:
        matchLabels:
          name: infra
    ports:
    - protocol: TCP
      port: 8200  # OpenBao
    - protocol: TCP
      port: 8080  # Keycloak
EOF

# Create ingress file
log "INFO" "Creating ingress file..."
cat > rentguy-ingress.yaml << EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: rentguy-ingress
  namespace: rentguy
  annotations:
    kubernetes.io/ingress.class: "traefik"
    traefik.ingress.kubernetes.io/router.entrypoints: "websecure"
    traefik.ingress.kubernetes.io/router.tls: "true"
    traefik.ingress.kubernetes.io/router.middlewares: "rentguy-auth@kubernetescrd"
spec:
  rules:
  - host: rentguy.sevensa.nl
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: rentguy-frontend
            port:
              number: 80
  - host: api.rentguy.sevensa.nl
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: rentguy-api
            port:
              number: 80
  - host: onboarding.rentguy.sevensa.nl
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: rentguy-onboarding
            port:
              number: 80
  tls:
  - hosts:
    - rentguy.sevensa.nl
    - api.rentguy.sevensa.nl
    - onboarding.rentguy.sevensa.nl
    secretName: rentguy-tls
EOF

# Create service account file
log "INFO" "Creating service account file..."
cat > rentguy-service-account.yaml << EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  name: rentguy-api
  namespace: rentguy
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: rentguy-api-role
  namespace: rentguy
rules:
- apiGroups: [""]
  resources: ["configmaps", "secrets"]
  verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: rentguy-api-role-binding
  namespace: rentguy
subjects:
- kind: ServiceAccount
  name: rentguy-api
  namespace: rentguy
roleRef:
  kind: Role
  name: rentguy-api-role
  apiGroup: rbac.authorization.k8s.io
EOF

# Create config map for environment variables
log "INFO" "Creating config map for environment variables..."
cat > rentguy-config.yaml << EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: rentguy-config
  namespace: rentguy
data:
  NODE_ENV: "production"
  API_URL: "https://api.rentguy.sevensa.nl"
  FRONTEND_URL: "https://rentguy.sevensa.nl"
  ONBOARDING_URL: "https://onboarding.rentguy.sevensa.nl"
  KEYCLOAK_URL: "https://keycloak.sevensa.nl/auth"
  KEYCLOAK_REALM: "sevensa"
  KEYCLOAK_CLIENT_ID: "rentguy-api"
EOF

# Create secret for database credentials
log "INFO" "Creating secret for database credentials..."
cat > rentguy-db-credentials.yaml << EOF
apiVersion: v1
kind: Secret
metadata:
  name: rentguy-db-credentials
  namespace: rentguy
type: Opaque
stringData:
  username: "rentguy"
  password: "changeme"
  url: "postgresql://rentguy:changeme@rentguy-db:5432/rentguy"
EOF

# Create secret for JWT
log "INFO" "Creating secret for JWT..."
cat > rentguy-jwt.yaml << EOF
apiVersion: v1
kind: Secret
metadata:
  name: rentguy-jwt
  namespace: rentguy
type: Opaque
stringData:
  secret: "changeme"
EOF

# Create secret for OpenBao
log "INFO" "Creating secret for OpenBao..."
cat > rentguy-openbao-credentials.yaml << EOF
apiVersion: v1
kind: Secret
metadata:
  name: rentguy-openbao-credentials
  namespace: rentguy
type: Opaque
stringData:
  role_id: "changeme"
  secret_id: "changeme"
EOF

# Create secret for Keycloak
log "INFO" "Creating secret for Keycloak..."
cat > rentguy-keycloak-credentials.yaml << EOF
apiVersion: v1
kind: Secret
metadata:
  name: rentguy-keycloak-credentials
  namespace: rentguy
type: Opaque
stringData:
  client_secret: "changeme"
EOF

# Create Helm chart structure
log "INFO" "Creating Helm chart structure..."
mkdir -p helm/rentguy/templates
mkdir -p helm/rentguy/charts

# Create Chart.yaml
log "INFO" "Creating Chart.yaml..."
cat > helm/rentguy/Chart.yaml << EOF
apiVersion: v2
name: rentguy
description: A Helm chart for RentGuy
type: application
version: 0.1.0
appVersion: "1.0.0"
EOF

# Create values.yaml
log "INFO" "Creating values.yaml..."
cat > helm/rentguy/values.yaml << EOF
# Default values for rentguy.
# This is a YAML-formatted file.

replicaCount: 3

image:
  repository: sevensa/rentguy-api
  tag: latest
  pullPolicy: Always

service:
  type: ClusterIP
  port: 80
  targetPort: 3000

ingress:
  enabled: true
  annotations:
    kubernetes.io/ingress.class: "traefik"
    traefik.ingress.kubernetes.io/router.entrypoints: "websecure"
    traefik.ingress.kubernetes.io/router.tls: "true"
  hosts:
    - host: api.rentguy.sevensa.nl
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: rentguy-tls
      hosts:
        - api.rentguy.sevensa.nl

resources:
  requests:
    cpu: 100m
    memory: 256Mi
  limits:
    cpu: 500m
    memory: 512Mi

database:
  enabled: true
  type: postgresql
  host: rentguy-db
  port: 5432
  database: rentguy
  username: rentguy
  existingSecret: rentguy-db-credentials

redis:
  enabled: true
  host: rentguy-redis
  port: 6379
  existingSecret: rentguy-redis-credentials

keycloak:
  enabled: true
  realm: sevensa
  clientId: rentguy-api
  existingSecret: rentguy-keycloak-credentials

openbao:
  enabled: true
  role: rentguy
  existingSecret: rentguy-openbao-credentials

networkPolicy:
  enabled: true
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: ingress
        - podSelector:
            matchLabels:
              app: traefik
      ports:
        - protocol: TCP
          port: 80
EOF

# Copy Kubernetes resources to Helm templates
log "INFO" "Copying Kubernetes resources to Helm templates..."
cp rentguy-namespace.yaml helm/rentguy/templates/
cp rentguy-network-policy.yaml helm/rentguy/templates/
cp rentguy-ingress.yaml helm/rentguy/templates/
cp rentguy-service-account.yaml helm/rentguy/templates/
cp rentguy-config.yaml helm/rentguy/templates/
cp rentguy-db-credentials.yaml helm/rentguy/templates/
cp rentguy-jwt.yaml helm/rentguy/templates/
cp rentguy-openbao-credentials.yaml helm/rentguy/templates/
cp rentguy-keycloak-credentials.yaml helm/rentguy/templates/

# Copy deployment and service files to Helm templates
log "INFO" "Copying deployment and service files to Helm templates..."
for file in *-deployment.yaml *-service.yaml; do
  cp $file helm/rentguy/templates/
done

# Create kustomization.yaml
log "INFO" "Creating kustomization.yaml..."
cat > kustomization.yaml << EOF
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: rentguy

resources:
- rentguy-namespace.yaml
- rentguy-network-policy.yaml
- rentguy-ingress.yaml
- rentguy-service-account.yaml
- rentguy-config.yaml
- rentguy-db-credentials.yaml
- rentguy-jwt.yaml
- rentguy-openbao-credentials.yaml
- rentguy-keycloak-credentials.yaml
EOF

# Add all deployment and service files to kustomization.yaml
for file in *-deployment.yaml *-service.yaml; do
  echo "- $file" >> kustomization.yaml
done

# Create ArgoCD application file
log "INFO" "Creating ArgoCD application file..."
cat > rentguy-argocd-application.yaml << EOF
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: rentguy
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/sevensa/kubernetes-manifests.git
    targetRevision: HEAD
    path: charts/rentguy
    helm:
      valueFiles:
        - values.yaml
        - values-prod.yaml
  destination:
    server: https://kubernetes.default.svc
    namespace: rentguy
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
EOF

# Summary
log "SUCCESS" "RentGuy Docker Compose to Kubernetes conversion completed successfully!"
log "INFO" "Kubernetes resources created in $OUTPUT_DIR"
log "INFO" "Helm chart created in $OUTPUT_DIR/helm/rentguy"
log "INFO" "ArgoCD application file created: $OUTPUT_DIR/rentguy-argocd-application.yaml"
log "INFO" "To apply the Kubernetes resources, run: kubectl apply -k $OUTPUT_DIR"
log "INFO" "To deploy using Helm, run: helm install rentguy $OUTPUT_DIR/helm/rentguy"
log "INFO" "To deploy using ArgoCD, apply the ArgoCD application file: kubectl apply -f $OUTPUT_DIR/rentguy-argocd-application.yaml"
