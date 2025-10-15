import os
from typing import Dict, Optional

class RateLimitConfig:
    # Default limits (requests per minute)
    DEFAULT_ANONYMOUS_LIMIT = 10
    DEFAULT_AUTHENTICATED_LIMIT = 100
    DEFAULT_PREMIUM_LIMIT = 1000

    # Redis configuration
    REDIS_HOST: str = os.getenv("RATE_LIMIT_REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("RATE_LIMIT_REDIS_PORT", "6379"))
    REDIS_DB: int = int(os.getenv("RATE_LIMIT_REDIS_DB", "0"))
    REDIS_PASSWORD: Optional[str] = os.getenv("RATE_LIMIT_REDIS_PASSWORD")

    # Custom per-endpoint limits (path -> limit string, e.g., "5/minute")
    CUSTOM_ENDPOINT_LIMITS: Dict[str, str] = {
        # Example: ML endpoints slower
        "/api/ml/predict": "50/minute",
        "/api/ml/train": "10/minute",
    }

    # Admin bypass settings
    ADMIN_BYPASS_HEADER: str = os.getenv("RATE_LIMIT_ADMIN_BYPASS_HEADER", "X-Admin-Bypass")
    ADMIN_BYPASS_SECRET: str = os.getenv("RATE_LIMIT_ADMIN_BYPASS_SECRET", "secret-admin-token")
    INTERNAL_IPS: list = os.getenv("RATE_LIMIT_INTERNAL_IPS", "127.0.0.1,::1").split(",")

    @classmethod
    def get_limit_for_tier(cls, tier: str) -> str:
        """Return the rate limit string for a given tier."""
        limits = {
            "anonymous": f"{cls.DEFAULT_ANONYMOUS_LIMIT}/minute",
            "authenticated": f"{cls.DEFAULT_AUTHENTICATED_LIMIT}/minute",
            "premium": f"{cls.DEFAULT_PREMIUM_LIMIT}/minute",
        }
        return limits.get(tier, limits["anonymous"])

    @classmethod
    def get_custom_limit(cls, path: str) -> Optional[str]:
        """Return custom limit for a path if defined."""
        return cls.CUSTOM_ENDPOINT_LIMITS.get(path)