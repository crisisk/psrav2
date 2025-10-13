# OpenBao/Vault Integration - Quick Start Guide

Get up and running with OpenBao/Vault integration in 5 minutes.

## Prerequisites

- Vault is installed and running at `http://127.0.0.1:8200`
- You have root access or admin privileges
- Python 3.8+ with pip installed

## Step 1: Initialize Vault

Run the initialization script to set up Vault:

```bash
cd /home/vncuser/psra-ltsd-enterprise-v2/ops/vault
./init_vault.sh --init
```

This will:
- Initialize and unseal Vault (if needed)
- Enable AppRole authentication
- Create all necessary policies
- Generate AppRole credentials for your application
- Create sample secrets

**IMPORTANT**: The script will create `vault-keys.json` containing unseal keys and root token. Keep this file secure!

## Step 2: Configure Environment

Source the generated credentials:

```bash
source /home/vncuser/psra-ltsd-enterprise-v2/ops/vault/psra-app-credentials.env
```

Or add to your `.env` file:

```bash
cat psra-app-credentials.env >> /home/vncuser/psra-ltsd-enterprise-v2/.env
```

The credentials file contains:
- `VAULT_ADDR`: Vault server address
- `VAULT_ROLE_ID`: Your application's role ID
- `VAULT_SECRET_ID`: Your application's secret ID

## Step 3: Install Python Dependencies

```bash
cd /home/vncuser/psra-ltsd-enterprise-v2
pip install -r requirements.txt
```

This installs `hvac==2.1.0` (the Python Vault client) and other dependencies.

## Step 4: Test the Integration

Run the test suite to verify everything works:

```bash
cd /home/vncuser/psra-ltsd-enterprise-v2/ops/vault
python test_vault_integration.py
```

Expected output:
```
======================================================================
  OpenBao/Vault Integration Test Suite
======================================================================

Environment Configuration:
  VAULT_ADDR: http://127.0.0.1:8200
  VAULT_ROLE_ID: SET
  VAULT_SECRET_ID: SET

======================================================================
  Test 1: Health Check
======================================================================
✓ Vault Status:
  - Initialized: True
  - Sealed: False
  - Authenticated: True
  ...

Results: 8/8 tests passed

✓ All tests passed! Vault integration is working correctly.
```

## Step 5: Use in Your Application

### Basic Usage

```python
from backend.services.vault_client import get_vault_client

# Get the global client
vault = get_vault_client()

# Read a secret
db_config = vault.read_secret("database/psra-primary")
print(f"Database: {db_config['database']}")

# Write a secret
vault.write_secret("api-keys/my-service", {
    "key": "sk-my-api-key",
    "description": "My service API key"
})

# List secrets
secrets = vault.list_secrets("api-keys")
print(f"Found {len(secrets)} API keys")
```

### Using Convenience Functions

```python
from backend.services.vault_client import (
    read_secret,
    write_secret,
    get_api_key,
    get_encryption_key
)

# These use the global client automatically
db_config = read_secret("database/psra-primary")
openai_key = get_api_key("openai")
encryption_key = get_encryption_key("default")
```

### In FastAPI Application

```python
from fastapi import FastAPI
from backend.services.vault_client import get_vault_client, close_vault_client

app = FastAPI()

@app.on_event("startup")
async def startup_event():
    # Initialize Vault client
    vault = get_vault_client()
    health = vault.health_check()

    if not health['authenticated']:
        raise Exception("Failed to authenticate with Vault")

    print(f"Vault connected: {health['vault_version']}")

@app.on_event("shutdown")
async def shutdown_event():
    # Close Vault client
    close_vault_client()

@app.get("/config")
async def get_config():
    vault = get_vault_client()
    config = vault.read_secret("config/psra/app")
    return config
```

## Common Operations

### Read Database Credentials

```python
vault = get_vault_client()
db_config = vault.read_secret("database/psra-primary")

# Connect to database
import psycopg2
conn = psycopg2.connect(
    host=db_config['host'],
    port=db_config['port'],
    database=db_config['database'],
    user=db_config.get('username', 'psra_app'),
    password=db_config.get('password', '')
)
```

### Get API Keys

```python
vault = get_vault_client()

# Get OpenAI key
openai_key = vault.get_api_key("openai")

# Get Stripe key
stripe_key = vault.get_api_key("stripe")
```

### Rotate a Secret

