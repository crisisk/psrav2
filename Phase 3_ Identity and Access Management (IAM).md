# Phase 3: Identity and Access Management (IAM)

This phase implements a comprehensive Identity and Access Management (IAM) solution for the Sevensa platform. It builds upon the Zero-Trust Network Architecture from Phase 2 and provides a unified interface for identity and access management.

## Components

### OpenBao

OpenBao is used as the secret management solution. It provides:

- Secure storage of secrets
- Dynamic secrets for databases
- Transit encryption
- PKI certificates
- AppRole authentication

### Keycloak

Keycloak is used as the identity provider. It provides:

- User management
- Role-based access control
- Single sign-on
- Multi-factor authentication
- OAuth2/OpenID Connect

### IAM API

The IAM API provides a unified interface for identity and access management. It integrates with Keycloak and OpenBao to provide:

- User management
- Role management
- Group management
- Authentication and authorization

## Directory Structure

```
phase3/
├── docs/
│   ├── iam_architecture.md
│   └── iam_implementation_plan.md
├── openbao/
│   ├── bootstrap/
│   │   └── init_openbao.sh
│   └── policies/
│       ├── admin-policy.hcl
│       ├── ai-policy.hcl
│       ├── psra-policy.hcl
│       ├── rentguy-policy.hcl
│       └── wpcs-policy.hcl
├── keycloak/
│   ├── bootstrap/
│   │   └── init_keycloak.sh
│   └── config/
│       ├── ai-client.json
│       ├── psra-client.json
│       ├── rentguy-client.json
│       ├── sevensa-realm.json
│       └── wpcs-client.json
├── api/
│   ├── app.py
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── README.md
│   └── requirements.txt
└── README.md
```

## Implementation Steps

1. Configure OpenBao with policies, AppRoles, and secret engines
2. Configure Keycloak with realm, clients, roles, and groups
3. Implement IAM API for unified access
4. Integrate services with IAM solution

## Deployment

The IAM solution is deployed using Docker Compose:

```bash
# Deploy OpenBao
cd openbao
./bootstrap/init_openbao.sh

# Deploy Keycloak
cd ../keycloak
./bootstrap/init_keycloak.sh

# Deploy IAM API
cd ../api
docker-compose up -d
```

## Integration with Services

Services integrate with the IAM solution using:

- OpenBao Agent for secret management
- OAuth2/OpenID Connect for authentication and authorization
- IAM API for user management
