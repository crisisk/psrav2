import Redis from 'ioredis';
import { config, isRedisEnabled } from './config';

type MemoryEntry = {
  data: any;
  expiry: number;
};

export class CacheService {
  private redis: Redis | null = null;
  private memoryCache: Map<string, MemoryEntry> = new Map();
  private redisReady = false;
  private readonly enabled = isRedisEnabled;

  constructor() {
    if (this.enabled && config.redisUrl) {
      this.redis = new Redis(config.redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 3,
      });

      this.redis.on('error', (error) => {
        console.warn('Redis cache error:', error.message);
        this.redisReady = false;
      });
    }

    const timer = setInterval(() => this.cleanupMemoryCache(), 5 * 60 * 1000);
    timer.unref?.();
  }

  private async getRedis(): Promise<Redis | null> {
    if (!this.redis) {
      return null;
    }

    if (!this.redisReady) {
      try {
        if (this.redis.status === 'wait') {
          await this.redis.connect();
        }
        this.redisReady = true;
      } catch (error) {
        console.warn('Unable to connect to Redis:', (error as Error).message);
        this.redis = null;
        return null;
      }
    }

    return this.redis;
  }

  async get<T>(key: string): Promise<T | null> {
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && memoryEntry.expiry > Date.now()) {
      return memoryEntry.data as T;
    }

    const redis = await this.getRedis();
    if (redis) {
      try {
        const redisValue = await redis.get(key);
        if (redisValue) {
          const parsed = JSON.parse(redisValue) as T;
          this.memoryCache.set(key, {
            data: parsed,
            expiry: Date.now() + 5 * 60 * 1000,
          });
          return parsed;
        }
      } catch (error) {
        console.warn('Cache get error:', (error as Error).message);
      }
    }

    return null;
  }

  async set(key: string, value: any, ttlSeconds = 3600): Promise<void> {
    this.memoryCache.set(key, {
      data: value,
      expiry: Date.now() + Math.min(ttlSeconds * 1000, 5 * 60 * 1000),
    });

    const redis = await this.getRedis();
    if (redis) {
      try {
        await redis.setex(key, ttlSeconds, JSON.stringify(value));
      } catch (error) {
        console.warn('Cache set error:', (error as Error).message);
      }
    }
  }

  async del(key: string): Promise<void> {
    this.memoryCache.delete(key);

    const redis = await this.getRedis();
    if (redis) {
      try {
        await redis.del(key);
      } catch (error) {
        console.warn('Cache delete error:', (error as Error).message);
      }
    }
  }

  async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttlSeconds = 3600): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetcher();
    await this.set(key, value, ttlSeconds);
    return value;
  }

  async cacheHsCodes<T = any>(key: string, value: T): Promise<void> {
    await this.set(`hs-codes:${key}`, value, 3600);
  }

  async getCachedHsCodes<T = any>(key: string): Promise<T | null> {
    return this.get<T>(`hs-codes:${key}`);
  }

  async cacheOriginCalculation(request: any, result: any): Promise<void> {
    await this.set(`origin:${JSON.stringify(request)}`, result, 1800);
  }

  async getCachedOriginCalculation(request: any): Promise<any | null> {
    return this.get<any>(`origin:${JSON.stringify(request)}`);
  }

  async cacheTradeAgreements(agreements: any[]): Promise<void> {
    await this.set('trade-agreements:all', agreements, 7200);
  }

  async getCachedTradeAgreements(): Promise<any[] | null> {
    return this.get<any[]>('trade-agreements:all');
  }

  private cleanupMemoryCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.expiry <= now) {
        this.memoryCache.delete(key);
      }
    }
  }

  async getStats(): Promise<{
    redisEnabled: boolean;
    redisConnected: boolean;
    memoryCacheSize: number;
  }> {
    const redis = await this.getRedis();
    return {
      redisEnabled: this.enabled,
      redisConnected: Boolean(redis && this.redisReady),
      memoryCacheSize: this.memoryCache.size,
    };
  }
}

export const cacheService = new CacheService();
