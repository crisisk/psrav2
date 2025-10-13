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
