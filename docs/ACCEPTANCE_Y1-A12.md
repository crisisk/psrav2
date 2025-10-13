# Acceptatieverslag Y1-A.12 – LTSD microservice

## Doel
Implementeer de dedicated LTSD microservice die declaraties valideert via de deterministische origin-engine en gecertificeerde PDF-uitgifte met notary-hash en ledger-registratie mogelijk maakt.

## Deliverables
- `backend/ltsd_service/app.py` met `/evaluate` en `/generate` endpoints, ledger-koppeling en PDF-rendering.
- `backend/ltsd_service/__init__.py` exporteert `create_app` voor embedding in ASGI-routers.
- `tests/backend/ltsd_service/test_app.py` dekt evaluatie-, fout- en certificaatstromen met ledger-asserties.

## Bewijslast
- ✅ `pytest tests/backend/ltsd_service/test_app.py`

## Opmerkingen
- De PDF-renderer levert een geldig enkel-pagina document met `Helvetica`-font, notary-hash en ledger-referentie in HTTP-headers.
- Ledger-implementatie is voorlopig in-memory en wordt in latere batches vervangen door de append-only versieledger-service.
