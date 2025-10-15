"""
Redis caching layer with cache-aside pattern.
Supports rules lookup and HS code autocomplete caching.
"""

import redis.asyncio as redis
from typing import Optional, List
import json
import logging
from datetime import timedelta

logger = logging.getLogger(__name__)

class RedisCache:
    """Redis caching wrapper with metrics tracking."""

    def __init__(self, redis_url: str):
        self.redis_url = redis_url
        self.client: Optional[redis.Redis] = None
        self.cache_hits = 0
        self.cache_misses = 0

    async def connect(self):
        """Initialize Redis connection."""
        if not self.client:
            self.client = redis.from_url(self.redis_url, encoding="utf-8", decode_responses=True)
            logger.info(f"Connected to Redis at {self.redis_url}")

    async def disconnect(self):
        """Close Redis connection."""
        if self.client:
            await self.client.close()
            logger.info("Disconnected from Redis")

    async def get(self, key: str) -> Optional[str]:
        """
        Get value from cache.

        Args:
            key: Cache key

        Returns:
            Cached value or None if not found
        """
        if not self.client:
            await self.connect()

        try:
            value = await self.client.get(key)
            if value:
                self.cache_hits += 1
                logger.debug(f"Cache hit for key: {key}")
                return value
            else:
                self.cache_misses += 1
                logger.debug(f"Cache miss for key: {key}")
                return None
        except Exception as e:
            logger.error(f"Redis GET error for key {key}: {e}")
            return None

    async def set(self, key: str, value: str, ttl: Optional[int] = None):
        """
        Set value in cache with optional TTL.

        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds
        """
        if not self.client:
            await self.connect()

        try:
            if ttl:
                await self.client.setex(key, ttl, value)
            else:
                await self.client.set(key, value)
            logger.debug(f"Cached value for key: {key} (TTL: {ttl}s)")
        except Exception as e:
            logger.error(f"Redis SET error for key {key}: {e}")

    async def delete(self, key: str):
        """
        Delete key from cache.

        Args:
            key: Cache key to delete
        """
        if not self.client:
            await self.connect()

        try:
            await self.client.delete(key)
            logger.debug(f"Deleted cache key: {key}")
        except Exception as e:
            logger.error(f"Redis DELETE error for key {key}: {e}")

    async def get_json(self, key: str) -> Optional[dict]:
        """Get JSON value from cache."""
        value = await self.get(key)
        if value:
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                logger.error(f"Failed to decode JSON for key: {key}")
                return None
        return None

    async def set_json(self, key: str, value: dict, ttl: Optional[int] = None):
        """Set JSON value in cache."""
        try:
            json_str = json.dumps(value)
            await self.set(key, json_str, ttl)
        except (TypeError, ValueError) as e:
            logger.error(f"Failed to encode JSON for key {key}: {e}")

    async def cache_rules(self, agreement: str, hs_code: str, rules: dict, ttl: int = 3600):
        """
        Cache rules lookup result.

        Args:
            agreement: Trade agreement
            hs_code: HS code
            rules: Rules data
            ttl: TTL in seconds (default: 1 hour)
        """
        cache_key = f"rules:{agreement}:{hs_code}"
        await self.set_json(cache_key, rules, ttl)

    async def get_cached_rules(self, agreement: str, hs_code: str) -> Optional[dict]:
        """
        Get cached rules lookup result.

        Args:
            agreement: Trade agreement
            hs_code: HS code

        Returns:
            Cached rules or None
        """
        cache_key = f"rules:{agreement}:{hs_code}"
        return await self.get_json(cache_key)

    async def invalidate_rules(self, agreement: str, hs_code: str):
        """
        Invalidate cached rules.

        Args:
            agreement: Trade agreement
            hs_code: HS code
        """
        cache_key = f"rules:{agreement}:{hs_code}"
        await self.delete(cache_key)
        logger.info(f"Invalidated cache for rules: {agreement}/{hs_code}")

    async def cache_hs_codes(self, prefix: str, hs_codes: List[str], ttl: int = 86400):
        """
        Cache HS code autocomplete results.

        Args:
            prefix: Search prefix
            hs_codes: List of HS codes (top 50)
            ttl: TTL in seconds (default: 24 hours)
        """
        cache_key = f"hscodes:search:{prefix}"
        # Store as comma-separated string for efficiency
        value = ",".join(hs_codes[:50])
        await self.set(cache_key, value, ttl)

    async def get_cached_hs_codes(self, prefix: str) -> Optional[List[str]]:
        """
        Get cached HS code autocomplete results.

        Args:
            prefix: Search prefix

        Returns:
            List of cached HS codes or None
        """
        cache_key = f"hscodes:search:{prefix}"
        value = await self.get(cache_key)
        if value:
            return value.split(",")
        return None

    def get_metrics(self) -> dict:
        """Get cache metrics."""
        total = self.cache_hits + self.cache_misses
        hit_rate = (self.cache_hits / total * 100) if total > 0 else 0

        return {
            "cache_hits": self.cache_hits,
            "cache_misses": self.cache_misses,
            "hit_rate_percent": round(hit_rate, 2)
        }

# Global instance
_redis_cache: Optional[RedisCache] = None

def get_redis_client(redis_url: str = "redis://psra-redis:6379/0") -> RedisCache:
    """Get or create Redis cache instance."""
    global _redis_cache
    if not _redis_cache:
        _redis_cache = RedisCache(redis_url)
    return _redis_cache
