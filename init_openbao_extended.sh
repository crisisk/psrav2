#!/usr/bin/env bash
# Extended OpenBao bootstrap script
# Created: 2025-10-09
# Last Updated: 2025-10-09

set -euo pipefail
cd {{ project_dir }}
source .env
export VAULT_ADDR="http://127.0.0.1:${BAO_HTTP_PORT:-{{ bao_http_port }}}"

# Initialize and unseal OpenBao (existing code)
if [ ! -f ./openbao/cluster-initialized ]; then
  echo "[+] Initializing OpenBao cluster"
  mkdir -p ./openbao
  docker compose exec -T openbao bao operator init -key-shares=5 -key-threshold=3 -format=json > ./openbao/init.json
  cat ./openbao/init.json | jq -r '.root_token' > ./openbao/root.token
  cat ./openbao/init.json | jq -r '.unseal_keys_b64[0]' > ./openbao/unseal_key_1
  cat ./openbao/init.json | jq -r '.unseal_keys_b64[1]' > ./openbao/unseal_key_2
  cat ./openbao/init.json | jq -r '.unseal_keys_b64[2]' > ./openbao/unseal_key_3
  touch ./openbao/cluster-initialized
  echo "[+] OpenBao initialized"
else
  echo "[+] OpenBao already initialized, unsealing"
  docker compose exec -T openbao bao operator unseal $(cat ./openbao/unseal_key_1)
  docker compose exec -T openbao bao operator unseal $(cat ./openbao/unseal_key_2)
  docker compose exec -T openbao bao operator unseal $(cat ./openbao/unseal_key_3)
  echo "[+] OpenBao unsealed"
fi

ROOT_TOKEN=$(cat ./openbao/root.token)
export VAULT_TOKEN="$ROOT_TOKEN"

# Create namespaces and enable KV v2 secret engine
echo "[+] Creating namespaces and enabling KV v2 secret engine"
for NS in {{ namespaces | list }}; do
  echo "[+] Creating namespace: $NS"
  docker compose exec -T openbao bao namespace create "$NS" || true
  echo "[+] Enabling KV v2 secret engine for namespace: $NS"
  docker compose exec -T openbao sh -lc "export VAULT_TOKEN=$ROOT_TOKEN; bao secrets enable -version=2 -path=kv-${NS} kv" -e VAULT_NAMESPACE="$NS" || true
done

# Enable Transit secret engine for service namespaces
echo "[+] Enabling Transit secret engine for service namespaces"
for NS in rentguy psra wpcs ai; do
  echo "[+] Enabling Transit secret engine for namespace: $NS"
  docker compose exec -T openbao sh -lc "export VAULT_TOKEN=$ROOT_TOKEN; bao secrets enable -path=transit transit" -e VAULT_NAMESPACE="$NS" || true
  echo "[+] Creating encryption key for namespace: $NS"
  docker compose exec -T openbao sh -lc "export VAULT_TOKEN=$ROOT_TOKEN; bao write -f transit/keys/${NS}-key type=aes256-gcm96 derived=true exportable=false allow_plaintext_backup=false" -e VAULT_NAMESPACE="$NS" || true
done

# Enable Database secret engine for service namespaces
echo "[+] Enabling Database secret engine for service namespaces"
for NS in rentguy psra wpcs; do
  echo "[+] Enabling Database secret engine for namespace: $NS"
  docker compose exec -T openbao sh -lc "export VAULT_TOKEN=$ROOT_TOKEN; bao secrets enable -path=database database" -e VAULT_NAMESPACE="$NS" || true
done

# Enable PKI secret engine in root namespace
echo "[+] Enabling PKI secret engine in root namespace"
docker compose exec -T openbao bao secrets enable pki || true
docker compose exec -T openbao bao secrets tune -max-lease-ttl=87600h pki || true

# Generate root CA
echo "[+] Generating root CA"
docker compose exec -T openbao bao write pki/root/generate/internal \
  common_name="Sevensa Internal CA" \
  ttl=87600h || true

# Configure PKI URLs
echo "[+] Configuring PKI URLs"
docker compose exec -T openbao bao write pki/config/urls \
  issuing_certificates="http://127.0.0.1:${BAO_HTTP_PORT}/v1/pki/ca" \
  crl_distribution_points="http://127.0.0.1:${BAO_HTTP_PORT}/v1/pki/crl" || true

# Create role for issuing certificates
echo "[+] Creating role for issuing certificates"
docker compose exec -T openbao bao write pki/roles/sevensa-dot-nl \
  allowed_domains="sevensa.nl" \
  allow_subdomains=true \
  max_ttl=72h || true

# Configure OIDC authentication (existing code)
echo "[+] Configuring OIDC authentication"
: "${KC_REALM:?Missing KC_REALM in .env}"; : "${KC_CLIENT_ID:?Missing KC_CLIENT_ID in .env}"; : "${KC_CLIENT_SECRET:?Missing KC_CLIENT_SECRET in .env}"
KEYCLOAK_URL="http://keycloak:${KEYCLOAK_HTTP_PORT:-{{ kc_http_port }}}"
OIDC="${KEYCLOAK_URL}/realms/${KC_REALM}/.well-known/openid-configuration"
docker compose exec -T openbao bao auth enable oidc || true
docker compose exec -T openbao bao write auth/oidc/config oidc_discovery_url="${OIDC}" oidc_client_id="${KC_CLIENT_ID}" oidc_client_secret="${KC_CLIENT_SECRET}" default_role="default" >/dev/null
docker compose exec -T openbao bao write auth/oidc/role/default user_claim="preferred_username" allowed_redirect_uris="http://127.0.0.1:${BAO_HTTP_PORT:-{{ bao_http_port }}}/ui/*" policies="default" ttl="1h" >/dev/null

# Enable AppRole authentication
echo "[+] Enabling AppRole authentication"
docker compose exec -T openbao bao auth enable approle || true

# Create policies
echo "[+] Creating policies"
for POLICY in admin rentguy psra wpcs ai; do
  echo "[+] Creating policy: ${POLICY}-policy"
  docker compose exec -T openbao bao policy write ${POLICY}-policy /opt/bao/policies/${POLICY}-policy.hcl || true
done

# Create AppRoles for services
echo "[+] Creating AppRoles for services"
for SERVICE in rentguy psra wpcs ai; do
  echo "[+] Creating AppRole for service: $SERVICE"
  docker compose exec -T openbao bao write auth/approle/role/${SERVICE} \
    token_policies="${SERVICE}-policy" \
    token_ttl=1h \
    token_max_ttl=24h || true
done

# Enable audit logging
echo "[+] Enabling audit logging"
docker compose exec -T openbao bao audit enable file file_path=/opt/bao/logs/audit.log || true

echo "[OK] Bootstrap complete. Root token at {{ project_dir }}/openbao/root.token"
