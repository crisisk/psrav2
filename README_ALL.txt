
## Snelle stappen
1) Unzip bovenop je huidige codeboom (na Fase 2).
2) Herstart **API** (en zorg dat env `SLACK_WEBHOOK_URL` is gezet als je Slack wilt gebruiken in andere flows).
3) Importeer n8n: `data_quality_monitor.json`.
4) Open `GET /metrics/report.html` voor dagoverzicht.
5) Tune drempels in de n8n workflow (`thresholds` node).

_Versie: phase3-v1.1.3-data-quality — 2025-10-07_
# UGC Bulk Suite — Fase 4 (v1.2): Dual Analytics Integratie (Matomo + GA4)

**Doel:** Matomo (self-hosted) en GA4 **parallel** laten draaien en data combineren voor AI-optimalisatie.
**Scope (increment-only t.o.v. Fase 3):** Matomo containers + WP-tracker injectie + n8n metrics collector.

## Inhoud
- `docker-compose.addon-matomo.yml` — voegt **matomo-app** (php-apache) en **matomo-db** (MariaDB) toe.
- `.env.delta` — extra variabelen voor GA4 & Matomo.
- `n8n/workflows/metrics_collector_dual_analytics.json` — dagelijkse Matomo + GA4 datacollectie → `/metrics/store`.
- `wp-plugin/sevensa-ugc-suite/includes/analytics.php` — **dual script injectie** (GA4 + Matomo) + simpele settingspagina.

## Snel starten
1) Merge `.env.delta` in je `.env` en vul waardes in.
2) Start Matomo stack:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.addon-matomo.yml up -d
   ```
3) Open Matomo wizard op `http://localhost:8082/` ⇒ maak site **ID=1** (of pas `MATOMO_SITE_ID` aan).
4) WordPress plugin: kopieer/overschrijf `includes/analytics.php` en activeer **Analytics Settings**.
5) n8n: importeer `metrics_collector_dual_analytics.json` en run handmatig of wacht op cron 08:00 CET.

_Versie: phase4-v1.2-dual-analytics — 2025-10-07_
# UGC Bulk Suite — Fase 5 (v1.2.1): Automated Optimization & Learning Loop

**Doel:** varianten automatisch verbeteren o.b.v. Matomo+GA4 KPI’s.
**Scope (increment-only):** Performance Loop Agent (n8n), `/optimize` API-stub, WP admin-widget.
# UGC Bulk Suite — Fase 7 (v1.3‑alpha): Multi‑Agent Collaboration Layer

**Let op:** Fase 6 (Provenance & Compliance) is overgeslagen op jouw verzoek.  
Deze fase introduceert een **agent‑orchestratie‑laag** met eventbus, coordinator‑API, n8n‑coördinatieflows en een **agent‑registry**.

## Doel
- Agents (UGC, Metrics, Optimizer, Scraper, etc.) **asynchroon** laten samenwerken via **event‑topics**.
- Eén centrale **Coordinator API** voor: events publiceren, agent‑status/logging, eenvoudige health/liveness.
- Lichtgewicht **NATS** eventbus (OSS) + n8n workflows voor publish/route.

## Inhoud (increment‑only bovenop Fase 5)
- `docker-compose.addon-eventbus.yml` → voegt **NATS** + **NATS Box** toe.
- `api/agent_orchestrator.py` → FastAPI router met endpoints:
  - `POST /agent/event`     → publiceer event (naar NATS)
  - `POST /agent/status`    → agent heartbeat/status loggen
  - `GET  /agent/status`    → laatste statusper agent ophalen
- `api/requirements.delta.txt` → `nats-py`
- `n8n/workflows/agent_coordinator.json` → centrale flow (Webhook → publish event → route sub‑workflows)
- `n8n/workflows/agent_worker_template.json` → template sub‑flow voor een worker‑agent
- `registry/agents.manifest.json` → agentrollen, topics, basiseindpunten
- `AGENTS-RUNBOOK.md` → setup & werkwijze (topics, env, testen)

## Snel starten
1) Voeg **.env** toe (bijv.):
   ```
   NATS_URL=nats://nats:4222
   ```
