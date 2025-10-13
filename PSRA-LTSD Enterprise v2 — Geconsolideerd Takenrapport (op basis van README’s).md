# PSRA‑LTSD Enterprise v2 — Geconsolideerd Takenrapport (op basis van README’s)
Datum: 2025-10-10  
Auteur: ChatGPT (voor Chris, Klokkers Consultancy)

> **Doel van dit document**  
> Dit rapport consolideert alle taken en vervolgacties die voortkomen uit de README‑bestanden in de repository *psra‑ltsd‑enterprise-v2* (inclusief `README.md` in de root en `infra/README.md`). Ter verrijking en verifiëring zijn ondersteunende secties gecontroleerd met **CHECKLIST.md**, **ARCHITECTURE.md**, **SECURITY.md** en **CONTRIBUTING.md**. Het resultaat is een uitvoerbaar en prioriteerbaar takenpakket voor realisatie en borging van de PSRA‑LTSD Enterprise v2‑omgeving.

## Bronnen (waar deze taken op gebaseerd zijn)
- **Root README:** projectbeschrijving, functionaliteit en vervolgstappen voor de Next.js 14 frontend en persona‑gestuurde UAT.  
- **`infra/README.md`:** status en richting infrastructuur‑artefacten (IaC/Helm/Kubernetes).  
- **`CHECKLIST.md`:** onboarding‑acceptatie per persona + technische gates.  
- **`ARCHITECTURE.md`:** systeemcontext, componenten, dataflows en observability.  
- **`SECURITY.md`:** beleid, eisen (OWASP/ASVS), SBOM, signing, secrets.  
- **`CONTRIBUTING.md`:** werkwijze, quality gates en PR‑criteria.

> *NB*: Dit takenpakket is afgeleid van bovengenoemde bronnen en geformuleerd als **Definition of Done**‑gerichte actiepunten met duidelijke criteria.

## Inhoud
1. Samenvatting & uitgangspunten  
2. Overzicht architectuur en scope  
3. Takenoverzicht per domein (hoofdstukken)  
   3.1 Frontend (Next.js 14)  
   3.2 API’s & Integraties  
   3.3 Data & Persistence (PostgreSQL/Prisma + fallbacks)  
   3.4 UAT & Persona‑gedreven validatie  
   3.5 Security & Compliance (OWASP/ASVS, supply chain)  
   3.6 Observability & Health  
   3.7 CI/CD & Kwaliteitshekken  
   3.8 Infrastructuur & Deploy (Docker/Kubernetes)  
   3.9 Documentatie & Kennisborging  
   3.10 Lokale betrokkenheid & privacy (Brabant/Limburg)  
4. Gedetailleerde backlog (prioritair)  
5. Planning & mijlpalen (voorbeeld)  
6. RACI & rollen  
7. Risico’s & mitigaties  
8. KPI’s & acceptatiecriteria (samengevat)  
9. Bijlagen (bestandsverwijzingen)

## 1. Samenvatting & uitgangspunten

**PSRA‑LTSD Enterprise v2** levert een productieklare origin‑checker frontend met explainability, persona‑gestuurde UAT‑scenario’s en theming, aangesloten op een LangGraph‑powered origin engine binnen dezelfde monorepo. De README geeft een duidelijke **Snelstart**, verwijst naar tien persona‑flows en benoemt **verdere stappen** (o.a. integratie met notificatieservice voor automatische verspreiding van persona‑feedback).  
**ARCHITECTURE.md** bevestigt de indeling: Next.js 14, route‑gebaseerde API’s met Zod‑validatie, PostgreSQL/Prisma met seeddata en **graceful fallbacks** naar mock‑opslag, plus observability via health‑endpoints en dashboards.  
**CHECKLIST.md** vertaalt dit naar concrete **onboarding‑acceptatie** (CFO, Compliance, Analyst, Auditor, Supplier, Sysadmin) en **technische gates** (auth/rate‑limit op health/metrics, E2E Playwright, persona‑KPI widgets, etc.).  
**SECURITY.md** zet aanvullend in op **OWASP/ASVS**, **SBOM (CycloneDX)**, **artifact signing (Cosign)** en **Trivy/CodeQL** in CI. **CONTRIBUTING.md** borgt de ontwikkelwijze (lint/typecheck/tests, conventionele commits, Zod in routes, repository‑laag).  
**infra/README.md** markeert dat IaC/Kubernetes‑artefacten worden toegevoegd zodra de deployment‑targets zijn gefinaliseerd; de release buildt en **sign**t containers nu al.

**Kernboodschap:** de basis staat. De resterende werkzaamheden draaien om **afronden, borgen en integreren**: persona‑acceptatie, API‑hardening, observability, supply‑chain security, IaC‑uitwerking, UAT/QA‑dekking en duidelijke DOD’s per deliverable.

## 2. Overzicht architectuur en scope (afgeleid uit README & ARCHITECTURE)

- **Frontend**: Next.js 14; server components (`app/`) + client components (`components/`); theming via `ThemeProvider`; dashboards voor HS39/HS40, systeemstatus, explainability (Sankey), KPI‑gauges; herontworpen Origin Calculator met materiaalbeheer, persona‑inzichten en explainability output.
- **API’s**: route handlers onder `app/api/**`; **Zod**‑validatie; endpoints o.a. `/api/origin/calculate`, `/api/certificates`, `/api/certificates/[id]/pdf`, `/api/hs-codes`, `/api/analytics`, `/api/health`.
- **Data & persistence**: `lib/db.ts` (pool), `lib/repository.ts` (repository‑laag), **Prisma** in `prisma/schema.prisma` + `prisma/seed.ts` (HS‑codes, afspraken, origin rules, certificates); **mock/fallback** paden bij afwezige DB.
- **Observability**: `/api/health` voor dependency‑gezondheid (DB, Redis, queues, notificaties); dashboard pollt live indicatoren.
- **Security & supply chain**: Zod + typed payloads; parametrized SQL; HTTPS voor TARIC; pre‑commit hooks en Vitest; **SBOM**, **Trivy**, **CodeQL**, **Cosign** signing in release pipeline.
- **Infra & deploy**: Docker (multi‑stage, non‑root runtime), image signing; IaC/Kubernetes komt eraan (infra README).

**Scope van dit rapport:** het vertalen van bovenstaande naar concrete **taken, DOD’s, afhankelijkheden en acceptatiecriteria** zodat implementatie en audit in één keer goed zijn.

## 3. Taken per domein

### 3.1 Frontend (Next.js 14)

**Doel**: Volledig functionele, toegankelijke en gevalideerde dashboards + Origin Calculator, conform README en persona‑scenario’s.

**Taken**
- **Theming & UX**
  - Verifieer light/dark modus met persistente voorkeuren (`ThemeProvider`); check contrast/ARIA en toetsenbordnavigatie.
  - Borg semantische structuur voor schermlezers (landmarks, headings, aria‑attributes).
- **Origin Calculator**
  - Bevestig materiaalbeheerflows (toevoegen/bewerken/verwijderen) en explainability‑output (Sankey).
  - Koppel persona‑inzichten vanuit `data/persona-scenarios.ts` en toon feedback in UI.
- **Dashboards**
  - HS39/HS40 statistiek‑widgets (up‑to‑date en met loading/skeleton states).
  - KPI‑gauges en System Status integreren met backend endpoints (`/api/health`, analytics).
- **Tabellen & Polling**
  - `DataTable` autorefresh met **gedeelde backoff/abort utility**; expose **live regions** voor assistive tech (zie technical gates).
- **Testing**
  - Unit/component tests (Vitest) + **E2E Playwright** voor alle onboarding‑persona’s met seeded fixtures.
- **Verdere stappen README**
  - **Notificatieservice** integreren voor automatische verspreiding van persona‑feedback.

**Definition of Done**
- A11y Lighthouse ≥ **0.9**, Performance ≥ **0.8**, SEO ≥ **0.9** (als quality gate in CI).
- Alle persona‑flows slagen (E2E), inclusief explainability, certificaat‑weergave en feedbackloop.
- System Status toont correcte health; polling is annuleerbaar en toegankelijk.
- Foutstates zijn mensvriendelijk en gelogd (audit).

### 3.2 API’s & Integraties

**Doel**: Robuuste REST‑routes met **Zod**‑validatie, rate‑limiting, audit‑logging en duidelijke contracten.

**Taken**
- **Origin**: `/api/origin/calculate` retourneert **201** en **persistente certificate** **ook zonder DB** (fallback enabled).
- **Certificates**: CRUD + PDF‑streaming (`/api/certificates/[id]/pdf`) via `lib/pdf-generator.ts`.
- **HS Codes & TARIC**: `/api/hs-codes` met caching en gecontroleerde back‑offs; HTTPS only.
- **Analytics**: `/api/analytics` met aggregaties voor dashboard KPI’s.
- **Health & Metrics**: `/api/health`; metrics/observability endpoints achter auth + rate limiting (security gate).
- **Validatie**: Zod‑schemas verplicht voor alle POST/PUT endpoints; 400/422 gedrag gestandaardiseerd.
- **Beveiliging**: SQL‑parametrisatie, input sanitization, request‑size limits.

**Definition of Done**
- OpenAPI‑definitie of at least route‑contracten in repo; eenduidige error‑vorm (`code`, `message`, `details`).
- Rate limiting & auth toegepast op health/metrics.
- Volledige testdekking voor happy/edge/error paths.

