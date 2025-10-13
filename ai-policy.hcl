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

# PKI permissions (if PKI is enabled)
path "pki/issue/sevensa-dot-nl" {
  capabilities = ["update"]
}