2) Start eventbus naast je bestaande compose:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.addon-eventbus.yml up -d
   ```
3) Herstart API (installeer extra reqs: `pip install -r api/requirements.delta.txt`).
4) Importeer n8n workflows: `agent_coordinator.json` en (als voorbeeld) `agent_worker_template.json`.
5) Test event:
   ```bash
   curl -X POST $API_PUBLIC_URL/agent/event -H "content-type: application/json" -d '{"topic":"ugc.events.create","payload":{"title":"Test","content":"Hallo"}}'
   ```

_Versie: phase7-v1.3-alpha-multi-agent — 2025-10-07_
# UGC Bulk Suite — Fase 8 (v1.3): Full Observability & Dashboards

**Doel:** End‑to‑end monitoring met Prometheus + Grafana en API‑metrics in Prometheus‑formaat.

## Inhoud (increment‑only bovenop Fase 7)
- `docker-compose.addon-observability.yml` — voegt **Prometheus** + **Grafana** toe.
- `observability/prometheus/prometheus.yml` — scrape config (API `/metrics`, n8n, Matomo).
- `observability/grafana/provisioning/` — datasources + dashboards auto‑provisioning.
- **API delta**: `api/metrics_exporter.py` + `api/requirements.delta.txt` → `prometheus-client`.
  - Exporteert **/metrics** met counters/histograms voor: requests, errors, latency, DLQ appends.
- **Dashboards**:
  - `dashboards/ugc_integrity.json` — integriteit (DLQ rate, invalid ratios).
  - `dashboards/ugc_performance.json` — KPI’s (requests, latency, optimizer events, collector success).

## Snel starten
1) Installeer API dep: `pip install -r api/requirements.delta.txt` en herstart de API.
2) Start observability‑stack:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.addon-observability.yml up -d
   ```
3) Open Grafana op `http://localhost:3000` (default login: admin / admin). Datasource = Prometheus (auto).
4) Dashboards staan automatisch klaar: **UGC Integrity** en **UGC Performance**.

_Versie: phase8-v1.3-observability — 2025-10-07_
Sevensa UGC Suite v0.1.1 - enhanced plugin with A/B taxonomy and media sideload.
# Iteratie: v1.1.1 — Data Integrity Delta (alleen updates)

**Doel:** waarborgen van dataconsistentie en herhaalbare dev-activiteiten op basis van jouw v1.1-basispakket.  
Deze delta **vervangt/voegt toe** onderstaande bestanden. Geen breaking changes.

## 🔧 Inbegrepen updates (korte lijst)
1) **API – atomic writes + JSON Schema validatie**
   - Nieuwe endpoints: `/integrity/hash`, `/integrity/validate`
   - Alle writes (`/dlq`, `/replicate/callback`, `/metrics/store`) gebruiken **atomic file writes** met `.tmp` → `rename()`.
   - JSON Schema’s voor `metrics_combined`, `replicate_callback`, `dlq`.

2) **n8n – integrity guards**
   - `integrity_guard_pre_publish.json`: Sub-workflow compute **idempotency-key** (SHA256 over title+content) → check duplicaten → pas publish door.
   - `metrics_integrity_monitor.json`: Dagelijkse schema-check van `metrics_combined.jsonl` → invalid → DLQ.

3) **Tools**
   - `tools/atomic_write.py`: helper voor atomische writes.
   - `tools/check_jsonl_schema.py`: bulk validator voor JSONL-bestanden tegen schema’s.

4) **Docs**
   - `INTEGRITY-RUNBOOK.md`: hoe te draaien in dev/staging, met quick-commands.

## 📦 Wat vervangen / toevoegen
- **Vervang**: `api/main.py` (drop-in replacement compatibel met v1.1).
- **Nieuw**: `api/schemas/*.json`, `n8n/workflows/*integrity*.json`, `tools/*.py`, docs.

## ▶️ Snelle stappen
1. Kopieer **inhoud** van deze ZIP **bovenop** v1.1 codeboom.
2. Herstart alleen de **API** container of service.
3. Importeer de 2 n8n-workflows.
4. Test:
   - `POST /integrity/hash`
   - `POST /integrity/validate` met een metrics-voorbeeld (zie schema’s)
   - Run `metrics_integrity_monitor` handmatig in n8n.

_Versie: 1.1.1 — 2025-10-07_

# Fase 1 — Quality gates als blocker (CI) — 2025-10-07

**Doel**: Accessibility/Performance/SEO drempels afdwingen in PRs.

## Actie
1) Zet je staging-URLs in `qa/lighthouse/lighthouserc.json`.
2) Commit workflow `.github/workflows/quality.yml`.

## KPI
- Accessibility ≥ 0.9
- Performance ≥ 0.8
- SEO ≥ 0.9

# Fase 2 — Kostenmonitoring (Prometheus + Grafana) — 2025-10-07

**Doel**: Kosten & tokenverbruik monitoren per model/klant.

## Actie
1) Pas `orchestrator/app.py` aan om metrics-router te mounten (patch hieronder).
2) Start Prometheus scrape op `/metrics` en importeer het Grafana dashboard.

# Fase 3 — CRO v2.0 (Bandit + Sticky + UI) — 2025-10-07

**Doel**: Thompson Sampling, sticky server-side, eenvoudige WP UI.

## Acties
- Verbind `cro_eval` met echte counters uit WP (options of aparte tabel).
- Server-side sticky cookie + fallback JS/localStorage.
- Voeg eenvoudige beheer-UI toe in WP.

