# Acceptatieverslag Y1-A.9 – Deterministische Origin Engine

## Doel
Implementeer een deterministische preferentiële oorsprongsevaluator die volledig op de canonical PSRA-contracten draait en reproduceerbare verdicts met citaties levert.

## Deliverables
- `backend/rules_engine/origin.py` met `evaluate_origin` en `OriginEvaluationError`.
- `backend/rules_engine/__init__.py` exporteert de engine-entrypoints.
- `tests/backend/rules_engine/test_origin.py` dekt positieve en negatieve scenario's met HS39 CETA-regel.

## Bewijslast
- ✅ `pytest tests/backend/rules_engine/test_origin.py`

## Opmerkingen
- Engine gebruikt `Severity`-enum uit de PSRA-contracten voor consistente auditniveaus.
- Deterministische `now`-callable maakt reproduceerbare tests mogelijk; productie gebruikt UTC timestamps.
