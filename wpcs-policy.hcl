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
