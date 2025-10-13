# Acceptatieverslag Y1-A.10 – HMRC/TARIC/WCO Connectors

## Doel
Leveren van externe tarief- en oorsprongsconnectoren met agressieve caching, health-checks en contracttests voor PSRA-integratie.

## Deliverables
- `backend/connectors/base.py` met TTL-cache, healthstructuur en gedeelde HTTP-client.
- `backend/connectors/{hmrc,taric,wco}.py` die commodity/duty/origin data ophalen.
- `backend/connectors/__init__.py` voor module-export.
- `tests/backend/connectors/test_connectors.py` met caching- en healthvalidatie.

## Bewijslast
- ✅ `pytest tests/backend/connectors/test_connectors.py`

## Opmerkingen
- MockTransport wordt gebruikt zodat tests offline blijven en geen externe calls uitvoeren.
- Cache TTL standaard 24 uur; kan per omgeving worden aangepast via constructor.
