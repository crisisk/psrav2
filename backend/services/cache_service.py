"""Redis-based caching service for PSRA performance optimization.

Provides connection pooling, key-value caching, and cache invalidation patterns.
"""

from __future__ import annotations

import json
import logging
import os
from functools import wraps
from typing import Any, Callable, Optional, TypeVar, cast

import redis
from redis.connection import ConnectionPool

logger = logging.getLogger(__name__)

# Type variable for decorated functions
F = TypeVar("F", bound=Callable[..., Any])


class CacheService:
    """Redis-based caching service with connection pooling."""

    def __init__(
        self,
        host: str | None = None,
        port: int | None = None,
        password: str | None = None,
        db: int = 0,
        max_connections: int = 50,
    ) -> None:
        """Initialize Redis cache service with connection pool.

        Args:
            host: Redis host (defaults to REDIS_HOST env var or 'psra-redis')
            port: Redis port (defaults to REDIS_PORT env var or 6379)
            password: Redis password (defaults to REDIS_PASSWORD env var)
            db: Redis database number (defaults to 0)
            max_connections: Maximum connections in pool (default 50)
        """
        self.host = host or os.getenv("REDIS_HOST", "psra-redis")
        self.port = port or int(os.getenv("REDIS_PORT", "6379"))
        self.password = password or os.getenv("REDIS_PASSWORD")
        self.db = db

        # Create connection pool
        self.pool = ConnectionPool(
            host=self.host,
            port=self.port,
            password=self.password,
            db=self.db,
            max_connections=max_connections,
            decode_responses=True,
        )
        self.client = redis.Redis(connection_pool=self.pool)

        logger.info(
            f"Initialized Redis cache service: {self.host}:{self.port} (db={self.db}, pool_size={max_connections})"
        )

    def get(self, key: str) -> Any | None:
        """Get a value from cache.

        Args:
            key: Cache key

        Returns:
            Cached value (deserialized from JSON) or None if not found
        """
        try:
            value = self.client.get(key)
            if value is None:
                logger.debug(f"Cache MISS: {key}")
                return None

            logger.debug(f"Cache HIT: {key}")
            return json.loads(value)
        except (redis.RedisError, json.JSONDecodeError) as e:
            logger.warning(f"Cache GET error for key '{key}': {e}")
            return None

    def set(
        self,
        key: str,
        value: Any,
        ttl: int | None = None,
    ) -> bool:
        """Set a value in cache with optional TTL.

        Args:
            key: Cache key
            value: Value to cache (will be JSON serialized)
            ttl: Time to live in seconds (None = no expiration)

        Returns:
            True if successful, False otherwise
        """
        try:
            serialized = json.dumps(value, default=str)
            if ttl:
                result = self.client.setex(key, ttl, serialized)
            else:
                result = self.client.set(key, serialized)

            logger.debug(f"Cache SET: {key} (TTL: {ttl}s)")
            return bool(result)
        except (redis.RedisError, TypeError, ValueError) as e:
            logger.warning(f"Cache SET error for key '{key}': {e}")
            return False

    def delete(self, key: str) -> bool:
        """Delete a key from cache.

        Args:
            key: Cache key to delete

        Returns:
            True if key was deleted, False otherwise
        """
        try:
            result = self.client.delete(key)
            logger.debug(f"Cache DELETE: {key}")
            return bool(result)
        except redis.RedisError as e:
            logger.warning(f"Cache DELETE error for key '{key}': {e}")
            return False

    def delete_pattern(self, pattern: str) -> int:
        """Delete all keys matching a pattern.

        Args:
            pattern: Redis key pattern (e.g., 'hs:*', 'rules:*')

        Returns:
            Number of keys deleted
        """
        try:
            keys = list(self.client.scan_iter(match=pattern, count=100))
            if not keys:
                return 0

            deleted = self.client.delete(*keys)
            logger.info(f"Cache INVALIDATE: {pattern} ({deleted} keys deleted)")
            return deleted
        except redis.RedisError as e:
            logger.warning(f"Cache DELETE_PATTERN error for pattern '{pattern}': {e}")
            return 0

    def exists(self, key: str) -> bool:
        """Check if a key exists in cache.

        Args:
            key: Cache key

        Returns:
            True if key exists, False otherwise
        """
        try:
            return bool(self.client.exists(key))
        except redis.RedisError as e:
            logger.warning(f"Cache EXISTS error for key '{key}': {e}")
            return False

    def get_ttl(self, key: str) -> int | None:
        """Get remaining TTL for a key.

        Args:
            key: Cache key

        Returns:
            TTL in seconds, -1 if no expiry, -2 if key doesn't exist, None on error
        """
        try:
            return self.client.ttl(key)
        except redis.RedisError as e:
            logger.warning(f"Cache TTL error for key '{key}': {e}")
            return None

    def ping(self) -> bool:
        """Test Redis connection.

        Returns:
            True if connection is healthy, False otherwise
        """
        try:
            return self.client.ping()
        except redis.RedisError as e:
            logger.error(f"Redis connection error: {e}")
            return False

    def close(self) -> None:
        """Close the Redis connection pool."""
        try:
            self.pool.disconnect()
            logger.info("Redis connection pool closed")
        except Exception as e:
            logger.warning(f"Error closing Redis connection pool: {e}")


# Global cache instance (lazy initialized)
_cache_instance: CacheService | None = None


def get_cache() -> CacheService:
    """Get or create the global cache service instance.

    Returns:
        CacheService instance
    """
    global _cache_instance
    if _cache_instance is None:
        _cache_instance = CacheService()
    return _cache_instance


# Cache key builders
def build_hs_code_key(code: str) -> str:
    """Build cache key for HS code lookup."""
    return f"hs:code:{code}"


