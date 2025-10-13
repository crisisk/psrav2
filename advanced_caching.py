"""
Advanced Caching Implementation for PSRA-LTSD Origin Engine

This module implements advanced caching strategies for the Origin Engine,
including hierarchical caching, semantic caching, and predictive caching.
"""

import os
import time
import json
import hashlib
import logging
from typing import Dict, List, Optional, Any, Tuple, Union, Callable
from datetime import datetime, timedelta
import asyncio
import threading
from functools import lru_cache

from pydantic import BaseModel, Field

# Configure logging
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("advanced_caching")

# Environment configuration
CACHE_TTL = int(os.getenv("CACHE_TTL", "86400"))  # 24 hours by default
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
MEMORY_CACHE_SIZE = int(os.getenv("MEMORY_CACHE_SIZE", "1000"))
SEMANTIC_CACHE_THRESHOLD = float(os.getenv("SEMANTIC_CACHE_THRESHOLD", "0.9"))
ENABLE_PREDICTIVE_CACHING = os.getenv("ENABLE_PREDICTIVE_CACHING", "true").lower() == "true"
PREDICTIVE_CACHE_INTERVAL = int(os.getenv("PREDICTIVE_CACHE_INTERVAL", "3600"))  # 1 hour by default

# Define cache models
class CacheEntry(BaseModel):
    """Model for a cache entry."""
    key: str
    value: Any
    created_at: datetime = Field(default_factory=datetime.now)
    expires_at: Optional[datetime] = None
    hit_count: int = 0
    last_accessed: datetime = Field(default_factory=datetime.now)
    
    def is_expired(self) -> bool:
        """Check if the cache entry is expired."""
        if self.expires_at is None:
            return False
        return datetime.now() > self.expires_at

class CacheStats(BaseModel):
    """Model for cache statistics."""
    hits: int = 0
    misses: int = 0
    evictions: int = 0
    size: int = 0
    hit_rate: float = 0.0
    
    def update_hit_rate(self):
        """Update the hit rate."""
        total = self.hits + self.misses
        self.hit_rate = self.hits / total if total > 0 else 0.0

class SemanticCacheEntry(CacheEntry):
    """Model for a semantic cache entry."""
    embedding: List[float]
    
    class Config:
        arbitrary_types_allowed = True

class PredictiveCacheEntry(BaseModel):
    """Model for a predictive cache entry."""
    key_pattern: str
    probability: float
    last_predicted: datetime = Field(default_factory=datetime.now)
    hit_count: int = 0
    miss_count: int = 0
    
    def update_probability(self, hit: bool):
        """Update the probability based on a hit or miss."""
        if hit:
            self.hit_count += 1
        else:
            self.miss_count += 1
        
        total = self.hit_count + self.miss_count
        self.probability = self.hit_count / total if total > 0 else 0.0

