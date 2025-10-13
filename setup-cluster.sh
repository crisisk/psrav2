#!/bin/bash
# Kubernetes Cluster Setup Script
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

# Check if script is run as root
if [ "$EUID" -ne 0 ]; then
  log "ERROR" "Please run as root"
  exit 1
fi

# Parse command line arguments
CONTROL_PLANE_COUNT=3
WORKER_COUNT=3
KUBERNETES_VERSION="1.28.0"
CLUSTER_NAME="sevensa-cluster"
POD_CIDR="10.244.0.0/16"
SERVICE_CIDR="10.96.0.0/12"
CNI="calico"
PROVIDER="bare-metal"

while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    --control-plane-count)
      CONTROL_PLANE_COUNT="$2"
      shift
      shift
      ;;
    --worker-count)
      WORKER_COUNT="$2"
      shift
      shift
      ;;
    --kubernetes-version)
      KUBERNETES_VERSION="$2"
      shift
      shift
      ;;
    --cluster-name)
      CLUSTER_NAME="$2"
      shift
      shift
      ;;
    --pod-cidr)
      POD_CIDR="$2"
      shift
      shift
      ;;
    --service-cidr)
      SERVICE_CIDR="$2"
      shift
      shift
      ;;
    --cni)
      CNI="$2"
      shift
      shift
      ;;
    --provider)
      PROVIDER="$2"
      shift
      shift
      ;;
    --help)
      echo "Usage: $0 [options]"
      echo "Options:"
      echo "  --control-plane-count <count>   Number of control plane nodes (default: 3)"
      echo "  --worker-count <count>          Number of worker nodes (default: 3)"
      echo "  --kubernetes-version <version>  Kubernetes version (default: 1.28.0)"
      echo "  --cluster-name <name>           Cluster name (default: sevensa-cluster)"
      echo "  --pod-cidr <cidr>               Pod CIDR (default: 10.244.0.0/16)"
      echo "  --service-cidr <cidr>           Service CIDR (default: 10.96.0.0/12)"
      echo "  --cni <cni>                     CNI plugin (default: calico)"
      echo "  --provider <provider>           Provider (default: bare-metal)"
      echo "  --help                          Show this help message"
      exit 0
      ;;
    *)
      log "ERROR" "Unknown option: $key"
      exit 1
      ;;
  esac
done

log "INFO" "Starting Kubernetes cluster setup with the following configuration:"
log "INFO" "Control Plane Nodes: $CONTROL_PLANE_COUNT"
log "INFO" "Worker Nodes: $WORKER_COUNT"
log "INFO" "Kubernetes Version: $KUBERNETES_VERSION"
log "INFO" "Cluster Name: $CLUSTER_NAME"
log "INFO" "Pod CIDR: $POD_CIDR"
log "INFO" "Service CIDR: $SERVICE_CIDR"
log "INFO" "CNI: $CNI"
log "INFO" "Provider: $PROVIDER"

# Create directory for cluster configuration
CLUSTER_DIR="/etc/kubernetes/sevensa-cluster"
mkdir -p $CLUSTER_DIR
log "INFO" "Created cluster configuration directory: $CLUSTER_DIR"

# Install dependencies
log "INFO" "Installing dependencies..."
apt-get update
apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release jq

# Install Docker
log "INFO" "Installing Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io

# Configure containerd
log "INFO" "Configuring containerd..."
mkdir -p /etc/containerd
cat > /etc/containerd/config.toml << EOF
version = 2
[plugins]
  [plugins."io.containerd.grpc.v1.cri"]
    [plugins."io.containerd.grpc.v1.cri".containerd]
      discard_unpacked_layers = true
      [plugins."io.containerd.grpc.v1.cri".containerd.runtimes]
        [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc]
          runtime_type = "io.containerd.runc.v2"
          [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc.options]
            SystemdCgroup = true
EOF
systemctl restart containerd

# Disable swap
log "INFO" "Disabling swap..."
swapoff -a
sed -i '/swap/d' /etc/fstab

# Load kernel modules
log "INFO" "Loading kernel modules..."
cat > /etc/modules-load.d/k8s.conf << EOF
overlay
br_netfilter
EOF
modprobe overlay
modprobe br_netfilter