```python
vault = get_vault_client()

# Generate new key
import secrets
new_key = secrets.token_urlsafe(32)

# Rotate the secret
vault.rotate_secret("api-keys/internal-service", {
    "key": new_key,
    "rotated_at": datetime.now().isoformat()
})
```

### Use Encryption Keys

```python
vault = get_vault_client()

# Get encryption key
key = vault.get_encryption_key("default")

# Use with cryptography library
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import os

cipher = AESGCM(key)
nonce = os.urandom(12)
plaintext = b"sensitive data"
ciphertext = cipher.encrypt(nonce, plaintext, None)
```

## Managing Secrets

### Using Vault CLI

```bash
# Set Vault address
export VAULT_ADDR=http://127.0.0.1:8200

# Login (use token from psra-app-credentials.env or vault-keys.json)
export VAULT_TOKEN=<your-token>

# Write a secret
vault kv put secret/api-keys/stripe \
    key="sk_live_xxxxxxxxxxxxxxxx" \
    description="Stripe API key for payments"

# Read a secret
vault kv get secret/api-keys/stripe

# List secrets
vault kv list secret/api-keys

# Delete a secret version
vault kv delete secret/api-keys/old-service
```

### Using Python

```python
from backend.services.vault_client import get_vault_client

vault = get_vault_client()

# Write
vault.write_secret("api-keys/new-service", {
    "key": "sk-new-key",
    "description": "New service API key"
})

# Read
secret = vault.read_secret("api-keys/new-service")

# List
keys = vault.list_secrets("api-keys")

# Delete
vault.delete_secret("api-keys/old-service")
```

## Secret Paths Reference

Quick reference for common secret paths:

| Path | Purpose | Example |
|------|---------|---------|
| `database/*` | Database connections | `database/psra-primary` |
| `api-keys/*` | Third-party API keys | `api-keys/openai` |
| `encryption-keys/*` | Encryption keys | `encryption-keys/default` |
| `tls-certificates/*` | TLS certificates | `tls-certificates/api.example.com` |
| `jwt-keys/*` | JWT signing keys | `jwt-keys/signing` |
| `config/psra/*` | Application config | `config/psra/app` |
| `oauth/*` | OAuth credentials | `oauth/google` |

## Troubleshooting

### "Authentication failed"

Check your credentials:

```bash
echo $VAULT_ROLE_ID
echo $VAULT_SECRET_ID
```

If not set, source the credentials file:

```bash
source /home/vncuser/psra-ltsd-enterprise-v2/ops/vault/psra-app-credentials.env
```

### "Permission denied"

Your AppRole might not have the right policy. Check policies:

```bash
vault read auth/approle/role/psra-app
```

Re-run initialization to fix:

```bash
./init_vault.sh --force
```

### "Secret not found"

Create the secret first:

```bash
vault kv put secret/your/path key=value
```

Or using Python:

```python
vault.write_secret("your/path", {"key": "value"})
```

### Connection issues

Check if Vault is running:

```bash
ps aux | grep vault
vault status
```

If sealed, unseal it:

```bash
vault operator unseal <unseal-key-1>
vault operator unseal <unseal-key-2>
vault operator unseal <unseal-key-3>
```

## Next Steps

1. **Read the full documentation**: [README.md](./README.md)
2. **Configure your secrets**: Replace sample secrets with real values
3. **Set up secret rotation**: Implement automated rotation for sensitive credentials
4. **Enable audit logging**: Configure audit device for compliance
5. **Use dynamic secrets**: Set up database dynamic credentials

## Security Checklist

- [ ] Vault keys file (`vault-keys.json`) is backed up securely
- [ ] Credentials file is not committed to version control
- [ ] AppRole secret IDs are stored securely
- [ ] TLS is enabled for production Vault
- [ ] Audit logging is enabled
- [ ] Secret rotation schedule is defined
- [ ] Access policies follow least privilege principle

## Getting Help

- Check logs: Application logs show detailed Vault operations
- Enable debug mode: Set `logging.DEBUG` for vault_client
- Test connection: Run `test_vault_integration.py`
- Verify with CLI: Use `vault` command to test operations
- Review policies: Check if your role has required permissions

## Additional Resources

- [Full Documentation](./README.md)
- [OpenBao Documentation](https://openbao.org/docs/)
- [HVAC Python Client Docs](https://hvac.readthedocs.io/)
- [Vault Policy Documentation](https://www.vaultproject.io/docs/concepts/policies)

---

**Need help?** Check the [Troubleshooting](#troubleshooting) section or review the full [README.md](./README.md).
