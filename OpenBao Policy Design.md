# OpenBao Policy Design

## Overview

This document outlines the design for OpenBao policies to support multiple services in the Sevensa platform. Policies define the permissions that users and services have within OpenBao, following the principle of least privilege.

## Policy Design Principles

1. **Least Privilege**: Policies should grant only the permissions necessary for the service to function.
2. **Isolation**: Each service should have its own policy to ensure proper isolation.
3. **Readability**: Policies should be clear and well-documented.
4. **Maintainability**: Policies should be organized in a way that makes them easy to maintain.

## Policy Structure

Each policy will be defined in a separate HCL file with the following structure:

```hcl
# <service>-policy.hcl
# Description: Policy for <service> service
# Created: <date>
# Last Updated: <date>

# KV v2 permissions
path "kv-<service>/data/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "kv-<service>/metadata/*" {
  capabilities = ["list", "read"]
}

# Transit permissions
path "transit/encrypt/<service>-key" {
  capabilities = ["update"]
}

path "transit/decrypt/<service>-key" {
  capabilities = ["update"]
}

# Database permissions (if applicable)
path "database/creds/<service>-*" {
  capabilities = ["read"]
}

# Additional permissions as needed
```

## Service-Specific Policies

### RentGuy Policy

```hcl
# rentguy-policy.hcl
# Description: Policy for RentGuy service
# Created: 2025-10-09
# Last Updated: 2025-10-09

# KV v2 permissions
path "kv-rentguy/data/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "kv-rentguy/metadata/*" {
  capabilities = ["list", "read"]
}

# Transit permissions
path "transit/encrypt/rentguy-key" {
  capabilities = ["update"]
}

path "transit/decrypt/rentguy-key" {
  capabilities = ["update"]
}

# Database permissions
path "database/creds/rentguy-*" {
  capabilities = ["read"]
}

# PKI permissions (if PKI is enabled)
path "pki/issue/sevensa-dot-nl" {
  capabilities = ["update"]
}
```

### PSRA Policy

```hcl
# psra-policy.hcl
# Description: Policy for PSRA service
# Created: 2025-10-09
# Last Updated: 2025-10-09

# KV v2 permissions
path "kv-psra/data/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "kv-psra/metadata/*" {
  capabilities = ["list", "read"]
}

# Transit permissions
path "transit/encrypt/psra-key" {
  capabilities = ["update"]
}

path "transit/decrypt/psra-key" {
  capabilities = ["update"]
}

# Database permissions
path "database/creds/psra-*" {
  capabilities = ["read"]
}

# PKI permissions (if PKI is enabled)
path "pki/issue/sevensa-dot-nl" {
  capabilities = ["update"]
}
```

### WPCS Policy

```hcl
# wpcs-policy.hcl
# Description: Policy for WPCS service
# Created: 2025-10-09
# Last Updated: 2025-10-09

# KV v2 permissions
path "kv-wpcs/data/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "kv-wpcs/metadata/*" {
  capabilities = ["list", "read"]
}

# Transit permissions
path "transit/encrypt/wpcs-key" {
  capabilities = ["update"]
}

path "transit/decrypt/wpcs-key" {
  capabilities = ["update"]
}

# Database permissions
path "database/creds/wpcs-*" {
  capabilities = ["read"]
}

# PKI permissions (if PKI is enabled)
path "pki/issue/sevensa-dot-nl" {
  capabilities = ["update"]
}
```

### AI Orchestration Policy

```hcl
# ai-policy.hcl
# Description: Policy for AI Orchestration service
# Created: 2025-10-09
# Last Updated: 2025-10-09

# KV v2 permissions
path "kv-ai/data/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "kv-ai/metadata/*" {
  capabilities = ["list", "read"]
}

# Transit permissions
path "transit/encrypt/ai-key" {
  capabilities = ["update"]
}

path "transit/decrypt/ai-key" {
  capabilities = ["update"]
}

# No database permissions for AI service
```

### Admin Policy

```hcl
# admin-policy.hcl
# Description: Policy for administrators
# Created: 2025-10-09
# Last Updated: 2025-10-09

# Root namespace permissions
path "*" {
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}

# Namespace permissions
path "sys/namespaces/*" {
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}

# Auth method permissions
path "sys/auth/*" {
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}

# Policy permissions
path "sys/policies/*" {
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}

# Secret engine permissions
path "sys/mounts/*" {
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}
```

## Implementation Approach

The implementation will follow these steps:

1. **Create Policy Files**: Create HCL files for each policy.
2. **Upload Policies**: Upload the policies to OpenBao using the `bao policy write` command.
3. **Associate Policies with Authentication Methods**: Associate policies with the appropriate authentication methods (AppRole, OIDC).

## Ansible Role Extension

The Ansible role will be extended to include the following tasks:

1. **Template Policy Files**: Create templates for each policy file.
2. **Upload Policies**: Upload the policies to OpenBao.
3. **Configure Authentication Methods**: Associate policies with authentication methods.

```yaml
# roles/openbao_extension/tasks/policies.yml
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
    - admin-policy

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
    - admin-policy
```

## AppRole Configuration

AppRole authentication will be configured for each service to allow programmatic access to OpenBao.

```yaml
# roles/openbao_extension/tasks/approles.yml
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

## Testing

The policy configuration will be tested using the following methods:

1. **Policy Verification**: Verify that all policies are created correctly.
2. **Permission Testing**: Test that the policies grant the appropriate permissions.
3. **AppRole Authentication**: Test that services can authenticate using AppRole.
4. **Access Control**: Test that services can only access their own resources.

## Conclusion

This design provides a comprehensive approach to defining and implementing OpenBao policies for the Sevensa platform. The policies follow the principle of least privilege and ensure proper isolation between services.
