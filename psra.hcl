# PSRA policy
# Geeft toegang tot PSRA-specifieke secrets en functionaliteit

# KV v2 secrets voor PSRA
path "kv/data/psra/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "kv/metadata/psra/*" {
  capabilities = ["list", "read"]
}

# Transit encryptie/decryptie voor PSRA
path "transit/encrypt/psra" {
  capabilities = ["update"]
}

path "transit/decrypt/psra" {
  capabilities = ["update"]
}

# Database dynamische credentials voor PSRA
path "database/creds/psra" {
  capabilities = ["read"]
}

# PKI certificaten voor PSRA
path "pki/issue/sevensa-dot-nl" {
  capabilities = ["update"]
}

# Lease management voor PSRA
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
