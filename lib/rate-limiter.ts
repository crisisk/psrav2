import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import Redis from 'ioredis';
import { config, isRedisEnabled } from './config';

type MemoryStore = Map<string, number[]>;

const createRedis = () => {
  if (!isRedisEnabled || !config.redisUrl) {
    return null;
  }

  const client = new Redis(config.redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
  });

  client.on('error', (error) => {
    console.warn('Rate limiter redis error:', error.message);
  });

  return client;
};

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export class RateLimiter {
  private config: RateLimitConfig;
  private redis: Redis | null;
  private memoryStore: MemoryStore = new Map();

  constructor(config: RateLimitConfig) {
    const defaults = {
      windowMs: 60_000,
      maxRequests: 100,
      keyGenerator: (req: NextRequest) => this.getClientIdentifier(req),
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
    } as const;

    this.config = {
      windowMs: config.windowMs ?? defaults.windowMs,
      maxRequests: config.maxRequests ?? defaults.maxRequests,
      keyGenerator: config.keyGenerator ?? defaults.keyGenerator,
      skipSuccessfulRequests: config.skipSuccessfulRequests ?? defaults.skipSuccessfulRequests,
      skipFailedRequests: config.skipFailedRequests ?? defaults.skipFailedRequests,
    };

    this.redis = createRedis();
  }

  private getClientIdentifier(req: NextRequest): string {
    const forwarded = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const remoteAddr = req.headers.get('remote-addr');

    let ip = forwarded?.split(',')[0] || realIp || remoteAddr || 'unknown';

    const userAgent = req.headers.get('user-agent') || 'unknown';
    const userAgentHash = this.simpleHash(userAgent);

    return `rate_limit:${ip}:${userAgentHash}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  private async ensureRedis(): Promise<Redis | null> {
    if (!this.redis) {
      return null;
    }

    if (this.redis.status === 'wait') {
      try {
        await this.redis.connect();
      } catch (error) {
        console.warn('Unable to connect to Redis for rate limiting:', (error as Error).message);
        this.redis = null;
        return null;
      }
    }

    return this.redis;
  }

  async checkRateLimit(req: NextRequest): Promise<RateLimitResult> {
    const key = this.config.keyGenerator!(req);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    const redis = await this.ensureRedis();
    if (redis) {
      return this.checkRedis(redis, key, now, windowStart);
    }

    return this.checkMemory(key, now, windowStart);
  }

  private async checkRedis(redis: Redis, key: string, now: number, windowStart: number): Promise<RateLimitResult> {
    const pipeline = redis.pipeline();

    pipeline.zremrangebyscore(key, 0, windowStart);
    pipeline.zcard(key);
    pipeline.zadd(key, now, `${now}-${Math.random()}`);
    pipeline.expire(key, Math.ceil(this.config.windowMs / 1000));

    const results = await pipeline.exec();

    if (!results) {
      return this.checkMemory(key, now, windowStart);
    }

    const currentCount = (results[1][1] as number) || 0;
    const resetTime = now + this.config.windowMs;
    const remaining = Math.max(0, this.config.maxRequests - currentCount - 1);

    if (currentCount >= this.config.maxRequests) {
      return {
        success: false,
        limit: this.config.maxRequests,
        remaining: 0,
        resetTime,
        retryAfter: Math.ceil(this.config.windowMs / 1000),
      };
    }

    return {
      success: true,
      limit: this.config.maxRequests,
      remaining,
      resetTime,
    };
  }

  private checkMemory(key: string, now: number, windowStart: number): RateLimitResult {
    const entries = this.memoryStore.get(key) || [];
    const filtered = entries.filter((timestamp) => timestamp > windowStart);
    filtered.push(now);
    this.memoryStore.set(key, filtered);

    const resetTime = now + this.config.windowMs;
    const remaining = Math.max(0, this.config.maxRequests - filtered.length);

    if (filtered.length > this.config.maxRequests) {
      return {
        success: false,
        limit: this.config.maxRequests,
        remaining: 0,
        resetTime,
        retryAfter: Math.ceil(this.config.windowMs / 1000),
      };
    }

    return {
      success: true,
      limit: this.config.maxRequests,
      remaining,
      resetTime,
    };
  }

  createMiddleware() {
    return async (req: NextRequest): Promise<NextResponse | null> => {
      const result = await this.checkRateLimit(req);

      if (!result.success) {
        const response = NextResponse.json(
          {
            error: 'Too Many Requests',
            message: `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
            retryAfter: result.retryAfter,
          },
          { status: 429 }
        );

        response.headers.set('X-RateLimit-Limit', result.limit.toString());
        response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
        response.headers.set('X-RateLimit-Reset', result.resetTime.toString());
        response.headers.set('Retry-After', result.retryAfter!.toString());

        return response;
      }

      const response = NextResponse.next();
      response.headers.set('X-RateLimit-Limit', result.limit.toString());
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
      response.headers.set('X-RateLimit-Reset', result.resetTime.toString());

      return null;
    };
  }
}

export const generalRateLimiter = new RateLimiter({
  windowMs: 60000,
  maxRequests: 100,
});

export const heavyOperationRateLimiter = new RateLimiter({
  windowMs: 60000,
  maxRequests: 10,
});

export const authRateLimiter = new RateLimiter({
  windowMs: 900000,
  maxRequests: 5,
});

export async function withRateLimit(
  req: NextRequest,
  rateLimiter: RateLimiter,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const rateLimitResult = await rateLimiter.checkRateLimit(req);

  if (!rateLimitResult.success) {
    const response = NextResponse.json(
      {
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${rateLimitResult.retryAfter} seconds.`,
        retryAfter: rateLimitResult.retryAfter,
      },
      { status: 429 }
    );

    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());
    response.headers.set('Retry-After', rateLimitResult.retryAfter!.toString());

    return response;
  }

  const response = await handler();
  response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
  response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
  response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());

  return response;
}
