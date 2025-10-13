# Acceptatieverslag Y1-A.3 – Golden test suite HS39/HS40

## Doel
Opzetten van een uitgebreide golden test suite om schema-conformiteit en regressies voor HS39/HS40 te bewaken.

## Deliverable
- `tests/golden/test_rules_schema.py`
- Geverifieerde voorbeeldregels (`psr/rules/**`)

## Testen
- `poetry run pytest tests/golden`

## Resultaat
Alle golden tests slagen. Negatieve scenario’s genereren verwachte validatiefouten en bevestigen de strengheid van het schema.