### 3.3 Data & Persistence (PostgreSQL/Prisma + fallbacks)

**Doel**: Betrouwbare opslag met **graceful degradation** indien DB afwezig is.

**Taken**
- **Schema & Seeds**: Controleer `prisma/schema.prisma` + `prisma/seed.ts` (HS‑codes, afspraken, origin rules, certificates).
- **Repository‑laag**: Alle data‑toegang via `lib/repository.ts`; schrijf pad‑onafhankelijke mocks voor offline/demo.
- **Transacties & idempotentie**: Atomic writes en idempotency‑keys op kritieke flows (certificaten, metrics).
- **Migratiepad**: Alembic/Prisma migraties (per omgeving), rollback‑scenario’s gedocumenteerd.
- **Backups & retentie**: Retentiebeleid en exportmogelijkheden (auditors).

**Definition of Done**
- Seeds produceerbaar, migraties herhaalbaar in CI + staging.
- Fallbacks leveren **functionele pariteit** (feature‑flags in `lib/config.ts`).
- Data‑integriteit aantoonbaar (schema‑validatie, referentiële checks).

### 3.4 UAT & Persona‑gedreven validatie

**Doel**: Onboarding‑acceptatie voor alle sleutel‑persona’s zoals gedefinieerd in **CHECKLIST.md**.

**Taken (per persona)**
- **CFO/Finance**: ROI‑delta, landed cost, savings memo zichtbaar in certificate‑preview.
- **Compliance Manager**: Evidence checklist vóór origin‑calculation; confidence alerts → backlog taak.
- **Analyst/Operator**: Minimal HS dataset import triggert explainability focus + feedbacklinkage.
- **Auditor**: Sampling queue, signature‑status en audit‑trail export na calculation.
- **Supplier**: Extern portaal voor documentuploads, ESG‑bijlagen en SLA‑timer.
- **System Admin**: Health dashboard gated by admin role; SLA thresholds & alert destinations geconfigureerd.

**Testing/Gates**
- **E2E Playwright** suite voor **alle** onboarding‑persona’s met seeded fixtures.
- Dashboard persona‑KPI widgets + glossary links en filters.

**Definition of Done**
- Alle checkboxen in **CHECKLIST.md** staan op ✅ en worden in CI gerapporteerd.
- UAT‑verslagen per persona zijn opgeslagen (artefacten).

### 3.5 Security & Compliance (OWASP/ASVS, supply chain)

**Doel**: Productieklare beveiliging conform **OWASP ASVS L2**, supply‑chain hardening en responsible disclosure.

**Taken**
- **ASVS‑maatregelen**: Mitigaties aantoonbaar in routes (auth, input‑validatie, XSS, logging/monitoring).
- **Dependency governance**: `make scan` (Trivy) clean, of risk acceptance gedocumenteerd in PR.
- **SBOM & Signatures**: CycloneDX SBOM (`make sbom`) en **Cosign** signing in release pipeline.
- **Secrets**: Geen secrets in git; gebruik GitHub Actions secrets; `.env.local` voor dev.
- **Disclosure**: PGP key en response‑SLA’s geborgd.

**Definition of Done**
- CI badge met geslaagde Trivy/CodeQL en Cosign‑verificatie op release artefacten.
- Security‑review checklist per PR en periodieke pentest‑acties gepland.

### 3.6 Observability & Health

**Doel**: Transparante status‑rapportage en metrics die aansluiten op de dashboards.

**Taken**
- `/api/health` voltooid en gedocumenteerd (DB, Redis, queues, notificaties).
- Metrics endpoint (Prometheus‑compatibel) achter auth/rate‑limit; dashboards voor requests, errors, latency.
- Alertering: SLA‑thresholds → notificatieservice (README “verdere stappen”).

**Definition of Done**
- System Status kaart toont real‑time status; simuleer afhankelijke storingen voor demo.
- Dashboards met trends en alert policies (JSON).

### 3.7 CI/CD & Kwaliteitshekken

**Doel**: Reproduceerbare build, scan en release met duidelijke hekken.

**Taken**
- **Pijplijn**: lint, typecheck, unit/E2E tests, build, SBOM, Trivy, CodeQL.
- **Release**: gesigneerde containers, SBOM‑bijlage, changelog en release‑notes.
- **Quality gates**: Lighthouse a11y/perf/seo drempels in PR’s.

**Definition of Done**
- Alle checks verplicht; PR kan niet mergen zonder ✅.
- SBOM en signatures gepubliceerd per release.

### 3.8 Infrastructuur & Deploy (Docker/Kubernetes)

**Doel**: Werkende container‑images en voorbereide IaC voor toekomstige Kubernetes‑deployments.

**Taken**
- Dockerfile (multi‑stage, non‑root) gebruiken; image signing verifiëren.
- IaC‑skelet aanleggen (Terraform/Helm/K8s manifests) zodra targets bekend zijn.
- Omgevingen definiëren: Dev, Staging, Prod; secrets via platformsecretbeheer.
- Node.js 20 runtime compatibiliteit controleren; resource‑limits definiëren.

**Definition of Done**
- Image pull & run‑instructies gedocumenteerd; K8s‑values skeleton aanwezig.
- Release pipeline levert deployable, gesigneerde images.

### 3.9 Documentatie & Kennisborging

**Doel**: Toegankelijke, lokale en eerlijke documentatie die adoptie versnelt.

**Taken**
- **Runbooks**: setup, incident response, audit export, data‑seed/migratie, back‑ups, rollbacks.
- **API‑contracten** en developer‑how‑to’s (Zod, repository‑patronen).
- **UAT‑handleidingen** per persona + changelog van verbeteringen.
- **Lokale betrokkenheid**: voeg voorbeelden en referenties toe voor MKB in **Brabant/Limburg** (privacy/AVG, kosteninzicht).

**Definition of Done**
- Documenten up‑to‑date, vindbaar vanuit README en gelinkt in UI waar relevant.

### 3.10 Lokale betrokkenheid & privacy (Brabant/Limburg)

**Doel**: Aansluiting bij de doelgroep (lokale ondernemers), transparantie over kosten, en privacy‑bewuste keuzes.

**Taken**
- Voorbeeldconfiguraties voor MKB in Brabant/Limburg (kostenprofiel, hostingopties, Data Processing Agreements).
- Heldere uitleg van explainability‑uitvoer richting niet‑technische stakeholders.
- AVG‑checklist integreren bij Supplier/Compliance persona’s (masking, bewaartermijnen).

## 4. Gedetailleerde backlog (prioritair)

**P0 – must**  
- `/api/origin/calculate` 201 + persist (met DB‑fallback) + tests.  
- Auth + rate‑limit op health/metrics; audit‑logging.  
- Persona‑E2E suites (CFO/Compliance/Analyst/Auditor/Supplier/Sysadmin).  
- Dashboard polling met shared backoff/abort + live regions.  
- SBOM + Cosign signing + Trivy/CodeQL clean in CI.  
- README “verdere stappen”: notificatieservice aansluiten.

**P1 – should**  
- Seeds & migraties consistent in CI/staging.  
- Analytics endpoint + KPI‑gauges.  
- A11y/perf/seo drempels als merge‑gate.  
- Runbooks: incident, audit export, backup/restore.

**P2 – could**  
- Prometheus‑metrics en Grafana‑dashboards.  
- K8s‑skeleton (Helm chart/values), resource‑limits en probes.  
- PDF‑generator hardening (stijl/branding/metadata).

**P3 – later**  
- Uitbreiding TARIC‑client (fault‑injection tests, cachingstrategieën).  
- Multi‑tenant features/quotas in repository‑laag.

## 5. Planning & mijlpalen (voorbeeld, 6–10 weken)

- **Week 1–2 (Foundation)**: API 201+persist+fallback; auth/rate‑limit; seeds/migraties; persona‑fixtures; lint/typecheck/tests in CI.
- **Week 3–4 (Validation)**: Playwright E2E voor alle persona’s; dashboards + polling‑utility; KPI‑gauges; incident/audit runbooks.
- **Week 5–6 (Security/Observability)**: Trivy/CodeQL clean; SBOM + Cosign release; metrics endpoint; alertering/notificatieservice.
- **Week 7–8 (Infra/Docs)**: Docker best‑practices, resource‑limits, K8s‑skeleton; onboarding‑documentatie & lokale MKB‑guides.
- **Week 9–10 (Hardening)**: Performance/A11y fine‑tuning; fault‑injection; DR/backup‑tests; audit‑trail export validatie.

## 6. RACI & rollen (indicatief)

- **Product Owner (Chris)** — A, R: prioritering, lokale klantbehoeften, acceptatie.  
- **Tech Lead** — R: architectuurkeuzes, codekwaliteit, security reviews.  
- **Frontend Dev** — R: UI/UX, a11y, E2E.  
- **Backend Dev** — R: API’s, data‑laag, integraties.  
- **DevOps/Platform** — R: CI/CD, signing, SBOM, IaC/K8s.  
- **QA/Tester** — R: testplannen, coverage, regressie.  
- **Security** — C: ASVS, scans, disclosure proces.  
- **Stakeholders (Brabant/Limburg MKB)** — C/I: validatie van explainability en kosteninzicht.

## 7. Risico’s & mitigaties

