# Acceptatieverslag Y1-A.7 – Postgres Data Access Layer

## Doel
Een productieklare DAL neerzetten bovenop Postgres om rules te kunnen ophalen en evaluatieverdicts met provenance veilig op te slaan.

## Deliverables
- `backend/app/dal/models.py` met canonical tabellen (`psra_rules`, `psra_verdicts`).
- `backend/app/dal/postgres_dal.py` als repositorylaag met upsert, filter en fetch-methoden.
- `tests/backend/dal/test_postgres_dal.py` met Testcontainers-gedreven integraties.

## Bewijslast
- ✅ `pytest tests/backend/dal/test_postgres_dal.py`

## Opmerkingen
- Verdicts slaan volledige input snapshots, lineageflag en timings op voor auditability.
- Tests worden automatisch geskipt indien Docker niet beschikbaar is (CI vereiste: Docker aanwezig).
