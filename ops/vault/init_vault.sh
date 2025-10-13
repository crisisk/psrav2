#!/bin/bash
#
# OpenBao/Vault Initialization Script
# Initializes Vault, enables AppRole authentication, and creates policies for PSRA services
#
# Usage: ./init_vault.sh [options]
#   Options:
#     --vault-addr ADDR    Vault address (default: http://127.0.0.1:8200)
#     --init               Initialize and unseal Vault (if not already done)
#     --force              Force re-creation of policies and roles
#
# Created: 2025-10-13
#

set -e

# Default configuration
VAULT_ADDR="${VAULT_ADDR:-http://127.0.0.1:8200}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VAULT_KEYS_FILE="${SCRIPT_DIR}/vault-keys.json"
VAULT_ROOT_TOKEN_FILE="${SCRIPT_DIR}/.vault-root-token"
INIT_VAULT=false
FORCE=false

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --vault-addr)
            VAULT_ADDR="$2"
            shift 2
            ;;
        --init)
            INIT_VAULT=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --vault-addr ADDR    Vault address (default: http://127.0.0.1:8200)"
            echo "  --init               Initialize and unseal Vault"
            echo "  --force              Force re-creation of policies and roles"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

export VAULT_ADDR

echo -e "${GREEN}=== OpenBao/Vault Initialization ===${NC}"
echo "Vault Address: $VAULT_ADDR"
echo ""

# Check if vault is available
if ! command -v vault &> /dev/null; then
    echo -e "${RED}Error: vault command not found${NC}"
    exit 1
fi

# Check Vault status
echo "Checking Vault status..."
if ! vault status &> /dev/null; then
    if [[ "$?" == "2" ]]; then
        echo -e "${YELLOW}Vault is sealed${NC}"
        VAULT_SEALED=true
    else
        echo -e "${RED}Error: Cannot connect to Vault at $VAULT_ADDR${NC}"
        exit 1
    fi
else
    VAULT_SEALED=false
fi

# Initialize Vault if requested and not initialized
if [[ "$INIT_VAULT" == "true" ]]; then
    vault_status=$(vault status -format=json 2>/dev/null || echo "{}")
    initialized=$(echo "$vault_status" | jq -r '.initialized // false')

    if [[ "$initialized" == "false" ]]; then
        echo -e "${YELLOW}Initializing Vault...${NC}"
        vault operator init -key-shares=5 -key-threshold=3 -format=json > "$VAULT_KEYS_FILE"

        echo -e "${GREEN}Vault initialized successfully${NC}"
        echo -e "${YELLOW}IMPORTANT: Unseal keys and root token saved to $VAULT_KEYS_FILE${NC}"
        echo -e "${YELLOW}Keep this file secure and back it up!${NC}"

        # Extract root token
        jq -r '.root_token' "$VAULT_KEYS_FILE" > "$VAULT_ROOT_TOKEN_FILE"
        chmod 600 "$VAULT_ROOT_TOKEN_FILE"

        # Unseal Vault
        echo "Unsealing Vault..."
        for i in 0 1 2; do
            unseal_key=$(jq -r ".unseal_keys_b64[$i]" "$VAULT_KEYS_FILE")
            vault operator unseal "$unseal_key" > /dev/null
        done

        echo -e "${GREEN}Vault unsealed successfully${NC}"
        VAULT_SEALED=false
    else
        echo "Vault is already initialized"
    fi
fi

# Unseal Vault if sealed
if [[ "$VAULT_SEALED" == "true" ]]; then
    if [[ -f "$VAULT_KEYS_FILE" ]]; then
        echo "Unsealing Vault..."
        for i in 0 1 2; do
            unseal_key=$(jq -r ".unseal_keys_b64[$i]" "$VAULT_KEYS_FILE")
            vault operator unseal "$unseal_key" > /dev/null
        done
        echo -e "${GREEN}Vault unsealed successfully${NC}"
    else
        echo -e "${RED}Error: Vault is sealed but no keys file found at $VAULT_KEYS_FILE${NC}"
        echo "Please unseal manually or run with --init to initialize"
        exit 1
    fi
fi

# Login with root token
if [[ -f "$VAULT_ROOT_TOKEN_FILE" ]]; then
    export VAULT_TOKEN=$(cat "$VAULT_ROOT_TOKEN_FILE")
    echo "Logged in with root token"
elif [[ -n "$VAULT_TOKEN" ]]; then
    echo "Using existing VAULT_TOKEN"
else
    echo -e "${YELLOW}No root token found. Please set VAULT_TOKEN environment variable${NC}"
    echo "You can find the root token in $VAULT_KEYS_FILE"
    exit 1
fi

# Enable KV v2 secrets engine at 'secret/' if not already enabled
echo ""
echo "=== Configuring Secrets Engines ==="
if vault secrets list | grep -q "^secret/"; then
    echo "KV v2 secrets engine already enabled at secret/"
else
    echo "Enabling KV v2 secrets engine at secret/"
    vault secrets enable -path=secret kv-v2
fi

# Enable AppRole auth method if not already enabled
echo ""
echo "=== Configuring Authentication Methods ==="
if vault auth list | grep -q "^approle/"; then
    echo "AppRole auth method already enabled"
else
    echo "Enabling AppRole auth method"
    vault auth enable approle
fi

# Create policies
echo ""
echo "=== Creating Policies ==="

# 1. Database credentials policy
echo "Creating database-credentials policy..."
vault policy write database-credentials - <<EOF
# Policy for database credentials access
# Allows read access to database secrets and dynamic credentials

# Read static database credentials
path "secret/data/database/*" {
  capabilities = ["read", "list"]
}

# Read database connection details
path "secret/data/database/connections/*" {
  capabilities = ["read"]
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
EOF

# 2. API keys policy
echo "Creating api-keys policy..."
vault policy write api-keys - <<EOF
# Policy for API keys access
# Allows read access to third-party API keys

# Read API keys
path "secret/data/api-keys/*" {
  capabilities = ["read"]
}

# List API keys
path "secret/metadata/api-keys/*" {
  capabilities = ["list"]
}
EOF

# 3. Encryption keys policy
echo "Creating encryption-keys policy..."
vault policy write encryption-keys - <<EOF
# Policy for encryption keys access
# Allows read access to encryption keys for data protection

# Read encryption keys
path "secret/data/encryption-keys/*" {
  capabilities = ["read"]
}

# List encryption keys
path "secret/metadata/encryption-keys/*" {
  capabilities = ["list"]
}

# Use transit encryption engine
path "transit/encrypt/*" {
  capabilities = ["update"]
}

path "transit/decrypt/*" {
  capabilities = ["update"]
}

path "transit/keys/*" {
  capabilities = ["read", "list"]
}
EOF

# 4. TLS certificates policy
echo "Creating tls-certificates policy..."
vault policy write tls-certificates - <<EOF
# Policy for TLS certificates access
# Allows read access to TLS certificates and private keys

# Read TLS certificates
path "secret/data/tls-certificates/*" {
  capabilities = ["read"]
}

# List TLS certificates
path "secret/metadata/tls-certificates/*" {
  capabilities = ["list"]
}

# Generate certificates via PKI engine
path "pki/issue/*" {
  capabilities = ["create", "update"]
}

path "pki/sign/*" {
  capabilities = ["create", "update"]
}
EOF

# 5. PSRA application policy (combines all above)
echo "Creating psra-app policy..."
vault policy write psra-app - <<EOF
# Comprehensive policy for PSRA application
# Combines access to all necessary secrets

# Database access
path "secret/data/database/*" {
  capabilities = ["read", "list"]
}

path "database/creds/*" {
  capabilities = ["read"]
}

# API keys access
path "secret/data/api-keys/*" {
  capabilities = ["read", "list"]
}

# Encryption keys access
path "secret/data/encryption-keys/*" {
  capabilities = ["read", "list"]
}

# Transit encryption
path "transit/encrypt/*" {
  capabilities = ["update"]
}

path "transit/decrypt/*" {
  capabilities = ["update"]
}

# TLS certificates access
path "secret/data/tls-certificates/*" {
  capabilities = ["read", "list"]
}

# Application configuration
path "secret/data/config/psra/*" {
  capabilities = ["read", "list"]
}

# JWT signing keys
path "secret/data/jwt-keys/*" {
  capabilities = ["read"]
}

# Token management
path "auth/token/renew-self" {
  capabilities = ["update"]
}

path "auth/token/lookup-self" {
  capabilities = ["read"]
}
EOF

# 6. Admin policy for secret rotation
echo "Creating secrets-admin policy..."
vault policy write secrets-admin - <<EOF
# Policy for secrets administration and rotation
# Allows full CRUD operations on secrets

# Full access to all secrets
path "secret/data/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "secret/metadata/*" {
  capabilities = ["read", "list", "delete"]
}

# Manage database connections
path "database/config/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "database/roles/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# Rotate database root credentials
path "database/rotate-root/*" {
  capabilities = ["update"]
}

# Manage transit keys
path "transit/keys/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "transit/rotate/*" {
  capabilities = ["update"]
}
EOF

echo -e "${GREEN}All policies created successfully${NC}"

# Create AppRole roles
echo ""
echo "=== Creating AppRole Roles ==="

# 1. PSRA application role
echo "Creating psra-app AppRole..."
vault write auth/approle/role/psra-app \
    token_ttl=1h \
    token_max_ttl=24h \
    token_policies="psra-app" \
    bind_secret_id=true \
    secret_id_ttl=0 \
    secret_id_num_uses=0

# 2. Database access role
echo "Creating database-access AppRole..."
vault write auth/approle/role/database-access \
    token_ttl=30m \
    token_max_ttl=2h \
    token_policies="database-credentials" \
    bind_secret_id=true

# 3. Secrets admin role
echo "Creating secrets-admin AppRole..."
vault write auth/approle/role/secrets-admin \
    token_ttl=15m \
    token_max_ttl=1h \
    token_policies="secrets-admin" \
    bind_secret_id=true

echo -e "${GREEN}All AppRole roles created successfully${NC}"

# Generate credentials for PSRA app
echo ""
echo "=== Generating PSRA App Credentials ==="

ROLE_ID=$(vault read -field=role_id auth/approle/role/psra-app/role-id)
SECRET_ID=$(vault write -field=secret_id -f auth/approle/role/psra-app/secret-id)

CREDS_FILE="${SCRIPT_DIR}/psra-app-credentials.env"
cat > "$CREDS_FILE" <<EOF
# PSRA Application Vault Credentials
# Generated: $(date)
# DO NOT COMMIT THIS FILE TO VERSION CONTROL

VAULT_ADDR=$VAULT_ADDR
VAULT_ROLE_ID=$ROLE_ID
VAULT_SECRET_ID=$SECRET_ID
EOF

chmod 600 "$CREDS_FILE"

echo -e "${GREEN}PSRA app credentials saved to: $CREDS_FILE${NC}"
echo ""
echo "Add these to your .env file or environment variables:"
echo "  VAULT_ADDR=$VAULT_ADDR"
echo "  VAULT_ROLE_ID=$ROLE_ID"
echo "  VAULT_SECRET_ID=$SECRET_ID"

# Create sample secrets structure
echo ""
echo "=== Creating Sample Secrets Structure ==="

# Sample database connection
vault kv put secret/database/psra-primary \
    host="localhost" \
    port="5432" \
    database="psra" \
    ssl_mode="require" \
    max_connections="20" \
    description="Primary PSRA database connection"

# Sample API key
vault kv put secret/api-keys/openai \
    key="sk-sample-key-replace-with-real-key" \
    description="OpenAI API key for LLM features"

# Sample encryption key (32 bytes hex for AES-256)
vault kv put secret/encryption-keys/default \
    key="$(openssl rand -hex 32)" \
    algorithm="AES-256-GCM" \
    description="Default encryption key for sensitive data"

# Sample JWT signing key
vault kv put secret/jwt-keys/signing \
    private_key="$(openssl genrsa 2048 2>/dev/null | base64 -w 0)" \
    algorithm="RS256" \
    description="JWT signing key"

# Sample application config
vault kv put secret/config/psra/app \
    environment="development" \
    debug="true" \
    log_level="INFO"

echo -e "${GREEN}Sample secrets created${NC}"

# Summary
echo ""
echo -e "${GREEN}=== Vault Initialization Complete ===${NC}"
echo ""
echo "Summary:"
echo "  - Vault Address: $VAULT_ADDR"
echo "  - Policies Created: 6"
echo "  - AppRole Roles Created: 3"
echo "  - Sample Secrets Created: Yes"
echo ""
echo "Next Steps:"
echo "  1. Source the credentials file:"
echo "     source $CREDS_FILE"
echo "  2. Update your application .env file with VAULT_* variables"
echo "  3. Replace sample secrets with real values"
echo "  4. Test the connection using the vault_client.py"
echo ""
echo "Security Notes:"
echo "  - Keep $VAULT_KEYS_FILE secure and backed up"
echo "  - Rotate secrets regularly"
echo "  - Monitor Vault audit logs"
echo "  - Use dynamic secrets where possible"
echo ""
echo -e "${YELLOW}WARNING: This script uses the root token for setup.${NC}"
echo -e "${YELLOW}For production, use a more restrictive token and revoke root token.${NC}"
