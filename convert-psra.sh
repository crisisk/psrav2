#!/bin/bash
# PSRA-LTSD Docker Compose to Kubernetes Conversion Script
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
DOCKER_COMPOSE_FILE="/home/ubuntu/psra_deployment/docker-compose.yml"
if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
  log "ERROR" "Docker Compose file not found at $DOCKER_COMPOSE_FILE"
  exit 1
fi

# Create output directory
OUTPUT_DIR="/home/ubuntu/sevensa_implementation/code/kubernetes/psra"
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
kompose convert -f docker-compose.yml --controller deployment --namespace psra --with-kompose-annotation=false

# Add namespace to all resources
log "INFO" "Adding namespace to all resources..."
for file in *.yaml; do
  if ! grep -q "namespace: psra" $file; then
    sed -i '/metadata:/a \ \ namespace: psra' $file
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
if [ -f "psra-api-deployment.yaml" ]; then
  if ! grep -q "livenessProbe:" psra-api-deployment.yaml; then
    sed -i '/resources:/a \ \ \ \ \ \ \ \ livenessProbe:\n\ \ \ \ \ \ \ \ \ \ httpGet:\n\ \ \ \ \ \ \ \ \ \ \ \ path: /health\n\ \ \ \ \ \ \ \ \ \ \ \ port: 3000\n\ \ \ \ \ \ \ \ \ \ initialDelaySeconds: 30\n\ \ \ \ \ \ \ \ \ \ periodSeconds: 10\n\ \ \ \ \ \ \ \ readinessProbe:\n\ \ \ \ \ \ \ \ \ \ httpGet:\n\ \ \ \ \ \ \ \ \ \ \ \ path: /ready\n\ \ \ \ \ \ \ \ \ \ \ \ port: 3000\n\ \ \ \ \ \ \ \ \ \ initialDelaySeconds: 5\n\ \ \ \ \ \ \ \ \ \ periodSeconds: 5' psra-api-deployment.yaml
  fi
fi

# Create namespace file
log "INFO" "Creating namespace file..."
cat > psra-namespace.yaml << EOF
apiVersion: v1
kind: Namespace
metadata:
  name: psra
  labels:
    name: psra
EOF

# Create network policy file
log "INFO" "Creating network policy file..."
cat > psra-network-policy.yaml << EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: psra-network-policy
  namespace: psra
spec:
  podSelector:
    matchLabels:
      app: psra
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
          app: psra
    ports:
    - protocol: TCP
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: psra
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
cat > psra-ingress.yaml << EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: psra-ingress
  namespace: psra
  annotations:
    kubernetes.io/ingress.class: "traefik"
    traefik.ingress.kubernetes.io/router.entrypoints: "websecure"
    traefik.ingress.kubernetes.io/router.tls: "true"
    traefik.ingress.kubernetes.io/router.middlewares: "psra-auth@kubernetescrd"
spec:
  rules:
  - host: psra.sevensa.nl
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: psra-frontend
            port:
              number: 80
  - host: api.psra.sevensa.nl
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: psra-api
            port:
              number: 80
  - host: origin-engine.psra.sevensa.nl
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: psra-origin-engine
            port:
              number: 8000
  tls:
  - hosts:
    - psra.sevensa.nl
    - api.psra.sevensa.nl
    - origin-engine.psra.sevensa.nl
    secretName: psra-tls
EOF

# Create service account file
log "INFO" "Creating service account file..."
cat > psra-service-account.yaml << EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  name: psra-api
  namespace: psra
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: psra-api-role
  namespace: psra
rules:
- apiGroups: [""]
  resources: ["configmaps", "secrets"]
  verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: psra-api-role-binding
  namespace: psra
subjects:
- kind: ServiceAccount
  name: psra-api
  namespace: psra
roleRef:
  kind: Role
  name: psra-api-role
  apiGroup: rbac.authorization.k8s.io
EOF

# Create config map for environment variables
log "INFO" "Creating config map for environment variables..."
cat > psra-config.yaml << EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: psra-config
  namespace: psra