# Fase 4 — Internal Linking v2.0 — 2025-10-07

**Doel**: D3 viewer + fetch van echte artefacten, orphans/suggesties UI en batch-apply via WP-CLI.

# Fase 5 — Exporters (Elementor/Divi) — 2025-10-07

**Doel**: Mapping voor 5 kernsecties (hero/usp/cta/testimonial/pricing) + smoke-tests.

# Fase 6 — GBP Full Sync — 2025-10-07

**Doel**: OAuth/service-account; NAW/openingstijden/posts + UTM; logging & AVG-masking.

# Fase 7 — Brand/Asset Agent — 2025-10-07

**Doel**: Alt-text generatie, compressie, design tokens, contrast-checks; integratie met pattern-pipeline.

# Fase 8 — Progress UX — 2025-10-07

**Doel**: Grafische tijdlijn van jobs, icons per stap, links naar artefacts, filters en retry-knoppen.
# WPCS Addons (8 Phases)

This archive consolidates all generated addon packs.
# WPCS Design Orchestrator (MVP)

FastAPI-service met RQ (Redis Queue) voor multi-agent taken:
- Intake & Sitemap
- Wireframe & Copy (Figma/LLM)
- Gutenberg Composer
- Accessibility & Performance QA (axe-core via Playwright)
- Local SEO generator
- CRO Variant builder

## Quickstart (Dev)

1. **Environment**
   ```bash
   cp .env.example .env
   # Stel je BYOK-model keys in: OPENROUTER_API_KEY, ANTHROPIC_API_KEY, OPENAI_API_KEY (optioneel)
   # Figma: FIGMA_TOKEN
   # Redis: REDIS_URL=redis://redis:6379/0
   ```

2. **Docker (aanrader)**
   ```bash
   docker compose up --build
   ```

3. **API**
   - OpenAPI: `http://localhost:8080/docs`
   - Health: `GET /health`
   - Jobs: `POST /api/jobs/create`, `GET /api/jobs/status/{id}`

4. **Workers**
   - Worden automatisch gestart via `worker` service in docker-compose.

## Beveiliging
- Gebruik Vault/AppRole voor secrets in productie (zie `../config/vault/`).
- Rate limiting en cost caps in `.env`.
- Auditlog in `./logs`.

*Laatste update:* 2025-10-07# QA: Playwright + axe-core (stub)

MVP-runner voor accessibility checks. In productie:
- Installeer deps (`npm i`), run `npx playwright install`.
- Start met: `npm run qa -- https://jouwsite.nl`.

De runner voegt `axe.min.js` toe aan de pagina en schrijft JSON-resultaten naar `./out/axe.json`.=== WPCS Design Co-Pilot ===
Contributors: sevensa
Tags: ai, design, gutenberg, accessibility, seo, cro
Requires at least: 6.4
Tested up to: 6.6
Stable tag: 0.1.0
License: GPLv2 or later

AI-gestuurde design-assistent voor WordPress Control Suite.
# WPCS GitOps Bundle

## 1) Packs mergen in master
1. Plaats de 6 roadmap ZIPs in een lokale map, bv. `~/packs`.
2. Run `./merge_runner.sh` en volg de prompts (repo pad, packs pad, remote).
3. Check `.wpcs_diffs/` en je commit op master.

## 2) Verbeteringen doorvoeren als branch
1. Run `./branch_apply.sh` en volg de prompts.
2. Script maakt branch `feature/wpcs-stack-v2`, kopieert `improvements/` in je repo, commit en pusht.
3. Open vervolgens een PR en werk gefaseerd verder volgens `docs/IMPROVEMENTS_8_PHASE_PLAN.md`.

**Opmerking**: Scripts wijzigen niets aan je Git-config behalve branches/commits pushen zoals gevraagd.

# Pack 1 — CRO v2.0 (Bandits + Sticky + UI) — 2025-10-07

**Doel**: Upgrade A/B → multi-armed bandit (Thompson Sampling), sticky assignments server-side,
en een basis-UI in WordPress voor experimentbeheer.

## Inhoud
- `orchestrator/modules/cro_bandit.py` — Thompson Sampling implementatie (Bernoulli).
- `orchestrator/jobs/tasks_cro.py` — Job-taken om experimenten te creëren en resultaten te evalueren.
- `wp-plugin/wpcs-design-copilot/includes/class-wpcs-experiments-admin.php` — WP Admin UI (lijst, status, winner).
- `wp-plugin/wpcs-design-copilot/assets/wpcs-cro-admin.js` — eenvoudige UI-logica (fetch/status).
- `docs/PACK1_INTEGRATION.md` — stappen om te mergen.
# Pack 2 — Internal Linking v2.0 — 2025-10-07
D3-visualisatie + orphans + suggesties.# Pack 3 — GBP Full Scaffold — 2025-10-07
Voorbereiding voor Google Business Profile sync.# Pack 4 — Exporters (Elementor/Divi) — 2025-10-07
Stubs voor blueprint → builder JSON.# Pack 5 — QA Tighten — 2025-10-07
Combineer axe + Lighthouse als release gate.# Pack 6 — Cost Monitoring & Dashboards — 2025-10-07
Kosten-logging + Prometheus export + Grafana dashboard.# Orchestrator placeholder (LangGraph/MCP come in later phases)
# Protocols placeholder (MCP adapters will be added in Phase 4)

