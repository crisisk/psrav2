# OpenBao/Vault Integration Documentation

Complete guide for OpenBao/Vault integration with AppRole authentication and secrets management for PSRA LTSD Enterprise.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Setup](#setup)
4. [Secret Paths](#secret-paths)
5. [Access Patterns](#access-patterns)
6. [Policies](#policies)
7. [Secret Rotation](#secret-rotation)
8. [Usage Examples](#usage-examples)
9. [Security Best Practices](#security-best-practices)
10. [Troubleshooting](#troubleshooting)

## Overview

This integration provides secure secrets management for the PSRA LTSD Enterprise application using OpenBao/Vault with AppRole authentication. It supports:

- **AppRole Authentication**: Service-to-service authentication without human intervention
- **KV Secrets Engine**: Versioned key-value secrets storage
- **Dynamic Secrets**: On-demand database credentials
- **Secret Rotation**: Automated and manual secret rotation
- **Connection Pooling**: Efficient connection management
- **Automatic Token Renewal**: Background token renewal before expiration

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     PSRA Application                              │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              vault_client.py                              │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  - AppRole Authentication                          │  │   │
│  │  │  - Secret Read/Write Operations                    │  │   │
│  │  │  - Connection Pooling                              │  │   │
│  │  │  - Automatic Token Renewal                         │  │   │
│  │  │  - Lease Management                                │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          │                                        │
└──────────────────────────┼────────────────────────────────────────┘
                           │
                           │ HTTPS (AppRole Auth)
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                  OpenBao/Vault Server                             │
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │  KV v2 Engine    │  │  Database Engine │  │  Transit Eng. │ │
│  │  (secret/)       │  │  (database/)     │  │  (transit/)   │ │
│  └──────────────────┘  └──────────────────┘  └───────────────┘ │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Policies                               │   │
│  │  - database-credentials  - api-keys                       │   │
│  │  - encryption-keys       - tls-certificates               │   │
│  │  - psra-app              - secrets-admin                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              AppRole Auth Method                          │   │
│  │  - psra-app role     (token_ttl: 1h)                      │   │
│  │  - database-access   (token_ttl: 30m)                     │   │
│  │  - secrets-admin     (token_ttl: 15m)                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Setup

### Prerequisites

- OpenBao/Vault server installed and running
- `vault` CLI tool available
- `jq` for JSON processing
- Python 3.8+ with `hvac` library

### Initial Setup

1. **Run the initialization script:**

```bash
cd /home/vncuser/psra-ltsd-enterprise-v2/ops/vault
./init_vault.sh --init
```

This will:
- Initialize Vault (if not already initialized)
- Unseal Vault
- Enable KV v2 secrets engine
- Enable AppRole authentication
- Create all policies
- Create AppRole roles
- Generate credentials for the PSRA app
- Create sample secrets

2. **Configure environment variables:**

```bash
# Source the generated credentials
source /home/vncuser/psra-ltsd-enterprise-v2/ops/vault/psra-app-credentials.env

# Or add to your .env file:
echo "VAULT_ADDR=http://127.0.0.1:8200" >> .env
echo "VAULT_ROLE_ID=<role-id>" >> .env
echo "VAULT_SECRET_ID=<secret-id>" >> .env
```

3. **Install Python dependencies:**

```bash
pip install hvac tenacity
```

## Secret Paths

### Standard Secret Structure

All secrets are stored in the KV v2 engine at the `secret/` mount point with the following structure:

```
secret/
├── database/
│   ├── psra-primary          # Primary database connection
│   ├── psra-replica          # Read replica connection
│   ├── psra-analytics        # Analytics database
│   └── connections/
│       └── <connection-name>
│
├── api-keys/
│   ├── openai                # OpenAI API key
│   ├── stripe                # Stripe API key
│   ├── sendgrid              # SendGrid API key
│   ├── twilio                # Twilio credentials
│   ├── slack                 # Slack webhooks
│   ├── webhooks/
│   │   └── <service>
│   └── oauth/
│       └── <provider>
│
├── encryption-keys/
│   ├── default               # Default encryption key
│   ├── database              # Database field encryption
│   ├── file                  # File encryption
│   └── backup                # Backup encryption
│
├── tls-certificates/
│   ├── <domain-name>/
│   │   ├── certificate
│   │   ├── private_key
│   │   ├── ca_chain
│   │   └── expiry
│   └── wildcard/
│
├── jwt-keys/
│   ├── signing               # JWT signing key
│   └── verification          # JWT verification key
│
├── session-keys/
│   └── <purpose>
│
├── config/
│   ├── psra/
│   │   ├── app               # Application config
│   │   ├── features          # Feature flags
│   │   └── integrations      # Integration settings
│   └── feature-flags/
│
├── oauth/
│   ├── google
│   ├── github
│   └── microsoft
│
├── saml/
│   └── <identity-provider>
│
├── monitoring/
│   ├── prometheus
│   ├── grafana
│   └── sentry
│
└── logging/
    ├── elasticsearch
    └── splunk
```

### Secret Format Examples

#### Database Connection

```json
{
  "host": "localhost",
  "port": "5432",
  "database": "psra",
  "username": "psra_app",
  "password": "secure_password",
  "ssl_mode": "require",
  "max_connections": "20",
  "min_connections": "5",
  "connection_timeout": "30",
  "description": "Primary PSRA database connection"
}
```

#### API Key

```json
{
  "key": "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "description": "OpenAI API key for LLM features",
  "created_at": "2025-10-13T00:00:00Z",
  "expires_at": "2026-10-13T00:00:00Z",
  "rate_limit": "10000 requests/day"
}
```

#### Encryption Key

```json
{
  "key": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  "algorithm": "AES-256-GCM",
  "key_id": "key-001",
  "created_at": "2025-10-13T00:00:00Z",
  "rotation_period": "90 days",
  "description": "Default encryption key for sensitive data"
}
```

#### TLS Certificate

```json
{
  "certificate": "-----BEGIN CERTIFICATE-----\n...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "ca_chain": "-----BEGIN CERTIFICATE-----\n...",
  "expiry": "2026-10-13T00:00:00Z",
  "domain": "api.example.com",
  "san": ["*.example.com", "example.com"]
}
```

## Access Patterns

### Pattern 1: Application Startup

```python
from backend.services.vault_client import get_vault_client

# Initialize Vault client during app startup
vault = get_vault_client()

# Verify connection
health = vault.health_check()
if not health['authenticated']:
    raise Exception("Failed to authenticate with Vault")

# Pre-load critical secrets
db_config = vault.read_secret("database/psra-primary")
api_keys = {
    'openai': vault.get_api_key('openai'),
    'stripe': vault.get_api_key('stripe')
}
```

### Pattern 2: On-Demand Secret Retrieval

```python
from backend.services.vault_client import read_secret

# Read secrets when needed
def get_database_connection():
    db_config = read_secret("database/psra-primary")
    return connect_to_database(**db_config)

def send_email(to, subject, body):
    sendgrid_key = read_secret("api-keys/sendgrid")['key']
    return sendgrid_client.send(sendgrid_key, to, subject, body)
```

### Pattern 3: Dynamic Database Credentials

```python
from backend.services.vault_client import get_vault_client

# Generate dynamic database credentials
vault = get_vault_client()
db_creds = vault.get_database_credentials(role="psra-app")

# Use credentials
connection = psycopg2.connect(
    host="localhost",
    database="psra",
    user=db_creds['username'],
    password=db_creds['password']
)

# Credentials automatically expire after lease duration
# Vault will clean up the database user
```

### Pattern 4: Secret Rotation

```python
from backend.services.vault_client import rotate_secret
import secrets

# Rotate an API key
new_key = secrets.token_urlsafe(32)
rotate_secret("api-keys/internal-service", {
    "key": new_key,
    "rotated_at": datetime.now().isoformat(),
    "description": "Internal service API key"
})

# Rotate encryption key
new_encryption_key = secrets.token_hex(32)
rotate_secret("encryption-keys/default", {
    "key": new_encryption_key,
    "algorithm": "AES-256-GCM",
    "rotated_at": datetime.now().isoformat()
})
```

### Pattern 5: Context Manager for Transient Operations

```python
from backend.services.vault_client import VaultClient

# Use context manager for specific operations
with VaultClient() as vault:
    # Perform operations
    secrets = vault.list_secrets("api-keys")
    for secret_name in secrets:
        key_data = vault.read_secret(f"api-keys/{secret_name}")
        # Process key data
# Client automatically closed
```

## Policies

### Policy Assignment

| Role | Policy | Token TTL | Use Case |
|------|--------|-----------|----------|
| psra-app | psra-app | 1h | Main application access |
| database-access | database-credentials | 30m | Database credential services |
| secrets-admin | secrets-admin | 15m | Secret rotation and management |

### Policy Capabilities

#### Read-Only Policies
- `database-credentials`: Read database secrets
- `api-keys`: Read third-party API keys
- `encryption-keys`: Read encryption keys and use transit engine
- `tls-certificates`: Read TLS certificates

#### Comprehensive Policy
- `psra-app`: Combines all read-only policies plus config access

#### Administrative Policy
- `secrets-admin`: Full CRUD on secrets, rotation, AppRole management

### Applying Policies

```bash
# Apply a policy
vault policy write psra-app policies/psra-app.hcl

# View a policy
vault policy read psra-app

# List all policies
vault policy list

# Attach policy to AppRole
vault write auth/approle/role/psra-app \
    token_policies="psra-app"
```

## Secret Rotation

### Automated Rotation

Implement automated rotation using a scheduled job:

```python
# rotation_service.py
from backend.services.vault_client import get_vault_client
import schedule
import time

def rotate_encryption_keys():
    """Rotate encryption keys every 90 days"""
    vault = get_vault_client()

    # Read current key
    current = vault.read_secret("encryption-keys/default")

    # Generate new key
    new_key = secrets.token_hex(32)

    # Write new version
    vault.rotate_secret("encryption-keys/default", {
        "key": new_key,
        "algorithm": "AES-256-GCM",
        "rotated_at": datetime.now().isoformat(),
        "previous_key_id": current.get("key_id")
    })

    logger.info("Encryption key rotated successfully")

# Schedule rotation every 90 days
schedule.every(90).days.do(rotate_encryption_keys)

while True:
    schedule.run_pending()
    time.sleep(3600)  # Check every hour
```

### Manual Rotation

```bash
# Generate new encryption key
NEW_KEY=$(openssl rand -hex 32)

# Rotate using vault CLI
vault kv put secret/encryption-keys/default \
    key="$NEW_KEY" \
    algorithm="AES-256-GCM" \
    rotated_at="$(date -Iseconds)"

# Or using Python
from backend.services.vault_client import rotate_secret
import secrets

rotate_secret("encryption-keys/default", {
    "key": secrets.token_hex(32),
    "algorithm": "AES-256-GCM",
    "rotated_at": datetime.now().isoformat()
})
```

### Database Credential Rotation

```python
from backend.services.vault_client import get_vault_client

vault = get_vault_client()

# Rotate database root password
vault.client.secrets.database.rotate_root_credentials(
    name="psra-primary"
)

# Rotate static role credentials
vault.client.secrets.database.rotate_static_credentials(
    name="reporting-user"
)
```

## Usage Examples

### Basic Secret Operations

```python
from backend.services.vault_client import (
    get_vault_client,
    read_secret,
    write_secret,
    rotate_secret
)

# Get client
vault = get_vault_client()

# Read a secret
db_config = read_secret("database/psra-primary")
print(f"Database: {db_config['database']}")

# Read specific version
old_config = read_secret("database/psra-primary", version=1)

# Write a secret
write_secret("api-keys/new-service", {
    "key": "sk-new-api-key",
    "description": "New service API key"
})

# List secrets
secrets = vault.list_secrets("api-keys")
print(f"Found {len(secrets)} API keys")

# Rotate a secret
rotate_secret("api-keys/internal", {
    "key": "new-key-value",
    "rotated_at": datetime.now().isoformat()
})

# Delete secret version
vault.delete_secret("api-keys/old-service", versions=[1, 2])
```

### Encryption Key Management

```python
from backend.services.vault_client import get_vault_client

vault = get_vault_client()

# Get encryption key
key = vault.get_encryption_key("default")

# Use with cryptography
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

cipher = AESGCM(key)
nonce = os.urandom(12)
ciphertext = cipher.encrypt(nonce, plaintext, None)
```

### Transit Engine for Encryption-as-a-Service

```python
from backend.services.vault_client import get_vault_client

vault = get_vault_client()

# Encrypt data without handling keys directly
plaintext = b"sensitive data"
encoded = base64.b64encode(plaintext).decode()

encrypted = vault.client.secrets.transit.encrypt_data(
    name="psra-app-key",
    plaintext=encoded
)

ciphertext = encrypted['data']['ciphertext']

# Decrypt data
decrypted = vault.client.secrets.transit.decrypt_data(
    name="psra-app-key",
    ciphertext=ciphertext
)

plaintext = base64.b64decode(decrypted['data']['plaintext'])
```

### Health Monitoring

```python
from backend.services.vault_client import get_vault_client

vault = get_vault_client()

# Check health
health = vault.health_check()

print(f"Vault Status:")
print(f"  Initialized: {health['initialized']}")
print(f"  Sealed: {health['sealed']}")
print(f"  Authenticated: {health['authenticated']}")
print(f"  Version: {health['vault_version']}")
print(f"  Token TTL: {health['token_ttl']}s")
```

## Security Best Practices

### 1. Secret Management

- **Never commit secrets to version control**
- Store secrets only in Vault, never in configuration files
- Use dynamic secrets when possible
- Implement secret rotation schedules
- Use versioning for rollback capability

### 2. Authentication

- Use AppRole for service-to-service authentication
- Set appropriate token TTLs (shorter is better)
- Enable token renewal for long-running services
- Revoke tokens when no longer needed
- Use bound CIDRs to restrict token usage

### 3. Authorization

- Follow principle of least privilege
- Create specific policies for each service
- Avoid using root tokens in production
- Audit policy assignments regularly
- Use namespaces for multi-tenancy (Enterprise)

### 4. Network Security

- Use TLS for all Vault communication in production
- Restrict network access to Vault server
- Use firewalls to limit connections
- Enable audit logging
- Monitor access patterns

### 5. Operational Security

- Back up Vault data and unseal keys securely
- Store unseal keys in separate secure locations
- Use auto-unseal with cloud KMS in production
- Implement disaster recovery procedures
- Regularly test backup restoration

### 6. Monitoring and Auditing

- Enable audit device for all operations
- Monitor failed authentication attempts
- Alert on policy violations
- Track secret access patterns
- Review audit logs regularly

### 7. Token Management

```python
# Good: Use AppRole with short-lived tokens
vault = VaultClient(auto_renew=True)  # Auto-renew enabled

# Bad: Using root token
vault = VaultClient(token="root-token")  # Never do this

# Good: Cleanup on shutdown
def shutdown_handler():
    vault.close()  # Revoke token

signal.signal(signal.SIGTERM, shutdown_handler)
```

### 8. Secret Versioning

```python
# Keep multiple versions for rollback
vault.write_secret("api-keys/service", new_data)

# Can rollback if needed
old_data = vault.read_secret("api-keys/service", version=2)
```

## Troubleshooting

### Common Issues

#### 1. Authentication Failures

```python
# Problem: "Authentication failed"
# Solution: Check role_id and secret_id

# Verify credentials
vault = VaultClient(
    role_id="your-role-id",
    secret_id="your-secret-id"
)

# Check if authenticated
if not vault.client.is_authenticated():
    print("Check VAULT_ROLE_ID and VAULT_SECRET_ID")
```

#### 2. Permission Denied

```bash
# Problem: "permission denied"
# Solution: Check policy assignment

# View token capabilities
vault token capabilities secret/data/database/psra-primary

# Update policy if needed
vault policy write psra-app policies/psra-app.hcl
```

#### 3. Token Expired

```python
# Problem: Token expired during operation
# Solution: Enable auto-renewal

vault = VaultClient(auto_renew=True)

# Or manually renew
vault.renew_token(increment=3600)
```

#### 4. Secret Not Found

```python
# Problem: VaultSecretNotFoundError
# Solution: Check path and create if needed

try:
    secret = vault.read_secret("api-keys/missing")
except VaultSecretNotFoundError:
    # Create the secret
    vault.write_secret("api-keys/missing", {"key": "value"})
```

#### 5. Connection Issues

```bash
# Problem: Cannot connect to Vault
# Solution: Check Vault status and address

# Check if Vault is running
ps aux | grep vault

# Check Vault status
export VAULT_ADDR=http://127.0.0.1:8200
vault status

# Check if sealed
vault operator unseal
```

### Debug Mode

```python
import logging

# Enable debug logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger('backend.services.vault_client')
logger.setLevel(logging.DEBUG)

# Now all Vault operations will be logged
vault = get_vault_client()
vault.read_secret("database/psra-primary")  # Logs detailed info
```

### Testing Connection

```python
# test_vault_connection.py
from backend.services.vault_client import get_vault_client

def test_vault_connection():
    try:
        vault = get_vault_client()
        health = vault.health_check()

        print("Vault Connection Test Results:")
        print(f"  Status: {'OK' if health['authenticated'] else 'FAILED'}")
        print(f"  Vault Version: {health['vault_version']}")
        print(f"  Sealed: {health['sealed']}")
        print(f"  Token TTL: {health['token_ttl']}s")

        return health['authenticated']
    except Exception as e:
        print(f"Connection test failed: {e}")
        return False

if __name__ == "__main__":
    success = test_vault_connection()
    exit(0 if success else 1)
```

## Additional Resources

- [OpenBao Documentation](https://openbao.org/docs/)
- [HashiCorp Vault Documentation](https://www.vaultproject.io/docs)
- [HVAC Python Client](https://hvac.readthedocs.io/)
- [AppRole Auth Method](https://www.vaultproject.io/docs/auth/approle)
- [KV Secrets Engine v2](https://www.vaultproject.io/docs/secrets/kv/kv-v2)

## Support

For issues or questions:
1. Check this documentation
2. Review Vault audit logs
3. Check application logs
4. Verify policy configurations
5. Test with vault CLI directly

## License

Internal use only - PSRA LTSD Enterprise v2