- **Onvolledige seeds of TARIC‑data** → Mock/fallback + duidelijke feature‑flags, contracttests.  
- **Achterblijvende a11y/performance** → CI‑gates, verbeterloops en tooling (axe, Lighthouse).  
- **Supply‑chain issues** → Trivy/CodeQL + SBOM + Cosign mandatory.  
- **Infra onduidelijk** → K8s‑skeleton nu, targets later invullen; container signing al actief.  
- **Adoptie door MKB** → Heldere documentatie, voorbeelden, kosten‑transparantie en lokale workshops.

## 8. KPI’s & acceptatiecriteria (samengevat)

- **A11y ≥ 0.9**, **Perf ≥ 0.8**, **SEO ≥ 0.9** (Lighthouse).  
- **Persona UAT**: 100% slaagpercentage E2E.  
- **Security**: Trivy/CodeQL clean of expliciet risk acceptance per PR; SBOM + Cosign aanwezig op elke release.  
- **Stabiliteit**: Health green in alle omgevingen; MTTR < N uur per incident (doelwaarde afspreken).  
- **Compliance**: Audit‑trail export reproduceerbaar; geen PII‑lekkage; AVG‑checklist gevolgd.

## 9. Bijlagen (bestandsverwijzingen)

- `README.md` (root): projectoverzicht, persona’s, dashboards, snelstart en “verdere stappen”.  
- `infra/README.md`: status van IaC/Kubernetes‑artefacten en image‑signing release.  
- `CHECKLIST.md`: persona‑acceptatie en technische gates.  
- `ARCHITECTURE.md`: componenten, dataflows, observability.  
- `SECURITY.md`: beleid en security‑eisen.  
- `CONTRIBUTING.md`: ontwikkelstandaarden en quality gates.

## Bijlage A — Uitwerking per persona (acceptatie & scenario’s)

### A.1 CFO / Finance
**Doel:** Financiële verantwoording en ROI-onderbouwing per onboarding.
**Te tonen in UI:**
- Landed cost-componenten (douane, logistiek, heffingen) en delta t.o.v. vorige periode.
- ROI‑samenvatting en **savings memo** per certificaat.
**Scenario’s (E2E):**
1. CFO bekijkt nieuw aangemaakt certificaat → sees ROI delta ≥ 0 en memo aanwezig.
2. CFO exporteert PDF → kostencomponenten staan in metadata/voetnoot.
3. CFO vergelijkt twee certificaten → delta‑visualisatie klopt met onderliggende bedragen.
**DOD:**
- Audit‑trail logt wie, wat en wanneer bekeken/gedownload is.
- PDF‑weergave consistent met UI; rounding rules gedocumenteerd.

### A.2 Compliance Manager
**Doel:** Bewijsvoering compleet vóór berekening; confidence alerts sturen backlog.
**Te borgen:**
- Evidence checklist (documenten, TARIC‑regels, leverancierverklaringen).
- Confidence score → drempelwaarden → automatische backlog item (met link naar case).
**Scenario’s:**
1. Onvolledige bewijsvoering → calculation geblokkeerd met duidelijke melding.
2. Lage confidence → alert + taak in backlog met trace naar ontbrekende stukken.
3. Volledige case → berekening slaagt en logt gebruikte bronnen.
**DOD:** Checkliststatus zichtbaar in UI en exporteerbaar per certificaat.

### A.3 Analyst / Operator
**Doel:** Minimale HS‑dataset import activeert explainability‑focus en feedback‑linkage.
**Scenario’s:**
1. Import van subset HS‑codes → explainability‑paneel highlight welke regels bepalend waren.
2. Feedback vanuit operator wordt persistenter gelinkt naar de betrokken HS‑cases.
**DOD:** Import validatie + rollback; explainability is reproduceerbaar op dezelfde input.

### A.4 Auditor
**Doel:** Steekproeven, ondertekeningsstatus en audit‑export na berekening.
**Scenario’s:**
1. Sampling‑queue toont N recente certificaten; per item: status + verantwoordelijke.
2. Exportfunctie maakt ZIP (JSON + PDF) voor externe review.
**DOD:** Export is hash‑gewaarmerkt; integriteitscheck bij import elders mogelijk.

### A.5 Supplier
**Doel:** Documentuploads, ESG‑bijlagen, SLA‑timer in extern portaal.
**Scenario’s:**
1. Upload mist verplichte velden → heldere validatiefout; retry zonder dataverlies.
2. ESG‑bijlage wordt herkend en aan het dossier gekoppeld.
3. SLA‑timer overschrijdt drempel → waarschuwing naar notificatieservice.
**DOD:** Upload‑antivirusscan in pipeline; PII‑masking en bewaartermijnen vastgelegd.

### A.6 System Admin
**Doel:** Health dashboard met role‑gating en alerting.
**Scenario’s:**
1. Admin ziet dependency‑matrix (DB/Redis/Queues/SMTP); niet‑admins zien dit niet.
2. Drempel breach triggert notificatie; acknowledgement wordt gelogd.
**DOD:** RBAC‑checks in routes; audit entries bij alle admin‑acties.

## Bijlage B — Testmatrix (indicatief)

| Domein | Case | Happy | Edge | Error | E2E? | Artefact |
|---|---|---:|---:|---:|---:|---|
| Origin API | /api/origin/calculate | ✅ | ✅ (grote payload) | ✅ (invalid schema) | ✅ | Postman + Jest log |
| Certificates | GET/POST/ID/PDF | ✅ | ✅ (lang ID) | ✅ (not found) | ✅ | PDF snapshot |
| Health | /api/health | ✅ | ✅ (1 dep down) | ✅ (timeout) | 🔶 | Screenshot |
| HS Codes | /api/hs-codes | ✅ | ✅ (cache miss) | ✅ (TARIC down) | 🔶 | Contract test |
| Analytics | /api/analytics | ✅ | ✅ (nulls) | ✅ (no data) | 🔶 | CSV export |
| Frontend | Theme toggle | ✅ | ✅ (pref unset) | — | ✅ | Axe/Lighthouse |
| Polling | Backoff/abort | ✅ | ✅ (network flap) | ✅ (server 500) | ✅ | Video run |
| UAT | 6 persona flows | ✅ | — | — | ✅ | E2E report |

Legenda: ✅=verplicht, 🔶=optioneel.

## Bijlage C — API-contracten (schets)

> **NB**: Dit is een schets t.b.v. uitlijning. Definitieve contracten dienen in OpenAPI of route‑specificatie vastgelegd te worden.

### POST /api/origin/calculate
Request (JSON): `{ "materials":[...], "hsCode":"", "ruleSet":"..." }`  
Response 201: `{ "certificateId":"...", "summary":{...}, "confidence":0.0..1.0 }`  
Fouten: 400/422 (schema), 429 (rate), 503 (dependency).

### GET /api/certificates/{id}
Response 200: `{ "id":"...", "calculatedAt":"...", "roi":{...}, "landedCost":{...} }`  
404 bij onbekend ID.

### GET /api/certificates/{id}/pdf
Stream PDF. Headers bevatten hash/etag.

### GET /api/hs-codes?query=... 
Response 200: lijst met HS‑records; cache‑control headers ingesteld.

### GET /api/health
Response 200: `{ "db":"up|down", "redis":"up|down", "queues":"up|down", "smtp":"up|down" }`  
401/403 voor niet‑admins (role‑gating).

### GET /api/analytics
Response 200: aggregaties voor dashboard KPI’s (tellingen, gemiddelden, percentielen).

## Bijlage D — CI/CD details (indicatief)

- **Jobs**: `lint`, `typecheck`, `unit`, `e2e`, `build`, `sbom`, `scan`, `codeql`, `release`.
- **Artefacten**: SBOM (CycloneDX JSON), container image (signed), coverage reports, E2E video’s.
- **Policies**: PR mag pas mergen als alle checks ✅ + reviewers akkoord + security label gevuld.
- **Release**: note met changes, CVE‑samenvatting, Cosign‑handtekening en SBOM‑link.
## Bijlage E — Kubernetes readiness checklist

- Container **non‑root**, read‑only FS, capabilities drop; liveness/readiness probes geconfigureerd.
- Resources: requests/limits; HPA signalen gedefinieerd; PodDisruptionBudget aanwezig.
- Secrets via platform vault/secrets manager; **geen** `.env` in Pod spec.
- NetworkPolicies beperken egress/ingress; TLS termination en mTLS waar relevant.
- Observability: Prometheus scrape config + Grafana dashboards als code.

## Bijlage F — Mapping “bron → taken”

- **README.md (root)** → Frontend features, persona’s, dashboards, **verdere stappen** (notificatieservice).  
- **infra/README.md** → Image signing aanwezig; IaC/K8s nog invullen zodra targets bekend.  
- **CHECKLIST.md** → Persona‑acceptatie + technische gates (auth/rate‑limit op health/metrics; E2E).  
- **ARCHITECTURE.md** → Endpoints, repository‑laag, fallbacks, observability.  
- **SECURITY.md** → ASVS/OWASP, SBOM, Cosign, Trivy/CodeQL, secrets policy.  
- **CONTRIBUTING.md** → Zod‑validatie in routes, conventionele commits, quality gates.

## Bijlage G — Threat model & controls (STRIDE, indicatief)