def build_hs_search_key(query: str, limit: int = 10) -> str:
    """Build cache key for HS code search."""
    return f"hs:search:{query}:{limit}"


def build_rule_key(rule_id: str) -> str:
    """Build cache key for rule lookup."""
    return f"rule:id:{rule_id}"


def build_rules_by_agreement_key(agreement_code: str) -> str:
    """Build cache key for rules by agreement."""
    return f"rules:agreement:{agreement_code}"


def build_assessment_key(
    rule_id: str,
    hs_code: str,
    origin_country: str,
    dest_country: str,
) -> str:
    """Build cache key for assessment result."""
    return f"assessment:{rule_id}:{hs_code}:{origin_country}:{dest_country}"


def build_verdict_key(evaluation_id: str) -> str:
    """Build cache key for verdict."""
    return f"verdict:{evaluation_id}"


# Decorator for caching function results
def cache_result(ttl: int = 3600, key_builder: Callable[..., str] | None = None):
    """Decorator to cache function results.

    Args:
        ttl: Time to live in seconds (default: 1 hour)
        key_builder: Optional function to build cache key from args/kwargs
                     If not provided, uses function name and str(args)

    Usage:
        @cache_result(ttl=3600)
        def get_hs_code(code: str) -> dict:
            # expensive database lookup
            return result
    """

    def decorator(func: F) -> F:
        @wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            cache = get_cache()

            # Build cache key
            if key_builder:
                cache_key = key_builder(*args, **kwargs)
            else:
                # Default: function name + stringified args
                args_str = ":".join(str(arg) for arg in args)
                kwargs_str = ":".join(f"{k}={v}" for k, v in sorted(kwargs.items()))
                parts = [func.__name__, args_str, kwargs_str]
                cache_key = ":".join(p for p in parts if p)

            # Check cache
            cached_value = cache.get(cache_key)
            if cached_value is not None:
                return cached_value

            # Execute function
            result = func(*args, **kwargs)

            # Cache result
            cache.set(cache_key, result, ttl=ttl)

            return result

        return cast(F, wrapper)

    return decorator


def invalidate_cache(patterns: list[str]):
    """Decorator to invalidate cache patterns after function execution.

    Args:
        patterns: List of Redis key patterns to invalidate (e.g., ['hs:*', 'rules:*'])

    Usage:
        @invalidate_cache(patterns=['hs:*'])
        def update_hs_codes():
            # update database
            pass
    """

    def decorator(func: F) -> F:
        @wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            result = func(*args, **kwargs)

            # Invalidate cache patterns
            cache = get_cache()
            for pattern in patterns:
                cache.delete_pattern(pattern)

            return result

        return cast(F, wrapper)

    return decorator


# Specialized cache functions for PSRA entities

def cache_hs_code(code: str, data: dict, ttl: int = 3600) -> bool:
    """Cache HS code lookup result.

    Args:
        code: HS code
        data: HS code data
        ttl: Time to live (default: 1 hour)

    Returns:
        True if cached successfully
    """
    cache = get_cache()
    key = build_hs_code_key(code)
    return cache.set(key, data, ttl=ttl)


def get_cached_hs_code(code: str) -> dict | None:
    """Get cached HS code.

    Args:
        code: HS code

    Returns:
        Cached HS code data or None
    """
    cache = get_cache()
    key = build_hs_code_key(code)
    return cache.get(key)


def cache_rule(rule_id: str, data: dict, ttl: int = 1800) -> bool:
    """Cache rule lookup result.

    Args:
        rule_id: Rule ID
        data: Rule data
        ttl: Time to live (default: 30 minutes)

    Returns:
        True if cached successfully
    """
    cache = get_cache()
    key = build_rule_key(rule_id)
    return cache.set(key, data, ttl=ttl)


def get_cached_rule(rule_id: str) -> dict | None:
    """Get cached rule.

    Args:
        rule_id: Rule ID

    Returns:
        Cached rule data or None
    """
    cache = get_cache()
    key = build_rule_key(rule_id)
    return cache.get(key)


def cache_assessment(
    rule_id: str,
    hs_code: str,
    origin_country: str,
    dest_country: str,
    result: dict,
    ttl: int = 300,
) -> bool:
    """Cache assessment result.

    Args:
        rule_id: Rule ID
        hs_code: HS code
        origin_country: Origin country code
        dest_country: Destination country code
        result: Assessment result
        ttl: Time to live (default: 5 minutes)

    Returns:
        True if cached successfully
    """
    cache = get_cache()
    key = build_assessment_key(rule_id, hs_code, origin_country, dest_country)
    return cache.set(key, result, ttl=ttl)


def get_cached_assessment(
    rule_id: str,
    hs_code: str,
    origin_country: str,
    dest_country: str,
) -> dict | None:
    """Get cached assessment result.

    Args:
        rule_id: Rule ID
        hs_code: HS code
        origin_country: Origin country code
        dest_country: Destination country code

    Returns:
        Cached assessment result or None
    """
    cache = get_cache()
    key = build_assessment_key(rule_id, hs_code, origin_country, dest_country)
    return cache.get(key)


def invalidate_hs_codes() -> int:
    """Invalidate all HS code caches.

    Returns:
        Number of keys deleted
    """
    cache = get_cache()
    return cache.delete_pattern("hs:*")


def invalidate_rules() -> int:
    """Invalidate all rule caches.

    Returns:
        Number of keys deleted
    """
    cache = get_cache()
    count = cache.delete_pattern("rule:*")
    count += cache.delete_pattern("rules:*")
    return count


def invalidate_assessments() -> int:
    """Invalidate all assessment caches.

    Returns:
        Number of keys deleted
    """
    cache = get_cache()
    return cache.delete_pattern("assessment:*")
