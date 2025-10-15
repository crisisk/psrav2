import redis
import json
from typing import Dict, Any, Optional
from .flags import FlagRegistry, FeatureFlag

class FlagEvaluator:
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.cache_ttl = 300  # 5 minutes

    def evaluate(self, flag_name: str, user_id: str, tenant_id: str, context: Dict[str, Any] = {}) -> Dict[str, Any]:
        """Evaluate flag and return result with variant. Uses Redis cache."""
        cache_key = f"flag:{flag_name}:{user_id}:{tenant_id}"
        cached = self.redis.get(cache_key)
        if cached:
            return json.loads(cached)

        flag = FlagRegistry.get(flag_name)
        if not flag:
            result = {"enabled": False, "variant": None}
        else:
            enabled = flag.is_enabled_for(user_id, tenant_id, context)
            variant = flag.get_variant_for(user_id) if enabled else None
            result = {"enabled": enabled, "variant": variant}

        self.redis.setex(cache_key, self.cache_ttl, json.dumps(result))
        return result

# Global evaluator instance (initialize with Redis client)
redis_client = redis.Redis(host='localhost', port=6379, db=0)
evaluator = FlagEvaluator(redis_client)