**Assets**: certificaatdata, HS‑codes, TARIC‑integraties, auditloggen, persona‑feedback, PDF‑artefacten.  
**Aanvallers**: externe anoniemen, geauthenticeerde gebruikers buiten scope, insider threats, gecompromitteerde afhankelijkheden.

| STRIDE | Voorbeeldbedreiging | Maatregelen (DoD) |
|---|---|---|
| Spoofing | Misbruik van health/metrics zonder auth | Role‑gated endpoints, mTLS tussen services, audit van alle admin calls |
| Tampering | Manipulatie van certificaatpayloads | Zod‑validatie, schema‑hashing, idempotency‑keys, WORM‑achtige archieven voor definitieve PDF’s |
| Repudiation | Ontkenning van handelingen | Onweerlegbaar audit‑log met tijdstempels, request‑id’s en digitale handtekeningen op exports |
| Information Disclosure | PII/bedrijfsgevoelige info in logs | Structured logging zonder PII, secrets masking, need‑to‑know data governance |
| Denial of Service | Excessive requests op calculate/analytics | Rate limiting, circuit breakers, backoff/abort client‑side, autoscaling signalen |
| Elevation of Privilege | Bypass van role‑checks | Defense‑in‑depth: route‑guards, middleware, tests voor privilege boundaries |

**Supply‑chain**  
- SCA (Trivy) + CodeQL gating; SBOM publicatie en Cosign‑verificatie.  
- Pinning/allow‑list van registries; image provenance (attestations).

**Secrets**  
- Geen secrets in git; KMS/Vault; short‑lived tokens; rotatieprocedure in runbook.

---

## Bijlage H — Data‑model & migraties (indicatief)

**Entiteiten**: `Certificate`, `HsCode`, `OriginRule`, `Agreement`, `AuditEvent`, `PersonaFeedback`.  
**Sleutelrelaties**: `Certificate` ↔ `HsCode` (N:1), `Certificate` ↔ `OriginRule` (N:M), `Certificate` ↔ `AuditEvent` (1:N).  
**Migraties**: versieer met Prisma; changelog per migratie; **down** scripts voor rollback op Staging.

**Data‑kwaliteit**  
- Required‑velden en normalisatie (codes, land, valuta).  
- Referentiële integriteit + unieke sleutels (idempotentie).  
- Testdata in `prisma/seed.ts` gedekt door contracttests.

**Back‑ups & retentie**  
- Dagelijkse snapshots; versleuteld opgeslagen; restore‑oefeningen per kwartaal.  
- Bewaartermijnen afgestemd op AVG en audit‑vereisten.
## Bijlage I — Operationele runbooks (extract)

### I.1 Start/stop
1. Controleer secrets en .env per omgeving.  
2. `npm run build` / `docker build` en `docker run` met read‑only FS.  
3. Validatie: `/api/health` groen; logniveau op **info**; error‑rate < threshold.

### I.2 Back‑up/restore
- **Back‑up**: database snapshot + object storage voor PDF’s/exports.  
- **Restore**: versleutelde toegang, checksum‑controle, post‑restore validatie (E2E set).

### I.3 Secretrotatie
- Draaiende pods laten terugvallen op nieuw secret; cutover zonder downtime; revoke oud secret.  
- Logging van alle secret‑reads.

### I.4 Patchmanagement
- Maandelijkse afhankelijkhedenupdate; security advisories monitoren; CVE’s triageren; hotfix flow documenteren.

---

## Bijlage J — Incident management (uittreksel)

**Classificatie**: P1 (productie‑uitval), P2 (gedeeltelijke degradatie), P3 (functionele bug), P4 (vraag).  
**SLO/SLA**: MTTR streefwaarde, error budget, change freeze voor piekperiodes.

**Runbook P1**
1. War room openen; statuspagina updaten.  
2. Circuit breaker inschakelen op zwaar belaste routes.  
3. Root cause analyse + post‑mortem binnen 48 uur; acties in backlog.

**Communicatie**: updates op vaste intervallen; lessons‑learned delen met team en stakeholders.

---

## Bijlage K — Performance & load test plan

- **Doelen**: p95 latency < X ms op /api/origin/calculate bij Y RPS; throughput Z certs/min; memory/CPU binnen limieten.  
- **Methoden**: k6/Artillery scenario’s; soak tests; chaos‑scenarios (TARIC down, DB read‑only).  
- **Metingen**: request timers, queue‑lengtes, GC‑events.  
- **Rapportage**: grafieken in Grafana + testruns als CI‑artefact.

---

## Bijlage L — A11y test plan (WCAG 2.2 AA)

- **Toetsenbordnavigatie**: alle interactieve items focusbaar; skip‑links; focus rings zichtbaar.  
- **Schermlezers**: aria‑labels/roles; liveregions bij updates; tabelheaders gelinkt.  
- **Contrast en kleur**: minimum contrast; geen kleur‑alleen signalering.  
- **Dynamische content**: polling met aankondigingen; non‑blocking.

**Tools**: axe‑core (lint in CI), Lighthouse; manuele tests met NVDA/VoiceOver.

---

## Bijlage M — Logging & audit trails

- **Structured logging** (JSON): `timestamp`, `level`, `service`, `userId?`, `requestId`, `event`, `details`.  
- **Audit events**: mutaties, exports, admin‑acties; immutable opslag en bewaartermijnen.  
- **Privacy**: geen PII in logs; sampling voor volumebeheersing; redacties van gevoelige velden.

---

## Bijlage N — Begrippenlijst (begrip → definitie)

- **HS‑code** — Geharmoniseerd systeem voor goederenclassificatie.  
- **TARIC** — EU‑tariefintegratie; bron voor tarieven/regels.  
- **Certificate** — Resultaat van origin‑berekening met onderbouwing en metadata.  
- **Explainability** — Uitleg welke regels/materialen de uitkomst bepalen.  
- **SBOM** — Software Bill of Materials (CycloneDX).  
- **Cosign** — Tooling voor container image signing en verificatie.
## Bijlage O — Gedetailleerde werkpakketten (200 sub‑taken)

### Frontend UI & A11y

- **UI-01. Valideer** de geselecteerde frontend ui & a11y‑onderdelen met meetbare acceptatiecriteria. Leg alle aannames vast in de developer docs en runbooks.
- **UI-02. Documenteer** de geselecteerde frontend ui & a11y‑onderdelen met duidelijke foutmeldingen voor eindgebruikers. Borg consistentie tussen UI‑status en audit‑events.
- **UI-03. Valideer** de geselecteerde frontend ui & a11y‑onderdelen zodat de persona‑flows volledig slagen. Voeg contracttests en property‑based tests toe voor randgevallen.
- **UI-04. Herbruik** de geselecteerde frontend ui & a11y‑onderdelen zonder geheimen in de codebasis. Gebruik waar mogelijk feature‑flags en fallback‑paden voor storingsbestendigheid.
- **UI-05. Implementeer** de geselecteerde frontend ui & a11y‑onderdelen zodat regressies vroegtijdig falen. Zorg dat logberichten geen PII bevatten en context‑sleutels hanteren.
- **UI-06. Documenteer** de geselecteerde frontend ui & a11y‑onderdelen zodat de persona‑flows volledig slagen. Stel KPI’s vast en koppel alerts aan concrete drempelwaarden.
- **UI-07. Implementeer** de geselecteerde frontend ui & a11y‑onderdelen zodat de persona‑flows volledig slagen. Zorg dat logberichten geen PII bevatten en context‑sleutels hanteren.
- **UI-08. Optimaliseer** de geselecteerde frontend ui & a11y‑onderdelen zonder geheimen in de codebasis. Zorg dat logberichten geen PII bevatten en context‑sleutels hanteren.
- **UI-09. Verrijk** de geselecteerde frontend ui & a11y‑onderdelen met overzichtelijke changelogs. Leg alle aannames vast in de developer docs en runbooks.
- **UI-10. Implementeer** de geselecteerde frontend ui & a11y‑onderdelen conform OWASP/ASVS‑richtlijnen. Hanteer duidelijke timeouts en retries bij externe integraties.
- **UI-11. Meet en rapporteer** de geselecteerde frontend ui & a11y‑onderdelen met aantoonbare toegankelijkheidswinst. Borg consistentie tussen UI‑status en audit‑events.
- **UI-12. Documenteer** de geselecteerde frontend ui & a11y‑onderdelen met minimale performance‑impact. Voeg contracttests en property‑based tests toe voor randgevallen.
- **UI-13. Valideer** de geselecteerde frontend ui & a11y‑onderdelen zonder geheimen in de codebasis. Voeg contracttests en property‑based tests toe voor randgevallen.
- **UI-14. Meet en rapporteer** de geselecteerde frontend ui & a11y‑onderdelen met minimale performance‑impact. Stel KPI’s vast en koppel alerts aan concrete drempelwaarden.
- **UI-15. Automatiseer** de geselecteerde frontend ui & a11y‑onderdelen met meetbare acceptatiecriteria. Publiceer SBOM en handtekeningen bij elke release.
- **UI-16. Optimaliseer** de geselecteerde frontend ui & a11y‑onderdelen zodat regressies vroegtijdig falen. Hanteer duidelijke timeouts en retries bij externe integraties.
- **UI-17. Valideer** de geselecteerde frontend ui & a11y‑onderdelen zodat de persona‑flows volledig slagen. Leg alle aannames vast in de developer docs en runbooks.
- **UI-18. Herbruik** de geselecteerde frontend ui & a11y‑onderdelen met minimale performance‑impact. Stel KPI’s vast en koppel alerts aan concrete drempelwaarden.
- **UI-19. Documenteer** de geselecteerde frontend ui & a11y‑onderdelen zodat regressies vroegtijdig falen. Gebruik waar mogelijk feature‑flags en fallback‑paden voor storingsbestendigheid.
- **UI-20. Documenteer** de geselecteerde frontend ui & a11y‑onderdelen met aantoonbare toegankelijkheidswinst. Voeg contracttests en property‑based tests toe voor randgevallen.
### API Contracts & Validation

