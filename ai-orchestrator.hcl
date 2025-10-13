# AI Orchestrator policy
# Geeft toegang tot AI Orchestrator-specifieke secrets en functionaliteit

# KV v2 secrets voor AI Orchestrator
path "kv/data/ai-orchestrator/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "kv/metadata/ai-orchestrator/*" {
  capabilities = ["list", "read"]
}

# Transit encryptie/decryptie voor AI Orchestrator
path "transit/encrypt/ai-orchestrator" {
  capabilities = ["update"]
}

path "transit/decrypt/ai-orchestrator" {
  capabilities = ["update"]
}

# PKI certificaten voor AI Orchestrator
path "pki/issue/sevensa-dot-nl" {
  capabilities = ["update"]
}

# Lease management voor AI Orchestrator
path "sys/leases/lookup" {
  capabilities = ["update"]
}

path "sys/leases/renew" {
  capabilities = ["update"]
}

# Health check
path "sys/health" {
  capabilities = ["read"]
}
