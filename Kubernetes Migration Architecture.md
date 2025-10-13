# Kubernetes Migration Architecture

## Overview

This document outlines the architecture and approach for migrating the Sevensa platform from Docker Compose to Kubernetes. The migration will provide improved scalability, reliability, and manageability for all services while maintaining the existing functionality and security measures.

## Current State

The current Sevensa platform consists of multiple services deployed using Docker Compose:

1. **RentGuy**: Property management SaaS with frontend, API, and database components
2. **PSRA-LTSD**: Trade compliance solution with the LangGraph-powered Origin Calculation Engine
3. **WPCS**: Managed WordPress hosting service
4. **AI Orchestration**: Including LangGraph, N8N, Claude Chat, and Trading Dashboard
5. **Infrastructure Services**: Including OpenBao (Vault), Keycloak, and Traefik
6. **Monitoring & Logging**: Prometheus, Grafana, Loki, and related components

These services are currently deployed on a single VPS (147.93.57.40) using Docker Compose with network segmentation, centralized secret management, and monitoring.

## Target Architecture

The target Kubernetes architecture will consist of:

1. **Kubernetes Cluster**: A production-grade Kubernetes cluster with multiple worker nodes
2. **Namespaces**: Separate namespaces for each service domain to provide isolation
3. **Deployments**: Kubernetes Deployments for each service component
4. **Services**: Kubernetes Services for internal and external communication
5. **Ingress**: Ingress resources for external access to services
6. **ConfigMaps and Secrets**: For configuration and sensitive data
7. **StatefulSets**: For stateful components like databases
8. **PersistentVolumes**: For persistent storage
9. **ServiceAccounts**: For service-specific permissions
10. **NetworkPolicies**: For network segmentation and security

### Namespace Structure

The following namespaces will be created:

| Namespace | Description | Services |
|-----------|-------------|----------|
| `rentguy` | RentGuy services | Frontend, API, Database |
| `psra` | PSRA-LTSD services | Frontend, API, Origin Engine, Database |
| `wpcs` | WPCS services | API, Database, WordPress instances |
| `ai` | AI Orchestration services | LangGraph, N8N, Claude Chat, Trading Dashboard |
| `infra` | Infrastructure services | OpenBao, Keycloak |
| `monitoring` | Monitoring services | Prometheus, Grafana, AlertManager |
| `logging` | Logging services | Loki, Promtail, Vector |
| `ingress` | Ingress controllers | Traefik |

### Component Architecture

#### Ingress Layer

Traefik will be deployed as an Ingress Controller to handle external traffic and route it to the appropriate services. It will be configured to:

- Terminate TLS connections
- Route traffic based on hostnames and paths
- Integrate with Keycloak for authentication
- Provide rate limiting and other security features

#### Service Layer

Each service will be deployed as a set of Kubernetes resources:

- **Deployments**: For stateless components
- **StatefulSets**: For stateful components
- **Services**: For internal communication
- **ConfigMaps**: For configuration
- **Secrets**: For sensitive data

#### Persistence Layer

Persistent data will be stored using:

- **PersistentVolumes**: For persistent storage
- **PersistentVolumeClaims**: For requesting storage
- **StorageClasses**: For dynamic provisioning

#### Security Layer

Security will be implemented using:

- **NetworkPolicies**: For network segmentation
- **ServiceAccounts**: For service-specific permissions
- **RBAC**: For access control
- **OpenBao**: For secret management
- **Keycloak**: For authentication and authorization

## Migration Strategy

The migration will follow a phased approach to minimize risk and ensure continuity of service:

### Phase 1: Kubernetes Cluster Setup

1. Set up a production-grade Kubernetes cluster
2. Configure networking, storage, and security
3. Set up CI/CD pipelines for Kubernetes deployments
4. Implement monitoring and logging for Kubernetes

### Phase 2: Infrastructure Services Migration

1. Migrate OpenBao to Kubernetes
2. Migrate Keycloak to Kubernetes
3. Deploy Traefik as an Ingress Controller
4. Migrate monitoring and logging services

### Phase 3: Application Services Migration

1. Migrate RentGuy services
2. Migrate PSRA-LTSD services
3. Migrate WPCS services
4. Migrate AI Orchestration services

### Phase 4: Testing and Validation

