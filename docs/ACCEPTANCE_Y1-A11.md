# Acceptatieverslag Y1-A.11 – Multi-LLM Orchestrator Router

## Doel
Een kostenbewuste, auditbare orchestrator leveren die meerdere LLM's aanstuurt met caching, consensus-judge en veiligheidsbeleid zodat gevoelige prompts uitsluitend via private/on-prem modellen verlopen.

## Deliverables
- `backend/orchestrator/router.py` met modelregistratie, veiligheidspolicy, readiness gate en consensus-judge.
- `backend/orchestrator/__init__.py` voor module-export.
- `tests/backend/orchestrator/test_router.py` met kostenrouting, veiligheidsbeleid, caching, readiness en consensus dekking.

## Bewijslast
- ✅ `pytest tests/backend/orchestrator/test_router.py`

## Opmerkingen
- Readiness checks volgen de semantiek van `health_gate_strict` en blokkeren verzoeken zodra Postgres, Redis of de LLM-clients onbeschikbaar zijn.
- Consensus gebruikt SequenceMatcher voor deterministische similarity-scores en cachet beslissingen zodat identieke prompts geen extra "judge"-kosten triggeren.
