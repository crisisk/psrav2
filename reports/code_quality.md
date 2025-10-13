# Code Quality & Security Review

## Architecture & Data Flow
- The dashboard page composes calculator, tables, charts, and health widgets in a single client-rendered surface, relying on `/api` routes for data hydration (HS codes, trade agreements, certificates).【F:app/(site)/page.tsx†L5-L55】
- Persona-driven scenarios provide seeded BoM, processes, and validation guidance consumed by `OriginCalculator`, reinforcing role-based onboarding but still requiring manual confirmation steps.【F:data/persona-scenarios.ts†L31-L214】【F:components/dashboard/OriginCalculator.tsx†L115-L205】
- The new `/api/origin/calculate` fallback validates inputs, leverages persona metadata, and persists certificates even without a database, restoring end-to-end flow continuity for previews.【F:app/api/origin/calculate/route.ts†L20-L191】【F:lib/repository.ts†L217-L269】

## Strengths
- Consistent use of `zod` in API routes to validate query/body payloads (`certificates`, `hs-codes`, `origin`) reduces input tampering risk.【F:app/api/certificates/route.ts†L8-L52】【F:app/api/origin/calculate/route.ts†L104-L185】
- Front-end sanitisation normalises HS codes, uppercases origins, and warns when material values diverge from product totals, preventing malformed API requests.【F:components/dashboard/OriginCalculator.tsx†L155-L270】
- Repository now falls back to in-memory mock certificates when PostgreSQL is disabled, enabling smoke tests and onboarding demos without infrastructure dependencies.【F:lib/repository.ts†L217-L269】

## Risks & Debt
1. **Unscoped metrics exposure:** `/api/metrics` serves Prometheus data without authentication or rate limiting, exposing queue stats to unauthorised personas if deployed publicly.【F:app/api/metrics/route.ts†L1-L21】
2. **Polling overhead:** Dashboard stats and system status poll multiple endpoints every 30–60 seconds without AbortControllers or incremental backoff, which can overwhelm the API under degraded networks.【F:components/dashboard/DashboardStats.tsx†L33-L83】【F:components/dashboard/SystemStatus.tsx†L49-L105】
3. **Explainability coupling:** Calculator relies on side-effects (`setSelectedCertificateId`) and manual table interaction to populate explainability charts; missing IDs break the flow silently because there is no error boundary around Sankey fetching.【F:app/(site)/page.tsx†L19-L53】【F:components/dashboard/OriginCalculator.tsx†L316-L430】
4. **Input trust on alternatives:** Fallback origin calculation still echoes persona success criteria without recalculating actual compliance metrics, so downstream analytics may misinterpret persona guidance as validated rules.【F:app/api/origin/calculate/route.ts†L44-L101】
5. **Missing rate limiting/security headers:** API routes return JSON but do not apply security headers or rate limiting middleware, leaving the SaaS susceptible to abuse during onboarding (especially `/api/certificates`).【F:app/api/certificates/route.ts†L8-L52】

## Recommendations
- Protect `/api/metrics` and `/api/health` with auth middleware and document service accounts; add IP filtering or token-based access for observability endpoints.【F:app/api/metrics/route.ts†L1-L21】【F:components/dashboard/SystemStatus.tsx†L49-L118】
- Introduce shared polling utility with abort support, exponential backoff, and persona-aware intervals to reduce bandwidth and avoid stale UI states.【F:components/dashboard/DashboardStats.tsx†L33-L104】【F:components/dashboard/SystemStatus.tsx†L49-L118】
- Expand origin calculation fallback to compute conformity metrics from materials rather than echoing persona success criteria, ensuring dashboards display verifiable numbers before production engine integration.【F:app/api/origin/calculate/route.ts†L44-L101】
- Surface explainability fetch errors (e.g., missing certificate ID) in UI and consider event-driven updates instead of manual table selection to improve resilience.【F:app/(site)/page.tsx†L33-L47】【F:components/tables/DataTable.tsx†L87-L129】
- Add rate limiting and structured logging to certificate creation routes to guard against brute-force attempts during onboarding phases.【F:app/api/certificates/route.ts†L8-L59】
