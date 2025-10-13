# Policy for secrets administration and rotation
# Allows full CRUD operations on secrets for administrators
#
# Usage:
#   vault policy write secrets-admin secrets-admin.hcl
#
# Created: 2025-10-13

# ============================================================================
# KV Secrets Management
# ============================================================================

# Full access to all secrets
path "secret/data/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "secret/metadata/*" {
  capabilities = ["read", "list", "delete"]
}

# Undelete and destroy secret versions
path "secret/undelete/*" {
  capabilities = ["update"]
}

path "secret/destroy/*" {
  capabilities = ["update"]
}

# Delete metadata and all versions
path "secret/metadata/*" {
  capabilities = ["delete"]
}

# ============================================================================
# Database Secrets Engine Management
# ============================================================================

# Manage database connections
path "database/config/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# Manage database roles
path "database/roles/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# Manage static roles
path "database/static-roles/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# Rotate database root credentials
path "database/rotate-root/*" {
  capabilities = ["update"]
}

# Rotate static role credentials
path "database/rotate-role/*" {
  capabilities = ["update"]
}

# Reset database connection
path "database/reset/*" {
  capabilities = ["update"]
}

# ============================================================================
# Transit Encryption Engine Management
# ============================================================================

# Manage transit keys
path "transit/keys/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# Rotate transit keys
path "transit/keys/*/rotate" {
  capabilities = ["update"]
}

# Configure transit keys
path "transit/keys/*/config" {
  capabilities = ["update"]
}

# Trim old key versions
path "transit/keys/*/trim" {
  capabilities = ["update"]
}

# Export keys (if allowed)
path "transit/export/*" {
  capabilities = ["read"]
}

# ============================================================================
# PKI Secrets Engine Management
# ============================================================================

# Manage PKI roles
path "pki/roles/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# Generate and manage root CA
path "pki/root/*" {
  capabilities = ["create", "update", "delete"]
}

# Generate and manage intermediate CA
path "pki/intermediate/*" {
  capabilities = ["create", "update"]
}

# Issue certificates
path "pki/issue/*" {
  capabilities = ["create", "update"]
}

# Sign certificates
path "pki/sign/*" {
  capabilities = ["create", "update"]
}

# Revoke certificates
path "pki/revoke" {
  capabilities = ["update"]
}

# Manage CRL configuration
path "pki/config/*" {
  capabilities = ["create", "read", "update"]
}

# Tidy operations
path "pki/tidy" {
  capabilities = ["update"]
}

# ============================================================================
# AppRole Management (for creating service roles)
# ============================================================================

# Manage AppRole roles
path "auth/approle/role/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# Generate role IDs and secret IDs
path "auth/approle/role/*/role-id" {
  capabilities = ["read"]
}

path "auth/approle/role/*/secret-id" {
  capabilities = ["create", "update"]
}

path "auth/approle/role/*/secret-id/*" {
  capabilities = ["read", "update", "delete"]
}

# List secret ID accessors
path "auth/approle/role/*/secret-id-accessor/*" {
  capabilities = ["read", "update", "delete"]
}

# ============================================================================
# Policy Management
# ============================================================================

# Read and list policies
path "sys/policies/acl" {
  capabilities = ["list"]
}

path "sys/policies/acl/*" {
  capabilities = ["read", "list"]
}

# ============================================================================
# Audit and Monitoring
# ============================================================================

# Read audit logs configuration
path "sys/audit" {
  capabilities = ["read"]
}

path "sys/audit/*" {
  capabilities = ["read"]
}

# Read mounts
path "sys/mounts" {
  capabilities = ["read"]
}

path "sys/mounts/*" {
  capabilities = ["read"]
}

# ============================================================================
# Lease Management
# ============================================================================

# Full lease management
path "sys/leases/lookup/*" {
  capabilities = ["update"]
}

path "sys/leases/renew/*" {
  capabilities = ["update"]
}

path "sys/leases/revoke/*" {
  capabilities = ["update"]
}

path "sys/leases/revoke-prefix/*" {
  capabilities = ["update"]
}

# ============================================================================
# Token Management
# ============================================================================

# Create tokens for services
path "auth/token/create" {
  capabilities = ["create", "update"]
}

# Lookup and manage tokens
path "auth/token/lookup" {
  capabilities = ["update"]
}

path "auth/token/lookup-accessor" {
  capabilities = ["update"]
}

path "auth/token/revoke" {
  capabilities = ["update"]
}

path "auth/token/revoke-accessor" {
  capabilities = ["update"]
}

# Self-management
path "auth/token/renew-self" {
  capabilities = ["update"]
}

path "auth/token/lookup-self" {
  capabilities = ["read"]
}
