# OpenBao Secrets Engines Design

## Overview

This document outlines the design for configuring OpenBao secrets engines to support multiple services in the Sevensa platform. Secrets engines are components that store, generate, or encrypt data. Different secrets engines handle different types of secrets, and each one is uniquely suited for its specific use case.

## Secrets Engines

The following secrets engines will be configured:

1. **KV v2**: For storing static secrets
2. **Transit**: For encryption and decryption operations
3. **Database**: For dynamic database credentials
4. **PKI**: For certificate management

## KV v2 Secret Engine

The KV v2 secret engine will be used to store static secrets for each service.

### Configuration

The KV v2 secret engine will be enabled for each namespace:

```bash
# Enable KV v2 for each namespace
for NS in sevensa rentguy psra wpcs ai; do
  docker compose exec -T openbao sh -lc "export VAULT_TOKEN=$ROOT_TOKEN; bao secrets enable -version=2 -path=kv-${NS} kv" -e VAULT_NAMESPACE="$NS" || true
done
```

### Secret Structure

The KV v2 secret engine will store secrets with the following structure:

```
kv-sevensa/
├── shared/
│   ├── database/
│   │   ├── postgres/
│   │   │   ├── root-credentials
│   │   │   └── keycloak-credentials
│   │   └── mysql/
│   │       └── root-credentials
│   └── api/
│       └── external-services
kv-rentguy/
├── config/
│   ├── app-config
│   └── feature-flags
├── database/
│   ├── connection-string
│   └── credentials
├── api/
│   ├── keys
│   └── endpoints
└── smtp/
    └── credentials
kv-psra/
├── config/
│   ├── app-config
│   └── feature-flags
├── database/
│   ├── connection-string
│   └── credentials
├── api/
│   ├── keys
│   └── endpoints
└── integration/
    └── external-services
kv-wpcs/
├── config/
│   ├── app-config
│   └── feature-flags
├── database/
│   ├── connection-string
│   └── credentials
└── sites/
    └── credentials
kv-ai/
├── config/
│   ├── app-config
│   └── feature-flags
├── api-keys/
│   ├── openai
│   ├── anthropic
│   └── google
└── integration/
    └── external-services
```

## Transit Secret Engine

The Transit secret engine will be used for encryption and decryption operations.

### Configuration

The Transit secret engine will be enabled for each service namespace:

```bash
# Enable Transit for each service namespace
for NS in rentguy psra wpcs ai; do
  docker compose exec -T openbao sh -lc "export VAULT_TOKEN=$ROOT_TOKEN; bao secrets enable -path=transit transit" -e VAULT_NAMESPACE="$NS" || true
  docker compose exec -T openbao sh -lc "export VAULT_TOKEN=$ROOT_TOKEN; bao write -f transit/keys/${NS}-key" -e VAULT_NAMESPACE="$NS" || true
done
```

### Key Configuration

Each service will have its own encryption key with the following configuration:

```bash
# Configure encryption key for RentGuy
docker compose exec -T openbao sh -lc "export VAULT_TOKEN=$ROOT_TOKEN; bao write transit/keys/rentguy-key \
  type=aes256-gcm96 \
  derived=true \
  exportable=false \
  allow_plaintext_backup=false" -e VAULT_NAMESPACE="rentguy"

# Configure encryption key for PSRA
docker compose exec -T openbao sh -lc "export VAULT_TOKEN=$ROOT_TOKEN; bao write transit/keys/psra-key \
  type=aes256-gcm96 \
  derived=true \
  exportable=false \
  allow_plaintext_backup=false" -e VAULT_NAMESPACE="psra"

# Configure encryption key for WPCS
docker compose exec -T openbao sh -lc "export VAULT_TOKEN=$ROOT_TOKEN; bao write transit/keys/wpcs-key \
  type=aes256-gcm96 \
  derived=true \
  exportable=false \
  allow_plaintext_backup=false" -e VAULT_NAMESPACE="wpcs"

# Configure encryption key for AI
docker compose exec -T openbao sh -lc "export VAULT_TOKEN=$ROOT_TOKEN; bao write transit/keys/ai-key \
  type=aes256-gcm96 \
  derived=true \
  exportable=false \
  allow_plaintext_backup=false" -e VAULT_NAMESPACE="ai"
```

## Database Secret Engine

The Database secret engine will be used to generate dynamic database credentials.

### Configuration

The Database secret engine will be enabled for service namespaces that require database access:

```bash
# Enable Database for service namespaces
for NS in rentguy psra wpcs; do
  docker compose exec -T openbao sh -lc "export VAULT_TOKEN=$ROOT_TOKEN; bao secrets enable -path=database database" -e VAULT_NAMESPACE="$NS" || true
done
```

### Database Configuration

Each service will have its own database configuration:

#### RentGuy Database

```bash
# Configure PostgreSQL connection for RentGuy
docker compose exec -T openbao sh -lc "export VAULT_TOKEN=$ROOT_TOKEN; bao write database/config/rentguy-db \
  plugin_name=postgresql-database-plugin \
  allowed_roles=\"rentguy-role\" \
  connection_url=\"postgresql://{{username}}:{{password}}@rentguy-db:5432/rentguy?sslmode=disable\" \
  username=\"vault\" \
  password=\"${RENTGUY_DB_ADMIN_PASSWORD}\"" -e VAULT_NAMESPACE="rentguy"

# Create role for RentGuy database credentials
docker compose exec -T openbao sh -lc "export VAULT_TOKEN=$ROOT_TOKEN; bao write database/roles/rentguy-role \
  db_name=rentguy-db \
  creation_statements=\"CREATE ROLE \\\"{{name}}\\\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; \
                      GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO \\\"{{name}}\\\";\" \
  default_ttl=\"1h\" \
  max_ttl=\"24h\"" -e VAULT_NAMESPACE="rentguy"
```

