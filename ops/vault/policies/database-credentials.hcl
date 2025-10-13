# Policy for database credentials access
# Allows read access to database secrets and dynamic credentials
#
# Usage:
#   vault policy write database-credentials database-credentials.hcl
#
# Created: 2025-10-13

# Read static database credentials
path "secret/data/database/*" {
  capabilities = ["read", "list"]
}

# Read database connection details
path "secret/data/database/connections/*" {
  capabilities = ["read"]
}

# List database secrets
path "secret/metadata/database/*" {
  capabilities = ["list"]
}

# Generate dynamic database credentials
path "database/creds/*" {
  capabilities = ["read"]
}

# List database roles
path "database/roles" {
  capabilities = ["list"]
}

# Read database configuration
path "database/config/*" {
  capabilities = ["read"]
}

# Read specific database role configurations
path "database/static-roles/*" {
  capabilities = ["read"]
}

# Renew database leases
path "sys/leases/renew" {
  capabilities = ["update"]
}

# Revoke database leases (for cleanup)
path "sys/leases/revoke" {
  capabilities = ["update"]
}
