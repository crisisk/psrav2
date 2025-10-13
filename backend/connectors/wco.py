"""Connector for the World Customs Organization origin database."""

from __future__ import annotations

from typing import Any, Dict

from backend.connectors.base import ExternalConnector


class WCOConnector(ExternalConnector):
    """Provides cached access to WCO origin notes and rulings."""

    def __init__(
        self,
        *,
        base_url: str = "https://api.wcoomd.org",
        timeout: float = 5.0,
        cache_ttl_seconds: float = 86400.0,
        transport=None,
    ) -> None:
        super().__init__(
            name="wco",
            base_url=base_url,
            timeout=timeout,
            cache_ttl_seconds=cache_ttl_seconds,
            transport=transport,
        )

    def fetch_origin_note(self, agreement_code: str, hs_code: str) -> Dict[str, Any]:
        key = ("origin_note", agreement_code, hs_code)

        def loader() -> Dict[str, Any]:
            response = self._request(
                "GET",
                f"/origin/agreements/{agreement_code}/hs/{hs_code}",
            )
            return response.json()

        return self._cached(key, loader)

    def fetch_rulings(self, hs_code: str) -> Dict[str, Any]:
        key = ("rulings", hs_code)

        def loader() -> Dict[str, Any]:
            response = self._request("GET", f"/origin/hs/{hs_code}/rulings")
            return response.json()

        return self._cached(key, loader)
