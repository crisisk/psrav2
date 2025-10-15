import asyncio
import threading
import time
from typing import Any, Callable, Dict, Optional, Union
from cachetools import TTLCache
from .redis_cluster import RedisClusterClient
import logging

logger = logging.getLogger(__name__)

class CacheManager:
    def __init__(self, redis_client: RedisClusterClient, l1_ttl: int = 60, l1_maxsize: int = 1000):
        self.redis = redis_client
        self.l1_cache = TTLCache(maxsize=l1_maxsize, ttl=l1_ttl)  # L1 in-memory
        self.ttls = {"user": 300, "product": 600, "default": 300}  # TTL per data type
        self.locks: Dict[str, threading.Lock] = {}  # For stampede prevention
        self.metrics = {"hits": 0, "misses": 0, "evictions": 0}
        self._monitor_thread = threading.Thread(target=self._monitor_evictions, daemon=True)
        self._monitor_thread.start()
        self._warm_cache()  # Cache warming on startup

    def _warm_cache(self):
        # Pre-populate with hot data (example: load from DB or config)
        hot_data = {"user:1": "UserData1", "product:1": "ProductData1"}  # Replace with actual data source
        for key, value in hot_data.items():
            data_type = key.split(":")[0]
            ttl = self.ttls.get(data_type, self.ttls["default"])
            self.set(key, value, ttl)
        logger.info("Cache warmed with hot data.")

    def _monitor_evictions(self):
        while True:
            time.sleep(60)  # Check every minute
            evicted = len(self.l1_cache) - self.l1_cache.maxsize  # Approximation
            if evicted > 0:
                self.metrics["evictions"] += evicted
                logger.info(f"Evictions: {self.metrics['evictions']}")

    def get_metrics(self) -> Dict[str, int]:
        total_requests = self.metrics["hits"] + self.metrics["misses"]
        hit_rate = (self.metrics["hits"] / total_requests) if total_requests > 0 else 0
        miss_rate = (self.metrics["misses"] / total_requests) if total_requests > 0 else 0
        return {
            "hits": self.metrics["hits"],
            "misses": self.metrics["misses"],
            "evictions": self.metrics["evictions"],
            "hit_rate": hit_rate,
            "miss_rate": miss_rate
        }

    def _get_lock(self, key: str) -> threading.Lock:
        if key not in self.locks:
            self.locks[key] = threading.Lock()
        return self.locks[key]

    def get(self, key: str, fetch_func: Optional[Callable] = None) -> Optional[Any]:
        # Cache-aside: Check L1, then L2, then fetch
        if key in self.l1_cache:
            self.metrics["hits"] += 1
            return self.l1_cache[key]
        value = self.redis.get(key)
        if value:
            self.l1_cache[key] = value
            self.metrics["hits"] += 1
            return value
        if fetch_func:
            with self._get_lock(key):  # Stampede prevention
                if key not in self.l1_cache and not self.redis.exists(key):
                    value = fetch_func()
                    if value:
                        data_type = key.split(":")[0]
                        ttl = self.ttls.get(data_type, self.ttls["default"])
                        self.set(key, value, ttl)
        self.metrics["misses"] += 1
        return value

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        data_type = key.split(":")[0]
        ttl = ttl or self.ttls.get(data_type, self.ttls["default"])
        self.l1_cache[key] = value
        return self.redis.set(key, value, ttl)

    def invalidate(self, key: str) -> bool:
        # Smart invalidation: Remove from both L1 and L2
        if key in self.l1_cache:
            del self.l1_cache[key]
        return self.redis.delete(key)

    async def write_through(self, key: str, value: Any, db_write_func: Callable) -> bool:
        # Write to DB and cache simultaneously
        success = await db_write_func(value)
        if success:
            data_type = key.split(":")[0]
            ttl = self.ttls.get(data_type, self.ttls["default"])
            self.set(key, value, ttl)
        return success

    async def write_behind(self, key: str, value: Any, db_write_func: Callable) -> bool:
        # Write to cache first, then asynchronously to DB
        data_type = key.split(":")[0]
        ttl = self.ttls.get(data_type, self.ttls["default"])
        self.set(key, value, ttl)
        asyncio.create_task(db_write_func(value))  # Async DB write
        return True

# Example usage:
# manager = CacheManager(redis_client)
# data = manager.get("user:123", lambda: fetch_from_db("user", 123))
# await manager.write_through("user:123", new_data, lambda v: update_db("user", 123, v))