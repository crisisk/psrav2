#!/bin/bash

# Script om Vault te initialiseren en te configureren
# Dit script wordt uitgevoerd door de vault-configurator container

set -e

# Controleer of Vault al is geïnitialiseerd
INITIALIZED=$(wget --no-check-certificate -q -O - https://vault:8200/v1/sys/health | grep -o '"initialized":[^,}]*' | grep -o '[^:]*$')

if [ "$INITIALIZED" = "false" ]; then
  echo "Initializing Vault..."
  
  # Initialiseer Vault met 5 key shares en een threshold van 3
  vault operator init -key-shares=5 -key-threshold=3 > /vault/config/init.txt
  
  echo "Vault initialized. Root token and unseal keys saved to /vault/config/init.txt"
  echo "IMPORTANT: Make sure to securely store these keys!"
else
  echo "Vault is already initialized."
fi

# Controleer of Vault is sealed
SEALED=$(wget --no-check-certificate -q -O - https://vault:8200/v1/sys/health | grep -o '"sealed":[^,}]*' | grep -o '[^:]*$')

if [ "$SEALED" = "true" ]; then
  echo "Unsealing Vault..."
  
  # Haal de unseal keys op uit het init bestand
  if [ -f /vault/config/init.txt ]; then
    UNSEAL_KEYS=$(grep "Unseal Key" /vault/config/init.txt | awk '{print $4}')
    
    # Gebruik de eerste 3 keys om Vault te unsealen
    echo "$UNSEAL_KEYS" | head -n 3 | while read key; do
      vault operator unseal "$key"
    done
  else
    echo "Error: Cannot find unseal keys in /vault/config/init.txt"
    exit 1
  fi
else
  echo "Vault is already unsealed."
fi

# Login met root token
if [ -f /vault/config/init.txt ]; then
  ROOT_TOKEN=$(grep "Root Token" /vault/config/init.txt | awk '{print $4}')
  vault login "$ROOT_TOKEN"
else
  echo "Error: Cannot find root token in /vault/config/init.txt"
  exit 1
fi

# Configureer auth methods
echo "Configuring auth methods..."
vault auth enable approle || echo "AppRole auth method already enabled"
vault auth enable userpass || echo "Userpass auth method already enabled"

# Configureer OIDC auth method voor Keycloak integratie
vault auth enable oidc || echo "OIDC auth method already enabled"
vault write auth/oidc/config \
  oidc_discovery_url="https://auth.sevensa.nl/auth/realms/sevensa" \
  oidc_client_id="vault" \
  oidc_client_secret="${VAULT_OIDC_CLIENT_SECRET}" \
  default_role="admin"

vault write auth/oidc/role/admin \
  bound_audiences="vault" \
  allowed_redirect_uris="https://vault.sevensa.nl/ui/vault/auth/oidc/oidc/callback" \
  allowed_redirect_uris="http://localhost:8250/oidc/callback" \
  user_claim="sub" \
  policies="admin" \
  ttl="1h"

# Configureer secret engines
echo "Configuring secret engines..."
vault secrets enable -version=2 kv || echo "KV v2 secret engine already enabled"
vault secrets enable transit || echo "Transit secret engine already enabled"
vault secrets enable pki || echo "PKI secret engine already enabled"
vault secrets enable database || echo "Database secret engine already enabled"

# Configureer policies
echo "Configuring policies..."
vault policy write admin /vault/policies/admin.hcl
vault policy write rentguy /vault/policies/rentguy.hcl
vault policy write psra /vault/policies/psra.hcl
vault policy write wpcs /vault/policies/wpcs.hcl
vault policy write ai-orchestrator /vault/policies/ai-orchestrator.hcl

# Configureer AppRoles
echo "Configuring AppRoles..."
vault write auth/approle/role/rentguy \
  token_policies="rentguy" \
  token_ttl=1h \
  token_max_ttl=24h

vault write auth/approle/role/psra \
  token_policies="psra" \
  token_ttl=1h \
  token_max_ttl=24h

vault write auth/approle/role/wpcs \
  token_policies="wpcs" \
  token_ttl=1h \
  token_max_ttl=24h

vault write auth/approle/role/ai-orchestrator \
  token_policies="ai-orchestrator" \
  token_ttl=1h \
  token_max_ttl=24h

# Genereer AppRole credentials
echo "Generating AppRole credentials..."
mkdir -p /vault/config/credentials

vault read -format=json auth/approle/role/rentguy/role-id > /vault/config/credentials/rentguy-role-id.json
vault write -format=json -f auth/approle/role/rentguy/secret-id > /vault/config/credentials/rentguy-secret-id.json

vault read -format=json auth/approle/role/psra/role-id > /vault/config/credentials/psra-role-id.json
vault write -format=json -f auth/approle/role/psra/secret-id > /vault/config/credentials/psra-secret-id.json

vault read -format=json auth/approle/role/wpcs/role-id > /vault/config/credentials/wpcs-role-id.json
vault write -format=json -f auth/approle/role/wpcs/secret-id > /vault/config/credentials/wpcs-secret-id.json

vault read -format=json auth/approle/role/ai-orchestrator/role-id > /vault/config/credentials/ai-orchestrator-role-id.json
vault write -format=json -f auth/approle/role/ai-orchestrator/secret-id > /vault/config/credentials/ai-orchestrator-secret-id.json

# Configureer Transit engine voor encryptie
echo "Configuring Transit engine..."
vault write -f transit/keys/rentguy
vault write -f transit/keys/psra
vault write -f transit/keys/wpcs
vault write -f transit/keys/ai-orchestrator

# Configureer PKI engine voor certificaten
echo "Configuring PKI engine..."
vault secrets tune -max-lease-ttl=87600h pki
vault write pki/root/generate/internal \
  common_name="Sevensa Internal CA" \
  ttl=87600h

vault write pki/config/urls \
  issuing_certificates="https://vault.sevensa.nl:8200/v1/pki/ca" \
  crl_distribution_points="https://vault.sevensa.nl:8200/v1/pki/crl"

vault write pki/roles/sevensa-dot-nl \
  allowed_domains="sevensa.nl" \
  allow_subdomains=true \
  max_ttl=72h

# Configureer Database engine voor dynamische credentials
echo "Configuring Database engine..."
# PostgreSQL voor RentGuy
vault write database/config/rentguy-db \
  plugin_name=postgresql-database-plugin \
  allowed_roles="rentguy" \
  connection_url="postgresql://{{username}}:{{password}}@rentguy-db:5432/rentguy?sslmode=disable" \
  username="vault" \
  password="${VAULT_DB_ADMIN_PASSWORD}"

vault write database/roles/rentguy \
  db_name=rentguy-db \
  creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; \
                      GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO \"{{name}}\";" \
  default_ttl="1h" \
  max_ttl="24h"

# PostgreSQL voor PSRA
vault write database/config/psra-db \
  plugin_name=postgresql-database-plugin \
  allowed_roles="psra" \
  connection_url="postgresql://{{username}}:{{password}}@psra-db:5432/psra?sslmode=disable" \
  username="vault" \
  password="${VAULT_DB_ADMIN_PASSWORD}"

vault write database/roles/psra \
  db_name=psra-db \
  creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; \
                      GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO \"{{name}}\";" \
  default_ttl="1h" \
  max_ttl="24h"

# MySQL voor WPCS
vault write database/config/wpcs-db \
  plugin_name=mysql-database-plugin \
  allowed_roles="wpcs" \
  connection_url="{{username}}:{{password}}@tcp(wpcs-db:3306)/" \
  username="vault" \
  password="${VAULT_DB_ADMIN_PASSWORD}"

vault write database/roles/wpcs \
  db_name=wpcs-db \
  creation_statements="CREATE USER '{{name}}'@'%' IDENTIFIED BY '{{password}}'; \
                      GRANT SELECT, INSERT, UPDATE, DELETE ON wpcs.* TO '{{name}}'@'%';" \
  default_ttl="1h" \
  max_ttl="24h"

# Initiële secrets voor services
echo "Creating initial secrets..."

# RentGuy secrets
vault kv put kv/rentguy/config \
  db_host="rentguy-db" \
  db_port="5432" \
  db_name="rentguy" \
  redis_host="rentguy-redis" \
  redis_port="6379" \
  redis_password="${RENTGUY_REDIS_PASSWORD}" \
  jwt_secret="${RENTGUY_JWT_SECRET}" \
  keycloak_client_secret="${RENTGUY_CLIENT_SECRET}"

# PSRA secrets
vault kv put kv/psra/config \
  db_host="psra-db" \
  db_port="5432" \
  db_name="psra" \
  redis_host="psra-redis" \
  redis_port="6379" \
  redis_password="${PSRA_REDIS_PASSWORD}" \
  jwt_secret="${PSRA_JWT_SECRET}" \
  keycloak_client_secret="${PSRA_CLIENT_SECRET}"

# WPCS secrets
vault kv put kv/wpcs/config \
  db_host="wpcs-db" \
  db_port="3306" \
  db_name="wpcs" \
  db_user="wpcs" \
  db_password="${WPCS_DB_PASSWORD}" \
  keycloak_client_secret="${WPCS_CLIENT_SECRET}"

# AI Orchestrator secrets
vault kv put kv/ai-orchestrator/config \
  keycloak_client_secret="${AI_ORCHESTRATOR_CLIENT_SECRET}"

echo "Vault initialization and configuration completed successfully!"
