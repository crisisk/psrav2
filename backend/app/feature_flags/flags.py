from typing import Dict, List, Optional, Any
from pydantic import BaseModel
from datetime import datetime, timedelta
import random
import json

class FlagRule(BaseModel):
    type: str  # 'percentage', 'user_target', 'tenant_target'
    value: Any  # e.g., 25 for percentage, list of user_ids for targeting

class FeatureFlag(BaseModel):
    name: str
    enabled: bool = True
    kill_switch: bool = False  # Emergency disable
    rollout_percentage: int = 100  # 0-100
    rules: List[FlagRule] = []  # Additional targeting rules
    variants: Optional[Dict[str, int]] = None  # A/B: {'variant_a': 50, 'variant_b': 50}
    dependencies: List[str] = []  # Prerequisite flags
    last_accessed: datetime = datetime.utcnow()
    usage_count: int = 0  # Metrics: increment on evaluation

    def is_enabled_for(self, user_id: str, tenant_id: str, context: Dict[str, Any] = {}) -> bool:
        """Evaluate if flag is enabled for a user/tenant."""
        if self.kill_switch:
            return False
        if not self.enabled:
            return False

        # Check dependencies
        for dep in self.dependencies:
            dep_flag = FlagRegistry.get(dep)
            if not dep_flag or not dep_flag.is_enabled_for(user_id, tenant_id, context):
                return False

        # Check percentage rollout
        if random.randint(1, 100) > self.rollout_percentage:
            return False

        # Check targeting rules
        for rule in self.rules:
            if rule.type == 'user_target' and user_id not in rule.value:
                return False
            if rule.type == 'tenant_target' and tenant_id not in rule.value:
                return False

        # Update metrics
        self.usage_count += 1
        self.last_accessed = datetime.utcnow()
        return True

    def get_variant_for(self, user_id: str) -> Optional[str]:
        """Get A/B variant for user."""
        if not self.variants:
            return None
        total = sum(self.variants.values())
        rand = random.randint(1, total)
        cumulative = 0
        for variant, weight in self.variants.items():
            cumulative += weight
            if rand <= cumulative:
                return variant
        return None

class FlagRegistry:
    _flags: Dict[str, FeatureFlag] = {}

    @classmethod
    def add(cls, flag: FeatureFlag):
        cls._flags[flag.name] = flag

    @classmethod
    def get(cls, name: str) -> Optional[FeatureFlag]:
        return cls._flags.get(name)

    @classmethod
    def list(cls) -> List[FeatureFlag]:
        return list(cls._flags.values())

    @classmethod
    def delete(cls, name: str):
        if name in cls._flags:
            del cls._flags[name]

    @classmethod
    def get_stale(cls, days: int = 30) -> List[FeatureFlag]:
        cutoff = datetime.utcnow() - timedelta(days=days)
        return [f for f in cls._flags.values() if f.last_accessed < cutoff]

# Example flags (load from DB in production)
FlagRegistry.add(FeatureFlag(
    name="new_dashboard",
    rollout_percentage=25,
    rules=[FlagRule(type="tenant_target", value=["tenant_1", "tenant_2"])],
    variants={"old_ui": 50, "new_ui": 50},
    dependencies=["beta_features"]
))
FlagRegistry.add(FeatureFlag(name="beta_features", enabled=True))