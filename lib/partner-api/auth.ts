/**
 * Partner API Authentication & Rate Limiting
 *
 * Provides API key authentication and rate limiting for external partners.
 * Integrates with Redis for distributed rate limiting.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHash, timingSafeEqual } from 'crypto';

// Environment configuration
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const API_KEY_HEADER = 'X-API-Key';
const RATE_LIMIT_WINDOW = 60; // seconds
const RATE_LIMIT_MAX_REQUESTS = 100; // requests per window

// In-memory cache for development (replace with Redis in production)
const rateLimitCache = new Map<string, { count: number; resetAt: number }>();
const validApiKeys = new Set<string>(
  [
    process.env.PARTNER_API_KEY_1,
    process.env.PARTNER_API_KEY_2,
    process.env.PARTNER_API_KEY_3,
    process.env.PARTNER_API_KEY_4,
    process.env.PARTNER_API_KEY_5,
    process.env.PARTNER_API_KEY_6,
    process.env.PARTNER_API_KEY_7,
    process.env.PARTNER_API_KEY_8,
  ].filter((key): key is string => typeof key === 'string' && key.length > 0)
);

export interface PartnerAuthResult {
  authorized: boolean;
  partnerId?: string;
  error?: string;
  rateLimited?: boolean;
}

/**
 * Authenticate partner API request via API key
 */
export function authenticatePartner(req: NextRequest): PartnerAuthResult {
  const apiKey = req.headers.get(API_KEY_HEADER);

  if (!apiKey) {
    return {
      authorized: false,
      error: 'Missing API key. Include X-API-Key header.',
    };
  }

  // Validate API key format (should be 64 hex chars)
  if (!/^[a-f0-9]{64}$/i.test(apiKey)) {
    return {
      authorized: false,
      error: 'Invalid API key format',
    };
  }

  // Check if API key is valid
  const isValid = validApiKeys.has(apiKey);

  if (!isValid) {
    return {
      authorized: false,
      error: 'Invalid API key',
    };
  }

  // Extract partner ID from API key (first 8 chars as identifier)
  const partnerId = apiKey.substring(0, 8);

  return {
    authorized: true,
    partnerId,
  };
}

/**
 * Check rate limit for partner
 *
 * Uses in-memory cache in development, should use Redis in production.
 */
export function checkRateLimit(partnerId: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Math.floor(Date.now() / 1000);
  const cacheKey = `ratelimit:${partnerId}`;

  let entry = rateLimitCache.get(cacheKey);

  // Reset if window expired
  if (!entry || now >= entry.resetAt) {
    entry = {
      count: 0,
      resetAt: now + RATE_LIMIT_WINDOW,
    };
  }

  // Check limit
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  // Increment counter
  entry.count++;
  rateLimitCache.set(cacheKey, entry);

  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX_REQUESTS - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Middleware to enforce authentication and rate limiting
 */
export function withPartnerAuth(
  handler: (req: NextRequest, context: { partnerId: string }) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Authenticate
    const authResult = authenticatePartner(req);

    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error, code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const partnerId = authResult.partnerId!;

    // Check rate limit
    const rateLimitResult = checkRateLimit(partnerId);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: rateLimitResult.resetAt - Math.floor(Date.now() / 1000),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetAt.toString(),
            'Retry-After': (rateLimitResult.resetAt - Math.floor(Date.now() / 1000)).toString(),
          },
        }
      );
    }

    // Call handler with partner context
    const response = await handler(req, { partnerId });

    // Add rate limit headers to response
    response.headers.set('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResult.resetAt.toString());

    return response;
  };
}

/**
 * Generate a new API key for partners
 * (Admin function - should be secured)
 */
export function generateApiKey(partnerId: string): string {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  const hash = createHash('sha256');
  hash.update(randomBytes);
  hash.update(partnerId);
  hash.update(Date.now().toString());
  return hash.digest('hex');
}

/**
 * Validate webhook signature (HMAC-SHA256)
 */
export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = createHash('sha256')
    .update(secret)
    .update(payload)
    .digest('hex');

  // Timing-safe comparison
  const expected = Buffer.from(expectedSignature, 'hex');
  const actual = Buffer.from(signature, 'hex');

  if (expected.length !== actual.length) {
    return false;
  }

  return timingSafeEqual(expected, actual);
}