# Fase 1 — Quality gates als blocker (CI) — 2025-10-07

**Doel**: Accessibility/Performance/SEO drempels afdwingen in PRs.

## Actie
1) Zet je staging-URLs in `qa/lighthouse/lighthouserc.json`.
2) Commit workflow `.github/workflows/quality.yml`.

## KPI
- Accessibility ≥ 0.9
- Performance ≥ 0.8
- SEO ≥ 0.9

# Fase 2 — Kostenmonitoring (Prometheus + Grafana) — 2025-10-07

**Doel**: Kosten & tokenverbruik monitoren per model/klant.

## Actie
1) Pas `orchestrator/app.py` aan om metrics-router te mounten (patch hieronder).
2) Start Prometheus scrape op `/metrics` en importeer het Grafana dashboard.

# Fase 3 — CRO v2.0 (Bandit + Sticky + UI) — 2025-10-07

**Doel**: Thompson Sampling, sticky server-side, eenvoudige WP UI.

## Acties
- Verbind `cro_eval` met echte counters uit WP (options of aparte tabel).
- Server-side sticky cookie + fallback JS/localStorage.
- Voeg eenvoudige beheer-UI toe in WP.

# Fase 4 — Internal Linking v2.0 — 2025-10-07

**Doel**: D3 viewer + fetch van echte artefacten, orphans/suggesties UI en batch-apply via WP-CLI.

# Fase 5 — Exporters (Elementor/Divi) — 2025-10-07

**Doel**: Mapping voor 5 kernsecties (hero/usp/cta/testimonial/pricing) + smoke-tests.

# Fase 6 — GBP Full Sync — 2025-10-07

**Doel**: OAuth/service-account; NAW/openingstijden/posts + UTM; logging & AVG-masking.

# Fase 7 — Brand/Asset Agent — 2025-10-07

**Doel**: Alt-text generatie, compressie, design tokens, contrast-checks; integratie met pattern-pipeline.

# Fase 8 — Progress UX — 2025-10-07

**Doel**: Grafische tijdlijn van jobs, icons per stap, links naar artefacts, filters en retry-knoppen.
# WPCS Design Orchestrator (MVP)

FastAPI-service met RQ (Redis Queue) voor multi-agent taken:
- Intake & Sitemap
- Wireframe & Copy (Figma/LLM)
- Gutenberg Composer
- Accessibility & Performance QA (axe-core via Playwright)
- Local SEO generator
- CRO Variant builder

## Quickstart (Dev)

1. **Environment**
   ```bash
   cp .env.example .env
   # Stel je BYOK-model keys in: OPENROUTER_API_KEY, ANTHROPIC_API_KEY, OPENAI_API_KEY (optioneel)
   # Figma: FIGMA_TOKEN
   # Redis: REDIS_URL=redis://redis:6379/0
   ```

2. **Docker (aanrader)**
   ```bash
   docker compose up --build
   ```

3. **API**
   - OpenAPI: `http://localhost:8080/docs`
   - Health: `GET /health`
   - Jobs: `POST /api/jobs/create`, `GET /api/jobs/status/{id}`

4. **Workers**
   - Worden automatisch gestart via `worker` service in docker-compose.

## Beveiliging
- Gebruik Vault/AppRole voor secrets in productie (zie `../config/vault/`).
- Rate limiting en cost caps in `.env`.
- Auditlog in `./logs`.

*Laatste update:* 2025-10-07# QA: Playwright + axe-core (stub)

MVP-runner voor accessibility checks. In productie:
- Installeer deps (`npm i`), run `npx playwright install`.
- Start met: `npm run qa -- https://jouwsite.nl`.

De runner voegt `axe.min.js` toe aan de pagina en schrijft JSON-resultaten naar `./out/axe.json`.=== WPCS Design Co-Pilot ===
Contributors: sevensa
Tags: ai, design, gutenberg, accessibility, seo, cro
Requires at least: 6.4
Tested up to: 6.6
Stable tag: 0.1.0
License: GPLv2 or later

AI-gestuurde design-assistent voor WordPress Control Suite.Sevensa UGC Suite v0.1.1 - enhanced plugin with A/B taxonomy and media sideload.
