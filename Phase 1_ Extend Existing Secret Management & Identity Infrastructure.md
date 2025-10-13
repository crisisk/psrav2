# Phase 1: Extend Existing Secret Management & Identity Infrastructure

## Overview

This phase focuses on enhancing the existing OpenBao (Vault alternative) and Keycloak setup to support all services in the Sevensa platform. We'll extend the current infrastructure to include proper namespaces, policies, roles, and secrets engines for each service.

## Timeline

- **Week 1**: OpenBao namespace and policy configuration
- **Week 2**: OpenBao secrets engines configuration
- **Week 3**: Keycloak realm and client configuration
- **Week 4**: Integration testing and documentation

## Detailed Implementation Steps

### Week 1: OpenBao Namespace and Policy Configuration

#### 1.1 Create Additional Namespaces

Extend the existing Ansible role to create additional namespaces for each service:

```yaml
# roles/central_vault/templates/bootstrap_init_openbao.sh.j2 (modified)
for NS in {{ namespaces | list }}; do
  docker compose exec -T openbao bao namespace create "$NS" || true
  docker compose exec -T openbao sh -lc "export VAULT_TOKEN=$ROOT_TOKEN; bao secrets enable -version=2 -path=kv-${NS} kv" -e VAULT_NAMESPACE="$NS" || true
done
```

Update the `group_vars/all.yml` file to include all required namespaces:

```yaml
namespaces:
- sevensa
- rentguy
- psra
- wpcs
- ai
```

#### 1.2 Create Service-Specific Policies

Create policy files for each service:

**rentguy-policy.hcl**:
```hcl
# RentGuy policy
path "kv-rentguy/data/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "kv-rentguy/metadata/*" {
  capabilities = ["list", "read"]
}

path "database/creds/rentguy-*" {
  capabilities = ["read"]
}

path "pki/issue/sevensa-dot-nl" {
  capabilities = ["update"]
}

path "transit/encrypt/rentguy" {
  capabilities = ["update"]
}

path "transit/decrypt/rentguy" {
  capabilities = ["update"]
}
```

Create similar policies for `psra`, `wpcs`, and `ai` namespaces.

Add a task to the Ansible role to create these policies:

```yaml
# roles/central_vault/tasks/policies.yml
- name: Template policy files
  template:
    src: "policies/{{ item }}.hcl.j2"
    dest: "{{ project_dir }}/openbao/policies/{{ item }}.hcl"
    mode: "0644"
  loop:
    - rentguy-policy
    - psra-policy
    - wpcs-policy
    - ai-policy

- name: Create policies in OpenBao
  shell: |
    export VAULT_ADDR="http://127.0.0.1:{{ bao_http_port }}"
    export VAULT_TOKEN="$(cat {{ project_dir }}/openbao/root.token)"
    docker compose exec -T openbao bao policy write {{ item }} /opt/bao/policies/{{ item }}.hcl
  args:
    chdir: "{{ project_dir }}"
  loop:
    - rentguy-policy
    - psra-policy
    - wpcs-policy
    - ai-policy
```

#### 1.3 Create AppRoles for Service Authentication

Add a task to create AppRoles for each service:

```yaml
# roles/central_vault/tasks/approles.yml
- name: Create AppRoles for services
  shell: |
    export VAULT_ADDR="http://127.0.0.1:{{ bao_http_port }}"
    export VAULT_TOKEN="$(cat {{ project_dir }}/openbao/root.token)"
    
    # Enable AppRole auth method if not already enabled
    docker compose exec -T openbao bao auth enable approle || true
    
    # Create AppRoles for each service
    docker compose exec -T openbao bao write auth/approle/role/rentguy \
      token_policies="rentguy-policy" \
      token_ttl=1h \
      token_max_ttl=24h
      
    docker compose exec -T openbao bao write auth/approle/role/psra \
      token_policies="psra-policy" \
      token_ttl=1h \
      token_max_ttl=24h
      
    docker compose exec -T openbao bao write auth/approle/role/wpcs \
      token_policies="wpcs-policy" \
      token_ttl=1h \
      token_max_ttl=24h
      
    docker compose exec -T openbao bao write auth/approle/role/ai \
      token_policies="ai-policy" \
      token_ttl=1h \
      token_max_ttl=24h
  args:
    chdir: "{{ project_dir }}"
```