1. Perform integration testing
2. Validate security measures
3. Perform load testing
4. Validate monitoring and alerting

### Phase 5: Cutover and Decommissioning

1. Update DNS records to point to the new Kubernetes services
2. Monitor for issues
3. Decommission Docker Compose services

## Kubernetes Resources

### Deployment Example (RentGuy API)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rentguy-api
  namespace: rentguy
  labels:
    app: rentguy
    component: api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: rentguy
      component: api
  template:
    metadata:
      labels:
        app: rentguy
        component: api
    spec:
      serviceAccountName: rentguy-api
      containers:
      - name: api
        image: sevensa/rentguy-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: rentguy-db-credentials
              key: url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: rentguy-jwt
              key: secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
      initContainers:
      - name: init-db
        image: sevensa/rentguy-api:latest
        command: ['sh', '-c', 'until nc -z rentguy-db 5432; do echo waiting for db; sleep 2; done;']
```

### Service Example (RentGuy API)

```yaml
apiVersion: v1
kind: Service
metadata:
  name: rentguy-api
  namespace: rentguy
  labels:
    app: rentguy
    component: api
spec:
  selector:
    app: rentguy
    component: api
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
    name: http
  type: ClusterIP
```

### Ingress Example (RentGuy)

```yaml
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
  tls:
  - hosts:
    - rentguy.sevensa.nl
    - api.rentguy.sevensa.nl
    secretName: rentguy-tls
```

### StatefulSet Example (RentGuy Database)

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: rentguy-db
  namespace: rentguy
  labels:
    app: rentguy
    component: db
spec:
  serviceName: rentguy-db
  replicas: 1
  selector:
    matchLabels:
      app: rentguy
      component: db
  template:
    metadata:
      labels:
        app: rentguy
        component: db
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
              name: rentguy-db-credentials
              key: username
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: rentguy-db-credentials
              key: password
        - name: POSTGRES_DB
          value: rentguy
        volumeMounts:
        - name: data
          mountPath: /var/lib/postgresql/data
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: [ "ReadWriteOnce" ]
      storageClassName: "standard"
      resources:
        requests:
          storage: 10Gi
```

### NetworkPolicy Example (RentGuy)

```yaml
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
```

## Helm Charts

Helm will be used to package and deploy the Sevensa services. The following Helm charts will be created:

1. **rentguy**: For RentGuy services
2. **psra**: For PSRA-LTSD services
3. **wpcs**: For WPCS services
4. **ai-orchestration**: For AI Orchestration services
5. **sevensa-infra**: For infrastructure services

### Helm Chart Structure (Example: RentGuy)

```
rentguy/
├── Chart.yaml
├── values.yaml
├── templates/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── configmap.yaml
│   ├── secret.yaml
│   ├── statefulset.yaml
│   ├── networkpolicy.yaml
│   └── serviceaccount.yaml
└── charts/
    ├── postgresql/
    └── redis/
```

### Values File Example (RentGuy)

```yaml
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
```

## GitOps Approach

A GitOps approach will be used to manage the Kubernetes resources. This will involve:

1. **Git Repository**: All Kubernetes manifests and Helm charts will be stored in a Git repository
2. **CI/CD Pipeline**: A CI/CD pipeline will be set up to validate and deploy changes
3. **ArgoCD**: ArgoCD will be used to ensure that the cluster state matches the desired state in Git

### ArgoCD Application Example (RentGuy)

```yaml
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
```

## Monitoring and Logging

The existing monitoring and logging stack will be migrated to Kubernetes:

1. **Prometheus**: For metrics collection
2. **Grafana**: For visualization
3. **AlertManager**: For alerting
4. **Loki**: For log aggregation
5. **Promtail**: For log collection
6. **Vector**: For log processing

These components will be deployed using the Prometheus Operator and Loki Operator for easier management.

## Backup and Disaster Recovery

Backup and disaster recovery will be implemented using:

1. **Velero**: For cluster backup and restore
2. **PersistentVolume Snapshots**: For database backups
3. **OpenBao**: For secret backup and restore

## Conclusion

This Kubernetes migration architecture provides a comprehensive plan for migrating the Sevensa platform from Docker Compose to Kubernetes. The migration will be performed in phases to minimize risk and ensure continuity of service. The resulting Kubernetes-based platform will provide improved scalability, reliability, and manageability for all services.
