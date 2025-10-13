# Policy for TLS certificates access
# Allows read access to TLS certificates and private keys
#
# Usage:
#   vault policy write tls-certificates tls-certificates.hcl
#
# Created: 2025-10-13

# Read TLS certificates
path "secret/data/tls-certificates/*" {
  capabilities = ["read"]
}

# List TLS certificates
path "secret/metadata/tls-certificates/*" {
  capabilities = ["list"]
}

# Read domain-specific certificates
path "secret/data/tls-certificates/*/certificate" {
  capabilities = ["read"]
}

path "secret/data/tls-certificates/*/private_key" {
  capabilities = ["read"]
}

path "secret/data/tls-certificates/*/ca_chain" {
  capabilities = ["read"]
}

# Generate certificates via PKI engine (if enabled)
path "pki/issue/*" {
  capabilities = ["create", "update"]
}

path "pki/sign/*" {
  capabilities = ["create", "update"]
}

path "pki/sign-verbatim/*" {
  capabilities = ["create", "update"]
}

# Read PKI roles
path "pki/roles/*" {
  capabilities = ["read", "list"]
}

# Read CA certificate and CRL
path "pki/cert/ca" {
  capabilities = ["read"]
}

path "pki/cert/crl" {
  capabilities = ["read"]
}

# Revoke certificates
path "pki/revoke" {
  capabilities = ["update"]
}

# List certificates
path "pki/certs" {
  capabilities = ["list"]
}
