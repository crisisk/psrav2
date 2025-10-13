# Partner API v1 Documentation

**Base URL**: `https://psra.sevensa.nl/api/partner/v1`

**Authentication**: API Key (via `X-API-Key` header)

**Rate Limit**: 100 requests per minute per API key

---

## Authentication

All Partner API endpoints require authentication via API key.

### Request Headers

```http
X-API-Key: your_64_character_hex_api_key
Content-Type: application/json
```

### Obtaining an API Key

Contact your account manager or register at: https://psra.sevensa.nl/partners/register

---

## Endpoints

### 1. Origin Check

**POST** `/api/partner/v1/origin-check`

Check if a product qualifies for preferential origin under a trade agreement.

#### Request Body

```json
{
  "productSku": "PRODUCT-001",
  "hsCode": "390110",
  "agreement": "CETA",
  "exWorksValue": 10000.00,
  "materials": [
    {
      "hsCode": "271019",
      "origin": "CA",
      "value": 3000.00,
      "description": "Petroleum feedstock"
    },
    {
      "hsCode": "290211",
      "origin": "EU",
      "value": 2500.00,
      "description": "Propylene"
    }
  ],
  "requestId": "optional-correlation-id"
}
```

#### Response (200 OK)

```json
{
  "requestId": "req_1729123456_abc123",
  "result": {
    "isConform": true,
    "confidence": 0.95,
    "verdict": "PREFERENTIAL",
    "explanation": "Product qualifies for preferential origin under CETA. Regional Value Content (RVC) is 65.0%, which exceeds the 60.0% threshold.",
    "appliedRules": ["RVC >= 60%", "Change in Tariff Classification (CTC)"]
  },
  "calculations": {
    "regionalValueContent": 65.0,
    "nonOriginatingMaterialsValue": 3500.00,
    "originatingMaterialsValue": 6500.00
  },
  "timestamp": "2025-10-13T10:30:00Z",
  "processingTime": 245
}
```

#### Supported Trade Agreements

- `CETA` - Comprehensive Economic and Trade Agreement (EU-Canada)
- `EU-UK-TCA` - EU-UK Trade and Cooperation Agreement
- `EU-JP-EPA` - EU-Japan Economic Partnership Agreement
- `RCEP` - Regional Comprehensive Economic Partnership
- `USMCA` - United States-Mexico-Canada Agreement
- `GSP` - Generalized System of Preferences

---

### 2. Retrieve Certificate

**GET** `/api/partner/v1/certificate/{id}`

Retrieve a Certificate of Origin by ID.

#### Path Parameters

- `id` (string, required) - Certificate ID (e.g., `cert_1729123456_abc123`)

#### Response (200 OK)

```json
{
  "certificate": {
    "id": "cert_1729123456_abc123",
    "productSku": "PRODUCT-001",
    "hsCode": "390110",
    "agreement": "CETA",
    "status": "issued",
    "issuedDate": "2025-10-10T12:00:00Z",
    "expiryDate": "2026-10-10T12:00:00Z",
    "pdfUrl": "https://psra.sevensa.nl/certificates/cert_1729123456_abc123.pdf",
    "verificationUrl": "https://psra.sevensa.nl/verify/cert_1729123456_abc123",
    "result": {
      "isConform": true,
      "verdict": "PREFERENTIAL",
      "confidence": 0.98
    }
  },
  "retrievedAt": "2025-10-13T10:30:00Z"
}
```

---

### 3. Webhook Management

Webhooks allow you to receive real-time notifications when events occur.

#### Register Webhook

**POST** `/api/partner/v1/webhook`

```json
{
  "url": "https://your-domain.com/webhooks/psra",
  "events": ["origin.checked", "certificate.generated"],
  "secret": "your_webhook_secret_min_32_chars_long",
  "description": "Production webhook for origin checks"
}
```

**Response (201 Created)**:

```json
{
  "webhook": {
    "id": "wh_1729123456_abc123",
    "url": "https://your-domain.com/webhooks/psra",
    "events": ["origin.checked", "certificate.generated"],
    "description": "Production webhook for origin checks",
    "active": true,
    "createdAt": "2025-10-13T10:30:00Z"
  },
  "message": "Webhook registered successfully"
}
```

#### List Webhooks

**GET** `/api/partner/v1/webhook`

**Response (200 OK)**:

```json
{
  "webhooks": [
    {
      "id": "wh_1729123456_abc123",
      "url": "https://your-domain.com/webhooks/psra",
      "events": ["origin.checked", "certificate.generated"],
      "active": true,
      "createdAt": "2025-10-13T10:30:00Z",
      "lastDeliveryAt": "2025-10-13T11:00:00Z",
      "deliveryStats": {
        "total": 150,
        "successful": 148,
        "failed": 2
      }
    }
  ],
  "total": 1
}
```

#### Delete Webhook

**DELETE** `/api/partner/v1/webhook?id={webhook_id}`

**Response (200 OK)**:

```json
{
  "message": "Webhook deleted successfully",
  "id": "wh_1729123456_abc123"
}
```

---

## Webhook Events

### Event Types

- `origin.checked` - Origin check completed
- `certificate.generated` - Certificate of Origin generated
- `certificate.expired` - Certificate has expired
- `ltsd.validated` - Long-Term Supplier Declaration validated
- `ltsd.rejected` - LTSD rejected

### Webhook Payload Example

```json
{
  "event": "origin.checked",
  "timestamp": "2025-10-13T10:30:00Z",
  "data": {
    "requestId": "req_1729123456_abc123",
    "productSku": "PRODUCT-001",
    "agreement": "CETA",
    "result": {
      "isConform": true,
      "verdict": "PREFERENTIAL"
    }
  }
}
```

### Webhook Security

All webhook deliveries include an `X-Signature` header with an HMAC-SHA256 signature:

```
X-Signature: sha256=<hex_digest>
```

Verify the signature using your webhook secret:

```python
import hmac
import hashlib

def verify_webhook(payload, signature, secret):
    expected = hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)
```

---

## Error Responses

### Authentication Errors

**401 Unauthorized**:
```json
{
  "error": "Invalid API key",
  "code": "UNAUTHORIZED"
}
```

### Rate Limit Errors

**429 Too Many Requests**:
```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 45
}
```

Headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1729123500
Retry-After: 45
```

### Validation Errors

**400 Bad Request**:
```json
{
  "error": "Invalid request body",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "path": "hsCode",
      "message": "HS code must be 6-10 digits"
    }
  ]
}
```

---

## Rate Limiting

- **Limit**: 100 requests per minute per API key
- **Headers**: Every response includes rate limit headers
- **Backoff**: Implement exponential backoff when hitting rate limits

---

## Best Practices

1. **Store API keys securely** - Never commit keys to source control
2. **Implement retry logic** - Use exponential backoff for failed requests
3. **Validate webhook signatures** - Always verify HMAC signatures
4. **Use HTTPS** - All webhook URLs must use HTTPS
5. **Handle idempotency** - Use `requestId` for duplicate detection
6. **Monitor rate limits** - Track `X-RateLimit-Remaining` header

---

## Support

- **Documentation**: https://docs.psra.sevensa.nl
- **API Status**: https://status.psra.sevensa.nl
- **Contact**: partners@sevensa.nl
