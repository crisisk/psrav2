import rediscluster
import logging
import zlib
from typing import Any, Optional

logger = logging.getLogger(__name__)

class RedisClusterClient:
    def __init__(self, startup_nodes: list, password: Optional[str] = None, max_connections: int = 10):
        self.client = rediscluster.RedisCluster(
            startup_nodes=startup_nodes,
            password=password,
            max_connections=max_connections,
            decode_responses=True,
            skip_full_coverage_check=True  # For 3-node setup
        )
        logger.info("Redis Cluster client initialized.")

    def get(self, key: str) -> Optional[Any]:
        try:
            value = self.client.get(key)
            if value and len(value) > 1024:  # Decompress if >1KB
                value = zlib.decompress(value.encode()).decode()
            return value
        except Exception as e:
            logger.error(f"Error getting key {key}: {e}")
            return None

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        try:
            if isinstance(value, str) and len(value) > 1024:  # Compress if >1KB
                value = zlib.compress(value.encode()).decode()
            return self.client.set(key, value, ex=ttl)
        except Exception as e:
            logger.error(f"Error setting key {key}: {e}")
            return False

    def delete(self, key: str) -> bool:
        try:
            return self.client.delete(key) > 0
        except Exception as e:
            logger.error(f"Error deleting key {key}: {e}")
            return False

    def exists(self, key: str) -> bool:
        try:
            return self.client.exists(key) > 0
        except Exception as e:
            logger.error(f"Error checking key {key}: {e}")
            return False

    def flush_all(self):
        try:
            self.client.flushall()
            logger.info("Flushed all keys in Redis Cluster.")
        except Exception as e:
            logger.error(f"Error flushing Redis Cluster: {e}")

# Example usage:
# client = RedisClusterClient([{"host": "localhost", "port": 7001}, {"host": "localhost", "port": 7002}, {"host": "localhost", "port": 7003}])