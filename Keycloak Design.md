# Keycloak Design

## Overview

This document outlines the design for extending the Keycloak configuration to support multiple services in the Sevensa platform. Keycloak will serve as the central identity provider for all services, providing authentication and authorization capabilities.

## Current State

The current Keycloak deployment includes:
- A single realm (`sevensa`)
- A client for OpenBao OIDC authentication (`bao-oidc`)
- Basic configuration for development use

## Realm Design

The existing `sevensa` realm will be enhanced with the following components:

### Roles

The following roles will be created:

| Role | Description | Scope |
|------|-------------|-------|
| `admin` | Administrator role with full access | Realm |
| `rentguy-admin` | RentGuy administrator | Realm |
| `rentguy-user` | RentGuy regular user | Realm |
| `psra-admin` | PSRA administrator | Realm |
| `psra-user` | PSRA regular user | Realm |
| `wpcs-admin` | WPCS administrator | Realm |
| `wpcs-user` | WPCS regular user | Realm |
| `ai-admin` | AI Orchestrator administrator | Realm |
| `ai-user` | AI Orchestrator regular user | Realm |

### Groups

The following groups will be created:

| Group | Description | Roles |
|-------|-------------|-------|
| `Administrators` | Users with administrative privileges | `admin` |
| `RentGuy Users` | Users with access to RentGuy | `rentguy-user` |
| `RentGuy Administrators` | Administrators of RentGuy | `rentguy-admin`, `rentguy-user` |
| `PSRA Users` | Users with access to PSRA | `psra-user` |
| `PSRA Administrators` | Administrators of PSRA | `psra-admin`, `psra-user` |
| `WPCS Users` | Users with access to WPCS | `wpcs-user` |
| `WPCS Administrators` | Administrators of WPCS | `wpcs-admin`, `wpcs-user` |
| `AI Users` | Users with access to AI Orchestrator | `ai-user` |
| `AI Administrators` | Administrators of AI Orchestrator | `ai-admin`, `ai-user` |

### Clients

The following clients will be created:

| Client ID | Description | Client Type | Access Type | Valid Redirect URIs |
|-----------|-------------|-------------|-------------|---------------------|
| `bao-oidc` | OpenBao OIDC client (existing) | Confidential | Standard Flow | `http://127.0.0.1:${BAO_HTTP_PORT}/ui/*` |
| `rentguy-client` | RentGuy application | Confidential | Standard Flow | `https://rentguy.sevensa.nl/*`, `https://onboarding.rentguy.sevensa.nl/*` |
| `psra-client` | PSRA application | Confidential | Standard Flow | `https://psra.sevensa.nl/*` |
| `wpcs-client` | WPCS application | Confidential | Standard Flow | `https://wpcs.sevensa.nl/*` |
| `ai-client` | AI Orchestrator | Confidential | Standard Flow | `https://ai.sevensa.nl/*` |
| `oauth2-proxy` | OAuth2 Proxy for Traefik | Confidential | Standard Flow | `https://auth.sevensa.nl/oauth2/callback` |

### Client Scopes

The following client scopes will be configured:

| Scope | Description | Protocol Mappers |
|-------|-------------|------------------|
| `profile` | User profile information | `username`, `given_name`, `family_name`, `full_name` |
| `email` | User email information | `email`, `email_verified` |
| `roles` | User roles | `realm_roles`, `client_roles` |
| `groups` | User groups | `groups` |

### Authentication Flows

The following authentication flows will be configured:

| Flow | Description | Requirements |
|------|-------------|-------------|
| `browser` | Browser-based authentication | Username/password form, OTP form (optional) |
| `direct grant` | Direct grant authentication | Username/password form |
| `registration` | User registration | Registration form, Email verification |

### MFA Configuration

Multi-factor authentication (MFA) will be configured for administrative accounts:

1. **OTP Configuration**:
   - Time-based One-Time Password (TOTP)
   - 6-digit code
   - 30-second interval

2. **Authentication Flow**:
   - Copy the `browser` flow to create a new `browser-mfa` flow
   - Add the `OTP Form` as a required step
   - Set the `browser-mfa` flow as the default for the `browser` binding

3. **User Configuration**:
   - Configure OTP for administrative users
   - Provide instructions for setting up authenticator apps

## Implementation Approach

The implementation will follow these steps:

1. **Create Realm Configuration**: Create a JSON file with the realm configuration.
2. **Import Realm Configuration**: Import the realm configuration into Keycloak.
3. **Create Initial Users**: Create initial administrative users.
4. **Configure MFA**: Configure MFA for administrative users.