data:
  NODE_ENV: "production"
  API_URL: "https://api.psra.sevensa.nl"
  FRONTEND_URL: "https://psra.sevensa.nl"
  ORIGIN_ENGINE_URL: "https://origin-engine.psra.sevensa.nl"
  KEYCLOAK_URL: "https://keycloak.sevensa.nl/auth"
  KEYCLOAK_REALM: "sevensa"
  KEYCLOAK_CLIENT_ID: "psra-api"
EOF

# Create secret for database credentials
log "INFO" "Creating secret for database credentials..."
cat > psra-db-credentials.yaml << EOF
apiVersion: v1
kind: Secret
metadata:
  name: psra-db-credentials
  namespace: psra
type: Opaque
stringData:
  username: "psra"
  password: "changeme"
  url: "postgresql://psra:changeme@psra-db:5432/psra"
EOF

# Create secret for JWT
log "INFO" "Creating secret for JWT..."
cat > psra-jwt.yaml << EOF
apiVersion: v1
kind: Secret
metadata:
  name: psra-jwt
  namespace: psra
type: Opaque
stringData:
  secret: "changeme"
EOF

# Create secret for OpenBao
log "INFO" "Creating secret for OpenBao..."
cat > psra-openbao-credentials.yaml << EOF
apiVersion: v1
kind: Secret
metadata:
  name: psra-openbao-credentials
  namespace: psra
type: Opaque
stringData:
  role_id: "changeme"
  secret_id: "changeme"
EOF

# Create secret for Keycloak
log "INFO" "Creating secret for Keycloak..."
cat > psra-keycloak-credentials.yaml << EOF
apiVersion: v1
kind: Secret
metadata:
  name: psra-keycloak-credentials
  namespace: psra
type: Opaque
stringData:
  client_secret: "changeme"
EOF

# Create LangGraph Origin Engine deployment
log "INFO" "Creating LangGraph Origin Engine deployment..."
cat > psra-origin-engine-deployment.yaml << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: psra-origin-engine
  namespace: psra
  labels:
    app: psra
    component: origin-engine
spec:
  replicas: 2
  selector:
    matchLabels:
      app: psra
      component: origin-engine
  template:
    metadata:
      labels:
        app: psra
        component: origin-engine
    spec:
      serviceAccountName: psra-api
      containers:
      - name: origin-engine
        image: sevensa/psra-origin-engine:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: psra-db-credentials
              key: url
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: psra-openai-credentials
              key: api_key
        - name: POSTGRES_HOST
          value: "psra-db"
        - name: POSTGRES_PORT
          value: "5432"
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: psra-db-credentials
              key: username
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: psra-db-credentials
              key: password
        - name: POSTGRES_DB
          value: "psra"
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
      initContainers:
      - name: init-db
        image: sevensa/psra-origin-engine:latest
        command: ['sh', '-c', 'until nc -z psra-db 5432; do echo waiting for db; sleep 2; done;']
EOF

# Create LangGraph Origin Engine service
log "INFO" "Creating LangGraph Origin Engine service..."
cat > psra-origin-engine-service.yaml << EOF
apiVersion: v1
kind: Service
metadata:
  name: psra-origin-engine
  namespace: psra
  labels:
    app: psra
    component: origin-engine
spec:
  selector:
    app: psra
    component: origin-engine
  ports:
  - port: 8000
    targetPort: 8000
    protocol: TCP
    name: http
  type: ClusterIP
EOF

# Create secret for OpenAI API key
log "INFO" "Creating secret for OpenAI API key..."
cat > psra-openai-credentials.yaml << EOF
apiVersion: v1
kind: Secret
metadata:
  name: psra-openai-credentials
  namespace: psra
type: Opaque
stringData:
  api_key: "changeme"
EOF

# Create PostgreSQL StatefulSet for LangGraph checkpoints
log "INFO" "Creating PostgreSQL StatefulSet for LangGraph checkpoints..."
cat > psra-langgraph-db-statefulset.yaml << EOF
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: psra-langgraph-db
  namespace: psra
  labels:
    app: psra
    component: langgraph-db
