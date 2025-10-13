"""Connector for the EU TARIC API."""

from __future__ import annotations

from typing import Any, Dict

from backend.connectors.base import ExternalConnector


class TARICConnector(ExternalConnector):
    """Retrieves EU customs measures with TTL caching and health probes."""

    def __init__(
        self,
        *,
        base_url: str = "https://taric.api.europa.eu",
        timeout: float = 5.0,
        cache_ttl_seconds: float = 86400.0,
        transport=None,
    ) -> None:
        super().__init__(
            name="taric",
            base_url=base_url,
            timeout=timeout,
            cache_ttl_seconds=cache_ttl_seconds,
            transport=transport,
        )

    def fetch_duty_rates(self, commodity_code: str) -> Dict[str, Any]:
        key = ("duty_rates", commodity_code)

        def loader() -> Dict[str, Any]:
            response = self._request("GET", f"/commodities/{commodity_code}/duty-rates")
            return response.json()

        return self._cached(key, loader)

    def fetch_documents(self, commodity_code: str) -> Dict[str, Any]:
        key = ("documents", commodity_code)

        def loader() -> Dict[str, Any]:
            response = self._request("GET", f"/commodities/{commodity_code}/documents")
            return response.json()

        return self._cached(key, loader)
