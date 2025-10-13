# Acceptatieverslag Y1-A.8 – RaC ETL met Great Expectations

## Doel
Rules-as-Code YAML omzetten naar relationele opslag met schema- en datakwaliteitswaarborgen.

## Deliverables
- `backend/app/etl/ingest_rules.py` met CLI-gestuurde schema- en GE-validatie en Postgres-load.
- `tests/backend/etl/test_ingest_rules.py` die schema- en GE-checks uitvoert en de upsert pad valideert.
- Geüpdatete runbook/plan documentatie voor batch 2.

## Bewijslast
- ✅ `pytest tests/backend/etl/test_ingest_rules.py`
- ✅ `python backend/app/etl/ingest_rules.py --rules-dir psr/rules --validate --validate-only`

## Opmerkingen
- ETL vereist geldige `PSRA_DB_DSN`; in CI wordt een tijdelijke Postgres via Testcontainers gestart.
- Schema- en GE-validaties worden geblokkeerd bij de eerste failure zodat merges onmogelijk zijn zonder schone dataset.
