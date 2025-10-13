# PSRA-LTSD Execution Plan (Batch 0)

## Bron & uitgangspunten
- Basisdocument: [PSRA-LTSD Platform - Gedetailleerde Subtaken Breakdown (2025-2028).md](../PSRA-LTSD Platform - Gedetailleerde Subtaken Breakdown (2025-2028).md).
- Hard constraints: geen secrets in code/CI, mTLS everywhere, Vault/OpenBao AppRole, SLO p95 < 1s, RaC schema + golden tests verplicht, Conventional Commits en CHANGELOG beheer.
- Domeinstructies: canonical data contracts voor PSRA ↔ inventory/billing/transport, audit ledger append-only, EU AI Act readiness.

## Methode
1. Elke subtaak krijgt metadata: ID, Werkpakket, Impact (H=hoog, M=middel, L=laag), Risico (H/M/L), Dependencies, Deliverable, Teststrategie.
2. Taken zijn topologisch geordend op basis van hun afhankelijkheden uit het roadmapdocument.
3. Taken worden gebundeld in batches met een maximale review footprint van ~400 LOC.
4. Elke batch levert volledige testdekking (unit, integration, e2e, load/k6) en draait `scripts/rac_validate.sh --run` zodra RaC assets aanwezig zijn.
5. Feature flags (LaunchDarkly/Flagsmith placeholder) worden voorbereid in batches waar productie-impact verwacht wordt.

## Topologische volgorde (uittreksel)

| Volgorde | Subtaak | Impact | Risico | Afhankelijkheden | Teststrategie |
| --- | --- | --- | --- | --- | --- |
| 1 | Y1-A.1 Strict JSON Schema v2 | H | M | - | pytest schema tests, jsonschema CLI |
| 2 | Y1-A.2 Rust/C parser + bindings | H | H | Y1-A.1 | Rust unit tests, Python binding tests |
| 3 | Y1-A.3 Golden tests HS39/40 | H | M | Y1-A.1 | pytest golden suite |
| 4 | Y1-A.4 pre-commit hook | M | L | Y1-A.2, Y1-A.3 | pre-commit run --all-files |
| 5 | Y1-A.5 CI gate | H | M | Y1-A.4 | gha workflow dry-run |
| 6 | Y1-A.6 Pydantic contracts | H | M | - | pytest contracts, mypy |
| 7 | Y1-A.7 DAL Postgres | H | H | Y1-A.6 | pytest integration (docker compose), mypy |
| 8 | Y1-A.8 ETL ingest_rules.py | H | H | Y1-A.1, Y1-A.7 | Great Expectations suite |
| 9 | Y1-A.9 Origin engine | H | H | Y1-A.7, Y1-A.8 | pytest deterministic cases |
| 10 | Y1-A.10 External connectors | H | M | - | contract tests, caching TTL tests |
| 11 | Y1-A.11 Orchestrator router | H | H | - | unit tests, contract tests |
| 12 | Y1-A.12 LTSD microservice | H | H | Y1-A.9 | FastAPI tests, contract |
| 13 | Y1-A.13 Next.js API routes | H | M | Y1-A.12 | zod unit tests, Playwright |
| 14 | Y1-A.14 ERP integration | M | H | - | saga integration tests |
| 15 | Y1-A.15 Partner API/webhooks | H | M | Y1-A.12 | API contract + Playwright |
| 16 | Y1-A.16 Vault/OpenBao | H | H | - | unit tests w/ mock vault |
| 17 | Y1-A.17 mTLS + RLS | H | H | Y1-A.16 | Postgres integration, TLS smoke |
| 18 | Y1-A.18 Keycloak RBAC | H | M | Y1-A.17 | Keycloak integration tests |
| 19 | Y1-A.19 Metrics export | M | M | - | promtool check |
| 20 | Y1-A.20 SLO dashboards | M | M | Y1-A.19 | grafana lint |
| 21 | Y1-A.21 Alerting | M | M | Y1-A.20 | alertmanager unit tests |
| 22 | Y1-A.22 CI workflows | H | M | - | act local run |
| 23 | Y1-A.23 SBOM/Trivy | H | M | Y1-A.22 | gha logs |
| 24 | Y1-A.24 Audit ledger | H | H | - | pytest ledger, property tests |
| 25 | Y1-A.25 DSAR/RTBF | H | H | Y1-A.24 | API contract tests |
| 26 | Y1-A.26 PITR | M | H | - | restore integration |
| 27 | Y1-A.27 Feature flags + blue/green | H | M | Y1-A.22 | integration tests |
| ... | ... | ... | ... | ... | ... |

Volledige lijst inclusief Y1-B t/m Y3-E is opgenomen in `docs/EXEC_PLAN_FULL.csv` (TODO in latere batch).

## Batchplanning (eerste 3 batches)

### Batch 0 – Hygienic Foundation
- scripts/ init (deze commit): kwaliteitsscripts, planning, RUNBOOK.
- Doel: borg tooling voordat code verandert.

### Batch 1 – RaC 2.0 Foundation ✅
- Y1-A.1 t/m Y1-A.5 afgerond.
- Deliverables: JSON Schema v2, native validator met Python bindings, golden tests, pre-commit config, CI workflow.
- Tests: `scripts/rac_validate.sh --run`, `poetry run pytest tests/golden`, `poetry run pre-commit run --all-files`.