# Set kernel parameters
log "INFO" "Setting kernel parameters..."
cat > /etc/sysctl.d/k8s.conf << EOF
net.bridge.bridge-nf-call-iptables  = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward                 = 1
EOF
sysctl --system

# Install kubeadm, kubelet, and kubectl
log "INFO" "Installing kubeadm, kubelet, and kubectl..."
curl -fsSLo /usr/share/keyrings/kubernetes-archive-keyring.gpg https://packages.cloud.google.com/apt/doc/apt-key.gpg
echo "deb [signed-by=/usr/share/keyrings/kubernetes-archive-keyring.gpg] https://apt.kubernetes.io/ kubernetes-xenial main" | tee /etc/apt/sources.list.d/kubernetes.list
apt-get update
apt-get install -y kubelet=$KUBERNETES_VERSION-00 kubeadm=$KUBERNETES_VERSION-00 kubectl=$KUBERNETES_VERSION-00
apt-mark hold kubelet kubeadm kubectl

# Initialize the control plane
log "INFO" "Initializing the control plane..."
kubeadm config print init-defaults --component-configs KubeletConfiguration > $CLUSTER_DIR/kubeadm-config.yaml

# Update the kubeadm config
log "INFO" "Updating kubeadm config..."
cat > $CLUSTER_DIR/kubeadm-config.yaml << EOF
apiVersion: kubeadm.k8s.io/v1beta3
kind: InitConfiguration
localAPIEndpoint:
  advertiseAddress: $(hostname -I | awk '{print $1}')
  bindPort: 6443
nodeRegistration:
  name: $(hostname)
  criSocket: unix:///var/run/containerd/containerd.sock
---
apiVersion: kubeadm.k8s.io/v1beta3
kind: ClusterConfiguration
clusterName: $CLUSTER_NAME
kubernetesVersion: v$KUBERNETES_VERSION
networking:
  podSubnet: $POD_CIDR
  serviceSubnet: $SERVICE_CIDR
---
apiVersion: kubelet.config.k8s.io/v1beta1
kind: KubeletConfiguration
cgroupDriver: systemd
EOF

# Initialize the cluster
log "INFO" "Initializing the cluster..."
kubeadm init --config=$CLUSTER_DIR/kubeadm-config.yaml --upload-certs | tee $CLUSTER_DIR/kubeadm-init.log

# Set up kubectl for the root user
log "INFO" "Setting up kubectl for the root user..."
mkdir -p $HOME/.kube
cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
chown $(id -u):$(id -g) $HOME/.kube/config

# Set up kubectl for the ubuntu user
log "INFO" "Setting up kubectl for the ubuntu user..."
mkdir -p /home/ubuntu/.kube
cp -i /etc/kubernetes/admin.conf /home/ubuntu/.kube/config
chown ubuntu:ubuntu /home/ubuntu/.kube/config

# Install CNI
log "INFO" "Installing CNI plugin: $CNI..."
if [ "$CNI" == "calico" ]; then
  kubectl create -f https://raw.githubusercontent.com/projectcalico/calico/v3.26.1/manifests/tigera-operator.yaml
  cat > $CLUSTER_DIR/calico-custom-resources.yaml << EOF
apiVersion: operator.tigera.io/v1
kind: Installation
metadata:
  name: default
spec:
  calicoNetwork:
    ipPools:
    - blockSize: 26
      cidr: $POD_CIDR
      encapsulation: VXLANCrossSubnet
      natOutgoing: Enabled
      nodeSelector: all()
EOF
  kubectl create -f $CLUSTER_DIR/calico-custom-resources.yaml
elif [ "$CNI" == "cilium" ]; then
  curl -L --remote-name-all https://github.com/cilium/cilium-cli/releases/latest/download/cilium-linux-amd64.tar.gz
  tar xzvf cilium-linux-amd64.tar.gz
  mv cilium /usr/local/bin/
  cilium install --version v1.14.0
elif [ "$CNI" == "flannel" ]; then
  kubectl apply -f https://raw.githubusercontent.com/flannel-io/flannel/master/Documentation/kube-flannel.yml