# Base Cache Interface
class BaseCache:
    """Base interface for cache implementations."""
    
    def __init__(self, name: str = "base"):
        """Initialize the cache."""
        self.name = name
        self.stats = CacheStats()
    
    async def get(self, key: str) -> Optional[Any]:
        """Get a value from the cache."""
        raise NotImplementedError
    
    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Set a value in the cache."""
        raise NotImplementedError
    
    async def delete(self, key: str) -> None:
        """Delete a value from the cache."""
        raise NotImplementedError
    
    async def clear(self) -> None:
        """Clear the cache."""
        raise NotImplementedError
    
    async def get_stats(self) -> CacheStats:
        """Get cache statistics."""
        return self.stats

# Memory Cache Implementation
class MemoryCache(BaseCache):
    """In-memory cache implementation."""
    
    def __init__(self, name: str = "memory", max_size: int = MEMORY_CACHE_SIZE):
        """Initialize the memory cache."""
        super().__init__(name)
        self.cache: Dict[str, CacheEntry] = {}
        self.max_size = max_size
        self.lock = asyncio.Lock()
    
    async def get(self, key: str) -> Optional[Any]:
        """Get a value from the cache."""
        async with self.lock:
            if key in self.cache:
                entry = self.cache[key]
                
                # Check if the entry is expired
                if entry.is_expired():
                    del self.cache[key]
                    self.stats.misses += 1
                    self.stats.size = len(self.cache)
                    return None
                
                # Update access statistics
                entry.hit_count += 1
                entry.last_accessed = datetime.now()
                
                self.stats.hits += 1
                self.stats.update_hit_rate()
                
                return entry.value
            
            self.stats.misses += 1
            self.stats.update_hit_rate()
            return None
    
    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Set a value in the cache."""
        async with self.lock:
            # Check if we need to evict entries
            if len(self.cache) >= self.max_size and key not in self.cache:
                await self._evict()
            
            # Calculate expiration time
            expires_at = datetime.now() + timedelta(seconds=ttl) if ttl is not None else None
            
            # Create or update the entry
            if key in self.cache:
                entry = self.cache[key]
                entry.value = value
                entry.created_at = datetime.now()
                entry.expires_at = expires_at
                entry.last_accessed = datetime.now()
            else:
                entry = CacheEntry(
                    key=key,
                    value=value,
                    created_at=datetime.now(),
                    expires_at=expires_at,
                    hit_count=0,
                    last_accessed=datetime.now()
                )
                self.cache[key] = entry
            
            self.stats.size = len(self.cache)
    
    async def delete(self, key: str) -> None:
        """Delete a value from the cache."""
        async with self.lock:
            if key in self.cache:
                del self.cache[key]
                self.stats.size = len(self.cache)
    
    async def clear(self) -> None:
        """Clear the cache."""
        async with self.lock:
            self.cache.clear()
            self.stats.size = 0
    
    async def _evict(self) -> None:
        """Evict entries from the cache."""
        # First, remove expired entries
        expired_keys = [key for key, entry in self.cache.items() if entry.is_expired()]
        for key in expired_keys:
            del self.cache[key]
            self.stats.evictions += 1
        
        # If we still need to evict, use LRU strategy
        if len(self.cache) >= self.max_size:
            # Sort by last accessed time
            sorted_entries = sorted(self.cache.items(), key=lambda x: x[1].last_accessed)
            
            # Remove the least recently used entries
            entries_to_remove = len(self.cache) - self.max_size + 1  # +1 for the new entry
            for i in range(entries_to_remove):
                if i < len(sorted_entries):
                    del self.cache[sorted_entries[i][0]]
                    self.stats.evictions += 1