### Week 2: OpenBao Secrets Engines Configuration

#### 2.1 Configure Transit Engine

Add a task to configure the Transit engine for encryption/decryption:

```yaml
# roles/central_vault/tasks/transit.yml
- name: Configure Transit engine
  shell: |
    export VAULT_ADDR="http://127.0.0.1:{{ bao_http_port }}"
    export VAULT_TOKEN="$(cat {{ project_dir }}/openbao/root.token)"
    
    # Enable Transit engine if not already enabled
    docker compose exec -T openbao bao secrets enable transit || true
    
    # Create encryption keys for each service
    docker compose exec -T openbao bao write -f transit/keys/rentguy
    docker compose exec -T openbao bao write -f transit/keys/psra
    docker compose exec -T openbao bao write -f transit/keys/wpcs
    docker compose exec -T openbao bao write -f transit/keys/ai
  args:
    chdir: "{{ project_dir }}"
```

#### 2.2 Configure PKI Engine

Add a task to configure the PKI engine for certificate management:

```yaml
# roles/central_vault/tasks/pki.yml
- name: Configure PKI engine
  shell: |
    export VAULT_ADDR="http://127.0.0.1:{{ bao_http_port }}"
    export VAULT_TOKEN="$(cat {{ project_dir }}/openbao/root.token)"
    
    # Enable PKI engine if not already enabled
    docker compose exec -T openbao bao secrets enable pki || true
    
    # Configure PKI engine
    docker compose exec -T openbao bao secrets tune -max-lease-ttl=87600h pki
    
    # Generate root CA
    docker compose exec -T openbao bao write pki/root/generate/internal \
      common_name="Sevensa Internal CA" \
      ttl=87600h
      
    # Configure PKI URLs
    docker compose exec -T openbao bao write pki/config/urls \
      issuing_certificates="http://127.0.0.1:{{ bao_http_port }}/v1/pki/ca" \
      crl_distribution_points="http://127.0.0.1:{{ bao_http_port }}/v1/pki/crl"
      
    # Create role for issuing certificates
    docker compose exec -T openbao bao write pki/roles/sevensa-dot-nl \
      allowed_domains="sevensa.nl" \
      allow_subdomains=true \
      max_ttl=72h
  args:
    chdir: "{{ project_dir }}"
```

#### 2.3 Configure Database Secrets Engine

Add a task to configure the Database secrets engine for dynamic credentials:

