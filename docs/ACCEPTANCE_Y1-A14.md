## Doel
Implementeer de ERP-integratieservice met saga/outbox patroon en idempotency-keys om recept- en materiaaldata veilig naar het inventory-platform te synchroniseren.

## Deliverables
- `backend/app/contracts/inventory.py` met canonieke modellen voor receptsync-commando's en resultaten.
- `backend/app/dal/models.py` uitgebreid met `erp_outbox`-tabel (idempotency-constraint, retry-metadata).
- `backend/erp_integration/service.py` met enqueue-, status- en verwerkingslogica inclusief retry/backoff.
- `tests/backend/erp_integration/test_service.py` dekt idempotentie, retry en succesvolle dispatch naar de inventory-gateway.

## Bewijslast
- ✅ `pytest tests/backend/erp_integration/test_service.py`

## Opmerkingen
- De backoff volgt een exponentieel schema (30s → 120s → 600s → 1800s → 3600s) met maximaal vijf pogingen voordat een item naar de dead-letter status gaat.
- `ERPIntegrationService.get_result` geeft downstream-clients toegang tot het bevestigde ERP-referentienummer voor audittrail- en reconciliatiedoeleinden.