else
  log "ERROR" "Unsupported CNI plugin: $CNI"
  exit 1
fi

# Wait for CNI to be ready
log "INFO" "Waiting for CNI to be ready..."
kubectl wait --for=condition=ready pods --all -n kube-system --timeout=300s

# Get the join command
log "INFO" "Getting the join command..."
JOIN_COMMAND=$(kubeadm token create --print-join-command)
echo "$JOIN_COMMAND" > $CLUSTER_DIR/join-command.sh
chmod +x $CLUSTER_DIR/join-command.sh

# Install Helm
log "INFO" "Installing Helm..."
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Install metrics-server
log "INFO" "Installing metrics-server..."
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Install Kubernetes Dashboard
log "INFO" "Installing Kubernetes Dashboard..."
kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.7.0/aio/deploy/recommended.yaml

# Create admin user for Dashboard
log "INFO" "Creating admin user for Dashboard..."
cat > $CLUSTER_DIR/dashboard-admin.yaml << EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  name: admin-user
  namespace: kubernetes-dashboard
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: admin-user
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
- kind: ServiceAccount
  name: admin-user
  namespace: kubernetes-dashboard
EOF
kubectl apply -f $CLUSTER_DIR/dashboard-admin.yaml

# Get the token for the admin user
log "INFO" "Getting the token for the admin user..."
kubectl -n kubernetes-dashboard create token admin-user > $CLUSTER_DIR/dashboard-token.txt

# Create namespaces
log "INFO" "Creating namespaces..."
kubectl create namespace rentguy
kubectl create namespace psra
kubectl create namespace wpcs
kubectl create namespace ai
kubectl create namespace infra
kubectl create namespace monitoring
kubectl create namespace logging
kubectl create namespace ingress

# Label namespaces
log "INFO" "Labeling namespaces..."
kubectl label namespace rentguy name=rentguy
kubectl label namespace psra name=psra
kubectl label namespace wpcs name=wpcs
kubectl label namespace ai name=ai
kubectl label namespace infra name=infra
kubectl label namespace monitoring name=monitoring
kubectl label namespace logging name=logging
kubectl label namespace ingress name=ingress

# Install Traefik
log "INFO" "Installing Traefik..."
helm repo add traefik https://helm.traefik.io/traefik
helm repo update
helm install traefik traefik/traefik --namespace ingress --create-namespace -f - << EOF
deployment:
  replicas: 2
service:
  type: LoadBalancer
ports:
  web:
    port: 80
  websecure:
    port: 443
    tls:
      enabled: true
ingressRoute:
  dashboard:
    enabled: true
    annotations:
      kubernetes.io/ingress.class: traefik
    entryPoints:
      - websecure
    middlewares:
      - name: traefik-dashboard-auth
        namespace: ingress
additionalArguments:
  - "--api.dashboard=true"
  - "--log.level=INFO"
  - "--providers.kubernetesingress.ingressclass=traefik"
  - "--entrypoints.websecure.http.tls=true"
EOF

# Create middleware for Traefik Dashboard authentication
log "INFO" "Creating middleware for Traefik Dashboard authentication..."
cat > $CLUSTER_DIR/traefik-dashboard-auth.yaml << EOF
apiVersion: traefik.containo.us/v1alpha1
kind: Middleware
metadata:
  name: traefik-dashboard-auth
  namespace: ingress
spec:
  basicAuth:
    secret: traefik-dashboard-auth
EOF
kubectl apply -f $CLUSTER_DIR/traefik-dashboard-auth.yaml

# Create secret for Traefik Dashboard authentication
log "INFO" "Creating secret for Traefik Dashboard authentication..."
htpasswd -c -b /tmp/auth admin admin
kubectl create secret generic traefik-dashboard-auth --from-file=/tmp/auth -n ingress
rm /tmp/auth

# Install ArgoCD
log "INFO" "Installing ArgoCD..."
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for ArgoCD to be ready
log "INFO" "Waiting for ArgoCD to be ready..."
kubectl wait --for=condition=available deployment/argocd-server -n argocd --timeout=300s

