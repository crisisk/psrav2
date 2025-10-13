# Kubernetes Migration Components

This directory contains the Kubernetes migration components for the Sevensa platform. These components are designed to migrate the platform from Docker Compose to Kubernetes for improved scalability, reliability, and manageability.

## Directory Structure

```
kubernetes_migration/
├── infrastructure/
│   ├── namespaces.yaml
│   ├── storage-class.yaml
│   ├── traefik-values.yaml
│   ├── prometheus-values.yaml
│   ├── loki-values.yaml
│   └── argocd-values.yaml
├── services/
│   ├── rentguy/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── ingress.yaml
│   │   ├── configmap.yaml
│   │   ├── secret.yaml
│   │   ├── hpa.yaml
│   │   ├── pvc.yaml
│   │   ├── networkpolicy.yaml
│   │   ├── serviceaccount.yaml
│   │   ├── database.yaml
│   │   └── redis.yaml
│   ├── psra/
│   │   └── ...
│   └── security/
│       └── ...
└── README.md
```

## Infrastructure Components

The infrastructure components provide the foundation for the Kubernetes cluster:

- **Namespaces**: Isolated environments for different services
- **Storage Classes**: Storage provisioning for persistent volumes
- **Traefik**: Ingress controller for routing external traffic
- **Prometheus**: Monitoring and alerting
- **Loki**: Log aggregation and analysis
- **ArgoCD**: GitOps continuous delivery

## Service Components

The service components define the Kubernetes resources for each service:

### RentGuy

- **Deployment**: API and frontend deployments
- **Service**: Internal service endpoints
- **Ingress**: External access configuration
- **ConfigMap**: Configuration data
- **Secret**: Sensitive data
- **HPA**: Horizontal Pod Autoscaler for scaling
- **PVC**: Persistent Volume Claims for storage
- **NetworkPolicy**: Network security rules
- **ServiceAccount**: Service identity and permissions
- **Database**: PostgreSQL StatefulSet
- **Redis**: Redis StatefulSet

## Implementation Steps

1. **Infrastructure Setup**

```bash
# Create namespaces
kubectl apply -f infrastructure/namespaces.yaml

# Create storage classes
kubectl apply -f infrastructure/storage-class.yaml

# Install Traefik
helm install traefik traefik/traefik -n traefik -f infrastructure/traefik-values.yaml

# Install Prometheus
helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring -f infrastructure/prometheus-values.yaml

# Install Loki
helm install loki grafana/loki-stack -n logging -f infrastructure/loki-values.yaml

# Install ArgoCD
helm install argocd argo/argo-cd -n argocd -f infrastructure/argocd-values.yaml
```

2. **Service Deployment**

```bash
# Deploy RentGuy
kubectl apply -f services/rentguy/
```

## Environment Variables

The following environment variables need to be set before applying the secret templates:

```bash
# RentGuy environment variables
export DB_PASSWORD="your-db-password"
export REDIS_PASSWORD="your-redis-password"
export JWT_SECRET="your-jwt-secret"
export KEYCLOAK_CLIENT_SECRET="your-keycloak-client-secret"
export OPENBAO_ROLE_ID="your-openbao-role-id"
export OPENBAO_SECRET_ID="your-openbao-secret-id"
export TLS_CRT="base64-encoded-tls-certificate"
export TLS_KEY="base64-encoded-tls-key"
```

## Security Considerations

- All sensitive data is stored in Kubernetes Secrets
- Network Policies restrict communication between services
- RBAC controls access to Kubernetes resources
- TLS is enabled for all ingress traffic
- Pod Security Contexts restrict container privileges

## Monitoring and Logging

- Prometheus collects metrics from all services
- Grafana provides dashboards for visualization
- Loki aggregates logs from all services
- AlertManager sends alerts based on defined rules

## GitOps Workflow

ArgoCD is used for GitOps continuous delivery:

1. Changes are committed to the Git repository
2. ArgoCD detects changes and applies them to the cluster
3. The cluster state is reconciled with the desired state

## Next Steps

1. Complete the migration of all services
2. Set up CI/CD pipelines for automated deployment
3. Implement backup and disaster recovery
4. Configure monitoring and alerting
5. Train team on Kubernetes operations