### Batch 2 – Canonical Contracts & DAL ✅
- Y1-A.6 t/m Y1-A.8 afgerond met immutable Pydantic contracten, Postgres DAL en GE-gedreven ETL.
- Deliverables: `/backend/app/contracts/psra.py`, `/backend/app/dal/postgres_dal.py`, `/backend/app/etl/ingest_rules.py`, tests onder `tests/backend/**`.
- Tests: `pytest tests/backend/contracts`, `pytest tests/backend/dal`, `pytest tests/backend/etl` (Docker vereist voor Postgres testcontainers).

### Batch 3 – Deterministic Origin Engine & Connectors ✅
- Y1-A.9 en Y1-A.10 afgerond met een deterministische origin evaluator en gecachte HMRC/TARIC/WCO connectors.
- Deliverables: `backend/rules_engine/origin.py`, `backend/connectors/{base,hmrc,taric,wco}.py`, nieuwe pytest suites.
- Tests: `pytest tests/backend/rules_engine/test_origin.py`, `pytest tests/backend/connectors/test_connectors.py`.

### Batch 4 – Multi-LLM Orchestrator Router ✅
- Y1-A.11 gerealiseerd met kostenbewuste routering, consensus-judge, caching en veiligheidsbeleid voor gevoelige prompts.
- Deliverables: `backend/orchestrator/router.py`, `backend/orchestrator/__init__.py`, `tests/backend/orchestrator/test_router.py`.
- Tests: `pytest tests/backend/orchestrator/test_router.py`.

### Batch 5 – LTSD Microservice ✅
- Y1-A.12 afgerond met FastAPI-microservice die deterministische evaluaties draait en PDF-certificaten met notary-hash streamt.
- Deliverables: `backend/ltsd_service/app.py`, `backend/ltsd_service/__init__.py`, `tests/backend/ltsd_service/test_app.py`, `docs/ACCEPTANCE_Y1-A12.md`.
- Tests: `pytest tests/backend/ltsd_service/test_app.py`.

### Batch 6 – LTSD Next.js API ✅
- Y1-A.13 afgerond met Next.js API-routes voor `/ltsd-addon/evaluate`, `/ltsd-addon/generate` en `certificates/[id]` inclusief Zod-validatie, camel⇄snake transformatie en foutpropagatie.
- Deliverables: `app/api/ltsd-addon/{evaluate,generate}/route.ts`, `app/api/certificates/[id]/route.ts`, `lib/integrations/ltsd-service.ts`, `lib/integrations/ltsd-contracts.ts`, `lib/utils/case.ts`, `docs/ACCEPTANCE_Y1-A13.md`.
- Tests: `npm run test -- tests/api/ltsd-addon.routes.test.ts`.

### Batch 7 – ERP Integratie Service ✅
- Y1-A.14 afgerond met een outbox-gedreven ERP-integratieservice inclusief idempotency keys en retry/backoff.
- Deliverables: `backend/app/contracts/inventory.py`, `backend/app/dal/models.py` (erp_outbox), `backend/erp_integration/service.py`, `tests/backend/erp_integration/test_service.py`, `docs/ACCEPTANCE_Y1-A14.md`.
- Tests: `pytest tests/backend/erp_integration/test_service.py` (vereist Docker voor Postgres testcontainer).

Volgende batches volgen de roadmap: LTSD microservice/API, ERP/Partner integraties, Security & GDPR kit, Observability, EU AI Act compliance fases, LCNC builder, predictive analytics, generative reporting en wereldwijde expansie.

## Teststrategie per categorie
- **Unit**: pytest, vitest, targeted coverage diff ≥85%.
- **Integration**: Postgres DAL tests met docker-compose, API tests met httpx/pytest, Playwright API flows.
- **E2E**: Browser flows met Playwright; orchestrator & LTSD endpoints via Next.js routes.
- **Load**: k6 smoke + SLO gating (1000ms p95, stretch 700ms).
- **Data Quality**: Great Expectations suites per ETL-run.
- **Security**: Trivy image scan, gitleaks (via pre-commit/CI), SBOM (syft), dependency review.

## Feature Flags & Deploystrategie
- Feature toggles via LaunchDarkly/Flagsmith placeholder environment variables; actual SDK integration gepland in Y1-A.27.
- Canary rollout: apply to 1-2 tenants, monitor SLO dashboards, auto-rollback via scripts/build_release_bundle.sh artifacts.

## Observability
- `/metrics` exposure op nieuwe services, Prometheus scrape config in `ops/observability/`.
- Grafana dashboards voor SLO, ETL freshness, webhook success, LLM cost.
- Alertmanager rules: error budget burn, ETL stale, webhook failure.

## Documentatie & Acceptatie
- Elke subtaak levert `/docs/ACCEPTANCE_<ID>.md` met scenario's, testoutput, links/screenshot.
- Audit trail: verwijzing naar append-only ledger once implemented (Y1-A.24).

## Open risico's (batch 0)
- Backend-structuur ontbreekt momenteel in repo → taken Y1-A.6+ vereisen scaffolding.
- Geen bestaande tests/golden suites → init batches moeten data verzamelen.
- Vault/OpenBao integratie onduidelijk → vereist alignment met infra team.
- Playwright en k6 vereisen lokale dependencies; scripts geven instructies maar geen binaries.

## Volgende stappen
1. Start Batch 7 (`Y1-A.14`) – ERP integratie service met saga/outbox patroon en idempotency keys.
2. Ontwerp Partner API/webhook contracten (`Y1-A.15`) zodat Playwright en contracttests voorbereid zijn.
3. Inventariseer ledger persistence (LTSD generate → audit service) als voorbereiding op `Y1-A.24`.
4. Prepareer Playwright flows voor LTSD evaluate/generate UI en definieer k6 smoke-scripts voor nieuwe routes.
