"""Common utilities for external origin data connectors."""

from __future__ import annotations

import threading
import time
from dataclasses import dataclass
from typing import Any, Callable, Dict, Tuple

import httpx


@dataclass(frozen=True)
class ConnectorHealth:
    """Represents the health of an external connector."""

    name: str
    status: str
    latency_ms: float
    checked_at: float
    details: Dict[str, Any]


class TTLCache:
    """A lightweight, thread-safe TTL cache.

    This avoids adding heavy third-party dependencies while still providing a
    predictable caching behaviour with aggressive eviction semantics for stale
    entries.
    """

    def __init__(self, ttl_seconds: float, maxsize: int = 512) -> None:
        self._ttl = ttl_seconds
        self._maxsize = maxsize
        self._data: Dict[Any, Tuple[float, Any]] = {}
        self._lock = threading.Lock()

    def get(self, key: Any) -> Any:
        with self._lock:
            if key not in self._data:
                raise KeyError(key)
            timestamp, value = self._data[key]
            if time.time() - timestamp > self._ttl:
                del self._data[key]
                raise KeyError(key)
            return value

    def set(self, key: Any, value: Any) -> None:
        with self._lock:
            if self._maxsize <= 0:
                self._data.clear()
            elif len(self._data) >= self._maxsize and self._data:
                # Remove the stalest item to free room.
                oldest_key = min(self._data.items(), key=lambda item: item[1][0])[0]
                del self._data[oldest_key]
            self._data[key] = (time.time(), value)

    def clear(self) -> None:
        with self._lock:
            self._data.clear()


class ExternalConnector:
    """Base helper for origin connectors with caching & health probes."""

    def __init__(
        self,
        *,
        name: str,
        base_url: str,
        timeout: float = 5.0,
        cache_ttl_seconds: float = 86400.0,
        transport: httpx.BaseTransport | None = None,
    ) -> None:
        self._name = name
        self._client = httpx.Client(
            base_url=base_url,
            timeout=timeout,
            transport=transport,
            headers={"User-Agent": f"psra-ltsd/{name}-connector"},
        )
        self._cache = TTLCache(ttl_seconds=cache_ttl_seconds)

    def _cached(self, key: Any, loader: Callable[[], Any]) -> Any:
        try:
            return self._cache.get(key)
        except KeyError:
            value = loader()
            self._cache.set(key, value)
            return value

    def _request(self, method: str, path: str, **kwargs: Any) -> httpx.Response:
        response = self._client.request(method, path, **kwargs)
        response.raise_for_status()
        return response

    def health(self) -> ConnectorHealth:
        start = time.perf_counter()
        try:
            response = self._client.get("/health")
            response.raise_for_status()
            latency_ms = (time.perf_counter() - start) * 1000.0
            payload: Dict[str, Any] = response.json() if response.content else {}
            return ConnectorHealth(
                name=self._name,
                status="pass",
                latency_ms=latency_ms,
                checked_at=time.time(),
                details=payload,
            )
        except Exception as exc:  # pragma: no cover - defensive safeguard
            latency_ms = (time.perf_counter() - start) * 1000.0
            return ConnectorHealth(
                name=self._name,
                status="fail",
                latency_ms=latency_ms,
                checked_at=time.time(),
                details={"error": str(exc)},
            )

    def close(self) -> None:
        self._client.close()

    def __enter__(self) -> "ExternalConnector":
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        self.close()
