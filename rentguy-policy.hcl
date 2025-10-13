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