```yaml
# roles/central_vault/tasks/database.yml
- name: Configure Database secrets engine
  shell: |
    export VAULT_ADDR="http://127.0.0.1:{{ bao_http_port }}"
    export VAULT_TOKEN="$(cat {{ project_dir }}/openbao/root.token)"
    
    # Enable Database engine if not already enabled
    docker compose exec -T openbao bao secrets enable database || true
    
    # Configure PostgreSQL connection for RentGuy
    docker compose exec -T openbao bao write database/config/rentguy-db \
      plugin_name=postgresql-database-plugin \
      allowed_roles="rentguy-role" \
      connection_url="postgresql://{{username}}:{{password}}@rentguy-db:5432/rentguy?sslmode=disable" \
      username="vault" \
      password="{{ rentguy_db_admin_password }}"
      
    # Create role for RentGuy database credentials
    docker compose exec -T openbao bao write database/roles/rentguy-role \
      db_name=rentguy-db \
      creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; \
                          GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO \"{{name}}\";" \
      default_ttl="1h" \
      max_ttl="24h"
      
    # Configure PostgreSQL connection for PSRA
    docker compose exec -T openbao bao write database/config/psra-db \
      plugin_name=postgresql-database-plugin \
      allowed_roles="psra-role" \
      connection_url="postgresql://{{username}}:{{password}}@psra-db:5432/psra?sslmode=disable" \
      username="vault" \
      password="{{ psra_db_admin_password }}"
      
    # Create role for PSRA database credentials
    docker compose exec -T openbao bao write database/roles/psra-role \
      db_name=psra-db \
      creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; \
                          GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO \"{{name}}\";" \
      default_ttl="1h" \
      max_ttl="24h"
      
    # Configure MySQL connection for WPCS
    docker compose exec -T openbao bao write database/config/wpcs-db \
      plugin_name=mysql-database-plugin \
      allowed_roles="wpcs-role" \
      connection_url="{{username}}:{{password}}@tcp(wpcs-db:3306)/" \
      username="vault" \
      password="{{ wpcs_db_admin_password }}"
      
    # Create role for WPCS database credentials
    docker compose exec -T openbao bao write database/roles/wpcs-role \
      db_name=wpcs-db \
      creation_statements="CREATE USER '{{name}}'@'%' IDENTIFIED BY '{{password}}'; \
                          GRANT SELECT, INSERT, UPDATE, DELETE ON wpcs.* TO '{{name}}'@'%';" \
      default_ttl="1h" \
      max_ttl="24h"
  args:
    chdir: "{{ project_dir }}"
  vars:
    rentguy_db_admin_password: "{{ lookup('env', 'RENTGUY_DB_ADMIN_PASSWORD') | default('changeme-rentguy-db-admin', true) }}"
    psra_db_admin_password: "{{ lookup('env', 'PSRA_DB_ADMIN_PASSWORD') | default('changeme-psra-db-admin', true) }}"
    wpcs_db_admin_password: "{{ lookup('env', 'WPCS_DB_ADMIN_PASSWORD') | default('changeme-wpcs-db-admin', true) }}"
```

#### 2.4 Configure Audit Logging

Add a task to configure audit logging:

```yaml
# roles/central_vault/tasks/audit.yml
- name: Configure audit logging
  shell: |
    export VAULT_ADDR="http://127.0.0.1:{{ bao_http_port }}"
    export VAULT_TOKEN="$(cat {{ project_dir }}/openbao/root.token)"
    
    # Enable file audit device
    docker compose exec -T openbao bao audit enable file file_path=/opt/bao/logs/audit.log
  args:
    chdir: "{{ project_dir }}"
```

### Week 3: Keycloak Realm and Client Configuration

#### 3.1 Create Keycloak Realm Configuration

Create a Keycloak realm configuration file:

