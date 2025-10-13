# RentGuy policy
# Geeft toegang tot RentGuy-specifieke secrets en functionaliteit

# KV v2 secrets voor RentGuy
path "kv/data/rentguy/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "kv/metadata/rentguy/*" {
  capabilities = ["list", "read"]
}

# Transit encryptie/decryptie voor RentGuy
path "transit/encrypt/rentguy" {
  capabilities = ["update"]
}

path "transit/decrypt/rentguy" {
  capabilities = ["update"]
}

# Database dynamische credentials voor RentGuy
path "database/creds/rentguy" {
  capabilities = ["read"]
}

# PKI certificaten voor RentGuy
path "pki/issue/sevensa-dot-nl" {
  capabilities = ["update"]
}

# Lease management voor RentGuy
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
