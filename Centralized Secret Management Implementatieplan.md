# Centralized Secret Management Implementatieplan

## Overzicht

Dit document beschrijft de implementatie van een gecentraliseerd secret management systeem voor de multi-tenant Docker-omgeving op VPS 147.93.57.40. Het doel is om de beveiliging te verbeteren door secrets (wachtwoorden, API keys, certificaten) veilig op te slaan en te beheren, in plaats van deze als environment variables in Docker Compose bestanden te plaatsen.

## Huidige Situatie

De huidige architectuur heeft de volgende beperkingen op het gebied van secret management:

1. Secrets worden opgeslagen als environment variables in Docker Compose bestanden of .env bestanden
2. Geen centrale plaats voor het beheren van secrets
3. Geen automatische rotatie van secrets
4. Geen audit trail voor secret access
5. Geen fine-grained access control voor secrets

## Implementatiestrategie

We implementeren HashiCorp Vault als gecentraliseerde secret management oplossing met de volgende componenten:

1. **Vault Server**: Centrale opslag voor alle secrets
2. **Vault Agent**: Client-side agent voor het ophalen van secrets
3. **Vault Transit Engine**: Voor encryptie/decryptie van gevoelige data
4. **Vault PKI Engine**: Voor het beheren van certificaten
5. **Vault Database Secrets Engine**: Voor dynamische database credentials

## Implementatiefasen

### Fase 1: Vault Server Setup (Week 1-2)

1. Implementeer Vault server in Docker
2. Configureer storage backend (file storage met encryptie)
3. Configureer auto-unseal met AWS KMS of GCP KMS
4. Configureer high availability (HA) setup

### Fase 2: Secret Engines Configuratie (Week 3-4)

1. Configureer KV v2 secret engine voor statische secrets
2. Configureer Transit engine voor encryptie/decryptie
3. Configureer PKI engine voor certificaatbeheer
4. Configureer Database secrets engine voor dynamische database credentials

### Fase 3: Service Integratie (Week 5-8)

1. Integreer RentGuy met Vault
2. Integreer PSRA-LTSD met Vault
3. Integreer WPCS met Vault
4. Integreer AI/Orchestration services met Vault

### Fase 4: Automatisering en Monitoring (Week 9-12)

1. Implementeer secret rotatie policies
2. Configureer audit logging
3. Implementeer monitoring en alerting
4. Documenteer disaster recovery procedures

## Technische Specificaties

### Vault Server Configuratie

```yaml
version: '3.8'

services:
  vault:
    image: hashicorp/vault:1.13.3
    container_name: vault
    ports:
      - "8200:8200"
    environment:
      - VAULT_ADDR=https://0.0.0.0:8200
      - VAULT_API_ADDR=https://vault.sevensa.nl:8200
      - VAULT_LOCAL_CONFIG={"storage":{"file":{"path":"/vault/data"}},"listener":{"tcp":{"address":"0.0.0.0:8200","tls_disable":0,"tls_cert_file":"/vault/config/cert.pem","tls_key_file":"/vault/config/key.pem"}},"ui":true,"default_lease_ttl":"168h","max_lease_ttl":"720h"}
    cap_add:
      - IPC_LOCK
    volumes:
      - vault-data:/vault/data
      - vault-config:/vault/config
      - vault-logs:/vault/logs
      - ./vault/certs:/vault/certs
    networks:
      - traefik-net
      - vault-net
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.vault.rule=Host(`vault.sevensa.nl`)"
      - "traefik.http.routers.vault.entrypoints=websecure"
      - "traefik.http.routers.vault.tls=true"
      - "traefik.http.routers.vault.tls.certresolver=letsencrypt"
      - "traefik.http.services.vault.loadbalancer.server.port=8200"
      # OIDC authenticatie middleware
      - "traefik.http.routers.vault.middlewares=vault-auth"
      - "traefik.http.middlewares.vault-auth.forwardauth.address=http://traefik-forward-auth:4181"
      - "traefik.http.middlewares.vault-auth.forwardauth.authResponseHeaders=X-Forwarded-User,X-Forwarded-Email,X-Forwarded-Preferred-Username"
      - "traefik.http.middlewares.vault-auth.forwardauth.trustForwardHeader=true"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "vault", "status"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

networks:
  traefik-net:
    external: true
  vault-net:
    name: vault-net
    driver: bridge
    internal: true
    ipam:
      driver: default
      config:
        - subnet: 172.20.11.0/24

volumes:
  vault-data:
    name: vault-data
  vault-config:
    name: vault-config
  vault-logs:
    name: vault-logs
```

### Vault Initialisatie Script

