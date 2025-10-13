# Phase 4: Kubernetes Migration

This phase focuses on migrating the Sevensa platform from Docker Compose to Kubernetes for improved scalability, reliability, and manageability.

## Overview

The Kubernetes migration provides the following benefits:

- **Scalability**: Horizontal scaling of services based on demand
- **Reliability**: Self-healing and high availability
- **Manageability**: Declarative configuration and GitOps workflow
- **Security**: Fine-grained access control and network policies
- **Observability**: Integrated monitoring and logging

## Directory Structure

```
phase4/
├── docs/
│   ├── kubernetes_migration_architecture.md
│   └── kubernetes_migration_plan.md
├── kubernetes/
│   ├── base/
│   │   └── rentguy/
│   │       ├── configmap.yaml
│   │       ├── deployment.yaml
│   │       ├── hpa.yaml
│   │       ├── ingress.yaml
│   │       ├── kustomization.yaml
│   │       ├── namespace.yaml
│   │       ├── networkpolicy.yaml
│   │       ├── pvc.yaml
│   │       ├── secret.yaml
│   │       ├── service.yaml
│   │       └── serviceaccount.yaml
│   └── overlays/
│       ├── dev/
│       │   └── rentguy/
│       │       ├── configmap-patch.yaml
│       │       ├── deployment-patch.yaml
│       │       └── kustomization.yaml
│       ├── staging/
│       │   └── ...
│       └── prod/
│           └── rentguy/
│               ├── deployment-patch.yaml
│               ├── hpa-patch.yaml
│               └── kustomization.yaml
├── scripts/
│   ├── setup_cluster.sh
│   ├── convert-rentguy.sh
│   └── convert-psra.sh
├── helm-charts/
│   └── rentguy/
│       ├── Chart.yaml
│       └── values.yaml
├── argocd/
│   └── applications/
│       └── rentguy.yaml
└── README.md
```

## Implementation Steps

### 1. Infrastructure Setup

The first step is to set up the Kubernetes infrastructure:

```bash
./scripts/setup_cluster.sh
```

This script sets up a Kubernetes cluster with the following components:

- Calico for network policy enforcement
- Longhorn for distributed block storage
- Traefik for ingress control and routing
- Linkerd for service mesh
- Prometheus and Grafana for monitoring
- Loki and Promtail for logging
- ArgoCD for GitOps

### 2. Service Migration

The next step is to migrate services to Kubernetes. This can be done using the Kompose conversion scripts:

```bash
./scripts/convert-rentguy.sh
./scripts/convert-psra.sh
```

These scripts convert Docker Compose files to Kubernetes manifests and apply post-processing to ensure best practices.

### 3. GitOps Setup

The final step is to set up GitOps with ArgoCD:

```bash
kubectl apply -f argocd/applications/rentguy.yaml
```

This sets up ArgoCD to manage the RentGuy application from the Git repository.

## Kubernetes Resources

The following Kubernetes resources are created for each service:

- **Namespace**: Isolated environment for the service
- **Deployment**: Manages the pods for the service
- **Service**: Exposes the service internally
- **Ingress**: Exposes the service externally
- **ConfigMap**: Stores configuration data
- **Secret**: Stores sensitive data
- **HPA**: Scales the service based on metrics
- **PVC**: Provides persistent storage
- **NetworkPolicy**: Controls network traffic
- **ServiceAccount**: Provides identity for the service

## Environment-Specific Configuration

Environment-specific configuration is managed using Kustomize overlays:

- **Base**: Common configuration for all environments
- **Dev**: Development environment configuration
- **Staging**: Staging environment configuration
- **Prod**: Production environment configuration

## Helm Charts

Helm charts are provided for services that require more complex deployment:

```bash
helm install rentguy ./helm-charts/rentguy -f values.yaml
```

## ArgoCD Applications

ArgoCD applications are defined for each service to enable GitOps workflow:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: rentguy
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/sevensa/sevensa-infrastructure.git
    targetRevision: HEAD
    path: kubernetes/overlays/prod/rentguy
  destination:
    server: https://kubernetes.default.svc
    namespace: sevensa-rentguy
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

## Conclusion

This phase provides a robust foundation for migrating the Sevensa platform to Kubernetes. It addresses the key requirements of scalability, reliability, and manageability while maintaining security and performance.
