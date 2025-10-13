#!/bin/bash

# Kubernetes Cluster Setup Script
# This script sets up a Kubernetes cluster for the Sevensa platform

set -e

# Configuration
CLUSTER_NAME=${CLUSTER_NAME:-"sevensa-cluster"}
KUBERNETES_VERSION=${KUBERNETES_VERSION:-"1.28.3"}
WORKER_NODE_COUNT=${WORKER_NODE_COUNT:-3}
CONTROL_PLANE_NODE_COUNT=${CONTROL_PLANE_NODE_COUNT:-3}
REGION=${REGION:-"eu-west-1"}
NODE_TYPE=${NODE_TYPE:-"t3.large"}
LOG_FILE=${LOG_FILE:-"/var/log/sevensa/k8s_setup.log"}

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

# Function to install dependencies
install_dependencies() {
  log "Installing dependencies"
  
  # Update package list
  apt-get update
  
  # Install required packages
  apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release jq
  
  # Install kubectl
  if ! command_exists kubectl; then
    log "Installing kubectl"
    curl -LO "https://dl.k8s.io/release/v${KUBERNETES_VERSION}/bin/linux/amd64/kubectl"
    chmod +x kubectl
    mv kubectl /usr/local/bin/
  else
    log "kubectl already installed"
  fi
  
  # Install eksctl
  if ! command_exists eksctl; then
    log "Installing eksctl"
    curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
    mv /tmp/eksctl /usr/local/bin
  else
    log "eksctl already installed"
  fi
  
  # Install helm
  if ! command_exists helm; then
    log "Installing helm"
    curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
  else
    log "helm already installed"
  fi
  
  # Install AWS CLI
  if ! command_exists aws; then
    log "Installing AWS CLI"
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip awscliv2.zip
    ./aws/install
    rm -rf aws awscliv2.zip
  else
    log "AWS CLI already installed"
  fi
  
  log "Dependencies installed successfully"
}

# Function to create EKS cluster
create_eks_cluster() {
  log "Creating EKS cluster ${CLUSTER_NAME}"
  
  # Create cluster configuration file
  cat > cluster.yaml <<EOF
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig

metadata:
  name: ${CLUSTER_NAME}
  region: ${REGION}
  version: "${KUBERNETES_VERSION}"

availabilityZones: ["${REGION}a", "${REGION}b", "${REGION}c"]

managedNodeGroups:
  - name: ng-1
    instanceType: ${NODE_TYPE}
    desiredCapacity: ${WORKER_NODE_COUNT}
    minSize: ${WORKER_NODE_COUNT}
    maxSize: $((WORKER_NODE_COUNT * 2))
    volumeSize: 100
    privateNetworking: true
    labels:
      role: worker
    tags:
      nodegroup-role: worker
    iam:
      withAddonPolicies:
        imageBuilder: true
        autoScaler: true
        externalDNS: true
        certManager: true
        albIngress: true
        ebs: true
        efs: true
        cloudWatch: true

# Enable control plane logging
cloudWatch:
  clusterLogging:
    enableTypes: ["api", "audit", "authenticator", "controllerManager", "scheduler"]
EOF
  
  # Create cluster
  eksctl create cluster -f cluster.yaml
  
  # Update kubeconfig
  aws eks update-kubeconfig --name ${CLUSTER_NAME} --region ${REGION}
  
  log "EKS cluster ${CLUSTER_NAME} created successfully"
}

# Function to install Calico
install_calico() {
  log "Installing Calico"
  
  # Create Calico namespace
  kubectl create namespace calico-system || true
  
  # Install Calico operator
  kubectl apply -f https://docs.projectcalico.org/manifests/tigera-operator.yaml
  
  # Create Calico custom resource
  cat > calico-installation.yaml <<EOF
apiVersion: operator.tigera.io/v1
kind: Installation
metadata:
  name: default
spec:
  calicoNetwork:
    ipPools:
    - blockSize: 26
      cidr: 192.168.0.0/16
      encapsulation: VXLANCrossSubnet
      natOutgoing: Enabled
      nodeSelector: all()
EOF
  
  kubectl apply -f calico-installation.yaml
  
  # Wait for Calico to be ready
  kubectl wait --for=condition=available --timeout=5m deployment/calico-kube-controllers -n calico-system
  
  log "Calico installed successfully"
}

# Function to install Longhorn
install_longhorn() {
  log "Installing Longhorn"
  
  # Create Longhorn namespace
  kubectl create namespace longhorn-system || true
  
  # Add Longhorn Helm repository
  helm repo add longhorn https://charts.longhorn.io
  helm repo update
  
  # Install Longhorn
  helm install longhorn longhorn/longhorn --namespace longhorn-system
  
  # Wait for Longhorn to be ready
  kubectl -n longhorn-system rollout status deployment/longhorn-ui
  
  log "Longhorn installed successfully"
}