```bash
#!/bin/bash

# Script om Vault te initialiseren en te configureren

set -e

# Wacht tot Vault beschikbaar is
echo "Waiting for Vault to start..."
until vault status > /dev/null 2>&1; do
  sleep 1
done

# Initialiseer Vault als het nog niet is geïnitialiseerd
if vault status | grep -q "Initialized.*false"; then
  echo "Initializing Vault..."
  vault operator init -key-shares=5 -key-threshold=3 > /vault/config/init.txt
  
  # Bewaar de root token en unseal keys veilig
  echo "Root token and unseal keys saved to /vault/config/init.txt"
  echo "IMPORTANT: Make sure to securely store these keys!"
fi

# Unseal Vault
if vault status | grep -q "Sealed.*true"; then
  echo "Unsealing Vault..."
  
  # Haal de unseal keys op uit het init bestand
  UNSEAL_KEYS=$(grep "Unseal Key" /vault/config/init.txt | awk '{print $4}')
  
  # Gebruik de eerste 3 keys om Vault te unsealen
  echo "$UNSEAL_KEYS" | head -n 3 | while read key; do
    vault operator unseal "$key"
  done
fi

# Login met root token
ROOT_TOKEN=$(grep "Root Token" /vault/config/init.txt | awk '{print $4}')
vault login "$ROOT_TOKEN"

# Configureer auth methods
echo "Configuring auth methods..."
vault auth enable approle
vault auth enable userpass
vault auth enable kubernetes

# Configureer secret engines
echo "Configuring secret engines..."
vault secrets enable -version=2 kv
vault secrets enable transit
vault secrets enable pki
vault secrets enable database

# Configureer policies
echo "Configuring policies..."
vault policy write admin /vault/config/policies/admin.hcl
vault policy write rentguy /vault/config/policies/rentguy.hcl
vault policy write psra /vault/config/policies/psra.hcl
vault policy write wpcs /vault/config/policies/wpcs.hcl
vault policy write ai-orchestrator /vault/config/policies/ai-orchestrator.hcl

# Configureer AppRoles
echo "Configuring AppRoles..."
vault write auth/approle/role/rentguy policies=rentguy
vault write auth/approle/role/psra policies=psra
vault write auth/approle/role/wpcs policies=wpcs
vault write auth/approle/role/ai-orchestrator policies=ai-orchestrator

# Genereer AppRole credentials
echo "Generating AppRole credentials..."
vault read -format=json auth/approle/role/rentguy/role-id > /vault/config/credentials/rentguy-role-id.json
vault write -format=json -f auth/approle/role/rentguy/secret-id > /vault/config/credentials/rentguy-secret-id.json

vault read -format=json auth/approle/role/psra/role-id > /vault/config/credentials/psra-role-id.json
vault write -format=json -f auth/approle/role/psra/secret-id > /vault/config/credentials/psra-secret-id.json

vault read -format=json auth/approle/role/wpcs/role-id > /vault/config/credentials/wpcs-role-id.json
vault write -format=json -f auth/approle/role/wpcs/secret-id > /vault/config/credentials/wpcs-secret-id.json

vault read -format=json auth/approle/role/ai-orchestrator/role-id > /vault/config/credentials/ai-orchestrator-role-id.json
vault write -format=json -f auth/approle/role/ai-orchestrator/secret-id > /vault/config/credentials/ai-orchestrator-secret-id.json

echo "Vault initialization and configuration completed successfully!"
```

### Vault Policy voor RentGuy

```hcl
# RentGuy policy
path "kv/data/rentguy/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "kv/metadata/rentguy/*" {
  capabilities = ["list", "read"]
}

path "transit/encrypt/rentguy" {
  capabilities = ["update"]
}

path "transit/decrypt/rentguy" {
  capabilities = ["update"]
}

path "database/creds/rentguy" {
  capabilities = ["read"]
}
```

### Service Integratie met Vault (Docker Compose voorbeeld)

```yaml
version: '3.8'

services:
  rentguy-api:
    image: ${DOCKER_REGISTRY}/rentguy-api:latest
    container_name: rentguy-api
    environment:
      - NODE_ENV=production
      - PORT=3000
      - VAULT_ADDR=https://vault.sevensa.nl:8200
      - VAULT_ROLE_ID=${VAULT_RENTGUY_ROLE_ID}
      - VAULT_SECRET_ID=${VAULT_RENTGUY_SECRET_ID}
      - VAULT_PATH=kv/data/rentguy
    volumes:
      - rentguy-uploads:/app/uploads
    networks:
      - rentguy-net
      - rentguy-db-net
      - vault-net
    # ... rest van de configuratie
```

## Risico's en Mitigatie

| Risico | Impact | Waarschijnlijkheid | Mitigatie |
|--------|--------|-------------------|-----------|
| Verlies van unseal keys | Kritiek | Laag | Veilige opslag van keys, Shamir's Secret Sharing |
| Vault server onbeschikbaar | Hoog | Laag | HA setup, disaster recovery procedures |
| Incorrecte permissies | Medium | Medium | Regelmatige audit van policies |
| Credential leakage | Hoog | Laag | Korte TTLs, automatische rotatie |

## Succesfactoren

- Alle secrets worden opgeslagen in Vault in plaats van in Docker Compose bestanden
- Dynamische database credentials worden gebruikt waar mogelijk
- Alle secret access wordt gelogd en geaudit
- Automatische rotatie van secrets is geconfigureerd

## Volgende Stappen

1. Implementeer Vault server
2. Configureer secret engines
3. Creëer policies voor verschillende services
4. Integreer services met Vault
5. Implementeer automatische rotatie van secrets