spec:
  serviceName: psra-langgraph-db
  replicas: 1
  selector:
    matchLabels:
      app: psra
      component: langgraph-db
  template:
    metadata:
      labels:
        app: psra
        component: langgraph-db
    spec:
      containers:
      - name: postgres
        image: postgres:14-alpine
        ports:
        - containerPort: 5432
          name: postgres
        env:
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: psra-langgraph-db-credentials
              key: username
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: psra-langgraph-db-credentials
              key: password
        - name: POSTGRES_DB
          value: langgraph
        volumeMounts:
        - name: data
          mountPath: /var/lib/postgresql/data
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "250m"
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: [ "ReadWriteOnce" ]
      storageClassName: "standard"
      resources:
        requests:
          storage: 5Gi
EOF

# Create PostgreSQL Service for LangGraph checkpoints
log "INFO" "Creating PostgreSQL Service for LangGraph checkpoints..."
cat > psra-langgraph-db-service.yaml << EOF
apiVersion: v1
kind: Service
metadata:
  name: psra-langgraph-db
  namespace: psra
  labels:
    app: psra
    component: langgraph-db
spec:
  selector:
    app: psra
    component: langgraph-db
  ports:
  - port: 5432
    targetPort: 5432
    protocol: TCP
    name: postgres
  type: ClusterIP
EOF

# Create secret for LangGraph PostgreSQL credentials
log "INFO" "Creating secret for LangGraph PostgreSQL credentials..."
cat > psra-langgraph-db-credentials.yaml << EOF
apiVersion: v1
kind: Secret
metadata:
  name: psra-langgraph-db-credentials
  namespace: psra
type: Opaque
stringData:
  username: "langgraph"
  password: "changeme"
  url: "postgresql://langgraph:changeme@psra-langgraph-db:5432/langgraph"
EOF

# Create Helm chart structure
log "INFO" "Creating Helm chart structure..."
mkdir -p helm/psra/templates
mkdir -p helm/psra/charts

# Create Chart.yaml
log "INFO" "Creating Chart.yaml..."
cat > helm/psra/Chart.yaml << EOF
apiVersion: v2
name: psra
description: A Helm chart for PSRA-LTSD
type: application
version: 0.1.0
appVersion: "1.0.0"
EOF

# Create values.yaml
log "INFO" "Creating values.yaml..."
cat > helm/psra/values.yaml << EOF
# Default values for psra.
# This is a YAML-formatted file.

replicaCount: 3

api:
  image:
    repository: sevensa/psra-api
    tag: latest
    pullPolicy: Always
  service:
    type: ClusterIP
    port: 80
    targetPort: 3000
  resources:
    requests:
      cpu: 100m
      memory: 256Mi
    limits:
      cpu: 500m
      memory: 512Mi

frontend:
  image:
    repository: sevensa/psra-frontend
    tag: latest
    pullPolicy: Always
  service:
    type: ClusterIP
    port: 80
    targetPort: 80
  resources:
    requests:
      cpu: 50m
      memory: 128Mi
    limits:
      cpu: 200m
      memory: 256Mi

originEngine:
  image:
    repository: sevensa/psra-origin-engine
    tag: latest
    pullPolicy: Always
  service:
    type: ClusterIP
    port: 8000
    targetPort: 8000
  resources:
    requests:
      cpu: 250m
      memory: 512Mi
    limits:
      cpu: 500m
      memory: 1Gi
  replicas: 2

database:
  enabled: true
  type: postgresql
  host: psra-db
  port: 5432
  database: psra
  username: psra
  existingSecret: psra-db-credentials

langgraphDatabase:
  enabled: true
  type: postgresql
  host: psra-langgraph-db
  port: 5432
  database: langgraph
  username: langgraph
  existingSecret: psra-langgraph-db-credentials

keycloak:
  enabled: true
  realm: sevensa
  clientId: psra-api
  existingSecret: psra-keycloak-credentials

openbao:
  enabled: true
  role: psra
  existingSecret: psra-openbao-credentials

openai:
  enabled: true
  existingSecret: psra-openai-credentials