# Redis Cache Implementation
class RedisCache(BaseCache):
    """Redis-based distributed cache implementation."""
    
    def __init__(self, name: str = "redis", url: str = REDIS_URL, prefix: str = "psra:cache:"):
        """Initialize the Redis cache."""
        super().__init__(name)
        self.url = url
        self.prefix = prefix
        self.redis_client = None
        self._connect()
    
    def _connect(self):
        """Connect to Redis."""
        try:
            import redis
            self.redis_client = redis.from_url(self.url)
            logger.info(f"Connected to Redis cache at {self.url}")
        except ImportError:
            logger.warning("Redis package not installed")
        except Exception as e:
            logger.warning(f"Failed to connect to Redis: {e}")
    
    async def get(self, key: str) -> Optional[Any]:
        """Get a value from the cache."""
        if not self.redis_client:
            self.stats.misses += 1
            return None
        
        try:
            # Get the value from Redis
            redis_key = f"{self.prefix}{key}"
            value = self.redis_client.get(redis_key)
            
            if value is None:
                self.stats.misses += 1
                self.stats.update_hit_rate()
                return None
            
            # Update statistics
            self.redis_client.hincrby(f"{self.prefix}stats", "hits", 1)
            self.redis_client.hincrby(f"{self.prefix}stats:{key}", "hit_count", 1)
            self.redis_client.hset(f"{self.prefix}stats:{key}", "last_accessed", datetime.now().isoformat())
            
            self.stats.hits += 1
            self.stats.update_hit_rate()
            
            # Parse the value
            return json.loads(value)
        except Exception as e:
            logger.warning(f"Error getting value from Redis: {e}")
            self.stats.misses += 1
            self.stats.update_hit_rate()
            return None
    
    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Set a value in the cache."""
        if not self.redis_client:
            return
        
        try:
            # Set the value in Redis
            redis_key = f"{self.prefix}{key}"
            serialized_value = json.dumps(value)
            
            if ttl is not None:
                self.redis_client.setex(redis_key, ttl, serialized_value)
            else:
                self.redis_client.set(redis_key, serialized_value)
            
            # Update statistics
            self.redis_client.hset(
                f"{self.prefix}stats:{key}",
                mapping={
                    "created_at": datetime.now().isoformat(),
                    "last_accessed": datetime.now().isoformat(),
                    "hit_count": 0
                }
            )
            
            # Update size statistic
            self.stats.size = self.redis_client.dbsize()
        except Exception as e:
            logger.warning(f"Error setting value in Redis: {e}")
    
    async def delete(self, key: str) -> None:
        """Delete a value from the cache."""
        if not self.redis_client:
            return
        
        try:
            # Delete the value from Redis
            redis_key = f"{self.prefix}{key}"
            self.redis_client.delete(redis_key)
            self.redis_client.delete(f"{self.prefix}stats:{key}")
            
            # Update size statistic
            self.stats.size = self.redis_client.dbsize()
        except Exception as e:
            logger.warning(f"Error deleting value from Redis: {e}")
    
    async def clear(self) -> None:
        """Clear the cache."""
        if not self.redis_client:
            return
        
        try:
            # Delete all keys with the prefix
            cursor = 0
            while True:
                cursor, keys = self.redis_client.scan(cursor, f"{self.prefix}*", 100)
                if keys:
                    self.redis_client.delete(*keys)
                if cursor == 0:
                    break
            
            # Update size statistic
            self.stats.size = self.redis_client.dbsize()
        except Exception as e:
            logger.warning(f"Error clearing Redis cache: {e}")
    
    async def get_stats(self) -> CacheStats:
        """Get cache statistics."""
        if not self.redis_client:
            return self.stats
        
        try:
            # Get statistics from Redis
            stats = self.redis_client.hgetall(f"{self.prefix}stats")
            
            # Update local stats
            self.stats.hits = int(stats.get(b"hits", 0))
            self.stats.misses = int(stats.get(b"misses", 0))
            self.stats.evictions = int(stats.get(b"evictions", 0))
            self.stats.size = self.redis_client.dbsize()
            self.stats.update_hit_rate()
        except Exception as e:
            logger.warning(f"Error getting Redis cache statistics: {e}")
        
        return self.stats

# Semantic Cache Implementation
class SemanticCache(BaseCache):
    """Semantic cache implementation."""
    
    def __init__(
        self,
        name: str = "semantic",
        max_size: int = MEMORY_CACHE_SIZE,
        similarity_threshold: float = SEMANTIC_CACHE_THRESHOLD
    ):
        """Initialize the semantic cache."""
        super().__init__(name)
        self.cache: Dict[str, SemanticCacheEntry] = {}
        self.max_size = max_size
        self.similarity_threshold = similarity_threshold
        self.lock = asyncio.Lock()
        self.embedding_model = None
        self._initialize_embedding_model()
    
    def _initialize_embedding_model(self):
        """Initialize the embedding model."""
        try:
            from sentence_transformers import SentenceTransformer
            self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
            logger.info("Initialized embedding model for semantic cache")
        except ImportError:
            logger.warning("SentenceTransformer package not installed, semantic cache will use hash-based fallback")
        except Exception as e:
            logger.warning(f"Error initializing embedding model: {e}")
    
    def _compute_embedding(self, text: str) -> List[float]:
        """Compute an embedding for the given text."""
        if self.embedding_model is None:
            # Fallback to a simple hash-based approach
            hash_value = hashlib.md5(text.encode()).hexdigest()
            # Convert hash to a list of floats
            return [float(int(hash_value[i:i+8], 16)) / 2**32 for i in range(0, len(hash_value), 8)]
        
        # Compute embedding using the model
        return self.embedding_model.encode(text).tolist()
    
    def _compute_similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        """Compute the cosine similarity between two embeddings."""
        if len(embedding1) != len(embedding2):
            return 0.0
        
        dot_product = sum(a * b for a, b in zip(embedding1, embedding2))
        magnitude1 = sum(a * a for a in embedding1) ** 0.5
        magnitude2 = sum(b * b for b in embedding2) ** 0.5
        
        if magnitude1 == 0 or magnitude2 == 0:
            return 0.0
        
        return dot_product / (magnitude1 * magnitude2)
    
    def _find_similar_entry(self, query_embedding: List[float]) -> Optional[Tuple[str, float]]:
        """Find a similar entry in the cache."""
        best_match = None
        best_similarity = 0.0
        
        for key, entry in self.cache.items():
            if entry.is_expired():
                continue
            
            similarity = self._compute_similarity(query_embedding, entry.embedding)
            
            if similarity > self.similarity_threshold and similarity > best_similarity:
                best_match = key
                best_similarity = similarity
        
        if best_match is not None:
            return best_match, best_similarity
        
        return None
    
    async def get(self, key: str, query: str) -> Optional[Any]:
        """Get a value from the cache based on semantic similarity."""
        async with self.lock:
            # First, try an exact match
            if key in self.cache:
                entry = self.cache[key]
                
                # Check if the entry is expired
                if entry.is_expired():
                    del self.cache[key]
                    self.stats.misses += 1
                    self.stats.size = len(self.cache)
                    return None
                
                # Update access statistics
                entry.hit_count += 1
                entry.last_accessed = datetime.now()
                
                self.stats.hits += 1
                self.stats.update_hit_rate()
                
                return entry.value
            
            # If no exact match, try semantic matching
            query_embedding = self._compute_embedding(query)
            similar_entry = self._find_similar_entry(query_embedding)
            
            if similar_entry is not None:
                similar_key, similarity = similar_entry
                entry = self.cache[similar_key]
                
                # Update access statistics
                entry.hit_count += 1
                entry.last_accessed = datetime.now()
                
                self.stats.hits += 1
                self.stats.update_hit_rate()
                
                logger.info(f"Semantic cache hit with similarity {similarity:.4f}: {similar_key}")
                
                return entry.value
            
            self.stats.misses += 1
            self.stats.update_hit_rate()
            return None
    
    async def set(self, key: str, value: Any, query: str, ttl: Optional[int] = None) -> None:
        """Set a value in the cache with semantic information."""
        async with self.lock:
            # Check if we need to evict entries
            if len(self.cache) >= self.max_size and key not in self.cache:
                await self._evict()
            
            # Calculate expiration time
            expires_at = datetime.now() + timedelta(seconds=ttl) if ttl is not None else None
            
            # Compute embedding
            embedding = self._compute_embedding(query)
            
            # Create or update the entry
            if key in self.cache:
                entry = self.cache[key]
                entry.value = value
                entry.embedding = embedding
                entry.created_at = datetime.now()
                entry.expires_at = expires_at
                entry.last_accessed = datetime.now()
            else:
                entry = SemanticCacheEntry(
                    key=key,
                    value=value,
                    embedding=embedding,
                    created_at=datetime.now(),
                    expires_at=expires_at,
                    hit_count=0,
                    last_accessed=datetime.now()
                )
                self.cache[key] = entry
            
            self.stats.size = len(self.cache)
    
    async def delete(self, key: str) -> None:
        """Delete a value from the cache."""
        async with self.lock:
            if key in self.cache:
                del self.cache[key]
                self.stats.size = len(self.cache)
    
    async def clear(self) -> None:
        """Clear the cache."""
        async with self.lock:
            self.cache.clear()
            self.stats.size = 0
    
    async def _evict(self) -> None:
        """Evict entries from the cache."""
        # First, remove expired entries
        expired_keys = [key for key, entry in self.cache.items() if entry.is_expired()]
        for key in expired_keys:
            del self.cache[key]
            self.stats.evictions += 1
        
        # If we still need to evict, use LRU strategy
        if len(self.cache) >= self.max_size:
            # Sort by last accessed time
            sorted_entries = sorted(self.cache.items(), key=lambda x: x[1].last_accessed)
            
            # Remove the least recently used entries
            entries_to_remove = len(self.cache) - self.max_size + 1  # +1 for the new entry
            for i in range(entries_to_remove):
                if i < len(sorted_entries):
                    del self.cache[sorted_entries[i][0]]
                    self.stats.evictions += 1

# Predictive Cache Implementation
class PredictiveCache(BaseCache):
    """Predictive cache implementation."""
    
    def __init__(
        self,
        name: str = "predictive",
        underlying_cache: BaseCache = None,
        prediction_interval: int = PREDICTIVE_CACHE_INTERVAL
    ):
        """Initialize the predictive cache."""
        super().__init__(name)
        self.underlying_cache = underlying_cache or MemoryCache(f"{name}_underlying")
        self.predictions: Dict[str, PredictiveCacheEntry] = {}
        self.access_history: List[Tuple[str, datetime]] = []
        self.prediction_interval = prediction_interval
        self.lock = asyncio.Lock()
        self.prediction_thread = None
        
        if ENABLE_PREDICTIVE_CACHING:
            self._start_prediction_thread()
    
    def _start_prediction_thread(self):
        """Start the prediction thread."""
        if self.prediction_thread is not None:
            return
        
        self.prediction_thread = threading.Thread(target=self._prediction_loop)
        self.prediction_thread.daemon = True
        self.prediction_thread.start()
        logger.info("Started predictive caching thread")
    
    def _prediction_loop(self):
        """Prediction loop for the prediction thread."""
        while True:
            try:
                # Sleep for the prediction interval
                time.sleep(self.prediction_interval)
                
                # Generate predictions
                asyncio.run(self._generate_predictions())
            except Exception as e:
                logger.warning(f"Error in prediction loop: {e}")
    
    async def _generate_predictions(self):
        """Generate predictions based on access history."""
        async with self.lock:
            # Remove old entries from access history
            cutoff_time = datetime.now() - timedelta(seconds=self.prediction_interval * 10)
            self.access_history = [
                (key, timestamp) for key, timestamp in self.access_history
                if timestamp > cutoff_time
            ]
            
            # If we don't have enough history, skip prediction
            if len(self.access_history) < 10:
                return
            
            # Analyze access patterns
            patterns = {}
            
            # Look for sequential patterns
            for i in range(len(self.access_history) - 1):
                key1, _ = self.access_history[i]
                key2, _ = self.access_history[i + 1]
                
                pattern = f"{key1} -> {key2}"
                patterns[pattern] = patterns.get(pattern, 0) + 1
            
            # Look for time-based patterns (e.g., daily, hourly)
            time_patterns = {}
            for key, timestamp in self.access_history:
                # Hourly pattern
                hour_pattern = f"{key}@{timestamp.hour}"
                time_patterns[hour_pattern] = time_patterns.get(hour_pattern, 0) + 1
                
                # Daily pattern
                day_pattern = f"{key}@{timestamp.weekday()}"
                time_patterns[day_pattern] = time_patterns.get(day_pattern, 0) + 1
            
            # Combine patterns
            all_patterns = {**patterns, **time_patterns}
            
            # Filter and sort patterns
            min_occurrences = max(3, len(self.access_history) // 10)
            significant_patterns = {
                k: v for k, v in all_patterns.items()
                if v >= min_occurrences
            }
            
            sorted_patterns = sorted(
                significant_patterns.items(),
                key=lambda x: x[1],
                reverse=True
            )
            
            # Update predictions
            self.predictions = {}
            for pattern, count in sorted_patterns[:20]:  # Keep top 20 patterns
                probability = count / len(self.access_history)
                
                # Extract the key to predict
                if " -> " in pattern:
                    # Sequential pattern
                    _, key = pattern.split(" -> ")
                elif "@" in pattern:
                    # Time-based pattern
                    key, _ = pattern.split("@")
                else:
                    continue
                
                self.predictions[pattern] = PredictiveCacheEntry(
                    key_pattern=pattern,
                    probability=probability,
                    last_predicted=datetime.now(),
                    hit_count=0,
                    miss_count=0
                )
            
            logger.info(f"Generated {len(self.predictions)} predictions")
    
    async def get(self, key: str) -> Optional[Any]:
        """Get a value from the cache."""
        # Record access in history
        async with self.lock:
            self.access_history.append((key, datetime.now()))
        
        # Try to get from underlying cache
        value = await self.underlying_cache.get(key)
        
        if value is not None:
            self.stats.hits += 1
            self.stats.update_hit_rate()
            
            # Update prediction statistics
            for pattern, entry in self.predictions.items():
                if pattern.endswith(key) or (pattern.startswith(key) and "@" in pattern):
                    entry.update_probability(True)
            
            return value
        
        self.stats.misses += 1
        self.stats.update_hit_rate()
        
        # Update prediction statistics
        for pattern, entry in self.predictions.items():
            if pattern.endswith(key) or (pattern.startswith(key) and "@" in pattern):
                entry.update_probability(False)
        
        return None
    
    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Set a value in the cache."""
        await self.underlying_cache.set(key, value, ttl)
        self.stats.size = (await self.underlying_cache.get_stats()).size
    
    async def delete(self, key: str) -> None:
        """Delete a value from the cache."""
        await self.underlying_cache.delete(key)
        self.stats.size = (await self.underlying_cache.get_stats()).size
    
    async def clear(self) -> None:
        """Clear the cache."""
        await self.underlying_cache.clear()
        self.stats.size = 0
        
        async with self.lock:
            self.predictions.clear()
            self.access_history.clear()
    
    async def prefetch(self) -> None:
        """Prefetch predicted values."""
        # This would be called by a background task
        pass

