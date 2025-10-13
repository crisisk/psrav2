# PSRA-LTSD Platform Runbook (Batch 7)

## Doel en scope
Deze runbook-versie dekt batch 0 t/m 7 van de roadmap-uitvoering: tooling, planning, Rules-as-Code basiscomponenten, canonical PSRA contracten + Postgres Data Access Layer + ETL pijplijn, de deterministische origin engine met externe tariefconnectoren, de Multi-LLM orchestrator met consensus judge, de LTSD microservice met PDF-notary en ledger-hooks, de Next.js API-routes én de ERP-integratieservice met saga/outbox patroon en idempotency keys richting de inventory interface.

## Omgevingsvereisten
- **Secrets**: alle geheime waarden via Vault/OpenBao AppRole (zie `OpenBao Secrets` document). Voor lokale runs placeholders in `.env.local` (niet committen).
- **TLS**: client/server certificaten mounten via `${TLS_CERT_DIR}`. mTLS toggles volgen toekomstige implementatie (`ENABLE_MTLS=true`).
- **Databases**: Postgres, Redis, Vault containers worden pas opgezet in Batch 1 (TODO docker-compose).
- **Tooling**: `python>=3.11`, `node>=18`, `npm>=9`, `pre-commit`, `pytest`, `k6`, `syft`, `trivy`, `kubectl`, `npx playwright`.

## Startvolgorde (actueel)
1. `scripts/init_quality_stack.sh --run` – installeert pre-commit hooks en npm dependencies.
2. `scripts/test_unit.sh --plan` – verify workflow; gebruik `--run` zodra unit tests beschikbaar zijn.
3. `scripts/rac_validate.sh --plan` – overzicht RaC-validatiestappen.
4. `poetry install --with dev` – installeert Python/Rust toolchain incl. `maturin`, `great-expectations`, `pandas`, `testcontainers` en `pre-commit` (fallback: `pip install maturin pre-commit pytest pytest-cov great-expectations pandas testcontainers`).
5. `poetry run pre-commit install` – activeert hooks (ruff/black/mypy/RaC) of `pre-commit install` bij pip-fallback.
6. `scripts/rac_validate.sh --run` – bouwt de native validator en draait golden tests.
7. `pytest tests/backend/contracts` – valideert Pydantic contracten.
8. `pytest tests/backend/dal tests/backend/etl` – voert Postgres-integratietests uit (vereist Docker/testcontainers; fallback: gebruik `pytest -k "not postgres"`).
9. `pytest tests/backend/rules_engine/test_origin.py` – deterministische origin engine regressies.
10. `pytest tests/backend/connectors/test_connectors.py` – caching en health-checks voor HMRC/TARIC/WCO.
11. `pytest tests/backend/orchestrator/test_router.py` – kostenbewuste routing, consensus judge en veiligheidsbeleid.
12. `pytest tests/backend/ltsd_service/test_app.py` – LTSD evaluatie + certificaat stroom met ledger-verificaties.
13. `pytest tests/backend/erp_integration/test_service.py` – ERP outbox + saga workflow met idempotency/backoff (vereist Docker).
14. `npm run test -- tests/api/ltsd-addon.routes.test.ts` – Next.js LTSD evaluate/generate routes + certificate lookup.
15. `scripts/observability_apply.sh --plan` – inventariseert observability assets.
16. `scripts/build_release_bundle.sh --plan` – controleert bundlestappen.

## Configuratiebestanden (moeten aanwezig zijn)
- `.editorconfig`, `.gitignore`, `.gitattributes` – reeds aanwezig.
- `.github/workflows/` – bestaande workflows vereisen upgrade in Batch 1.
- `.github/CODEOWNERS` – basisindeling aanwezig, wordt uitgebreid bij module-aanmaak.

## Scripts (batch 0)
| Script | Omschrijving | Opmerkingen |
| --- | --- | --- |
| `scripts/init_quality_stack.sh` | Pre-commit + npm install + baseline config check. | default plan-modus; `--run` voert acties uit. |
| `scripts/etl_rules_with_validation.sh` | Voert schema + GE-validatie en ETL naar Postgres uit. | Vereist `PSRA_DB_DSN` of `--dsn` voor database connectie. |
| `scripts/rac_validate.sh` | Schema + golden tests. | bouwt automatisch de native validator en voert pytest uit. |
| `scripts/test_unit.sh` | Python + Vitest unit tests. | Combineert `pytest` en `npm run test`. |
| `scripts/test_integration.sh` | Pytest integration + Playwright API. | vereist markers/config in latere batches. |
| `scripts/test_e2e.sh` | Playwright browser flows. | Installeert browsers indien nodig. |
| `scripts/test_load_smoke.sh` | k6 smoke test. | Veronderstelt `ops/loadtest/k6_smoke.js`. |
| `scripts/observability_apply.sh` | Prometheus/Grafana manifest apply. | Fallback naar manifestlijst zonder kubectl. |
| `scripts/build_release_bundle.sh` | Bouwt releasebundle + SBOM. | Output `dist/release-bundle/` + tarball. |

## Rollbackstrategie
- Batch 0 bevat uitsluitend documentatie en scripts → rollback = verwijdering van toegevoegde bestanden (`git revert`).
- Voor toekomstige batches: gebruik `scripts/build_release_bundle.sh --plan` om rollback artefacten te valideren.

## Smoke-tests
- **Plan check**: voer alle scripts in `--plan` modus uit (verwacht exit code 0).
- **Lint placeholder**: `npm run lint` (huidige codebase).
- **Typecheck placeholder**: `npm run typecheck`.
- **Orchestrator smoke**: `pytest tests/backend/orchestrator/test_router.py` (verwacht consensus ≥0.8 en readiness gating actief).

## Issue-tracking & acceptatie
- Maak per subtaak een Jira-issue gekoppeld aan ID (bijv. `Y1-A.1`).
- Voeg `docs/ACCEPTANCE_<ID>.md` toe per afgeronde subtaak met testresultaten en observability snapshots.

## Volgende batch (Batch 8)
- Partner API/webhooks (`Y1-A.15`) inclusief Playwright regressies en webhook-delivery events.
- `docs/EXEC_PLAN_FULL.csv` genereren met volledige DAG en dependency metadata.
- Voorwerk audit ledger koppeling voor LTSD generate → versieledger (`Y1-A.24`).
- Start voorbereidingen voor Vault/OpenBao integratie (`Y1-A.16`).

## Historiek
- **2024-??-??** – Batch 0 runbook + scripts toegevoegd.
- **2024-??-??** – Batch 1 RaC foundation (schema, validator, golden tests, pre-commit/CI) toegevoegd.
- **2024-??-??** – Batch 2 canonical contracten, Postgres DAL en GE-ETL toegevoegd.
- **2024-??-??** – Batch 3 deterministische origin engine + HMRC/TARIC/WCO connectors toegevoegd.
- **2024-??-??** – Batch 4 Multi-LLM orchestrator router met consensus judge toegevoegd.
- **2024-??-??** – Batch 5 LTSD microservice (FastAPI) met PDF-notary streaming toegevoegd.
- **2024-??-??** – Batch 6 Next.js LTSD API-routes en Vitest regressies toegevoegd.
- **2024-??-??** – Batch 7 ERP-integratieservice met saga/outbox en idempotente receptsync toegevoegd.
