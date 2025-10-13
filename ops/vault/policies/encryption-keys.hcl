# Policy for encryption keys access
# Allows read access to encryption keys for data protection
#
# Usage:
#   vault policy write encryption-keys encryption-keys.hcl
#
# Created: 2025-10-13

# Read encryption keys
path "secret/data/encryption-keys/*" {
  capabilities = ["read"]
}

# List encryption keys
path "secret/metadata/encryption-keys/*" {
  capabilities = ["list"]
}

# Read specific purpose keys
path "secret/data/encryption-keys/default" {
  capabilities = ["read"]
}

path "secret/data/encryption-keys/database" {
  capabilities = ["read"]
}

path "secret/data/encryption-keys/file" {
  capabilities = ["read"]
}

path "secret/data/encryption-keys/backup" {
  capabilities = ["read"]
}

# Use transit encryption engine (if enabled)
# Transit provides encryption-as-a-service
path "transit/encrypt/*" {
  capabilities = ["update"]
}

path "transit/decrypt/*" {
  capabilities = ["update"]
}

path "transit/rewrap/*" {
  capabilities = ["update"]
}

path "transit/datakey/plaintext/*" {
  capabilities = ["update"]
}

path "transit/datakey/wrapped/*" {
  capabilities = ["update"]
}

path "transit/keys/*" {
  capabilities = ["read", "list"]
}

# HMAC operations
path "transit/hmac/*" {
  capabilities = ["update"]
}

# Sign and verify operations
path "transit/sign/*" {
  capabilities = ["update"]
}

path "transit/verify/*" {
  capabilities = ["update"]
}