# Hierarchical Cache Implementation
class HierarchicalCache(BaseCache):
    """Hierarchical cache implementation."""
    
    def __init__(
        self,
        name: str = "hierarchical",
        memory_cache: Optional[BaseCache] = None,
        redis_cache: Optional[BaseCache] = None,
        semantic_cache: Optional[SemanticCache] = None,
        predictive_cache: Optional[PredictiveCache] = None
    ):
        """Initialize the hierarchical cache."""
        super().__init__(name)
        self.memory_cache = memory_cache or MemoryCache(f"{name}_memory")
        self.redis_cache = redis_cache
        self.semantic_cache = semantic_cache
        self.predictive_cache = predictive_cache
    
    async def get(self, key: str, query: Optional[str] = None) -> Optional[Any]:
        """Get a value from the cache."""
        # Try memory cache first
        value = await self.memory_cache.get(key)
        if value is not None:
            self.stats.hits += 1
            self.stats.update_hit_rate()
            return value
        
        # Try semantic cache if query is provided
        if query is not None and self.semantic_cache is not None:
            value = await self.semantic_cache.get(key, query)
            if value is not None:
                # Propagate to memory cache
                await self.memory_cache.set(key, value)
                
                self.stats.hits += 1
                self.stats.update_hit_rate()
                return value
        
        # Try predictive cache
        if self.predictive_cache is not None:
            value = await self.predictive_cache.get(key)
            if value is not None:
                # Propagate to memory cache
                await self.memory_cache.set(key, value)
                
                self.stats.hits += 1
                self.stats.update_hit_rate()
                return value
        
        # Try Redis cache
        if self.redis_cache is not None:
            value = await self.redis_cache.get(key)
            if value is not None:
                # Propagate to memory cache
                await self.memory_cache.set(key, value)
                
                self.stats.hits += 1
                self.stats.update_hit_rate()
                return value
        
        self.stats.misses += 1
        self.stats.update_hit_rate()
        return None
    
    async def set(self, key: str, value: Any, ttl: Optional[int] = None, query: Optional[str] = None) -> None:
        """Set a value in the cache."""
        # Set in memory cache
        await self.memory_cache.set(key, value, ttl)
        
        # Set in semantic cache if query is provided
        if query is not None and self.semantic_cache is not None:
            await self.semantic_cache.set(key, value, query, ttl)
        
        # Set in Redis cache
        if self.redis_cache is not None:
            await self.redis_cache.set(key, value, ttl)
        
        self.stats.size = (await self.memory_cache.get_stats()).size
    
    async def delete(self, key: str) -> None:
        """Delete a value from the cache."""
        # Delete from all caches
        await self.memory_cache.delete(key)
        
        if self.semantic_cache is not None:
            await self.semantic_cache.delete(key)
        
        if self.predictive_cache is not None:
            await self.predictive_cache.delete(key)
        
        if self.redis_cache is not None:
            await self.redis_cache.delete(key)
        
        self.stats.size = (await self.memory_cache.get_stats()).size
    
    async def clear(self) -> None:
        """Clear the cache."""
        # Clear all caches
        await self.memory_cache.clear()
        
        if self.semantic_cache is not None:
            await self.semantic_cache.clear()
        
        if self.predictive_cache is not None:
            await self.predictive_cache.clear()
        
        if self.redis_cache is not None:
            await self.redis_cache.clear()
        
        self.stats.size = 0
    
    async def get_stats(self) -> Dict[str, CacheStats]:
        """Get cache statistics for all layers."""
        stats = {
            "memory": await self.memory_cache.get_stats()
        }
        
        if self.semantic_cache is not None:
            stats["semantic"] = await self.semantic_cache.get_stats()
        
        if self.predictive_cache is not None:
            stats["predictive"] = await self.predictive_cache.get_stats()
        
        if self.redis_cache is not None:
            stats["redis"] = await self.redis_cache.get_stats()
        
        # Aggregate stats
        self.stats.hits = sum(s.hits for s in stats.values())
        self.stats.misses = sum(s.misses for s in stats.values())
        self.stats.evictions = sum(s.evictions for s in stats.values())
        self.stats.size = stats["memory"].size
        self.stats.update_hit_rate()
        
        stats["total"] = self.stats
        
        return stats

