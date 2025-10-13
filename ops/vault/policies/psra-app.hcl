# Comprehensive policy for PSRA application
# Combines access to all necessary secrets for the application
#
# Usage:
#   vault policy write psra-app psra-app.hcl
#
# Created: 2025-10-13

# ============================================================================
# Database Access
# ============================================================================

# Read static database credentials
path "secret/data/database/*" {
  capabilities = ["read", "list"]
}

path "secret/metadata/database/*" {
  capabilities = ["list"]
}

# Generate dynamic database credentials
path "database/creds/*" {
  capabilities = ["read"]
}

# ============================================================================
# API Keys Access
# ============================================================================

# Read API keys for third-party services
path "secret/data/api-keys/*" {
  capabilities = ["read", "list"]
}

path "secret/metadata/api-keys/*" {
  capabilities = ["list"]
}

# ============================================================================
# Encryption Keys Access
# ============================================================================

# Read encryption keys
path "secret/data/encryption-keys/*" {
  capabilities = ["read", "list"]
}

path "secret/metadata/encryption-keys/*" {
  capabilities = ["list"]
}

# Transit encryption operations
path "transit/encrypt/*" {
  capabilities = ["update"]
}

path "transit/decrypt/*" {
  capabilities = ["update"]
}

path "transit/rewrap/*" {
  capabilities = ["update"]
}

path "transit/datakey/plaintext/*" {
  capabilities = ["update"]
}

path "transit/hmac/*" {
  capabilities = ["update"]
}

path "transit/sign/*" {
  capabilities = ["update"]
}

path "transit/verify/*" {
  capabilities = ["update"]
}

# ============================================================================
# TLS Certificates Access
# ============================================================================

# Read TLS certificates
path "secret/data/tls-certificates/*" {
  capabilities = ["read", "list"]
}

path "secret/metadata/tls-certificates/*" {
  capabilities = ["list"]
}

# Generate certificates via PKI
path "pki/issue/*" {
  capabilities = ["create", "update"]
}

# ============================================================================
# Application Configuration
# ============================================================================

# Read application-specific configuration
path "secret/data/config/psra/*" {
  capabilities = ["read", "list"]
}

path "secret/metadata/config/psra/*" {
  capabilities = ["list"]
}

# Read feature flags
path "secret/data/config/feature-flags/*" {
  capabilities = ["read"]
}

# ============================================================================
# JWT and Session Keys
# ============================================================================

# Read JWT signing keys
path "secret/data/jwt-keys/*" {
  capabilities = ["read"]
}

# Read session encryption keys
path "secret/data/session-keys/*" {
  capabilities = ["read"]
}

# ============================================================================
# OAuth and SSO Configuration
# ============================================================================

# Read OAuth credentials
path "secret/data/oauth/*" {
  capabilities = ["read"]
}

# Read SAML configuration
path "secret/data/saml/*" {
  capabilities = ["read"]
}

# ============================================================================
# Monitoring and Observability
# ============================================================================

# Read monitoring service credentials
path "secret/data/monitoring/*" {
  capabilities = ["read"]
}

# Read logging service credentials
path "secret/data/logging/*" {
  capabilities = ["read"]
}

# ============================================================================
# Token Management
# ============================================================================

# Renew own token
path "auth/token/renew-self" {
  capabilities = ["update"]
}

# Lookup own token
path "auth/token/lookup-self" {
  capabilities = ["read"]
}

# Revoke own token (for logout)
path "auth/token/revoke-self" {
  capabilities = ["update"]
}

# ============================================================================
# Lease Management
# ============================================================================

# Renew leases
path "sys/leases/renew" {
  capabilities = ["update"]
}

# Revoke leases
path "sys/leases/revoke" {
  capabilities = ["update"]
}

# Lookup leases
path "sys/leases/lookup" {
  capabilities = ["update"]
}
