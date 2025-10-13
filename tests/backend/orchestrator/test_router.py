from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Mapping

import pytest

from backend.orchestrator.router import (
    ConsensusDecision,
    DependencyStatus,
    GeneratedText,
    ModelSpec,
    MultiLLMRouter,
    OrchestrationResult,
    ReadinessError,
    SafetyPolicyViolation,
    SafetyTier,
)


@dataclass
class CountingClient:
    """Simple LLM client stub that counts invocations."""

    name: str
    primary_generation: GeneratedText
    secondary_generation: GeneratedText | None = None
    calls: int = field(default=0, init=False)

    def generate(
        self,
        prompt: str,
        *,
        temperature: float,
        max_tokens: int,
        metadata: Mapping[str, Any] | None = None,
    ) -> GeneratedText:
        self.calls += 1
        if self.secondary_generation is not None and self.calls > 1:
            return self.secondary_generation
        return self.primary_generation


@pytest.fixture
def healthy_dependencies() -> list[DependencyStatus]:
    return [
        DependencyStatus(name="postgres", healthy=True),
        DependencyStatus(name="redis", healthy=True),
        DependencyStatus(name="vault", healthy=True),
    ]


def build_router(models, clients, dependencies):
    return MultiLLMRouter(
        models,
        clients,
        dependency_resolver=lambda: dependencies,
        prompt_cache_ttl_seconds=60,
        judgment_cache_ttl_seconds=60,
    )


def test_router_selects_best_model_via_cost_awareness(healthy_dependencies):
    models = [
        ModelSpec(
            name="economy",
            provider="openai",
            cost_per_1k_tokens=1.0,
            performance_score=0.6,
            latency_ms_prior=500.0,
        ),
        ModelSpec(
            name="premium",
            provider="anthropic",
            cost_per_1k_tokens=2.0,
            performance_score=0.95,
            latency_ms_prior=100.0,
        ),
        ModelSpec(
            name="enterprise",
            provider="azure",
            cost_per_1k_tokens=3.0,
            performance_score=0.7,
            latency_ms_prior=200.0,
        ),
    ]
    clients = {
        spec.name: CountingClient(
            name=spec.name,
            primary_generation=GeneratedText(
                content=f"{spec.name} response",
                prompt_tokens=100,
                completion_tokens=50,
                latency_ms=spec.latency_ms_prior,
            ),
        )
        for spec in models
    }

    router = build_router(models, clients, healthy_dependencies)
    result = router.route("Explain origin rules", candidate_count=1)

    assert isinstance(result, OrchestrationResult)
    assert result.responses[0].model.name == "premium"
    assert pytest.approx(result.total_cost_usd, rel=1e-3) == 0.3
    assert result.cache_hit is False


def test_router_enforces_safety_policy_for_sensitive_prompts(healthy_dependencies):
    models = [
        ModelSpec(
            name="public-saas",
            provider="openai",
            cost_per_1k_tokens=1.5,
            performance_score=0.7,
            latency_ms_prior=200.0,
            safety_tier=SafetyTier.PUBLIC,
        ),
        ModelSpec(
            name="onprem-secure",
            provider="local",
            cost_per_1k_tokens=2.8,
            performance_score=0.9,
            latency_ms_prior=250.0,
            safety_tier=SafetyTier.PRIVATE,
        ),
    ]
    clients = {
        spec.name: CountingClient(
            name=spec.name,
            primary_generation=GeneratedText(
                content="Secure answer",
                prompt_tokens=80,
                completion_tokens=40,
                latency_ms=spec.latency_ms_prior,
            ),
        )
        for spec in models
    }

    router = build_router(models, clients, healthy_dependencies)
    prompt = "Process passport data for customs declaration"
    result = router.route(prompt, candidate_count=1)

    assert result.responses[0].model.name == "onprem-secure"
    assert all(response.model.safety_tier is SafetyTier.PRIVATE for response in result.responses)