## Realm Configuration

The realm configuration will be defined in a JSON file:

```json
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
      "name": "RentGuy Administrators",
      "path": "/RentGuy Administrators",
      "attributes": {},
      "realmRoles": [
        "rentguy-admin",
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
      "name": "PSRA Administrators",
      "path": "/PSRA Administrators",
      "attributes": {},
      "realmRoles": [
        "psra-admin",
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
      "name": "WPCS Administrators",
      "path": "/WPCS Administrators",
      "attributes": {},
      "realmRoles": [
        "wpcs-admin",
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
    },
    {
      "name": "AI Administrators",
      "path": "/AI Administrators",
      "attributes": {},
      "realmRoles": [
        "ai-admin",
        "ai-user"
      ],
      "clientRoles": {},
      "subGroups": []
    }
  ],
  "clients": [
    {
      "clientId": "bao-oidc",
      "name": "OpenBao",
      "description": "OpenBao OIDC Client",
      "rootUrl": "http://127.0.0.1:${BAO_HTTP_PORT}",
      "adminUrl": "http://127.0.0.1:${BAO_HTTP_PORT}",
      "baseUrl": "http://127.0.0.1:${BAO_HTTP_PORT}",
      "surrogateAuthRequired": false,
      "enabled": true,
      "alwaysDisplayInConsole": false,
      "clientAuthenticatorType": "client-secret",
      "secret": "${KC_CLIENT_SECRET}",
      "redirectUris": [
        "http://127.0.0.1:${BAO_HTTP_PORT}/ui/vault/auth/oidc/oidc/callback",
        "http://127.0.0.1:${BAO_HTTP_PORT}/ui/*"
      ],
      "webOrigins": [
        "http://127.0.0.1:${BAO_HTTP_PORT}"
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
      "secret": "${RENTGUY_CLIENT_SECRET}",
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

Similar client configurations will be added for `psra-client`, `wpcs-client`, `ai-client`, and `oauth2-proxy`.

## Ansible Role Extension

The Ansible role will be extended to include the following tasks:

1. **Template Realm Configuration**: Create a template for the realm configuration.
2. **Import Realm Configuration**: Import the realm configuration into Keycloak.
3. **Create Initial Users**: Create initial administrative users.
4. **Configure MFA**: Configure MFA for administrative users.

```yaml
# roles/keycloak_extension/tasks/main.yml
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
    oauth2_client_secret: "{{ lookup('env', 'OAUTH2_CLIENT_SECRET') | default('changeme-oauth2-proxy', true) }}"

- name: Copy realm configuration to Keycloak container
  shell: |
    docker compose cp {{ project_dir }}/keycloak/realm-sevensa.json keycloak:/opt/keycloak/data/import/
  args:
    chdir: "{{ project_dir }}"

- name: Import realm configuration to Keycloak
  shell: |
    docker compose exec -T keycloak /opt/keycloak/bin/kc.sh import --file /opt/keycloak/data/import/realm-sevensa.json
  args:
    chdir: "{{ project_dir }}"

- name: Create initial admin user
  shell: |
    export KEYCLOAK_URL="http://127.0.0.1:{{ kc_http_port }}"
    export KEYCLOAK_ADMIN="{{ keycloak_admin }}"
    export KEYCLOAK_ADMIN_PASSWORD="{{ keycloak_admin_password }}"
    
    # Get admin token
    TOKEN=$(curl -s -X POST "${KEYCLOAK_URL}/auth/realms/master/protocol/openid-connect/token" \
      -H "Content-Type: application/x-www-form-urlencoded" \
      -d "username=${KEYCLOAK_ADMIN}" \
      -d "password=${KEYCLOAK_ADMIN_PASSWORD}" \
      -d "grant_type=password" \
      -d "client_id=admin-cli" | jq -r .access_token)
    
    # Create admin user
    curl -s -X POST "${KEYCLOAK_URL}/auth/admin/realms/sevensa/users" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      -d '{
        "username": "admin",
        "enabled": true,
        "emailVerified": true,
        "firstName": "Admin",
        "lastName": "User",
        "email": "admin@sevensa.nl",
        "credentials": [
          {
            "type": "password",
            "value": "{{ admin_password }}",
            "temporary": false
          }
        ],
        "groups": [
          "/Administrators"
        ]
      }'
  args:
    chdir: "{{ project_dir }}"
  vars:
    keycloak_admin: "{{ lookup('env', 'KEYCLOAK_ADMIN') | default('admin', true) }}"
    keycloak_admin_password: "{{ lookup('env', 'KEYCLOAK_ADMIN_PASSWORD') | default('changeme-keycloak-admin', true) }}"
    admin_password: "{{ lookup('env', 'ADMIN_PASSWORD') | default('changeme-admin-password', true) }}"