# Function to install Traefik
install_traefik() {
  log "Installing Traefik"
  
  # Create Traefik namespace
  kubectl create namespace traefik || true
  
  # Add Traefik Helm repository
  helm repo add traefik https://helm.traefik.io/traefik
  helm repo update
  
  # Create Traefik values file
  cat > traefik-values.yaml <<EOF
deployment:
  replicas: 3

service:
  enabled: true
  type: LoadBalancer

ports:
  web:
    port: 80
    expose: true
    exposedPort: 80
    protocol: TCP
  websecure:
    port: 443
    expose: true
    exposedPort: 443
    protocol: TCP

ingressRoute:
  dashboard:
    enabled: true
    annotations:
      kubernetes.io/ingress.class: traefik

additionalArguments:
  - "--api.dashboard=true"
  - "--log.level=INFO"
  - "--accesslog=true"
  - "--accesslog.fields.headers.names.X-Forwarded-For=keep"
  - "--providers.kubernetescrd.allowCrossNamespace=true"
  - "--providers.kubernetesingress.ingressclass=traefik"
  - "--metrics.prometheus=true"
  - "--entrypoints.websecure.http.tls=true"
  - "--entrypoints.web.http.redirections.entryPoint.to=websecure"
  - "--entrypoints.web.http.redirections.entryPoint.scheme=https"
  - "--entrypoints.web.http.redirections.entryPoint.permanent=true"

resources:
  requests:
    cpu: "100m"
    memory: "100Mi"
  limits:
    cpu: "300m"
    memory: "300Mi"

affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        podAffinityTerm:
          labelSelector:
            matchExpressions:
              - key: app.kubernetes.io/name
                operator: In
                values:
                  - traefik
          topologyKey: kubernetes.io/hostname
EOF
  
  # Install Traefik
  helm install traefik traefik/traefik --namespace traefik -f traefik-values.yaml
  
  # Wait for Traefik to be ready
  kubectl -n traefik rollout status deployment/traefik
  
  log "Traefik installed successfully"
}

# Function to install Linkerd
install_linkerd() {
  log "Installing Linkerd"
  
  # Install Linkerd CLI
  if ! command_exists linkerd; then
    log "Installing Linkerd CLI"
    curl -sL https://run.linkerd.io/install | sh
    export PATH=$PATH:$HOME/.linkerd2/bin
  else
    log "Linkerd CLI already installed"
  fi
  
  # Check Kubernetes cluster compatibility
  linkerd check --pre
  
  # Install Linkerd CRDs
  linkerd install --crds | kubectl apply -f -
  
  # Install Linkerd control plane
  linkerd install | kubectl apply -f -
  
  # Wait for Linkerd to be ready
  linkerd check
  
  # Install Linkerd viz
  linkerd viz install | kubectl apply -f -
  
  log "Linkerd installed successfully"
}

# Function to install Prometheus and Grafana
install_monitoring() {
  log "Installing Prometheus and Grafana"
  
  # Create monitoring namespace
  kubectl create namespace monitoring || true
  
  # Add Prometheus Helm repository
  helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
  helm repo update
  
  # Create Prometheus values file
  cat > prometheus-values.yaml <<EOF
prometheus:
  prometheusSpec:
    retention: 15d
    resources:
      requests:
        cpu: 200m
        memory: 200Mi
      limits:
        cpu: 1000m
        memory: 1Gi
    storageSpec:
      volumeClaimTemplate:
        spec:
          storageClassName: longhorn
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: 50Gi

alertmanager:
  alertmanagerSpec:
    storage:
      volumeClaimTemplate:
        spec:
          storageClassName: longhorn
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: 10Gi

grafana:
  adminPassword: admin
  persistence:
    enabled: true
    storageClassName: longhorn
    size: 10Gi
  dashboardProviders:
    dashboardproviders.yaml:
      apiVersion: 1
      providers:
      - name: 'default'
        orgId: 1
        folder: ''
        type: file
        disableDeletion: false
        editable: true
        options:
          path: /var/lib/grafana/dashboards/default
  dashboards:
    default:
      kubernetes-cluster:
        gnetId: 7249
        revision: 1
        datasource: Prometheus
      kubernetes-nodes:
        gnetId: 315
        revision: 3
        datasource: Prometheus
      kubernetes-pods:
        gnetId: 6336
        revision: 1
        datasource: Prometheus
EOF
  
  # Install Prometheus Operator
  helm install prometheus prometheus-community/kube-prometheus-stack \
    --namespace monitoring \
    -f prometheus-values.yaml
  
  # Wait for Prometheus to be ready
  kubectl -n monitoring rollout status deployment/prometheus-grafana
  
  log "Prometheus and Grafana installed successfully"
}