```yaml
# roles/central_vault/templates/realm-sevensa.json.j2
{
  "realm": "sevensa",
  "enabled": true,
  "sslRequired": "external",
  "registrationAllowed": false,
  "loginWithEmailAllowed": true,
  "duplicateEmailsAllowed": false,
  "resetPasswordAllowed": true,
  "editUsernameAllowed": false,
  "bruteForceProtected": true,
  "permanentLockout": false,
  "maxFailureWaitSeconds": 900,
  "minimumQuickLoginWaitSeconds": 60,
  "waitIncrementSeconds": 60,
  "quickLoginCheckMilliSeconds": 1000,
  "maxDeltaTimeSeconds": 43200,
  "failureFactor": 5,
  "roles": {
    "realm": [
      {
        "name": "admin",
        "description": "Administrator role with full access"
      },
      {
        "name": "rentguy-admin",
        "description": "RentGuy administrator"
      },
      {
        "name": "rentguy-user",
        "description": "RentGuy regular user"
      },
      {
        "name": "psra-admin",
        "description": "PSRA administrator"
      },
      {
        "name": "psra-user",
        "description": "PSRA regular user"
      },
      {
        "name": "wpcs-admin",
        "description": "WPCS administrator"
      },
      {
        "name": "wpcs-user",
        "description": "WPCS regular user"
      },
      {
        "name": "ai-admin",
        "description": "AI Orchestrator administrator"
      },
      {
        "name": "ai-user",
        "description": "AI Orchestrator regular user"
      }
    ]
  },
  "groups": [
    {
      "name": "Administrators",
      "path": "/Administrators",
      "attributes": {},
      "realmRoles": [
        "admin"
      ],
      "clientRoles": {},
      "subGroups": []
    },
    {
      "name": "RentGuy Users",
      "path": "/RentGuy Users",
      "attributes": {},
      "realmRoles": [
        "rentguy-user"
      ],
      "clientRoles": {},
      "subGroups": []
    },
    {
      "name": "PSRA Users",
      "path": "/PSRA Users",
      "attributes": {},
      "realmRoles": [
        "psra-user"
      ],
      "clientRoles": {},
      "subGroups": []
    },
    {
      "name": "WPCS Users",
      "path": "/WPCS Users",
      "attributes": {},
      "realmRoles": [
        "wpcs-user"
      ],
      "clientRoles": {},
      "subGroups": []
    },
    {
      "name": "AI Users",
      "path": "/AI Users",
      "attributes": {},
      "realmRoles": [
        "ai-user"
      ],
      "clientRoles": {},
      "subGroups": []
    }
  ],
  "clients": [
    {
      "clientId": "{{ kc_client_id }}",
      "name": "OpenBao",
      "description": "OpenBao OIDC Client",
      "rootUrl": "http://127.0.0.1:{{ bao_http_port }}",
      "adminUrl": "http://127.0.0.1:{{ bao_http_port }}",
      "baseUrl": "http://127.0.0.1:{{ bao_http_port }}",
      "surrogateAuthRequired": false,
      "enabled": true,
      "alwaysDisplayInConsole": false,
      "clientAuthenticatorType": "client-secret",
      "secret": "{{ kc_client_secret }}",
      "redirectUris": [
        "http://127.0.0.1:{{ bao_http_port }}/ui/vault/auth/oidc/oidc/callback",
        "http://127.0.0.1:{{ bao_http_port }}/ui/*"
      ],
      "webOrigins": [
        "http://127.0.0.1:{{ bao_http_port }}"
      ],
      "notBefore": 0,
      "bearerOnly": false,
      "consentRequired": false,
      "standardFlowEnabled": true,
      "implicitFlowEnabled": false,
      "directAccessGrantsEnabled": true,
      "serviceAccountsEnabled": false,
      "publicClient": false,
      "frontchannelLogout": false,
      "protocol": "openid-connect",
      "attributes": {},
      "authenticationFlowBindingOverrides": {},
      "fullScopeAllowed": true,
      "nodeReRegistrationTimeout": -1,
      "defaultClientScopes": [
        "web-origins",
        "roles",
        "profile",
        "email"
      ],
      "optionalClientScopes": [
        "address",
        "phone",
        "offline_access"
      ]
    },
    {
      "clientId": "rentguy-client",
      "name": "RentGuy Application",
      "description": "RentGuy SaaS Platform",
      "rootUrl": "https://rentguy.sevensa.nl",
      "adminUrl": "https://rentguy.sevensa.nl",
      "baseUrl": "https://rentguy.sevensa.nl",
      "surrogateAuthRequired": false,
      "enabled": true,
      "alwaysDisplayInConsole": false,
      "clientAuthenticatorType": "client-secret",
      "secret": "{{ rentguy_client_secret }}",
      "redirectUris": [
        "https://rentguy.sevensa.nl/*",
        "https://onboarding.rentguy.sevensa.nl/*"
      ],
      "webOrigins": [
        "https://rentguy.sevensa.nl",
        "https://onboarding.rentguy.sevensa.nl"
      ],
      "notBefore": 0,
      "bearerOnly": false,
      "consentRequired": false,
      "standardFlowEnabled": true,
      "implicitFlowEnabled": false,
      "directAccessGrantsEnabled": true,
      "serviceAccountsEnabled": true,
      "authorizationServicesEnabled": true,
      "publicClient": false,
      "frontchannelLogout": true,
      "protocol": "openid-connect",
      "attributes": {},
      "authenticationFlowBindingOverrides": {},
      "fullScopeAllowed": true,
      "nodeReRegistrationTimeout": -1,
      "defaultClientScopes": [
        "web-origins",
        "roles",
        "profile",
        "email"
      ],
      "optionalClientScopes": [
        "address",
        "phone",
        "offline_access"
      ]
    }
  ]
}
```