# Create Ingress for ArgoCD
log "INFO" "Creating Ingress for ArgoCD..."
cat > $CLUSTER_DIR/argocd-ingress.yaml << EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: argocd-server-ingress
  namespace: argocd
  annotations:
    kubernetes.io/ingress.class: traefik
    traefik.ingress.kubernetes.io/router.entrypoints: websecure
    traefik.ingress.kubernetes.io/router.tls: "true"
spec:
  rules:
  - host: argocd.sevensa.nl
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: argocd-server
            port:
              number: 80
  tls:
  - hosts:
    - argocd.sevensa.nl
EOF
kubectl apply -f $CLUSTER_DIR/argocd-ingress.yaml

# Get the ArgoCD admin password
log "INFO" "Getting the ArgoCD admin password..."
ARGOCD_PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d)
echo "ArgoCD admin password: $ARGOCD_PASSWORD" > $CLUSTER_DIR/argocd-password.txt

# Install Prometheus Operator
log "INFO" "Installing Prometheus Operator..."
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm install prometheus prometheus-community/kube-prometheus-stack --namespace monitoring --create-namespace

# Install Loki
log "INFO" "Installing Loki..."
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update
helm install loki grafana/loki-stack --namespace logging --create-namespace --set grafana.enabled=false

# Create Ingress for Grafana
log "INFO" "Creating Ingress for Grafana..."
cat > $CLUSTER_DIR/grafana-ingress.yaml << EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: grafana-ingress
  namespace: monitoring
  annotations:
    kubernetes.io/ingress.class: traefik
    traefik.ingress.kubernetes.io/router.entrypoints: websecure
    traefik.ingress.kubernetes.io/router.tls: "true"
spec:
  rules:
  - host: grafana.sevensa.nl
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: prometheus-grafana
            port:
              number: 80
  tls:
  - hosts:
    - grafana.sevensa.nl
EOF
kubectl apply -f $CLUSTER_DIR/grafana-ingress.yaml

# Get the Grafana admin password
log "INFO" "Getting the Grafana admin password..."
GRAFANA_PASSWORD=$(kubectl get secret -n monitoring prometheus-grafana -o jsonpath="{.data.admin-password}" | base64 -d)
echo "Grafana admin password: $GRAFANA_PASSWORD" > $CLUSTER_DIR/grafana-password.txt

# Install Velero for backup
log "INFO" "Installing Velero..."
helm repo add vmware-tanzu https://vmware-tanzu.github.io/helm-charts
helm repo update
helm install velero vmware-tanzu/velero --namespace velero --create-namespace --set configuration.provider=aws --set configuration.backupStorageLocation.name=default --set configuration.backupStorageLocation.bucket=sevensa-backup --set configuration.backupStorageLocation.config.region=us-east-1 --set serviceAccount.server.create=true --set credentials.useSecret=false

# Summary
log "SUCCESS" "Kubernetes cluster setup completed successfully!"
log "INFO" "Cluster information:"
log "INFO" "Kubernetes version: $KUBERNETES_VERSION"
log "INFO" "CNI plugin: $CNI"
log "INFO" "Control plane nodes: $CONTROL_PLANE_COUNT"
log "INFO" "Worker nodes: $WORKER_COUNT"
log "INFO" "Pod CIDR: $POD_CIDR"
log "INFO" "Service CIDR: $SERVICE_CIDR"
log "INFO" "Cluster name: $CLUSTER_NAME"
log "INFO" "Dashboard token: saved to $CLUSTER_DIR/dashboard-token.txt"
log "INFO" "ArgoCD admin password: saved to $CLUSTER_DIR/argocd-password.txt"
log "INFO" "Grafana admin password: saved to $CLUSTER_DIR/grafana-password.txt"
log "INFO" "Join command: saved to $CLUSTER_DIR/join-command.sh"
log "INFO" "To access the Kubernetes Dashboard, run: kubectl proxy"
log "INFO" "Then visit: http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/"
log "INFO" "To access ArgoCD, visit: https://argocd.sevensa.nl"
log "INFO" "To access Grafana, visit: https://grafana.sevensa.nl"