- **API-01. Documenteer** de geselecteerde api contracts & validation‑onderdelen zodat regressies vroegtijdig falen. Hanteer duidelijke timeouts en retries bij externe integraties.
- **API-02. Automatiseer** de geselecteerde api contracts & validation‑onderdelen met reproduceerbare build‑artefacten. Gebruik rate limiting en input‑sanitatie bij alle POST‑routes.
- **API-03. Hardeneer** de geselecteerde api contracts & validation‑onderdelen met minimale performance‑impact. Gebruik rate limiting en input‑sanitatie bij alle POST‑routes.
- **API-04. Documenteer** de geselecteerde api contracts & validation‑onderdelen met aantoonbare toegankelijkheidswinst. Voeg contracttests en property‑based tests toe voor randgevallen.
- **API-05. Herbruik** de geselecteerde api contracts & validation‑onderdelen conform OWASP/ASVS‑richtlijnen. Definieer rollbacks voor mislukte migraties en deployments.
- **API-06. Documenteer** de geselecteerde api contracts & validation‑onderdelen conform OWASP/ASVS‑richtlijnen. Publiceer SBOM en handtekeningen bij elke release.
- **API-07. Herstructureer** de geselecteerde api contracts & validation‑onderdelen met aantoonbare toegankelijkheidswinst. Definieer rollbacks voor mislukte migraties en deployments.
- **API-08. Documenteer** de geselecteerde api contracts & validation‑onderdelen met minimale performance‑impact. Gebruik waar mogelijk feature‑flags en fallback‑paden voor storingsbestendigheid.
- **API-09. Documenteer** de geselecteerde api contracts & validation‑onderdelen met meetbare acceptatiecriteria. Gebruik rate limiting en input‑sanitatie bij alle POST‑routes.
- **API-10. Herstructureer** de geselecteerde api contracts & validation‑onderdelen met aantoonbare toegankelijkheidswinst. Voeg contracttests en property‑based tests toe voor randgevallen.
- **API-11. Documenteer** de geselecteerde api contracts & validation‑onderdelen met overzichtelijke changelogs. Gebruik rate limiting en input‑sanitatie bij alle POST‑routes.
- **API-12. Documenteer** de geselecteerde api contracts & validation‑onderdelen met reproduceerbare build‑artefacten. Hanteer duidelijke timeouts en retries bij externe integraties.
- **API-13. Verrijk** de geselecteerde api contracts & validation‑onderdelen conform OWASP/ASVS‑richtlijnen. Leg alle aannames vast in de developer docs en runbooks.
- **API-14. Hardeneer** de geselecteerde api contracts & validation‑onderdelen met duidelijke foutmeldingen voor eindgebruikers. Definieer rollbacks voor mislukte migraties en deployments.
- **API-15. Optimaliseer** de geselecteerde api contracts & validation‑onderdelen met aantoonbare toegankelijkheidswinst. Stel KPI’s vast en koppel alerts aan concrete drempelwaarden.
- **API-16. Herstructureer** de geselecteerde api contracts & validation‑onderdelen met overzichtelijke changelogs. Hanteer duidelijke timeouts en retries bij externe integraties.
- **API-17. Meet en rapporteer** de geselecteerde api contracts & validation‑onderdelen met duidelijke foutmeldingen voor eindgebruikers. Borg consistentie tussen UI‑status en audit‑events.
- **API-18. Optimaliseer** de geselecteerde api contracts & validation‑onderdelen met reproduceerbare build‑artefacten. Voeg contracttests en property‑based tests toe voor randgevallen.
- **API-19. Implementeer** de geselecteerde api contracts & validation‑onderdelen zodat regressies vroegtijdig falen. Borg consistentie tussen UI‑status en audit‑events.
- **API-20. Hardeneer** de geselecteerde api contracts & validation‑onderdelen zonder geheimen in de codebasis. Stel KPI’s vast en koppel alerts aan concrete drempelwaarden.
### Data & Persistence

- **DATA-01. Valideer** de geselecteerde data & persistence‑onderdelen zonder geheimen in de codebasis. Hanteer duidelijke timeouts en retries bij externe integraties.
- **DATA-02. Herbruik** de geselecteerde data & persistence‑onderdelen met reproduceerbare build‑artefacten. Definieer rollbacks voor mislukte migraties en deployments.
- **DATA-03. Automatiseer** de geselecteerde data & persistence‑onderdelen zodat de persona‑flows volledig slagen. Gebruik waar mogelijk feature‑flags en fallback‑paden voor storingsbestendigheid.
- **DATA-04. Valideer** de geselecteerde data & persistence‑onderdelen zodat de persona‑flows volledig slagen. Leg alle aannames vast in de developer docs en runbooks.
- **DATA-05. Meet en rapporteer** de geselecteerde data & persistence‑onderdelen zodat regressies vroegtijdig falen. Leg alle aannames vast in de developer docs en runbooks.
- **DATA-06. Herstructureer** de geselecteerde data & persistence‑onderdelen conform OWASP/ASVS‑richtlijnen. Publiceer SBOM en handtekeningen bij elke release.
- **DATA-07. Implementeer** de geselecteerde data & persistence‑onderdelen met aantoonbare toegankelijkheidswinst. Definieer rollbacks voor mislukte migraties en deployments.
- **DATA-08. Hardeneer** de geselecteerde data & persistence‑onderdelen zodat de persona‑flows volledig slagen. Voeg contracttests en property‑based tests toe voor randgevallen.
- **DATA-09. Automatiseer** de geselecteerde data & persistence‑onderdelen zodat de persona‑flows volledig slagen. Stel KPI’s vast en koppel alerts aan concrete drempelwaarden.
- **DATA-10. Documenteer** de geselecteerde data & persistence‑onderdelen conform OWASP/ASVS‑richtlijnen. Gebruik rate limiting en input‑sanitatie bij alle POST‑routes.
- **DATA-11. Hardeneer** de geselecteerde data & persistence‑onderdelen zodat de persona‑flows volledig slagen. Definieer rollbacks voor mislukte migraties en deployments.
- **DATA-12. Implementeer** de geselecteerde data & persistence‑onderdelen met overzichtelijke changelogs. Gebruik rate limiting en input‑sanitatie bij alle POST‑routes.
- **DATA-13. Verrijk** de geselecteerde data & persistence‑onderdelen met meetbare acceptatiecriteria. Voeg contracttests en property‑based tests toe voor randgevallen.
- **DATA-14. Meet en rapporteer** de geselecteerde data & persistence‑onderdelen met aantoonbare toegankelijkheidswinst. Zorg dat logberichten geen PII bevatten en context‑sleutels hanteren.
- **DATA-15. Implementeer** de geselecteerde data & persistence‑onderdelen met duidelijke foutmeldingen voor eindgebruikers. Stel KPI’s vast en koppel alerts aan concrete drempelwaarden.
- **DATA-16. Valideer** de geselecteerde data & persistence‑onderdelen zodat regressies vroegtijdig falen. Publiceer SBOM en handtekeningen bij elke release.
- **DATA-17. Valideer** de geselecteerde data & persistence‑onderdelen zodat de persona‑flows volledig slagen. Borg consistentie tussen UI‑status en audit‑events.
- **DATA-18. Hardeneer** de geselecteerde data & persistence‑onderdelen met reproduceerbare build‑artefacten. Definieer rollbacks voor mislukte migraties en deployments.
- **DATA-19. Hardeneer** de geselecteerde data & persistence‑onderdelen met aantoonbare toegankelijkheidswinst. Definieer rollbacks voor mislukte migraties en deployments.
- **DATA-20. Herbruik** de geselecteerde data & persistence‑onderdelen zonder geheimen in de codebasis. Zorg dat logberichten geen PII bevatten en context‑sleutels hanteren.
### Observability & Health

