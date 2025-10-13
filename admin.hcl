# Admin policy
# Geeft volledige toegang tot alle paden in Vault

# System endpoints
path "sys/*" {
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}

# Alle auth methods
path "auth/*" {
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}

# Alle secret engines
path "secret/*" {
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}

path "kv/*" {
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}

path "transit/*" {
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}

path "pki/*" {
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}

path "database/*" {
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}

# Identity management
path "identity/*" {
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}

# Policy management
path "sys/policies/*" {
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}

# Audit logs
path "sys/audit*" {
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}

# Leases
path "sys/leases/*" {
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}

# Monitoring
path "sys/metrics" {
  capabilities = ["read"]
}

path "sys/health" {
  capabilities = ["read", "sudo"]
}

# Capabilities
path "sys/capabilities*" {
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}
