# API Key Quick Start Guide

Quick reference for generating and using Partner API keys.

---

## Generate a New API Key

```bash
cd /home/vncuser/psra-ltsd-enterprise-v2

python scripts/generate_api_key.py --partner "Partner Name"
```

**Save the generated API key securely - it's only shown once!**

---

## Use the API Key

Add the key to your HTTP requests via the `X-API-Key` header:

```bash
curl -X POST http://localhost:8090/api/partner/v1/origin-check \
  -H "X-API-Key: YOUR_64_CHARACTER_HEX_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "productSku": "...", ... }'
```

---

## Enable Keys in Production

Add keys to `.env` file:

```bash
# .env (never commit!)
PARTNER_API_KEY_1=25b7ffb7e32872f6601ba37ef8721de0c86fcb9c49bc6c9b7fcf75e9ac85e0c6
PARTNER_API_KEY_2=17cb4dc11678e9a43723b9446aa544aa457d671ff728186520937ba1e34ae38b
PARTNER_API_KEY_3=ec9a6a4c8395a7cb2884af922bed7c8aa7b5a46b1512e789f2a77958c33f9873
```

Restart application:
```bash
docker-compose restart psra-frontend
```

---

## List Generated Keys

```bash
python scripts/generate_api_key.py --list
```

---

## Key Format

- **Length**: 64 characters
- **Format**: Hexadecimal (0-9, a-f)
- **Example**: `25b7ffb7e32872f6601ba37ef8721de0c86fcb9c49bc6c9b7fcf75e9ac85e0c6`

---

## Security Checklist

- [ ] Never commit `api_keys_secure.json` to version control
- [ ] Store keys in password manager or encrypted vault
- [ ] Add keys to `.gitignore`
- [ ] Use different keys for dev/staging/production
- [ ] Rotate keys every 90-180 days
- [ ] Revoke keys immediately if compromised

---

## Full Documentation

See [API Key Management Guide](./api_key_management.md) for complete documentation.

---

## Generated Test Keys

### Current Test Keys (2025-10-13)

**Key 1: Acme Corporation** (Production)
- Prefix: `25b7ffb7...`
- Rate Limit: 100 req/min
- Expires: 2026-10-13

**Key 2: GlobalTrade Inc** (Production)
- Prefix: `17cb4dc1...`
- Rate Limit: 100 req/min
- Expires: 2026-04-11 (180 days)

**Key 3: Test Partner** (Staging)
- Prefix: `ec9a6a4c...`
- Rate Limit: 50 req/min
- Expires: 2026-10-13

**Full keys stored in**: `/home/vncuser/psra-ltsd-enterprise-v2/api_keys_secure.json`

---

## Troubleshooting

**"Invalid API key" Error**
- Check key is exactly 64 hex characters
- Verify key is added to `.env` file
- Restart application after updating `.env`

**"Rate limit exceeded" Error**
- Wait for rate limit reset (check `X-RateLimit-Reset` header)
- Implement exponential backoff
- Request higher rate limit if needed

---

## Support

- **Email**: partners@sevensa.nl
- **Docs**: https://docs.psra.sevensa.nl
- **Status**: https://status.psra.sevensa.nl