Add similar client configurations for `psra-client`, `wpcs-client`, and `ai-client`.

#### 3.2 Import Realm Configuration to Keycloak

Add a task to import the realm configuration:

```yaml
# roles/central_vault/tasks/keycloak.yml
- name: Template Keycloak realm configuration
  template:
    src: "realm-sevensa.json.j2"
    dest: "{{ project_dir }}/keycloak/realm-sevensa.json"
    mode: "0644"
  vars:
    rentguy_client_secret: "{{ lookup('env', 'RENTGUY_CLIENT_SECRET') | default('changeme-rentguy-client', true) }}"
    psra_client_secret: "{{ lookup('env', 'PSRA_CLIENT_SECRET') | default('changeme-psra-client', true) }}"
    wpcs_client_secret: "{{ lookup('env', 'WPCS_CLIENT_SECRET') | default('changeme-wpcs-client', true) }}"
    ai_client_secret: "{{ lookup('env', 'AI_CLIENT_SECRET') | default('changeme-ai-client', true) }}"

- name: Import realm configuration to Keycloak
  shell: |
    docker compose exec -T keycloak /opt/keycloak/bin/kc.sh import --file /opt/keycloak/data/import/realm-sevensa.json
  args:
    chdir: "{{ project_dir }}"
```

#### 3.3 Configure MFA for Admin Accounts

Add a task to configure MFA for admin accounts:

```yaml
# roles/central_vault/tasks/keycloak_mfa.yml
- name: Configure MFA for admin accounts
  shell: |
    # This would typically be done through the Keycloak Admin API
    # For now, we'll just document the steps
    echo "To configure MFA for admin accounts:"
    echo "1. Log in to Keycloak Admin Console"
    echo "2. Go to Authentication > Flows"
    echo "3. Copy the 'Browser' flow"
    echo "4. Add 'OTP Form' to the flow"
    echo "5. Set it as 'REQUIRED' for the 'Browser Forms' flow"
    echo "6. Go to Authentication > Bindings"
    echo "7. Set the 'Browser Flow' to your new flow"
  args:
    chdir: "{{ project_dir }}"
```

### Week 4: Integration Testing and Documentation

#### 4.1 Create Test Scripts

Create test scripts to verify the configuration:

```bash
#!/bin/bash
# roles/central_vault/files/scripts/test_openbao.sh

set -e

export VAULT_ADDR="http://127.0.0.1:${BAO_HTTP_PORT}"
export VAULT_TOKEN="$(cat ./openbao/root.token)"

# Test namespaces
echo "Testing namespaces..."
for NS in sevensa rentguy psra wpcs ai; do
  docker compose exec -T openbao bao namespace lookup $NS
  echo "Namespace $NS exists"
done

# Test policies
echo "Testing policies..."
for POLICY in rentguy-policy psra-policy wpcs-policy ai-policy; do
  docker compose exec -T openbao bao policy read $POLICY
  echo "Policy $POLICY exists"
done

# Test AppRoles
echo "Testing AppRoles..."
for ROLE in rentguy psra wpcs ai; do
  docker compose exec -T openbao bao read auth/approle/role/$ROLE
  echo "AppRole $ROLE exists"
done

# Test Transit engine
echo "Testing Transit engine..."
for KEY in rentguy psra wpcs ai; do
  docker compose exec -T openbao bao read transit/keys/$KEY
  echo "Transit key $KEY exists"
done

# Test PKI engine
echo "Testing PKI engine..."
docker compose exec -T openbao bao read pki/roles/sevensa-dot-nl
echo "PKI role sevensa-dot-nl exists"

# Test Database engine
echo "Testing Database engine..."
for ROLE in rentguy-role psra-role wpcs-role; do
  docker compose exec -T openbao bao read database/roles/$ROLE
  echo "Database role $ROLE exists"
done

echo "All tests passed!"
```

#### 4.2 Create Documentation

Create documentation for the OpenBao and Keycloak setup:

