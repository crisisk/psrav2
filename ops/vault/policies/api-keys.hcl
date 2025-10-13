# Policy for API keys access
# Allows read access to third-party API keys
#
# Usage:
#   vault policy write api-keys api-keys.hcl
#
# Created: 2025-10-13

# Read API keys
path "secret/data/api-keys/*" {
  capabilities = ["read"]
}

# List API keys
path "secret/metadata/api-keys/*" {
  capabilities = ["list"]
}

# Read specific service API keys
path "secret/data/api-keys/openai" {
  capabilities = ["read"]
}

path "secret/data/api-keys/stripe" {
  capabilities = ["read"]
}

path "secret/data/api-keys/sendgrid" {
  capabilities = ["read"]
}

path "secret/data/api-keys/twilio" {
  capabilities = ["read"]
}

path "secret/data/api-keys/slack" {
  capabilities = ["read"]
}

# Read webhook secrets
path "secret/data/api-keys/webhooks/*" {
  capabilities = ["read"]
}

# Read OAuth credentials
path "secret/data/api-keys/oauth/*" {
  capabilities = ["read"]
}