- **OBS-01. Optimaliseer** de geselecteerde observability & health‑onderdelen met duidelijke foutmeldingen voor eindgebruikers. Leg alle aannames vast in de developer docs en runbooks.
- **OBS-02. Herstructureer** de geselecteerde observability & health‑onderdelen met minimale performance‑impact. Publiceer SBOM en handtekeningen bij elke release.
- **OBS-03. Optimaliseer** de geselecteerde observability & health‑onderdelen met reproduceerbare build‑artefacten. Voeg contracttests en property‑based tests toe voor randgevallen.
- **OBS-04. Documenteer** de geselecteerde observability & health‑onderdelen met duidelijke foutmeldingen voor eindgebruikers. Voeg contracttests en property‑based tests toe voor randgevallen.
- **OBS-05. Meet en rapporteer** de geselecteerde observability & health‑onderdelen met meetbare acceptatiecriteria. Stel KPI’s vast en koppel alerts aan concrete drempelwaarden.
- **OBS-06. Optimaliseer** de geselecteerde observability & health‑onderdelen met duidelijke foutmeldingen voor eindgebruikers. Stel KPI’s vast en koppel alerts aan concrete drempelwaarden.
- **OBS-07. Documenteer** de geselecteerde observability & health‑onderdelen met meetbare acceptatiecriteria. Voeg contracttests en property‑based tests toe voor randgevallen.
- **OBS-08. Implementeer** de geselecteerde observability & health‑onderdelen met duidelijke foutmeldingen voor eindgebruikers. Voeg contracttests en property‑based tests toe voor randgevallen.
- **OBS-09. Implementeer** de geselecteerde observability & health‑onderdelen met minimale performance‑impact. Voeg contracttests en property‑based tests toe voor randgevallen.
- **OBS-10. Optimaliseer** de geselecteerde observability & health‑onderdelen met duidelijke foutmeldingen voor eindgebruikers. Leg alle aannames vast in de developer docs en runbooks.
- **OBS-11. Verrijk** de geselecteerde observability & health‑onderdelen met duidelijke foutmeldingen voor eindgebruikers. Definieer rollbacks voor mislukte migraties en deployments.
- **OBS-12. Hardeneer** de geselecteerde observability & health‑onderdelen met overzichtelijke changelogs. Stel KPI’s vast en koppel alerts aan concrete drempelwaarden.
- **OBS-13. Verrijk** de geselecteerde observability & health‑onderdelen met duidelijke foutmeldingen voor eindgebruikers. Publiceer SBOM en handtekeningen bij elke release.
- **OBS-14. Herstructureer** de geselecteerde observability & health‑onderdelen met duidelijke foutmeldingen voor eindgebruikers. Voeg contracttests en property‑based tests toe voor randgevallen.
- **OBS-15. Valideer** de geselecteerde observability & health‑onderdelen zonder geheimen in de codebasis. Gebruik rate limiting en input‑sanitatie bij alle POST‑routes.
- **OBS-16. Herstructureer** de geselecteerde observability & health‑onderdelen zonder geheimen in de codebasis. Publiceer SBOM en handtekeningen bij elke release.
- **OBS-17. Implementeer** de geselecteerde observability & health‑onderdelen zodat regressies vroegtijdig falen. Gebruik waar mogelijk feature‑flags en fallback‑paden voor storingsbestendigheid.
- **OBS-18. Herstructureer** de geselecteerde observability & health‑onderdelen met minimale performance‑impact. Voeg contracttests en property‑based tests toe voor randgevallen.
- **OBS-19. Documenteer** de geselecteerde observability & health‑onderdelen met duidelijke foutmeldingen voor eindgebruikers. Zorg dat logberichten geen PII bevatten en context‑sleutels hanteren.
- **OBS-20. Optimaliseer** de geselecteerde observability & health‑onderdelen met reproduceerbare build‑artefacten. Borg consistentie tussen UI‑status en audit‑events.
### Security & Compliance

- **SEC-01. Herstructureer** de geselecteerde security & compliance‑onderdelen conform OWASP/ASVS‑richtlijnen. Leg alle aannames vast in de developer docs en runbooks.
- **SEC-02. Verrijk** de geselecteerde security & compliance‑onderdelen met duidelijke foutmeldingen voor eindgebruikers. Voeg contracttests en property‑based tests toe voor randgevallen.
- **SEC-03. Verrijk** de geselecteerde security & compliance‑onderdelen zodat de persona‑flows volledig slagen. Voeg contracttests en property‑based tests toe voor randgevallen.
- **SEC-04. Implementeer** de geselecteerde security & compliance‑onderdelen zodat de persona‑flows volledig slagen. Gebruik waar mogelijk feature‑flags en fallback‑paden voor storingsbestendigheid.
- **SEC-05. Valideer** de geselecteerde security & compliance‑onderdelen met duidelijke foutmeldingen voor eindgebruikers. Borg consistentie tussen UI‑status en audit‑events.
- **SEC-06. Herstructureer** de geselecteerde security & compliance‑onderdelen met reproduceerbare build‑artefacten. Publiceer SBOM en handtekeningen bij elke release.
- **SEC-07. Documenteer** de geselecteerde security & compliance‑onderdelen zonder geheimen in de codebasis. Gebruik waar mogelijk feature‑flags en fallback‑paden voor storingsbestendigheid.
- **SEC-08. Hardeneer** de geselecteerde security & compliance‑onderdelen zonder geheimen in de codebasis. Gebruik waar mogelijk feature‑flags en fallback‑paden voor storingsbestendigheid.
- **SEC-09. Herstructureer** de geselecteerde security & compliance‑onderdelen met aantoonbare toegankelijkheidswinst. Publiceer SBOM en handtekeningen bij elke release.
- **SEC-10. Automatiseer** de geselecteerde security & compliance‑onderdelen zonder geheimen in de codebasis. Definieer rollbacks voor mislukte migraties en deployments.
- **SEC-11. Verrijk** de geselecteerde security & compliance‑onderdelen conform OWASP/ASVS‑richtlijnen. Zorg dat logberichten geen PII bevatten en context‑sleutels hanteren.
- **SEC-12. Automatiseer** de geselecteerde security & compliance‑onderdelen met duidelijke foutmeldingen voor eindgebruikers. Gebruik waar mogelijk feature‑flags en fallback‑paden voor storingsbestendigheid.
- **SEC-13. Herbruik** de geselecteerde security & compliance‑onderdelen zodat de persona‑flows volledig slagen. Gebruik waar mogelijk feature‑flags en fallback‑paden voor storingsbestendigheid.
- **SEC-14. Meet en rapporteer** de geselecteerde security & compliance‑onderdelen met meetbare acceptatiecriteria. Gebruik waar mogelijk feature‑flags en fallback‑paden voor storingsbestendigheid.
- **SEC-15. Herbruik** de geselecteerde security & compliance‑onderdelen met reproduceerbare build‑artefacten. Definieer rollbacks voor mislukte migraties en deployments.
- **SEC-16. Optimaliseer** de geselecteerde security & compliance‑onderdelen conform OWASP/ASVS‑richtlijnen. Gebruik waar mogelijk feature‑flags en fallback‑paden voor storingsbestendigheid.
- **SEC-17. Optimaliseer** de geselecteerde security & compliance‑onderdelen zodat regressies vroegtijdig falen. Borg consistentie tussen UI‑status en audit‑events.
- **SEC-18. Valideer** de geselecteerde security & compliance‑onderdelen met overzichtelijke changelogs. Voeg contracttests en property‑based tests toe voor randgevallen.
- **SEC-19. Documenteer** de geselecteerde security & compliance‑onderdelen zonder geheimen in de codebasis. Voeg contracttests en property‑based tests toe voor randgevallen.
- **SEC-20. Herbruik** de geselecteerde security & compliance‑onderdelen met duidelijke foutmeldingen voor eindgebruikers. Stel KPI’s vast en koppel alerts aan concrete drempelwaarden.
### CI/CD & QA

- **CICD-01. Herbruik** de geselecteerde ci/cd & qa‑onderdelen met meetbare acceptatiecriteria. Stel KPI’s vast en koppel alerts aan concrete drempelwaarden.
- **CICD-02. Valideer** de geselecteerde ci/cd & qa‑onderdelen zonder geheimen in de codebasis. Stel KPI’s vast en koppel alerts aan concrete drempelwaarden.
- **CICD-03. Herbruik** de geselecteerde ci/cd & qa‑onderdelen zodat de persona‑flows volledig slagen. Gebruik rate limiting en input‑sanitatie bij alle POST‑routes.
- **CICD-04. Automatiseer** de geselecteerde ci/cd & qa‑onderdelen met duidelijke foutmeldingen voor eindgebruikers. Gebruik rate limiting en input‑sanitatie bij alle POST‑routes.
- **CICD-05. Documenteer** de geselecteerde ci/cd & qa‑onderdelen met aantoonbare toegankelijkheidswinst. Hanteer duidelijke timeouts en retries bij externe integraties.
- **CICD-06. Hardeneer** de geselecteerde ci/cd & qa‑onderdelen met aantoonbare toegankelijkheidswinst. Publiceer SBOM en handtekeningen bij elke release.
- **CICD-07. Meet en rapporteer** de geselecteerde ci/cd & qa‑onderdelen zodat regressies vroegtijdig falen. Gebruik waar mogelijk feature‑flags en fallback‑paden voor storingsbestendigheid.
- **CICD-08. Verrijk** de geselecteerde ci/cd & qa‑onderdelen met overzichtelijke changelogs. Stel KPI’s vast en koppel alerts aan concrete drempelwaarden.
- **CICD-09. Valideer** de geselecteerde ci/cd & qa‑onderdelen zodat regressies vroegtijdig falen. Definieer rollbacks voor mislukte migraties en deployments.
- **CICD-10. Documenteer** de geselecteerde ci/cd & qa‑onderdelen zodat de persona‑flows volledig slagen. Leg alle aannames vast in de developer docs en runbooks.
- **CICD-11. Hardeneer** de geselecteerde ci/cd & qa‑onderdelen met minimale performance‑impact. Voeg contracttests en property‑based tests toe voor randgevallen.
- **CICD-12. Documenteer** de geselecteerde ci/cd & qa‑onderdelen met minimale performance‑impact. Leg alle aannames vast in de developer docs en runbooks.
- **CICD-13. Hardeneer** de geselecteerde ci/cd & qa‑onderdelen met reproduceerbare build‑artefacten. Definieer rollbacks voor mislukte migraties en deployments.
- **CICD-14. Automatiseer** de geselecteerde ci/cd & qa‑onderdelen met overzichtelijke changelogs. Definieer rollbacks voor mislukte migraties en deployments.
- **CICD-15. Implementeer** de geselecteerde ci/cd & qa‑onderdelen zodat de persona‑flows volledig slagen. Leg alle aannames vast in de developer docs en runbooks.
- **CICD-16. Valideer** de geselecteerde ci/cd & qa‑onderdelen conform OWASP/ASVS‑richtlijnen. Leg alle aannames vast in de developer docs en runbooks.
- **CICD-17. Valideer** de geselecteerde ci/cd & qa‑onderdelen zodat regressies vroegtijdig falen. Definieer rollbacks voor mislukte migraties en deployments.
- **CICD-18. Hardeneer** de geselecteerde ci/cd & qa‑onderdelen met aantoonbare toegankelijkheidswinst. Leg alle aannames vast in de developer docs en runbooks.
- **CICD-19. Herbruik** de geselecteerde ci/cd & qa‑onderdelen met duidelijke foutmeldingen voor eindgebruikers. Gebruik rate limiting en input‑sanitatie bij alle POST‑routes.
- **CICD-20. Documenteer** de geselecteerde ci/cd & qa‑onderdelen met aantoonbare toegankelijkheidswinst. Definieer rollbacks voor mislukte migraties en deployments.
### Infrastructure & Deploy