- name: Configure MFA for admin accounts
  shell: |
    export KEYCLOAK_URL="http://127.0.0.1:{{ kc_http_port }}"
    export KEYCLOAK_ADMIN="{{ keycloak_admin }}"
    export KEYCLOAK_ADMIN_PASSWORD="{{ keycloak_admin_password }}"
    
    # Get admin token
    TOKEN=$(curl -s -X POST "${KEYCLOAK_URL}/auth/realms/master/protocol/openid-connect/token" \
      -H "Content-Type: application/x-www-form-urlencoded" \
      -d "username=${KEYCLOAK_ADMIN}" \
      -d "password=${KEYCLOAK_ADMIN_PASSWORD}" \
      -d "grant_type=password" \
      -d "client_id=admin-cli" | jq -r .access_token)
    
    # Get browser flow ID
    BROWSER_FLOW_ID=$(curl -s -X GET "${KEYCLOAK_URL}/auth/admin/realms/sevensa/authentication/flows" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" | jq -r '.[] | select(.alias == "browser") | .id')
    
    # Copy browser flow
    curl -s -X POST "${KEYCLOAK_URL}/auth/admin/realms/sevensa/authentication/flows/${BROWSER_FLOW_ID}/copy" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      -d '{
        "newName": "browser-mfa"
      }'
    
    # Get browser-mfa flow ID
    MFA_FLOW_ID=$(curl -s -X GET "${KEYCLOAK_URL}/auth/admin/realms/sevensa/authentication/flows" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" | jq -r '.[] | select(.alias == "browser-mfa") | .id')
    
    # Get browser forms ID
    BROWSER_FORMS_ID=$(curl -s -X GET "${KEYCLOAK_URL}/auth/admin/realms/sevensa/authentication/flows/browser-mfa/executions" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" | jq -r '.[] | select(.displayName == "Browser Forms") | .id')
    
    # Add OTP form
    curl -s -X POST "${KEYCLOAK_URL}/auth/admin/realms/sevensa/authentication/flows/browser-mfa/executions/execution" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      -d '{
        "provider": "auth-otp-form"
      }'
    
    # Get OTP form ID
    OTP_FORM_ID=$(curl -s -X GET "${KEYCLOAK_URL}/auth/admin/realms/sevensa/authentication/flows/browser-mfa/executions" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" | jq -r '.[] | select(.displayName == "OTP Form") | .id')
    
    # Update OTP form to required
    curl -s -X PUT "${KEYCLOAK_URL}/auth/admin/realms/sevensa/authentication/flows/browser-mfa/executions" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      -d '{
        "id": "'${OTP_FORM_ID}'",
        "requirement": "REQUIRED"
      }'
    
    # Set browser-mfa as default for browser binding
    curl -s -X PUT "${KEYCLOAK_URL}/auth/admin/realms/sevensa/authentication/flows/browser-mfa/executions" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      -d '{
        "alias": "browser",
        "flowId": "'${MFA_FLOW_ID}'"
      }'
  args:
    chdir: "{{ project_dir }}"
  vars:
    keycloak_admin: "{{ lookup('env', 'KEYCLOAK_ADMIN') | default('admin', true) }}"
    keycloak_admin_password: "{{ lookup('env', 'KEYCLOAK_ADMIN_PASSWORD') | default('changeme-keycloak-admin', true) }}"
```

## Testing

The Keycloak configuration will be tested using the following methods:

1. **Realm Verification**: Verify that the realm is created correctly.
2. **Role and Group Verification**: Verify that roles and groups are created correctly.
3. **Client Verification**: Verify that clients are created correctly.
4. **User Authentication**: Test user authentication with username/password.
5. **MFA Verification**: Test MFA for administrative users.
6. **Client Authentication**: Test client authentication and token issuance.
7. **Integration Testing**: Test integration with OpenBao and services.

## Conclusion

This design provides a comprehensive approach to configuring Keycloak for the Sevensa platform. The configuration ensures that each service has its own client and that users have appropriate roles and groups for access control. The addition of MFA for administrative users enhances security for privileged accounts.