# Function to install Loki and Promtail
install_logging() {
  log "Installing Loki and Promtail"
  
  # Create logging namespace
  kubectl create namespace logging || true
  
  # Add Grafana Helm repository
  helm repo add grafana https://grafana.github.io/helm-charts
  helm repo update
  
  # Create Loki values file
  cat > loki-values.yaml <<EOF
loki:
  auth_enabled: false
  storage:
    type: filesystem
  persistence:
    enabled: true
    storageClassName: longhorn
    size: 50Gi
  resources:
    requests:
      cpu: 100m
      memory: 128Mi
    limits:
      cpu: 1000m
      memory: 1Gi
EOF
  
  # Install Loki
  helm install loki grafana/loki-stack \
    --namespace logging \
    -f loki-values.yaml \
    --set promtail.enabled=true \
    --set grafana.enabled=false
  
  # Wait for Loki to be ready
  kubectl -n logging rollout status statefulset/loki
  
  log "Loki and Promtail installed successfully"
}

# Function to create namespaces
create_namespaces() {
  log "Creating namespaces"
  
  # Create namespaces
  kubectl create namespace sevensa-system || true
  kubectl create namespace sevensa-security || true
  kubectl create namespace sevensa-rentguy || true
  kubectl create namespace sevensa-psra || true
  kubectl create namespace sevensa-wpcs || true
  kubectl create namespace sevensa-ai || true
  
  # Label namespaces for Linkerd
  kubectl annotate namespace sevensa-system linkerd.io/inject=enabled || true
  kubectl annotate namespace sevensa-security linkerd.io/inject=enabled || true
  kubectl annotate namespace sevensa-rentguy linkerd.io/inject=enabled || true
  kubectl annotate namespace sevensa-psra linkerd.io/inject=enabled || true
  kubectl annotate namespace sevensa-wpcs linkerd.io/inject=enabled || true
  kubectl annotate namespace sevensa-ai linkerd.io/inject=enabled || true
  
  log "Namespaces created successfully"
}

# Function to configure RBAC
configure_rbac() {
  log "Configuring RBAC"
  
  # Create admin role
  cat > admin-role.yaml <<EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: sevensa-admin
rules:
- apiGroups: ["*"]
  resources: ["*"]
  verbs: ["*"]
EOF
  
  kubectl apply -f admin-role.yaml
  
  # Create developer role
  cat > developer-role.yaml <<EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: sevensa-developer
rules:
- apiGroups: [""]
  resources: ["pods", "services", "configmaps", "secrets", "persistentvolumeclaims"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
- apiGroups: ["apps"]
  resources: ["deployments", "statefulsets", "daemonsets"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
- apiGroups: ["batch"]
  resources: ["jobs", "cronjobs"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
- apiGroups: ["networking.k8s.io"]
  resources: ["ingresses"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
- apiGroups: ["autoscaling"]
  resources: ["horizontalpodautoscalers"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
EOF
  
  kubectl apply -f developer-role.yaml
  
  # Create viewer role
  cat > viewer-role.yaml <<EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: sevensa-viewer
rules:
- apiGroups: [""]
  resources: ["pods", "services", "configmaps", "persistentvolumeclaims"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["apps"]
  resources: ["deployments", "statefulsets", "daemonsets"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["batch"]
  resources: ["jobs", "cronjobs"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["networking.k8s.io"]
  resources: ["ingresses"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["autoscaling"]
  resources: ["horizontalpodautoscalers"]
  verbs: ["get", "list", "watch"]
EOF
  
  kubectl apply -f viewer-role.yaml
  
  log "RBAC configured successfully"
}

# Function to install ArgoCD
install_argocd() {
  log "Installing ArgoCD"
  
  # Create ArgoCD namespace
  kubectl create namespace argocd || true
  
  # Install ArgoCD
  kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
  
  # Wait for ArgoCD to be ready
  kubectl -n argocd rollout status deployment/argocd-server
  
  # Patch ArgoCD server to use LoadBalancer
  kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "LoadBalancer"}}'
  
  # Get ArgoCD admin password
  ARGOCD_PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d)
  
  log "ArgoCD installed successfully"
  log "ArgoCD admin password: ${ARGOCD_PASSWORD}"
}

# Main function
main() {
  log "Starting Kubernetes cluster setup"
  
  # Install dependencies
  install_dependencies
  
  # Create EKS cluster
  create_eks_cluster
  
  # Install Calico
  install_calico
  
  # Install Longhorn
  install_longhorn
  
  # Install Traefik
  install_traefik
  
  # Install Linkerd
  install_linkerd
  
  # Install Prometheus and Grafana
  install_monitoring
  
  # Install Loki and Promtail
  install_logging
  
  # Create namespaces
  create_namespaces
  
  # Configure RBAC
  configure_rbac
  
  # Install ArgoCD
  install_argocd
  
  log "Kubernetes cluster setup completed successfully"
}

# Execute main function
main
