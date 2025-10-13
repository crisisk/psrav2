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