- **INFRA-01. Verrijk** de geselecteerde infrastructure & deploy‑onderdelen met aantoonbare toegankelijkheidswinst. Gebruik waar mogelijk feature‑flags en fallback‑paden voor storingsbestendigheid.
- **INFRA-02. Valideer** de geselecteerde infrastructure & deploy‑onderdelen zonder geheimen in de codebasis. Leg alle aannames vast in de developer docs en runbooks.
- **INFRA-03. Implementeer** de geselecteerde infrastructure & deploy‑onderdelen met meetbare acceptatiecriteria. Gebruik rate limiting en input‑sanitatie bij alle POST‑routes.
- **INFRA-04. Hardeneer** de geselecteerde infrastructure & deploy‑onderdelen met aantoonbare toegankelijkheidswinst. Borg consistentie tussen UI‑status en audit‑events.
- **INFRA-05. Verrijk** de geselecteerde infrastructure & deploy‑onderdelen zodat de persona‑flows volledig slagen. Hanteer duidelijke timeouts en retries bij externe integraties.
- **INFRA-06. Optimaliseer** de geselecteerde infrastructure & deploy‑onderdelen met meetbare acceptatiecriteria. Voeg contracttests en property‑based tests toe voor randgevallen.
- **INFRA-07. Valideer** de geselecteerde infrastructure & deploy‑onderdelen conform OWASP/ASVS‑richtlijnen. Definieer rollbacks voor mislukte migraties en deployments.
- **INFRA-08. Implementeer** de geselecteerde infrastructure & deploy‑onderdelen met minimale performance‑impact. Stel KPI’s vast en koppel alerts aan concrete drempelwaarden.
- **INFRA-09. Optimaliseer** de geselecteerde infrastructure & deploy‑onderdelen conform OWASP/ASVS‑richtlijnen. Hanteer duidelijke timeouts en retries bij externe integraties.
- **INFRA-10. Hardeneer** de geselecteerde infrastructure & deploy‑onderdelen met meetbare acceptatiecriteria. Leg alle aannames vast in de developer docs en runbooks.
- **INFRA-11. Meet en rapporteer** de geselecteerde infrastructure & deploy‑onderdelen met meetbare acceptatiecriteria. Gebruik rate limiting en input‑sanitatie bij alle POST‑routes.
- **INFRA-12. Documenteer** de geselecteerde infrastructure & deploy‑onderdelen met duidelijke foutmeldingen voor eindgebruikers. Voeg contracttests en property‑based tests toe voor randgevallen.
- **INFRA-13. Meet en rapporteer** de geselecteerde infrastructure & deploy‑onderdelen zodat de persona‑flows volledig slagen. Hanteer duidelijke timeouts en retries bij externe integraties.
- **INFRA-14. Herbruik** de geselecteerde infrastructure & deploy‑onderdelen conform OWASP/ASVS‑richtlijnen. Zorg dat logberichten geen PII bevatten en context‑sleutels hanteren.
- **INFRA-15. Hardeneer** de geselecteerde infrastructure & deploy‑onderdelen conform OWASP/ASVS‑richtlijnen. Hanteer duidelijke timeouts en retries bij externe integraties.
- **INFRA-16. Implementeer** de geselecteerde infrastructure & deploy‑onderdelen conform OWASP/ASVS‑richtlijnen. Gebruik rate limiting en input‑sanitatie bij alle POST‑routes.
- **INFRA-17. Herstructureer** de geselecteerde infrastructure & deploy‑onderdelen met duidelijke foutmeldingen voor eindgebruikers. Leg alle aannames vast in de developer docs en runbooks.
- **INFRA-18. Hardeneer** de geselecteerde infrastructure & deploy‑onderdelen zodat regressies vroegtijdig falen. Hanteer duidelijke timeouts en retries bij externe integraties.
- **INFRA-19. Implementeer** de geselecteerde infrastructure & deploy‑onderdelen met reproduceerbare build‑artefacten. Zorg dat logberichten geen PII bevatten en context‑sleutels hanteren.
- **INFRA-20. Documenteer** de geselecteerde infrastructure & deploy‑onderdelen met reproduceerbare build‑artefacten. Gebruik rate limiting en input‑sanitatie bij alle POST‑routes.
### UAT Personas & Stakeholders

- **UAT-01. Automatiseer** de geselecteerde uat personas & stakeholders‑onderdelen met duidelijke foutmeldingen voor eindgebruikers. Zorg dat logberichten geen PII bevatten en context‑sleutels hanteren.
- **UAT-02. Implementeer** de geselecteerde uat personas & stakeholders‑onderdelen met duidelijke foutmeldingen voor eindgebruikers. Hanteer duidelijke timeouts en retries bij externe integraties.
- **UAT-03. Meet en rapporteer** de geselecteerde uat personas & stakeholders‑onderdelen met aantoonbare toegankelijkheidswinst. Voeg contracttests en property‑based tests toe voor randgevallen.
- **UAT-04. Automatiseer** de geselecteerde uat personas & stakeholders‑onderdelen met minimale performance‑impact. Definieer rollbacks voor mislukte migraties en deployments.
- **UAT-05. Herstructureer** de geselecteerde uat personas & stakeholders‑onderdelen zodat de persona‑flows volledig slagen. Gebruik rate limiting en input‑sanitatie bij alle POST‑routes.
- **UAT-06. Implementeer** de geselecteerde uat personas & stakeholders‑onderdelen zodat regressies vroegtijdig falen. Leg alle aannames vast in de developer docs en runbooks.
- **UAT-07. Hardeneer** de geselecteerde uat personas & stakeholders‑onderdelen met overzichtelijke changelogs. Leg alle aannames vast in de developer docs en runbooks.
- **UAT-08. Implementeer** de geselecteerde uat personas & stakeholders‑onderdelen zodat regressies vroegtijdig falen. Stel KPI’s vast en koppel alerts aan concrete drempelwaarden.
- **UAT-09. Herstructureer** de geselecteerde uat personas & stakeholders‑onderdelen met minimale performance‑impact. Gebruik rate limiting en input‑sanitatie bij alle POST‑routes.
- **UAT-10. Herstructureer** de geselecteerde uat personas & stakeholders‑onderdelen met overzichtelijke changelogs. Definieer rollbacks voor mislukte migraties en deployments.
- **UAT-11. Valideer** de geselecteerde uat personas & stakeholders‑onderdelen zonder geheimen in de codebasis. Stel KPI’s vast en koppel alerts aan concrete drempelwaarden.
- **UAT-12. Documenteer** de geselecteerde uat personas & stakeholders‑onderdelen met aantoonbare toegankelijkheidswinst. Gebruik waar mogelijk feature‑flags en fallback‑paden voor storingsbestendigheid.
- **UAT-13. Herstructureer** de geselecteerde uat personas & stakeholders‑onderdelen met meetbare acceptatiecriteria. Definieer rollbacks voor mislukte migraties en deployments.
- **UAT-14. Optimaliseer** de geselecteerde uat personas & stakeholders‑onderdelen met duidelijke foutmeldingen voor eindgebruikers. Gebruik rate limiting en input‑sanitatie bij alle POST‑routes.
- **UAT-15. Herstructureer** de geselecteerde uat personas & stakeholders‑onderdelen zodat regressies vroegtijdig falen. Gebruik rate limiting en input‑sanitatie bij alle POST‑routes.
- **UAT-16. Herbruik** de geselecteerde uat personas & stakeholders‑onderdelen met minimale performance‑impact. Voeg contracttests en property‑based tests toe voor randgevallen.
- **UAT-17. Automatiseer** de geselecteerde uat personas & stakeholders‑onderdelen zodat de persona‑flows volledig slagen. Leg alle aannames vast in de developer docs en runbooks.
- **UAT-18. Herstructureer** de geselecteerde uat personas & stakeholders‑onderdelen met minimale performance‑impact. Hanteer duidelijke timeouts en retries bij externe integraties.
- **UAT-19. Automatiseer** de geselecteerde uat personas & stakeholders‑onderdelen zodat de persona‑flows volledig slagen. Borg consistentie tussen UI‑status en audit‑events.
- **UAT-20. Documenteer** de geselecteerde uat personas & stakeholders‑onderdelen zonder geheimen in de codebasis. Hanteer duidelijke timeouts en retries bij externe integraties.
### Documentation & Knowledge