```markdown
# OpenBao and Keycloak Setup Documentation

## Overview

This document describes the OpenBao and Keycloak setup for the Sevensa platform. It includes information about the namespaces, policies, roles, and secrets engines configured for each service.

## OpenBao Configuration

### Namespaces

The following namespaces are configured in OpenBao:

- `sevensa`: Root namespace for shared secrets
- `rentguy`: Namespace for RentGuy service
- `psra`: Namespace for PSRA service
- `wpcs`: Namespace for WPCS service
- `ai`: Namespace for AI Orchestration service

### Policies

The following policies are configured in OpenBao:

- `rentguy-policy`: Policy for RentGuy service
- `psra-policy`: Policy for PSRA service
- `wpcs-policy`: Policy for WPCS service
- `ai-policy`: Policy for AI Orchestration service

### AppRoles

The following AppRoles are configured in OpenBao:

- `rentguy`: AppRole for RentGuy service
- `psra`: AppRole for PSRA service
- `wpcs`: AppRole for WPCS service
- `ai`: AppRole for AI Orchestration service

### Secrets Engines

The following secrets engines are configured in OpenBao:

- `kv-sevensa`: KV v2 engine for shared secrets
- `kv-rentguy`: KV v2 engine for RentGuy secrets
- `kv-psra`: KV v2 engine for PSRA secrets
- `kv-wpcs`: KV v2 engine for WPCS secrets
- `kv-ai`: KV v2 engine for AI Orchestration secrets
- `transit`: Transit engine for encryption/decryption
- `pki`: PKI engine for certificate management
- `database`: Database engine for dynamic credentials

## Keycloak Configuration

### Realm

The `sevensa` realm is configured in Keycloak with the following settings:

- SSL required: external
- Registration allowed: false
- Login with email allowed: true
- Reset password allowed: true
- Brute force protection: enabled

### Roles

The following roles are configured in the `sevensa` realm:

- `admin`: Administrator role with full access
- `rentguy-admin`: RentGuy administrator
- `rentguy-user`: RentGuy regular user
- `psra-admin`: PSRA administrator
- `psra-user`: PSRA regular user
- `wpcs-admin`: WPCS administrator
- `wpcs-user`: WPCS regular user
- `ai-admin`: AI Orchestrator administrator
- `ai-user`: AI Orchestrator regular user

### Groups

The following groups are configured in the `sevensa` realm:

- `Administrators`: Users with admin role
- `RentGuy Users`: Users with rentguy-user role
- `PSRA Users`: Users with psra-user role
- `WPCS Users`: Users with wpcs-user role
- `AI Users`: Users with ai-user role

### Clients

The following clients are configured in the `sevensa` realm:

- `bao-oidc`: OpenBao OIDC client
- `rentguy-client`: RentGuy application client
- `psra-client`: PSRA application client
- `wpcs-client`: WPCS application client
- `ai-client`: AI Orchestration application client

## Integration

OpenBao is integrated with Keycloak using OIDC authentication. Users can log in to OpenBao using their Keycloak credentials.

## Usage

### Accessing OpenBao

OpenBao is available at `http://127.0.0.1:{{ bao_http_port }}`.

### Accessing Keycloak

Keycloak is available at `http://127.0.0.1:{{ kc_http_port }}`.

### Using OpenBao with Services

Services should use the AppRole authentication method to authenticate with OpenBao. The following steps are required:

1. Get the AppRole ID and Secret ID for the service
2. Authenticate with OpenBao using the AppRole ID and Secret ID
3. Use the resulting token to access secrets

Example:

