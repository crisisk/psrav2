# Acceptatieverslag Y1-A.6 – Canonical PSRA Pydantic Contracten

## Doel
Immutable en schema-strikte datamodellen realiseren voor alle PSRA-domeinobjecten (HSCode, Agreement, Rule, EvaluationInput/Output) zodat services, ETL en DAL een gedeeld contract hanteren.

## Deliverables
- `backend/app/contracts/psra.py` met volledig getypeerde modellen en validatieregels.
- `tests/backend/contracts/test_psra_contracts.py` voor regressiekritische validatie van rules en evaluatiepayloads.

## Bewijslast
- ✅ `pytest tests/backend/contracts/test_psra_contracts.py`

## Opmerkingen
- Jurisdicties, certificaten en citations forceren minimaal één item om downstream logic te beschermen.
- Evaluatiepayloads vereisen ten minste één BoM-regel en citeren altijd minstens één bron.