def test_router_caches_prompt_and_skips_duplicate_generation(healthy_dependencies):
    model = ModelSpec(
        name="balanced",
        provider="anthropic",
        cost_per_1k_tokens=2.5,
        performance_score=0.85,
        latency_ms_prior=180.0,
    )
    client = CountingClient(
        name="balanced",
        primary_generation=GeneratedText(
            content="first",
            prompt_tokens=120,
            completion_tokens=60,
            latency_ms=150.0,
        ),
    )
    router = build_router([model], {"balanced": client}, healthy_dependencies)

    first = router.route("Summarise the preferential rules", candidate_count=1)
    second = router.route("Summarise the preferential rules", candidate_count=1)

    assert client.calls == 1
    assert first.cache_hit is False
    assert second.cache_hit is True
    assert second.responses == first.responses
    assert second.consensus == first.consensus


def test_router_raises_when_dependencies_unhealthy(healthy_dependencies):
    unhealthy = list(healthy_dependencies)
    unhealthy[1] = DependencyStatus(name="redis", healthy=False, detail="connection refused")

    model = ModelSpec(
        name="baseline",
        provider="openai",
        cost_per_1k_tokens=2.0,
        performance_score=0.8,
        latency_ms_prior=160.0,
    )
    client = CountingClient(
        name="baseline",
        primary_generation=GeneratedText(
            content="baseline",
            prompt_tokens=90,
            completion_tokens=45,
            latency_ms=140.0,
        ),
    )
    router = build_router([model], {"baseline": client}, unhealthy)

    with pytest.raises(ReadinessError) as exc:
        router.route("any")

    assert "redis" in str(exc.value)


def test_router_builds_consensus_and_caches_judgment(healthy_dependencies):
    model_private = ModelSpec(
        name="trusted-private",
        provider="local",
        cost_per_1k_tokens=3.0,
        performance_score=0.92,
        latency_ms_prior=220.0,
        safety_tier=SafetyTier.PRIVATE,
    )
    model_restricted = ModelSpec(
        name="trusted-cloud",
        provider="azure",
        cost_per_1k_tokens=2.4,
        performance_score=0.88,
        latency_ms_prior=190.0,
        safety_tier=SafetyTier.RESTRICTED,
    )
    clients = {
        model_private.name: CountingClient(
            name=model_private.name,
            primary_generation=GeneratedText(
                content="Origin qualifies with 45% regional value content.",
                prompt_tokens=110,
                completion_tokens=55,
                latency_ms=210.0,
            ),
        ),
        model_restricted.name: CountingClient(
            name=model_restricted.name,
            primary_generation=GeneratedText(
                content="Origin qualifies with 46% regional value content.",
                prompt_tokens=105,
                completion_tokens=50,
                latency_ms=185.0,
            ),
        ),
    }
    router = build_router([model_private, model_restricted], clients, healthy_dependencies)

    result = router.route("Provide the PSR origin decision", candidate_count=2, use_cache=False)

    assert isinstance(result.consensus, ConsensusDecision)
    assert result.consensus.confidence >= 0.8
    assert set(result.consensus.supporting_models) == {
        model_private.name,
        model_restricted.name,
    }

    key = tuple(
        sorted((response.model.name, router._hash_text(response.content)) for response in result.responses)
    )
    cached_decision = router._judgment_cache.get(key)
    assert cached_decision is result.consensus


def test_router_rejects_when_no_model_matches_safety_policy(healthy_dependencies):
    models = [
        ModelSpec(
            name="public-saas",
            provider="openai",
            cost_per_1k_tokens=1.8,
            performance_score=0.75,
            latency_ms_prior=210.0,
            safety_tier=SafetyTier.PUBLIC,
        )
    ]
    clients = {
        "public-saas": CountingClient(
            name="public-saas",
            primary_generation=GeneratedText(
                content="response",
                prompt_tokens=70,
                completion_tokens=40,
                latency_ms=205.0,
            ),
        )
    }
    router = build_router(models, clients, healthy_dependencies)

    with pytest.raises(SafetyPolicyViolation):
        router.route("Process SSN data", candidate_count=1)
