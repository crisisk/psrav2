# OpenBao Namespace Design

## Overview

This document outlines the design for extending the OpenBao namespace configuration to support multiple services in the Sevensa platform. The current implementation has a single namespace (`sevensa`), which will be extended to include service-specific namespaces for proper isolation.

## Current State

The current OpenBao deployment includes:
- A single namespace (`sevensa`)
- KV v2 secret engine enabled for the namespace
- OIDC authentication via Keycloak

## Namespace Design

The following namespaces will be created:

| Namespace | Purpose | Secret Engines | Policies |
|-----------|---------|---------------|----------|
| `sevensa` | Root namespace for shared secrets | KV v2 | `admin-policy` |
| `rentguy` | Namespace for RentGuy service | KV v2, Transit, Database | `rentguy-policy` |
| `psra` | Namespace for PSRA service | KV v2, Transit, Database | `psra-policy` |
| `wpcs` | Namespace for WPCS service | KV v2, Transit, Database | `wpcs-policy` |
| `ai` | Namespace for AI Orchestration service | KV v2, Transit | `ai-policy` |

## Namespace Hierarchy

```
root
├── sevensa (existing)
├── rentguy (new)
├── psra (new)
├── wpcs (new)
└── ai (new)
```

## Secret Engine Configuration

Each namespace will have the following secret engines enabled:

### KV v2 Secret Engine

The KV v2 secret engine will be enabled for all namespaces to store static secrets.

```
kv-sevensa/
├── shared/
│   ├── database/
│   └── api/
kv-rentguy/
├── config/
├── database/
├── api/
└── smtp/
kv-psra/
├── config/
├── database/
├── api/
└── integration/
kv-wpcs/
├── config/
├── database/
└── sites/
kv-ai/
├── config/
├── api-keys/
└── integration/
```

### Transit Secret Engine

The Transit secret engine will be enabled for service-specific namespaces to provide encryption and decryption services.

```
transit/
├── rentguy-key
├── psra-key
├── wpcs-key
└── ai-key
```

### Database Secret Engine

The Database secret engine will be enabled for service-specific namespaces that require database access.

```
database/
├── rentguy-db
│   └── roles/
│       ├── readonly
│       └── readwrite
├── psra-db
│   └── roles/
│       ├── readonly
│       └── readwrite
└── wpcs-db
    └── roles/
        ├── readonly
        └── readwrite
```

## Implementation Approach

The implementation will follow these steps:

1. **Extend Bootstrap Script**: Modify the existing bootstrap script to create additional namespaces.
2. **Configure Secret Engines**: Enable and configure secret engines for each namespace.
3. **Create Policies**: Create policies for each namespace to control access.
4. **Configure Authentication**: Configure authentication methods for each namespace.

## Bootstrap Script Extension

The existing bootstrap script (`bootstrap_init_openbao.sh`) will be extended to create the additional namespaces and configure the secret engines.

```bash
#!/usr/bin/env bash
set -euo pipefail
cd {{ project_dir }}
source .env
export VAULT_ADDR="http://127.0.0.1:${BAO_HTTP_PORT:-{{ bao_http_port }}}"

# Initialize and unseal OpenBao (existing code)
if [ ! -f ./openbao/cluster-initialized ]; then
  # ... existing initialization code ...
else
  # ... existing unseal code ...
fi

ROOT_TOKEN=$(cat ./openbao/root.token)
export VAULT_TOKEN="$ROOT_TOKEN"

# Create namespaces and enable KV v2 secret engine
for NS in {{ namespaces | list }}; do
  docker compose exec -T openbao bao namespace create "$NS" || true
  docker compose exec -T openbao sh -lc "export VAULT_TOKEN=$ROOT_TOKEN; bao secrets enable -version=2 -path=kv-${NS} kv" -e VAULT_NAMESPACE="$NS" || true
done

# Enable Transit secret engine for service namespaces
for NS in rentguy psra wpcs ai; do
  docker compose exec -T openbao sh -lc "export VAULT_TOKEN=$ROOT_TOKEN; bao secrets enable -path=transit transit" -e VAULT_NAMESPACE="$NS" || true
  docker compose exec -T openbao sh -lc "export VAULT_TOKEN=$ROOT_TOKEN; bao write -f transit/keys/${NS}-key" -e VAULT_NAMESPACE="$NS" || true
done

# Enable Database secret engine for service namespaces
for NS in rentguy psra wpcs; do
  docker compose exec -T openbao sh -lc "export VAULT_TOKEN=$ROOT_TOKEN; bao secrets enable -path=database database" -e VAULT_NAMESPACE="$NS" || true
done

# Configure OIDC authentication (existing code)
: "${KC_REALM:?Missing KC_REALM in .env}"; : "${KC_CLIENT_ID:?Missing KC_CLIENT_ID in .env}"; : "${KC_CLIENT_SECRET:?Missing KC_CLIENT_SECRET in .env}"
KEYCLOAK_URL="http://keycloak:${KEYCLOAK_HTTP_PORT:-{{ kc_http_port }}}"
OIDC="${KEYCLOAK_URL}/realms/${KC_REALM}/.well-known/openid-configuration"
docker compose exec -T openbao bao auth enable oidc || true
docker compose exec -T openbao bao write auth/oidc/config oidc_discovery_url="${OIDC}" oidc_client_id="${KC_CLIENT_ID}" oidc_client_secret="${KC_CLIENT_SECRET}" default_role="default" >/dev/null
docker compose exec -T openbao bao write auth/oidc/role/default user_claim="preferred_username" allowed_redirect_uris="http://127.0.0.1:${BAO_HTTP_PORT:-{{ bao_http_port }}}/ui/*" policies="default" ttl="1h" >/dev/null

echo "[OK] Bootstrap complete. Root token at {{ project_dir }}/openbao/root.token"
```

## Ansible Role Extension

The Ansible role will be extended to include the following tasks:

1. **Update Group Variables**: Add the new namespaces to the `namespaces` list in `group_vars/all.yml`.
2. **Template Bootstrap Script**: Update the bootstrap script template with the extended code.
3. **Create Policy Files**: Create policy files for each namespace.
4. **Configure AppRole Authentication**: Configure AppRole authentication for service integration.

## Security Considerations

1. **Namespace Isolation**: Each service will have its own namespace to ensure proper isolation.
2. **Least Privilege**: Policies will follow the principle of least privilege.
3. **Authentication**: Services will authenticate using AppRole authentication.
4. **Audit Logging**: Audit logging will be enabled for all namespaces.

## Testing

The namespace configuration will be tested using the following methods:

1. **Namespace Verification**: Verify that all namespaces are created correctly.
2. **Secret Engine Verification**: Verify that all secret engines are enabled and configured correctly.
3. **Policy Verification**: Verify that all policies are created and applied correctly.
4. **Authentication Verification**: Verify that authentication methods are configured correctly.

## Conclusion

This design provides a comprehensive approach to extending the OpenBao namespace configuration to support multiple services in the Sevensa platform. The implementation will ensure proper isolation, security, and functionality for each service.