```bash
# Get AppRole ID
ROLE_ID=$(curl -s -X GET -H "X-Vault-Token: $VAULT_TOKEN" $VAULT_ADDR/v1/auth/approle/role/rentguy/role-id | jq -r .data.role_id)

# Get Secret ID
SECRET_ID=$(curl -s -X POST -H "X-Vault-Token: $VAULT_TOKEN" $VAULT_ADDR/v1/auth/approle/role/rentguy/secret-id | jq -r .data.secret_id)

# Authenticate with AppRole
TOKEN=$(curl -s -X POST -d "{\"role_id\":\"$ROLE_ID\",\"secret_id\":\"$SECRET_ID\"}" $VAULT_ADDR/v1/auth/approle/login | jq -r .auth.client_token)

# Use token to access secrets
curl -s -H "X-Vault-Token: $TOKEN" $VAULT_ADDR/v1/kv-rentguy/data/config
```
```

#### 4.3 Update Main Ansible Role

Update the main Ansible role to include all the new tasks:

```yaml
# roles/central_vault/tasks/main.yml
- name: Ensure packages are present
  apt:
    name:
      - docker.io
      - docker-compose-plugin
      - jq
      - curl
      - unzip
      - python3
      - python3-pip
    update_cache: true
    state: present

- name: Create project directories
  file:
    path: "{{ item }}"
    state: directory
    mode: "0755"
  loop:
    - "{{ project_dir }}"
    - "{{ project_dir }}/openbao"
    - "{{ project_dir }}/data"
    - "{{ project_dir }}/keycloak"
    - "{{ project_dir }}/bootstrap"
    - "{{ project_dir }}/imports"
    - "{{ project_dir }}/openbao/policies"
    - "{{ project_dir }}/openbao/logs"

- name: Auto-detect free ports
  include_tasks: ports.yml

- name: Template .env
  template:
    src: ".env.j2"
    dest: "{{ project_dir }}/.env"
    mode: "0644"

- name: Template docker-compose.yml
  template:
    src: "docker-compose.yml.j2"
    dest: "{{ project_dir }}/docker-compose.yml"
    mode: "0644"

- name: Bring up stack
  community.docker.docker_compose_v2:
    project_src: "{{ project_dir }}"
    state: present

- name: Wait for containers to start
  pause:
    seconds: 5

- name: Install Python libs for import tool
  pip:
    name:
      - requests
      - pandas
      - openpyxl
    state: present

- name: Place bootstrap script
  template:
    src: "bootstrap_init_openbao.sh.j2"
    dest: "{{ project_dir }}/bootstrap/init_openbao.sh"
    mode: "0755"

- name: Run bootstrap (init + unseal + namespaces + OIDC)
  command: "{{ project_dir }}/bootstrap/init_openbao.sh"
  args:
    chdir: "{{ project_dir }}"

- name: Place import tool
  template:
    src: "import_secrets.py.j2"
    dest: "{{ project_dir }}/imports/import_secrets.py"
    mode: "0755"

# New tasks
- name: Configure OpenBao policies
  include_tasks: policies.yml

- name: Configure OpenBao AppRoles
  include_tasks: approles.yml

- name: Configure Transit engine
  include_tasks: transit.yml

- name: Configure PKI engine
  include_tasks: pki.yml

- name: Configure Database secrets engine
  include_tasks: database.yml

- name: Configure audit logging
  include_tasks: audit.yml

- name: Configure Keycloak realm
  include_tasks: keycloak.yml

- name: Configure MFA for admin accounts
  include_tasks: keycloak_mfa.yml

- name: Place test scripts
  copy:
    src: "scripts/test_openbao.sh"
    dest: "{{ project_dir }}/test_openbao.sh"
    mode: "0755"

- name: Create documentation
  template:
    src: "docs/README.md.j2"
    dest: "{{ project_dir }}/README.md"
    mode: "0644"
```

## Deliverables

1. Enhanced OpenBao configuration with:
   - Additional namespaces for each service
   - Service-specific policies
   - AppRoles for service authentication
   - Transit engine for encryption/decryption
   - PKI engine for certificate management
   - Database secrets engine for dynamic credentials
   - Audit logging

2. Enhanced Keycloak configuration with:
   - Proper realm configuration
   - Service-specific roles and groups
   - Service-specific clients
   - MFA for admin accounts

3. Documentation and test scripts

## Success Criteria

1. OpenBao is properly configured with all required namespaces, policies, and secrets engines
2. Keycloak is properly configured with all required roles, groups, and clients
3. Services can authenticate with OpenBao using AppRole authentication
4. Services can authenticate with Keycloak using OIDC
5. All test scripts pass successfully
6. Documentation is complete and accurate
