# WPCS policy
# Geeft toegang tot WPCS-specifieke secrets en functionaliteit

# KV v2 secrets voor WPCS
path "kv/data/wpcs/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "kv/metadata/wpcs/*" {
  capabilities = ["list", "read"]
}

# Transit encryptie/decryptie voor WPCS
path "transit/encrypt/wpcs" {
  capabilities = ["update"]
}

path "transit/decrypt/wpcs" {
  capabilities = ["update"]
}

# Database dynamische credentials voor WPCS
path "database/creds/wpcs" {
  capabilities = ["read"]
}

# PKI certificaten voor WPCS
path "pki/issue/sevensa-dot-nl" {
  capabilities = ["update"]
}

# Lease management voor WPCS
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
