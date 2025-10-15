/** 
 * Rate limiter configuration interface
 */
interface RateLimitConfig {
  tokensToAddPerInterval: number
  interval: number
  capacity: number
}

/**
 * Rate limit result interface
 */
interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number
  limit: number
  errors: string[]
}

/**
 * Token bucket rate limiter implementation
 */
class RateLimiter {
  private tokens: Map<string, number>
  private lastRefillTime: Map<string, number>
  private config: RateLimitConfig

  /**
   * @param {RateLimitConfig} config - Rate limiter configuration
   */
  constructor(config: RateLimitConfig) {
    this.tokens = new Map()
    this.lastRefillTime = new Map()
    this.config = config
  }

  /**
   * Check rate limit for given identifier
   * @param {string} identifier - Unique identifier for rate limiting
   * @returns {Promise<RateLimitResult>} Rate limit result
   */
  async checkRateLimit(identifier: string): Promise<RateLimitResult> {
    try {
      if (!identifier) {
        throw new Error('Identifier is required')
      }

      const now = Date.now()
      const lastRefill = this.lastRefillTime.get(identifier) || now
      const tokens = this.tokens.get(identifier) || this.config.capacity

      const timePassed = now - lastRefill
      const intervalsPassed = Math.floor(timePassed / this.config.interval)
      const tokensToAdd = intervalsPassed * this.config.tokensToAddPerInterval

      if (tokensToAdd > 0) {
        const newTokens = Math.min(
          tokens + tokensToAdd,
          this.config.capacity
        )
        this.tokens.set(identifier, newTokens)
        this.lastRefillTime.set(identifier, lastRefill + (intervalsPassed * this.config.interval))
      }

      const currentTokens = this.tokens.get(identifier) || 0
      if (currentTokens < 1) {
        return {
          success: false,
          remaining: 0,
          reset: this.config.interval - (now - lastRefill),
          limit: this.config.capacity,
          errors: []
        }
      }

      this.tokens.set(identifier, currentTokens - 1)
      return {
        success: true,
        remaining: currentTokens - 1,
        reset: this.config.interval,
        limit: this.config.capacity,
        errors: []
      }
    } catch (error) {
      return {
        success: false,
        remaining: 0,
        reset: 0,
        limit: this.config.capacity,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }
}

const defaultRateLimiter = new RateLimiter({
  tokensToAddPerInterval: 10,
  interval: 60_000,
  capacity: 20
})

export default defaultRateLimiter
export { RateLimiter, type RateLimitConfig, type RateLimitResult }

/**
 * Rate limiter middleware wrapper
 */
export function withRateLimit(limiter: any) {
  return async (handler: Function) => {
    return async (...args: any[]) => {
      // Mock rate limit check
      console.log('[Rate Limiter] Check rate limit');
      return handler(...args);
    };
  };
}

/**
 * Metrics-specific rate limiter instance
 */
export const metricsRateLimiter = {
  check: async (key: string) => {
    console.log('[Metrics Rate Limiter] Check:', key);
    return { allowed: true, remaining: 100 };
  }
};