ingress:
  enabled: true
  annotations:
    kubernetes.io/ingress.class: "traefik"
    traefik.ingress.kubernetes.io/router.entrypoints: "websecure"
    traefik.ingress.kubernetes.io/router.tls: "true"
  hosts:
    - host: psra.sevensa.nl
      paths:
        - path: /
          pathType: Prefix
          serviceName: psra-frontend
          servicePort: 80
    - host: api.psra.sevensa.nl
      paths:
        - path: /
          pathType: Prefix
          serviceName: psra-api
          servicePort: 80
    - host: origin-engine.psra.sevensa.nl
      paths:
        - path: /
          pathType: Prefix
          serviceName: psra-origin-engine
          servicePort: 8000
  tls:
    - secretName: psra-tls
      hosts:
        - psra.sevensa.nl
        - api.psra.sevensa.nl
        - origin-engine.psra.sevensa.nl

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
cp psra-namespace.yaml helm/psra/templates/
cp psra-network-policy.yaml helm/psra/templates/
cp psra-ingress.yaml helm/psra/templates/
cp psra-service-account.yaml helm/psra/templates/
cp psra-config.yaml helm/psra/templates/
cp psra-db-credentials.yaml helm/psra/templates/
cp psra-jwt.yaml helm/psra/templates/
cp psra-openbao-credentials.yaml helm/psra/templates/
cp psra-keycloak-credentials.yaml helm/psra/templates/
cp psra-origin-engine-deployment.yaml helm/psra/templates/
cp psra-origin-engine-service.yaml helm/psra/templates/
cp psra-openai-credentials.yaml helm/psra/templates/
cp psra-langgraph-db-statefulset.yaml helm/psra/templates/
cp psra-langgraph-db-service.yaml helm/psra/templates/
cp psra-langgraph-db-credentials.yaml helm/psra/templates/

# Copy deployment and service files to Helm templates
log "INFO" "Copying deployment and service files to Helm templates..."
for file in *-deployment.yaml *-service.yaml; do
  if [[ "$file" != "psra-origin-engine-deployment.yaml" && "$file" != "psra-origin-engine-service.yaml" && "$file" != "psra-langgraph-db-statefulset.yaml" && "$file" != "psra-langgraph-db-service.yaml" ]]; then
    cp $file helm/psra/templates/
  fi
done

# Create kustomization.yaml
log "INFO" "Creating kustomization.yaml..."
cat > kustomization.yaml << EOF
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: psra

resources:
- psra-namespace.yaml
- psra-network-policy.yaml
- psra-ingress.yaml
- psra-service-account.yaml
- psra-config.yaml
- psra-db-credentials.yaml
- psra-jwt.yaml
- psra-openbao-credentials.yaml
- psra-keycloak-credentials.yaml
- psra-origin-engine-deployment.yaml
- psra-origin-engine-service.yaml
- psra-openai-credentials.yaml
- psra-langgraph-db-statefulset.yaml
- psra-langgraph-db-service.yaml
- psra-langgraph-db-credentials.yaml
EOF

# Add all deployment and service files to kustomization.yaml
for file in *-deployment.yaml *-service.yaml; do
  if [[ "$file" != "psra-origin-engine-deployment.yaml" && "$file" != "psra-origin-engine-service.yaml" && "$file" != "psra-langgraph-db-statefulset.yaml" && "$file" != "psra-langgraph-db-service.yaml" ]]; then
    echo "- $file" >> kustomization.yaml
  fi
done

# Create ArgoCD application file
log "INFO" "Creating ArgoCD application file..."
cat > psra-argocd-application.yaml << EOF
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: psra
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/sevensa/kubernetes-manifests.git
    targetRevision: HEAD
    path: charts/psra
    helm:
      valueFiles:
        - values.yaml
        - values-prod.yaml
  destination:
    server: https://kubernetes.default.svc
    namespace: psra
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
EOF

# Summary
log "SUCCESS" "PSRA-LTSD Docker Compose to Kubernetes conversion completed successfully!"
log "INFO" "Kubernetes resources created in $OUTPUT_DIR"
log "INFO" "Helm chart created in $OUTPUT_DIR/helm/psra"
log "INFO" "ArgoCD application file created: $OUTPUT_DIR/psra-argocd-application.yaml"
log "INFO" "To apply the Kubernetes resources, run: kubectl apply -k $OUTPUT_DIR"
log "INFO" "To deploy using Helm, run: helm install psra $OUTPUT_DIR/helm/psra"
log "INFO" "To deploy using ArgoCD, apply the ArgoCD application file: kubectl apply -f $OUTPUT_DIR/psra-argocd-application.yaml"