#### PSRA Database

```bash
# Configure PostgreSQL connection for PSRA
docker compose exec -T openbao sh -lc "export VAULT_TOKEN=$ROOT_TOKEN; bao write database/config/psra-db \
  plugin_name=postgresql-database-plugin \
  allowed_roles=\"psra-role\" \
  connection_url=\"postgresql://{{username}}:{{password}}@psra-db:5432/psra?sslmode=disable\" \
  username=\"vault\" \
  password=\"${PSRA_DB_ADMIN_PASSWORD}\"" -e VAULT_NAMESPACE="psra"

# Create role for PSRA database credentials
docker compose exec -T openbao sh -lc "export VAULT_TOKEN=$ROOT_TOKEN; bao write database/roles/psra-role \
  db_name=psra-db \
  creation_statements=\"CREATE ROLE \\\"{{name}}\\\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; \
                      GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO \\\"{{name}}\\\";\" \
  default_ttl=\"1h\" \
  max_ttl=\"24h\"" -e VAULT_NAMESPACE="psra"
```

#### WPCS Database

```bash
# Configure MySQL connection for WPCS
docker compose exec -T openbao sh -lc "export VAULT_TOKEN=$ROOT_TOKEN; bao write database/config/wpcs-db \
  plugin_name=mysql-database-plugin \
  allowed_roles=\"wpcs-role\" \
  connection_url=\"{{username}}:{{password}}@tcp(wpcs-db:3306)/\" \
  username=\"vault\" \
  password=\"${WPCS_DB_ADMIN_PASSWORD}\"" -e VAULT_NAMESPACE="wpcs"

# Create role for WPCS database credentials
docker compose exec -T openbao sh -lc "export VAULT_TOKEN=$ROOT_TOKEN; bao write database/roles/wpcs-role \
  db_name=wpcs-db \
  creation_statements=\"CREATE USER '{{name}}'@'%' IDENTIFIED BY '{{password}}'; \
                      GRANT SELECT, INSERT, UPDATE, DELETE ON wpcs.* TO '{{name}}'@'%';\" \
  default_ttl=\"1h\" \
  max_ttl=\"24h\"" -e VAULT_NAMESPACE="wpcs"
```

## PKI Secret Engine

The PKI secret engine will be used to generate certificates for services.

### Configuration

The PKI secret engine will be enabled in the root namespace:

```bash
# Enable PKI
docker compose exec -T openbao bao secrets enable pki

# Configure PKI
docker compose exec -T openbao bao secrets tune -max-lease-ttl=87600h pki

# Generate root CA
docker compose exec -T openbao bao write pki/root/generate/internal \
  common_name="Sevensa Internal CA" \
  ttl=87600h

# Configure PKI URLs
docker compose exec -T openbao bao write pki/config/urls \
  issuing_certificates="http://127.0.0.1:${BAO_HTTP_PORT}/v1/pki/ca" \
  crl_distribution_points="http://127.0.0.1:${BAO_HTTP_PORT}/v1/pki/crl"

# Create role for issuing certificates
docker compose exec -T openbao bao write pki/roles/sevensa-dot-nl \
  allowed_domains="sevensa.nl" \
  allow_subdomains=true \
  max_ttl=72h
```

## Audit Logging

Audit logging will be enabled to track all operations performed on OpenBao.

### Configuration

```bash
# Enable file audit device
docker compose exec -T openbao bao audit enable file file_path=/opt/bao/logs/audit.log
```

## Implementation Approach

The implementation will follow these steps:

1. **Enable Secret Engines**: Enable the required secret engines for each namespace.
2. **Configure Secret Engines**: Configure each secret engine with the appropriate settings.
3. **Create Initial Secrets**: Create initial secrets for each service.
4. **Configure Audit Logging**: Enable and configure audit logging.

## Ansible Role Extension

The Ansible role will be extended to include the following tasks:

1. **Enable Secret Engines**: Tasks to enable the required secret engines.
2. **Configure Secret Engines**: Tasks to configure each secret engine.
3. **Create Initial Secrets**: Tasks to create initial secrets.
4. **Configure Audit Logging**: Tasks to enable and configure audit logging.

```yaml
# roles/openbao_extension/tasks/secrets_engines.yml
- name: Enable and configure Transit engine
  include_tasks: transit.yml

- name: Enable and configure Database engine
  include_tasks: database.yml

- name: Enable and configure PKI engine
  include_tasks: pki.yml

- name: Configure audit logging
  include_tasks: audit.yml
```

## Testing

The secrets engines configuration will be tested using the following methods:

1. **Secret Engine Verification**: Verify that all secret engines are enabled and configured correctly.
2. **Secret Creation and Retrieval**: Test creating and retrieving secrets from each secret engine.
3. **Dynamic Credential Generation**: Test generating dynamic credentials from the Database secret engine.
4. **Certificate Generation**: Test generating certificates from the PKI secret engine.
5. **Encryption and Decryption**: Test encryption and decryption operations using the Transit secret engine.
6. **Audit Log Verification**: Verify that operations are properly logged in the audit log.

## Conclusion

This design provides a comprehensive approach to configuring OpenBao secrets engines for the Sevensa platform. The configuration ensures that each service has access to the appropriate secret engines and that secrets are properly isolated and secured.
