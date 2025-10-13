from __future__ import annotations

import httpx
import pytest

from backend.connectors.hmrc import HMRCConnector
from backend.connectors.taric import TARICConnector
from backend.connectors.wco import WCOConnector


class CountingTransport(httpx.MockTransport):
    def __init__(self, handler):
        self.calls = []
        super().__init__(handler)


def test_hmrc_connector_caches_responses():
    payload = {"data": {"id": "commodity"}}

    def handler(request: httpx.Request) -> httpx.Response:
        transport.calls.append(request.url.path)
        return httpx.Response(200, json=payload)

    transport = CountingTransport(handler)
    connector = HMRCConnector(transport=transport, cache_ttl_seconds=3600)

    first = connector.fetch_commodity("390110")
    second = connector.fetch_commodity("390110")

    assert first == payload
    assert second == payload
    assert transport.calls.count("/api/v2/commodities/390110") == 1


@pytest.mark.parametrize(
    "connector_cls, path",
    [
        (HMRCConnector, "/health"),
        (TARICConnector, "/health"),
        (WCOConnector, "/health"),
    ],
)
def test_connector_health_success(connector_cls, path):
    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == path:
            return httpx.Response(200, json={"status": "ok"})
        return httpx.Response(200, json={"result": "ok"})

    transport = CountingTransport(handler)
    connector = connector_cls(transport=transport, cache_ttl_seconds=3600)
    health = connector.health()

    assert health.status == "pass"
    assert health.details["status"] == "ok"


def test_wco_connector_caches_origin_notes():
    payload = {"note": "origin"}

    def handler(request: httpx.Request) -> httpx.Response:
        transport.calls.append(request.url.path)
        return httpx.Response(200, json=payload)

    transport = CountingTransport(handler)
    connector = WCOConnector(transport=transport, cache_ttl_seconds=3600)

    result1 = connector.fetch_origin_note("CETA", "390110")
    result2 = connector.fetch_origin_note("CETA", "390110")

    assert result1 == payload
    assert result2 == payload
    assert transport.calls.count("/origin/agreements/CETA/hs/390110") == 1
