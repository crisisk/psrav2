"""Connector for the UK HMRC Trade Tariff API."""

from __future__ import annotations

from typing import Any, Dict

from backend.connectors.base import ExternalConnector


class HMRCConnector(ExternalConnector):
    """Fetches tariff data from the UK HMRC public API with aggressive caching."""

    def __init__(
        self,
        *,
        base_url: str = "https://api.trade-tariff.service.gov.uk",
        timeout: float = 5.0,
        cache_ttl_seconds: float = 86400.0,
        transport=None,
    ) -> None:
        super().__init__(
            name="hmrc",
            base_url=base_url,
            timeout=timeout,
            cache_ttl_seconds=cache_ttl_seconds,
            transport=transport,
        )

    def fetch_commodity(self, commodity_code: str) -> Dict[str, Any]:
        """Return commodity metadata for a HS code."""

        key = ("commodity", commodity_code)

        def loader() -> Dict[str, Any]:
            response = self._request("GET", f"/api/v2/commodities/{commodity_code}")
            return response.json()

        return self._cached(key, loader)

    def fetch_measures(self, commodity_code: str) -> Dict[str, Any]:
        """Return measure information for a HS code."""

        key = ("measures", commodity_code)

        def loader() -> Dict[str, Any]:
            response = self._request("GET", f"/api/v2/commodities/{commodity_code}/measures")
            return response.json()

        return self._cached(key, loader)