- **DOCS-01. Hardeneer** de geselecteerde documentation & knowledge‑onderdelen met overzichtelijke changelogs. Stel KPI’s vast en koppel alerts aan concrete drempelwaarden.
- **DOCS-02. Automatiseer** de geselecteerde documentation & knowledge‑onderdelen zonder geheimen in de codebasis. Definieer rollbacks voor mislukte migraties en deployments.
- **DOCS-03. Implementeer** de geselecteerde documentation & knowledge‑onderdelen met aantoonbare toegankelijkheidswinst. Leg alle aannames vast in de developer docs en runbooks.
- **DOCS-04. Documenteer** de geselecteerde documentation & knowledge‑onderdelen zonder geheimen in de codebasis. Stel KPI’s vast en koppel alerts aan concrete drempelwaarden.
- **DOCS-05. Herbruik** de geselecteerde documentation & knowledge‑onderdelen met minimale performance‑impact. Publiceer SBOM en handtekeningen bij elke release.
- **DOCS-06. Verrijk** de geselecteerde documentation & knowledge‑onderdelen met reproduceerbare build‑artefacten. Zorg dat logberichten geen PII bevatten en context‑sleutels hanteren.
- **DOCS-07. Optimaliseer** de geselecteerde documentation & knowledge‑onderdelen met reproduceerbare build‑artefacten. Borg consistentie tussen UI‑status en audit‑events.
- **DOCS-08. Valideer** de geselecteerde documentation & knowledge‑onderdelen met aantoonbare toegankelijkheidswinst. Definieer rollbacks voor mislukte migraties en deployments.
- **DOCS-09. Herbruik** de geselecteerde documentation & knowledge‑onderdelen met minimale performance‑impact. Voeg contracttests en property‑based tests toe voor randgevallen.
- **DOCS-10. Documenteer** de geselecteerde documentation & knowledge‑onderdelen met aantoonbare toegankelijkheidswinst. Zorg dat logberichten geen PII bevatten en context‑sleutels hanteren.
- **DOCS-11. Documenteer** de geselecteerde documentation & knowledge‑onderdelen conform OWASP/ASVS‑richtlijnen. Gebruik waar mogelijk feature‑flags en fallback‑paden voor storingsbestendigheid.
- **DOCS-12. Implementeer** de geselecteerde documentation & knowledge‑onderdelen met duidelijke foutmeldingen voor eindgebruikers. Publiceer SBOM en handtekeningen bij elke release.
- **DOCS-13. Herbruik** de geselecteerde documentation & knowledge‑onderdelen zodat regressies vroegtijdig falen. Publiceer SBOM en handtekeningen bij elke release.
- **DOCS-14. Herstructureer** de geselecteerde documentation & knowledge‑onderdelen met overzichtelijke changelogs. Zorg dat logberichten geen PII bevatten en context‑sleutels hanteren.
- **DOCS-15. Herstructureer** de geselecteerde documentation & knowledge‑onderdelen met reproduceerbare build‑artefacten. Hanteer duidelijke timeouts en retries bij externe integraties.
- **DOCS-16. Documenteer** de geselecteerde documentation & knowledge‑onderdelen conform OWASP/ASVS‑richtlijnen. Gebruik waar mogelijk feature‑flags en fallback‑paden voor storingsbestendigheid.
- **DOCS-17. Valideer** de geselecteerde documentation & knowledge‑onderdelen zonder geheimen in de codebasis. Zorg dat logberichten geen PII bevatten en context‑sleutels hanteren.
- **DOCS-18. Hardeneer** de geselecteerde documentation & knowledge‑onderdelen zodat de persona‑flows volledig slagen. Publiceer SBOM en handtekeningen bij elke release.
- **DOCS-19. Implementeer** de geselecteerde documentation & knowledge‑onderdelen zodat de persona‑flows volledig slagen. Zorg dat logberichten geen PII bevatten en context‑sleutels hanteren.
- **DOCS-20. Valideer** de geselecteerde documentation & knowledge‑onderdelen met reproduceerbare build‑artefacten. Borg consistentie tussen UI‑status en audit‑events.
### Local Impact & Privacy (Brabant/Limburg)

- **LOCAL-01. Verrijk** de geselecteerde local impact & privacy (brabant/limburg)‑onderdelen zodat de persona‑flows volledig slagen. Definieer rollbacks voor mislukte migraties en deployments.
- **LOCAL-02. Herbruik** de geselecteerde local impact & privacy (brabant/limburg)‑onderdelen met minimale performance‑impact. Publiceer SBOM en handtekeningen bij elke release.
- **LOCAL-03. Herbruik** de geselecteerde local impact & privacy (brabant/limburg)‑onderdelen zodat de persona‑flows volledig slagen. Hanteer duidelijke timeouts en retries bij externe integraties.
- **LOCAL-04. Optimaliseer** de geselecteerde local impact & privacy (brabant/limburg)‑onderdelen met reproduceerbare build‑artefacten. Borg consistentie tussen UI‑status en audit‑events.
- **LOCAL-05. Verrijk** de geselecteerde local impact & privacy (brabant/limburg)‑onderdelen met reproduceerbare build‑artefacten. Leg alle aannames vast in de developer docs en runbooks.
- **LOCAL-06. Documenteer** de geselecteerde local impact & privacy (brabant/limburg)‑onderdelen met aantoonbare toegankelijkheidswinst. Definieer rollbacks voor mislukte migraties en deployments.
- **LOCAL-07. Verrijk** de geselecteerde local impact & privacy (brabant/limburg)‑onderdelen met duidelijke foutmeldingen voor eindgebruikers. Leg alle aannames vast in de developer docs en runbooks.
- **LOCAL-08. Verrijk** de geselecteerde local impact & privacy (brabant/limburg)‑onderdelen zodat regressies vroegtijdig falen. Leg alle aannames vast in de developer docs en runbooks.
- **LOCAL-09. Documenteer** de geselecteerde local impact & privacy (brabant/limburg)‑onderdelen met aantoonbare toegankelijkheidswinst. Gebruik rate limiting en input‑sanitatie bij alle POST‑routes.
- **LOCAL-10. Meet en rapporteer** de geselecteerde local impact & privacy (brabant/limburg)‑onderdelen zodat de persona‑flows volledig slagen. Voeg contracttests en property‑based tests toe voor randgevallen.
- **LOCAL-11. Hardeneer** de geselecteerde local impact & privacy (brabant/limburg)‑onderdelen conform OWASP/ASVS‑richtlijnen. Zorg dat logberichten geen PII bevatten en context‑sleutels hanteren.
- **LOCAL-12. Herstructureer** de geselecteerde local impact & privacy (brabant/limburg)‑onderdelen conform OWASP/ASVS‑richtlijnen. Zorg dat logberichten geen PII bevatten en context‑sleutels hanteren.
- **LOCAL-13. Valideer** de geselecteerde local impact & privacy (brabant/limburg)‑onderdelen zonder geheimen in de codebasis. Hanteer duidelijke timeouts en retries bij externe integraties.
- **LOCAL-14. Meet en rapporteer** de geselecteerde local impact & privacy (brabant/limburg)‑onderdelen zodat de persona‑flows volledig slagen. Publiceer SBOM en handtekeningen bij elke release.
- **LOCAL-15. Herstructureer** de geselecteerde local impact & privacy (brabant/limburg)‑onderdelen met meetbare acceptatiecriteria. Zorg dat logberichten geen PII bevatten en context‑sleutels hanteren.
- **LOCAL-16. Herstructureer** de geselecteerde local impact & privacy (brabant/limburg)‑onderdelen zonder geheimen in de codebasis. Stel KPI’s vast en koppel alerts aan concrete drempelwaarden.
- **LOCAL-17. Implementeer** de geselecteerde local impact & privacy (brabant/limburg)‑onderdelen met overzichtelijke changelogs. Hanteer duidelijke timeouts en retries bij externe integraties.
- **LOCAL-18. Verrijk** de geselecteerde local impact & privacy (brabant/limburg)‑onderdelen met meetbare acceptatiecriteria. Gebruik rate limiting en input‑sanitatie bij alle POST‑routes.
- **LOCAL-19. Automatiseer** de geselecteerde local impact & privacy (brabant/limburg)‑onderdelen zonder geheimen in de codebasis. Hanteer duidelijke timeouts en retries bij externe integraties.
- **LOCAL-20. Optimaliseer** de geselecteerde local impact & privacy (brabant/limburg)‑onderdelen zodat de persona‑flows volledig slagen. Stel KPI’s vast en koppel alerts aan concrete drempelwaarden.
