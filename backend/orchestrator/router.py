"""Cost-aware multi-LLM router with safety and consensus controls."""

from __future__ import annotations

import hashlib
import threading
import time
from dataclasses import dataclass
from difflib import SequenceMatcher
from enum import Enum
from typing import Any, Callable, Dict, Iterable, Mapping, Protocol, Sequence, Tuple


class OrchestrationError(RuntimeError):
    """Raised when the orchestrator cannot fulfil a request."""


class ReadinessError(OrchestrationError):
    """Raised when upstream dependencies are not healthy."""


class SafetyPolicyViolation(OrchestrationError):
    """Raised when no allowed models satisfy the active safety policy."""


class SafetyTier(str, Enum):
    """Represents the security posture of a model deployment."""

    PUBLIC = "public"
    RESTRICTED = "restricted"
    PRIVATE = "private"


class SensitivityLevel(str, Enum):
    """Prompt sensitivity levels derived from the safety policy."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


@dataclass(frozen=True)
class DependencyStatus:
    """Represents the readiness of an external dependency."""

    name: str
    healthy: bool
    detail: str | None = None


@dataclass(frozen=True)
class ModelSpec:
    """Metadata describing an LLM deployment."""

    name: str
    provider: str
    cost_per_1k_tokens: float
    performance_score: float
    latency_ms_prior: float
    max_output_tokens: int = 1024
    safety_tier: SafetyTier = SafetyTier.PUBLIC
    default_temperature: float = 0.2

    def __post_init__(self) -> None:  # pragma: no cover - dataclass validation
        if self.cost_per_1k_tokens <= 0:
            raise ValueError("cost_per_1k_tokens must be positive")
        if not 0.0 < self.performance_score <= 1.0:
            raise ValueError("performance_score must be within (0, 1]")
        if self.latency_ms_prior <= 0:
            raise ValueError("latency_ms_prior must be positive")
        if self.max_output_tokens <= 0:
            raise ValueError("max_output_tokens must be positive")
        if not 0.0 <= self.default_temperature <= 2.0:
            raise ValueError("default_temperature must be between 0 and 2")


@dataclass(frozen=True)
class GeneratedText:
    """Normalised response returned by a model client."""

    content: str
    prompt_tokens: int
    completion_tokens: int
    latency_ms: float


@dataclass(frozen=True)
class ModelResponse:
    """Model generation enriched with accounting metadata."""

    model: ModelSpec
    content: str
    prompt_tokens: int
    completion_tokens: int
    latency_ms: float
    cost_usd: float


@dataclass(frozen=True)
class ConsensusDecision:
    """Represents the consensus judgement across model responses."""

    content: str
    confidence: float
    rationale: str
    supporting_models: Tuple[str, ...]
    dissenting_models: Tuple[str, ...]
    judge: str = "similarity-majority"


@dataclass(frozen=True)
class OrchestrationPayload:
    """Serializable orchestration result used for caching."""

    responses: Tuple[ModelResponse, ...]
    consensus: ConsensusDecision
    total_cost_usd: float
    latency_ms: float


@dataclass(frozen=True)
class OrchestrationResult(OrchestrationPayload):
    """Returned orchestration result including cache hit signal."""

    cache_hit: bool = False


class ModelClient(Protocol):
    """Protocol describing an LLM client implementation."""

    def generate(
        self,
        prompt: str,
        *,
        temperature: float,
        max_tokens: int,
        metadata: Mapping[str, Any] | None = None,
    ) -> GeneratedText:
        ...


class TTLCache:
    """Thread-safe TTL cache for orchestration artefacts."""

    def __init__(self, ttl_seconds: float, maxsize: int = 1024) -> None:
        self._ttl = ttl_seconds
        self._maxsize = maxsize
        self._items: Dict[Any, Tuple[float, Any]] = {}
        self._lock = threading.Lock()

    def get(self, key: Any) -> Any:
        with self._lock:
            if key not in self._items:
                raise KeyError(key)
            timestamp, value = self._items[key]
            if time.time() - timestamp > self._ttl:
                del self._items[key]
                raise KeyError(key)
            return value

    def set(self, key: Any, value: Any) -> None:
        with self._lock:
            if self._maxsize == 0:
                self._items.clear()
                return
            if len(self._items) >= self._maxsize and self._items:
                oldest_key = min(self._items.items(), key=lambda item: item[1][0])[0]
                del self._items[oldest_key]
            self._items[key] = (time.time(), value)

    def clear(self) -> None:
        with self._lock:
            self._items.clear()


class SafetyPolicy:
    """Simple keyword-driven safety policy classifier."""

    def __init__(
        self,
        *,
        restricted_keywords: Iterable[str] | None = None,
        confidential_keywords: Iterable[str] | None = None,
    ) -> None:
        self._restricted_keywords = {
            kw.lower() for kw in (restricted_keywords or {"gdpr", "pii", "social security", "passport", "bsn", "ssn"})
        }
        self._confidential_keywords = {
            kw.lower()
            for kw in (confidential_keywords or {"confidential", "internal", "financial forecast", "merger"})
        }

    def classify(self, prompt: str, metadata: Mapping[str, Any] | None = None) -> SensitivityLevel:
        if metadata and "sensitivity" in metadata:
            try:
                return SensitivityLevel(metadata["sensitivity"].lower())
            except Exception:  # pragma: no cover - defensive
                pass
        prompt_lower = prompt.lower()
        if any(keyword in prompt_lower for keyword in self._restricted_keywords):
            return SensitivityLevel.HIGH
        if any(keyword in prompt_lower for keyword in self._confidential_keywords):
            return SensitivityLevel.MEDIUM
        return SensitivityLevel.LOW

    def is_model_allowed(self, model: ModelSpec, level: SensitivityLevel) -> bool:
        if level is SensitivityLevel.LOW:
            return True
        if level is SensitivityLevel.MEDIUM:
            return model.safety_tier in {SafetyTier.RESTRICTED, SafetyTier.PRIVATE}
        return model.safety_tier is SafetyTier.PRIVATE


class ReadinessGate:
    """Enforces strict readiness checks inspired by health_gate_strict semantics."""

    def assert_ready(self, statuses: Sequence[DependencyStatus]) -> None:
        unhealthy = [status for status in statuses if not status.healthy]
        if unhealthy:
            detail = ", ".join(
                f"{status.name}: {status.detail or 'unavailable'}" for status in unhealthy
            )
            raise ReadinessError(f"Dependencies unavailable: {detail}")


class MultiLLMRouter:
    """Cost-aware multi-LLM router with caching and consensus judging."""

    def __init__(
        self,
        models: Sequence[ModelSpec],
        clients: Mapping[str, ModelClient],
        *,
        dependency_resolver: Callable[[], Sequence[DependencyStatus]] | None = None,
        safety_policy: SafetyPolicy | None = None,
        prompt_cache_ttl_seconds: float = 300.0,
        judgment_cache_ttl_seconds: float = 600.0,
        prompt_cache_maxsize: int = 512,
        judgment_cache_maxsize: int = 512,
    ) -> None:
        if not models:
            raise ValueError("at least one model must be configured")
        self._registry = list(models)
        self._clients = dict(clients)
        self._dependency_resolver = dependency_resolver or (lambda: [])
        self._safety_policy = safety_policy or SafetyPolicy()
        self._readiness_gate = ReadinessGate()
        self._prompt_cache = TTLCache(prompt_cache_ttl_seconds, prompt_cache_maxsize)
        self._judgment_cache = TTLCache(judgment_cache_ttl_seconds, judgment_cache_maxsize)

        missing_clients = [spec.name for spec in self._registry if spec.name not in self._clients]
        if missing_clients:
            raise ValueError(f"Missing clients for models: {', '.join(missing_clients)}")

    def route(
        self,
        prompt: str,
        *,
        metadata: Mapping[str, Any] | None = None,
        candidate_count: int = 2,
        use_cache: bool = True,
    ) -> OrchestrationResult:
        metadata = metadata or {}
        statuses = list(self._dependency_resolver())
        self._readiness_gate.assert_ready(statuses)

        cache_key = self._build_prompt_cache_key(prompt, metadata)
        if use_cache:
            try:
                cached: OrchestrationPayload = self._prompt_cache.get(cache_key)
                return OrchestrationResult(
                    responses=cached.responses,
                    consensus=cached.consensus,
                    total_cost_usd=cached.total_cost_usd,
                    latency_ms=cached.latency_ms,
                    cache_hit=True,
                )
            except KeyError:
                pass

        candidates = self._select_candidates(prompt, metadata, candidate_count)
        responses: list[ModelResponse] = []
        total_cost = 0.0
        total_latency = 0.0
        for spec in candidates:
            client = self._clients[spec.name]
            generation = client.generate(
                prompt,
                temperature=spec.default_temperature,
                max_tokens=spec.max_output_tokens,
                metadata=metadata,
            )
            cost = self._calculate_cost(spec, generation)
            total_cost += cost
            total_latency = max(total_latency, generation.latency_ms)
            responses.append(
                ModelResponse(
                    model=spec,
                    content=generation.content,
                    prompt_tokens=generation.prompt_tokens,
                    completion_tokens=generation.completion_tokens,
                    latency_ms=generation.latency_ms,
                    cost_usd=cost,
                )
            )

        payload = OrchestrationPayload(
            responses=tuple(responses),
            consensus=self._build_consensus(tuple(responses)),
            total_cost_usd=total_cost,
            latency_ms=total_latency,
        )
        self._prompt_cache.set(cache_key, payload)
        return OrchestrationResult(
            responses=payload.responses,
            consensus=payload.consensus,
            total_cost_usd=payload.total_cost_usd,
            latency_ms=payload.latency_ms,
            cache_hit=False,
        )

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _select_candidates(
        self,
        prompt: str,
        metadata: Mapping[str, Any],
        candidate_count: int,
    ) -> Tuple[ModelSpec, ...]:
        if candidate_count <= 0:
            raise ValueError("candidate_count must be positive")
        level = self._safety_policy.classify(prompt, metadata)
        eligible = [spec for spec in self._registry if self._safety_policy.is_model_allowed(spec, level)]
        if not eligible:
            raise SafetyPolicyViolation(
                f"No models satisfy safety tier for sensitivity level '{level.value}'"
            )
        scored = [(self._score_model(spec), spec) for spec in eligible]
        scored.sort(key=lambda item: item[0], reverse=True)
        limited = [spec for _, spec in scored[:candidate_count]]
        return tuple(limited)

    def _score_model(self, spec: ModelSpec) -> float:
        registry = self._registry
        max_cost = max(model.cost_per_1k_tokens for model in registry)
        min_cost = min(model.cost_per_1k_tokens for model in registry)
        cost_component = 1.0 - self._normalise(spec.cost_per_1k_tokens, min_cost, max_cost)

        max_latency = max(model.latency_ms_prior for model in registry)
        min_latency = min(model.latency_ms_prior for model in registry)
        latency_component = 1.0 - self._normalise(spec.latency_ms_prior, min_latency, max_latency)

        # Weighted combination favouring performance yet remaining cost-aware.
        return (spec.performance_score * 0.6) + (cost_component * 0.3) + (latency_component * 0.1)

    @staticmethod
    def _normalise(value: float, min_value: float, max_value: float) -> float:
        if max_value == min_value:
            return 0.5
        return (value - min_value) / (max_value - min_value)

    def _build_consensus(self, responses: Tuple[ModelResponse, ...]) -> ConsensusDecision:
        judge_key = tuple(sorted((resp.model.name, self._hash_text(resp.content)) for resp in responses))
        try:
            return self._judgment_cache.get(judge_key)
        except KeyError:
            pass

        if len(responses) == 1:
            response = responses[0]
            decision = ConsensusDecision(
                content=response.content,
                confidence=1.0,
                rationale=f"Single model {response.model.name} response accepted by default.",
                supporting_models=(response.model.name,),
                dissenting_models=(),
            )
            self._judgment_cache.set(judge_key, decision)
            return decision

        similarities: Dict[str, float] = {}
        for candidate in responses:
            other_responses = [resp for resp in responses if resp is not candidate]
            if not other_responses:
                similarities[candidate.model.name] = 1.0
                continue
            ratios = [
                SequenceMatcher(None, candidate.content, other.content).ratio()
                for other in other_responses
            ]
            similarities[candidate.model.name] = sum(ratios) / len(ratios)

        best_model_name = max(similarities.items(), key=lambda item: item[1])[0]
        best_response = next(resp for resp in responses if resp.model.name == best_model_name)
        confidence = max(similarities.values())
        supporting = [
            resp.model.name
            for resp in responses
            if SequenceMatcher(None, best_response.content, resp.content).ratio() >= 0.8
        ]
        dissenting = [
            resp.model.name
            for resp in responses
            if resp.model.name not in supporting
        ]
        rationale = (
            f"Selected response from {best_model_name} with similarity score {confidence:.2f}. "
            f"Supporting models: {', '.join(supporting) or 'none'}."
        )
        if dissenting:
            rationale += f" Dissenting models: {', '.join(dissenting)}."

        decision = ConsensusDecision(
            content=best_response.content,
            confidence=confidence,
            rationale=rationale,
            supporting_models=tuple(supporting),
            dissenting_models=tuple(dissenting),
        )
        self._judgment_cache.set(judge_key, decision)
        return decision

    @staticmethod
    def _calculate_cost(spec: ModelSpec, generation: GeneratedText) -> float:
        tokens = generation.prompt_tokens + generation.completion_tokens
        return (tokens / 1000.0) * spec.cost_per_1k_tokens

    @staticmethod
    def _hash_text(value: str) -> str:
        return hashlib.sha256(value.encode("utf-8")).hexdigest()

    @staticmethod
    def _build_prompt_cache_key(prompt: str, metadata: Mapping[str, Any]) -> str:
        hasher = hashlib.sha256()
        hasher.update(prompt.encode("utf-8"))
        if metadata:
            for key in sorted(metadata):
                hasher.update(str(key).encode("utf-8"))
                hasher.update(str(metadata[key]).encode("utf-8"))
        return hasher.hexdigest()
