# API Key Management Guide

**Version**: 1.0
**Last Updated**: 2025-10-13

---

## Overview

The Partner API uses API key authentication to secure external integrations. This guide covers the complete lifecycle of API keys: generation, validation, usage, rotation, and revocation.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Generating API Keys](#generating-api-keys)
3. [Using API Keys](#using-api-keys)
4. [Validating API Keys](#validating-api-keys)
5. [Rotating API Keys](#rotating-api-keys)
6. [Revoking API Keys](#revoking-api-keys)
7. [Security Best Practices](#security-best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Architecture

### Components

```
┌─────────────────────────────────────────────────────┐
│                 API Key System                       │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────┐      ┌──────────────────┐   │
│  │  API Key Service │◄─────┤  CLI Generator   │   │
│  │  (Validation)    │      │  (Creation)      │   │
│  └────────┬─────────┘      └──────────────────┘   │
│           │                                         │
│           ▼                                         │
│  ┌──────────────────┐      ┌──────────────────┐   │
│  │  Partner Auth    │◄─────┤  Database        │   │
│  │  Middleware      │      │  (Hashed Keys)   │   │
│  └──────────────────┘      └──────────────────┘   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Files

- **Service**: `/backend/services/api_key_service.py`
- **Models**: `/backend/models/api_key_models.py`
- **CLI Tool**: `/scripts/generate_api_key.py`
- **Auth Middleware**: `/lib/partner-api/auth.ts`
- **Secure Storage**: `api_keys_secure.json` (not in version control)

---

## Generating API Keys

### Using the CLI Tool

```bash
# Basic generation
python scripts/generate_api_key.py --partner "Acme Corporation"

# With custom expiration (180 days)
python scripts/generate_api_key.py --partner "Acme Corp" --expires-days 180

# With custom rate limit (50 req/min for staging)
python scripts/generate_api_key.py --partner "Test Partner" \
  --environment staging \
  --rate-limit 50

# With description
python scripts/generate_api_key.py --partner "GlobalTrade Inc" \
  --description "Production API key for GlobalTrade integration"
```

### CLI Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--partner` | string | Required | Partner organization name |
| `--expires-days` | int | 365 | Days until expiration (1-1825) |
| `--rate-limit` | int | 100 | Requests per minute (1-1000) |
| `--environment` | string | production | Environment: production, staging, development |
| `--description` | string | None | Optional description |
| `--output` | string | api_keys_secure.json | Output file path |
| `--list` | flag | False | List all generated keys |
| `--no-save` | flag | False | Don't save to file (display only) |

### Example Output

```
======================================================================
Generating API Key for: Acme Corporation
======================================================================

✓ API Key Generated Successfully!

──────────────────────────────────────────────────────────────────────
Key Details:
──────────────────────────────────────────────────────────────────────
  Partner:     Acme Corporation
  Key ID:      key_20251013133538_25b7ffb7
  Prefix:      25b7ffb7...
  Environment: production
  Created:     2025-10-13 13:35:38 UTC
  Expires:     2026-10-13 13:35:38 UTC (365 days)
  Rate Limit:  100 req/min
──────────────────────────────────────────────────────────────────────

⚠️  IMPORTANT: Save this API key securely - it will only be shown once!

  API Key: 25b7ffb7e32872f6601ba37ef8721de0c86fcb9c49bc6c9b7fcf75e9ac85e0c6

──────────────────────────────────────────────────────────────────────
```

### List Generated Keys

```bash
python scripts/generate_api_key.py --list
```

Output:
```
======================================================================
API Keys Summary (3 total)
======================================================================

1. Acme Corporation
   ID:          key_20251013133538_25b7ffb7
   Prefix:      25b7ffb7...
   Created:     2025-10-13T13:35:38.213145
   Expires:     2026-10-13T13:35:38.213145
   Environment: production
   Active:      True
```

---

## Using API Keys

### HTTP Request Format

All Partner API requests require the `X-API-Key` header:

```bash
curl -X POST https://psra.sevensa.nl/api/partner/v1/origin-check \
  -H "X-API-Key: YOUR_64_CHARACTER_HEX_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "productSku": "PRODUCT-001",
    "hsCode": "390110",
    "agreement": "CETA",
    "exWorksValue": 10000.00,
    "materials": [...]
  }'
```

### Response Headers

All API responses include rate limit headers:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1729123500
```

### Authentication Errors

**401 Unauthorized** - Missing or invalid API key:
```json
{
  "error": "Missing API key. Include X-API-Key header.",
  "code": "UNAUTHORIZED"
}
```

**429 Too Many Requests** - Rate limit exceeded:
```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 45
}
```

---

## Validating API Keys

### Using the API Key Service

```python
from backend.services.api_key_service import APIKeyService

# Validate an API key
api_key = "25b7ffb7e32872f6601ba37ef8721de0c86fcb9c49bc6c9b7fcf75e9ac85e0c6"
stored_hash = "fc9a73b269effa94ea589cf04c5e21c81cbcf69532409a65901c2b41599d0074"

is_valid = APIKeyService.validate_api_key(api_key, stored_hash)
if is_valid:
    print("API key is valid!")
else:
    print("Invalid API key")
```

### Validation Process

1. **Format Check**: Validates that the key is 64 hexadecimal characters
2. **Hash Comparison**: Computes SHA-256 hash and compares with stored hash
3. **Timing-Safe**: Uses `secrets.compare_digest()` to prevent timing attacks
4. **Additional Checks** (if using database):
   - Key is active (`is_active = True`)
   - Key is not revoked (`revoked_at = NULL`)
   - Key is not expired (`expires_at > NOW()`)

### Key Format

- **Length**: 64 characters
- **Format**: Hexadecimal (0-9, a-f)
- **Entropy**: 256 bits (32 random bytes)
- **Example**: `25b7ffb7e32872f6601ba37ef8721de0c86fcb9c49bc6c9b7fcf75e9ac85e0c6`

---

## Rotating API Keys

### When to Rotate

- **Regular Schedule**: Every 90-180 days
- **Security Incident**: Immediately if compromised
- **Employee Changes**: When staff with key access leave
- **Compliance**: As required by security policies

### Rotation Process

1. **Generate new key**:
   ```bash
   python scripts/generate_api_key.py --partner "Acme Corp"
   ```

2. **Share new key** securely with partner

3. **Update partner systems** with new key

4. **Verify new key** is working:
   ```bash
   curl -X POST http://localhost:8090/api/partner/v1/origin-check \
     -H "X-API-Key: NEW_API_KEY" \
     -H "Content-Type: application/json"
   ```

5. **Deactivate old key**:
   ```python
   from backend.services.api_key_service import APIKeyService

   revocation = APIKeyService.revoke_api_key(
       key_id="key_20251013133538_25b7ffb7",
       revoked_by="admin@sevensa.nl",
       reason="Scheduled rotation"
   )
   ```

6. **Monitor for errors** from old key usage

---

## Revoking API Keys

### Using the Service

```python
from backend.services.api_key_service import APIKeyService

# Revoke a key
revocation_data = APIKeyService.revoke_api_key(
    key_id="key_20251013133538_25b7ffb7",
    revoked_by="admin@sevensa.nl",
    reason="Security incident - key leaked on GitHub"
)

print(revocation_data)
# {
#   'key_id': 'key_20251013133538_25b7ffb7',
#   'revoked_at': '2025-10-13T14:00:00.000000',
#   'revoked_by': 'admin@sevensa.nl',
#   'reason': 'Security incident - key leaked on GitHub',
#   'is_active': False
# }
```

### Database Update (Example)

```python
# Update the database to mark key as revoked
# (Implementation depends on your database)
await db.execute(
    """
    UPDATE api_keys
    SET is_active = false,
        revoked_at = :revoked_at,
        revoked_by = :revoked_by,
        revocation_reason = :reason
    WHERE id = :key_id
    """,
    revocation_data
)
```

---

## Security Best Practices

### Key Storage

- **Never commit** `api_keys_secure.json` to version control
- **Add to .gitignore**: Ensure keys file is ignored
- **Restrictive permissions**: File should be readable only by owner (600)
- **Encrypt at rest**: Use encrypted storage for production keys
- **Separate environments**: Different keys for dev/staging/production

### Key Distribution

- **Secure channels only**: Use encrypted email, password managers, or secure file transfer
- **One-time sharing**: Use services like 1Password shared vaults or HashiCorp Vault
- **Avoid chat/Slack**: Never send keys via unencrypted messaging
- **Encrypted backups**: Store backup keys in encrypted password manager

### Monitoring

- **Log all usage**: Track API key usage and patterns
- **Alert on anomalies**: Unusual request patterns, geographic anomalies
- **Regular audits**: Review active keys quarterly
- **Track expiration**: Alert 30 days before key expires

### Environment Variables

To use generated keys with the Partner API, add them to your `.env` file:

```bash
# .env file (never commit this!)
PARTNER_API_KEY_1=25b7ffb7e32872f6601ba37ef8721de0c86fcb9c49bc6c9b7fcf75e9ac85e0c6
PARTNER_API_KEY_2=17cb4dc11678e9a43723b9446aa544aa457d671ff728186520937ba1e34ae38b
PARTNER_API_KEY_3=ec9a6a4c8395a7cb2884af922bed7c8aa7b5a46b1512e789f2a77958c33f9873
```

### .gitignore

Ensure these files are ignored:

```gitignore
# API Keys and Secrets
api_keys_secure.json
.env
.env.local
.env.production
```

---

## Troubleshooting

### "Invalid API key" Error

**Cause**: Key format invalid or not in authorized list

**Solution**:
1. Verify key is exactly 64 hexadecimal characters
2. Check key is added to environment variables
3. Restart application after updating `.env`
4. Verify key hasn't been revoked

### "Rate limit exceeded" Error

**Cause**: Too many requests within rate limit window

**Solution**:
1. Check `X-RateLimit-Remaining` header
2. Implement exponential backoff
3. Wait for `Retry-After` seconds
4. Request higher rate limit if needed

### Key Not Working After Generation

**Cause**: Key not added to environment variables

**Solution**:
```bash
# Add to .env
echo "PARTNER_API_KEY_1=YOUR_KEY_HERE" >> .env

# Restart application
docker-compose restart psra-frontend
# or
npm run dev
```

### Permission Denied on api_keys_secure.json

**Cause**: File permissions too restrictive

**Solution**:
```bash
chmod 600 api_keys_secure.json
```

---

## Testing with Generated Keys

### Test Authentication

```bash
# Test with generated key
curl -X POST http://localhost:8090/api/partner/v1/origin-check \
  -H "X-API-Key: 25b7ffb7e32872f6601ba37ef8721de0c86fcb9c49bc6c9b7fcf75e9ac85e0c6" \
  -H "Content-Type: application/json" \
  -d '{
    "productSku": "TEST-001",
    "hsCode": "390110",
    "agreement": "CETA",
    "exWorksValue": 10000.00,
    "materials": [
      {
        "hsCode": "271019",
        "origin": "CA",
        "value": 3000.00,
        "description": "Test material"
      }
    ]
  }'
```

### Test Rate Limiting

```bash
# Send 101 requests to trigger rate limit
for i in {1..101}; do
  curl -X GET http://localhost:8090/api/partner/v1/webhook \
    -H "X-API-Key: YOUR_KEY" \
    -w "\n%{http_code}\n"
done
```

---

## API Reference

### APIKeyService Methods

```python
class APIKeyService:
    @staticmethod
    def generate_api_key() -> tuple[str, str]:
        """Generate new API key and hash"""

    @staticmethod
    def hash_api_key(api_key: str) -> str:
        """Hash an API key with SHA-256"""

    @staticmethod
    def validate_api_key(api_key: str, stored_hash: str) -> bool:
        """Validate key against stored hash"""

    @staticmethod
    def revoke_api_key(key_id: str, revoked_by: str, reason: str = None) -> dict:
        """Revoke an API key"""

    @staticmethod
    def validate_key_format(api_key: str) -> bool:
        """Check if key format is valid"""

    @staticmethod
    def create_key_metadata(partner_name: str, api_key: str,
                           key_hash: str, expires_days: int = 365) -> dict:
        """Create metadata for new key"""
```

---

## Support

For questions or issues with API keys:

- **Email**: partners@sevensa.nl
- **Documentation**: https://docs.psra.sevensa.nl
- **API Status**: https://status.psra.sevensa.nl

---

## Changelog

### v1.0 - 2025-10-13
- Initial API key management system
- CLI tool for key generation
- Service layer for validation and revocation
- Comprehensive documentation
