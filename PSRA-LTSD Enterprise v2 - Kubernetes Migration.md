# PSRA-LTSD Enterprise v2 - Kubernetes Migration

This directory contains the Kubernetes configuration for the PSRA-LTSD Enterprise v2 platform. The migration to Kubernetes provides improved scalability, reliability, and manageability for the platform.

## Directory Structure

```
kubernetes/
├── base/                  # Base Kubernetes configuration
│   ├── api/               # API server configuration
│   ├── frontend/          # Frontend configuration
│   ├── langgraph/         # LangGraph Origin Engine configuration
│   ├── monitoring/        # Prometheus, Grafana, and Loki configuration
│   └── kustomization.yaml # Base kustomization file
├── overlays/              # Environment-specific overlays
│   ├── dev/               # Development environment
│   ├── staging/           # Staging environment
│   └── prod/              # Production environment
└── README.md              # This file
```

## Migration Strategy

The migration to Kubernetes follows a phased approach:

1. **Infrastructure Setup**
   - Kubernetes cluster provisioning
   - Namespace configuration
   - RBAC setup
   - Storage classes
   - Ingress controller

2. **Core Services Migration**
   - LangGraph Origin Engine
   - API Server
   - Frontend
   - Databases (PostgreSQL, Redis)

3. **Monitoring & Logging**
   - Prometheus
   - Grafana
   - Loki
   - Alertmanager

4. **CI/CD Integration**
   - ArgoCD setup
   - GitHub Actions integration
   - Automated deployment pipelines

## Key Features

- **Scalability**: Horizontal Pod Autoscalers for all components
- **Reliability**: Pod disruption budgets, readiness/liveness probes
- **Security**: Network policies, RBAC, secret management
- **Observability**: Prometheus metrics, Loki logs, Grafana dashboards
- **GitOps**: ArgoCD for declarative configuration management

## Getting Started

### Prerequisites

- Kubernetes cluster (v1.24+)
- kubectl (v1.24+)
- kustomize (v4.5+)
- Helm (v3.8+)

### Deployment

1. Clone this repository:
   ```bash
   git clone https://github.com/crisisk/PSRA-LTSD-v02.git
   cd PSRA-LTSD-v02/implementation/phase3/kubernetes
   ```

2. Deploy the base infrastructure:
   ```bash
   kubectl apply -k overlays/dev
   ```

3. Verify the deployment:
   ```bash
   kubectl get pods -n psra-system
   ```

## Environment-Specific Configuration

Each environment (dev, staging, prod) has specific configurations:

- **Development**: Lower resource requests, debug mode enabled
- **Staging**: Moderate resource requests, staging data
- **Production**: Higher resource requests, production data, autoscaling

## Monitoring

The platform includes comprehensive monitoring:

- **Prometheus**: Metrics collection
- **Grafana**: Visualization and dashboards
- **Loki**: Log aggregation
- **Alertmanager**: Alert routing and notification

## Security

Security measures include:

- **Network Policies**: Micro-segmentation for all services
- **RBAC**: Role-based access control
- **Secret Management**: Secure handling of sensitive data
- **TLS**: Encrypted communication between services

## Troubleshooting

Common issues and their solutions:

- **Pod Crashes**: Check logs with `kubectl logs -n psra-system <pod-name>`
- **Service Unavailable**: Check endpoints with `kubectl get endpoints -n psra-system`
- **Performance Issues**: Check resource usage with `kubectl top pods -n psra-system`