# Create a default hierarchical cache
def create_default_cache() -> HierarchicalCache:
    """Create a default hierarchical cache."""
    memory_cache = MemoryCache("memory", MEMORY_CACHE_SIZE)
    
    redis_cache = None
    if REDIS_URL:
        redis_cache = RedisCache("redis", REDIS_URL)
    
    semantic_cache = SemanticCache("semantic", MEMORY_CACHE_SIZE // 2, SEMANTIC_CACHE_THRESHOLD)
    
    predictive_cache = None
    if ENABLE_PREDICTIVE_CACHING:
        predictive_cache = PredictiveCache("predictive", memory_cache, PREDICTIVE_CACHE_INTERVAL)
    
    return HierarchicalCache(
        "hierarchical",
        memory_cache,
        redis_cache,
        semantic_cache,
        predictive_cache
    )

# Default cache instance
default_cache = create_default_cache()

# Decorator for caching function results
def cached(ttl: Optional[int] = None, key_prefix: str = ""):
    """Decorator for caching function results."""
    def decorator(func):
        @lru_cache(maxsize=128)
        def generate_key(*args, **kwargs):
            """Generate a cache key for the function call."""
            # Create a deterministic representation of the arguments
            key_dict = {
                "args": args,
                "kwargs": {k: v for k, v in kwargs.items() if k != "query"}
            }
            
            # Generate a hash of the arguments
            key = hashlib.sha256(json.dumps(key_dict, sort_keys=True).encode()).hexdigest()
            
            # Add prefix if provided
            if key_prefix:
                key = f"{key_prefix}:{key}"
            
            return key
        
        async def wrapper(*args, **kwargs):
            """Wrapper function that implements caching."""
            # Generate cache key
            key = generate_key(*args, **kwargs)
            
            # Extract query for semantic caching
            query = kwargs.get("query")
            
            # Try to get from cache
            cached_value = await default_cache.get(key, query)
            if cached_value is not None:
                return cached_value
            
            # Call the original function
            result = await func(*args, **kwargs)
            
            # Store in cache
            await default_cache.set(key, result, ttl, query)
            
            return result
        
        return wrapper
    
    return decorator
