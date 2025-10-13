# Dashboard & KPI Review

## Current Coverage
- **DashboardStats** pulls HS39/HS40 counts, trade agreement totals, and unique certificate materials, updating every minute. Values are purely volumetric and not tied to persona KPIs (e.g., TTVC, auto-determination rate).【F:components/dashboard/DashboardStats.tsx†L24-L104】
- **OriginCalculator** surfaces confidence score and applied rules but omits financial and SLA metrics needed by finance and compliance stakeholders.【F:components/dashboard/OriginCalculator.tsx†L221-L314】
- **SystemStatus** enumerates database/cache/task queue state but lacks trend history, SLO thresholds, or alerting, limiting value for SysAdmin persona.【F:components/dashboard/SystemStatus.tsx†L77-L118】
- **DataTable** provides status and confidence but no backlog aging, sampling flags, or manual override insights expected by analysts and auditors.【F:components/tables/DataTable.tsx†L45-L129】

## KPI Gaps by Persona
- **CFO / Finance:** Needs TTVC, € cost per certificate, and ROI projections; current UI does not show landed cost, savings, or payback timeline.【F:data/persona-scenarios.ts†L180-L214】【F:components/dashboard/OriginCalculator.tsx†L221-L314】
- **Compliance Manager:** Requires determination accuracy %, rule coverage, and exception rate. Dashboard lacks pass/fail trends or filters per trade agreement.【F:data/persona-scenarios.ts†L70-L105】【F:components/tables/DataTable.tsx†L59-L126】
- **Analyst / Operator:** Needs auto-determination rate, manual override %, backlog aging. Table shows counts but not automation vs manual metrics.【F:data/persona-scenarios.ts†L31-L67】【F:components/tables/DataTable.tsx†L45-L129】
- **Auditor:** Expects audit trail completeness, signature verification, sample pass %. No widgets track sampling queue or signature status.【F:data/persona-scenarios.ts†L367-L399】
- **Supplier:** Requires onboarding completion % and document upload success rate. No dedicated supplier dashboard exists.【F:data/persona-scenarios.ts†L217-L364】
- **SysAdmin:** Needs auth failure rate, 5xx per route, p95 latency. Health widget only shows current status without metrics history.【F:components/dashboard/SystemStatus.tsx†L77-L118】

## Recommended Widgets & Wireframe Concepts
1. **Persona KPI Ribbon:** Horizontal bar displaying TTVC, determination accuracy, auto-determination %, and audit-trail completeness with trend arrows. Sources: certificate results + audit logs.【F:components/tables/DataTable.tsx†L45-L129】
2. **Backlog Aging Heatmap:** Visual grid of certificates by status vs age buckets, highlighting manual reviews exceeding SLA for operators and compliance.【F:components/tables/DataTable.tsx†L87-L129】
3. **ROI & Savings Card:** Finance-focused card summarising duty savings, landed cost, and payback period triggered after each calculation.【F:components/dashboard/OriginCalculator.tsx†L221-L314】
4. **Sampling Queue Panel:** Auditor widget listing certificates flagged for sampling with signature/notary status and audit trail completeness percentages.【F:data/persona-scenarios.ts†L367-L399】
5. **Supplier Onboarding Funnel:** Chart tracking invite → document upload → approval, powered by supplier portal events, exposing completion % and response time.【F:data/persona-scenarios.ts†L217-L364】
6. **Reliability Timeline:** Sparkline of `/api/health` status with p95 latency and 5xx counts, with thresholds for SLO compliance.【F:components/dashboard/SystemStatus.tsx†L77-L118】

## UX Improvements
- Introduce dashboard filters aligned with trade agreements, personas, and SLA tiers to reduce noise for compliance and finance roles.【F:components/dashboard/DashboardStats.tsx†L33-L83】
- Provide glossary/tooltips for KPIs, linking to persona success criteria to ensure shared understanding across teams.【F:data/persona-scenarios.ts†L31-L214】
- Persist layout preferences per persona (e.g., auditors default to sampling queue) to shorten time-to-value during onboarding.【F:app/(site)/page.tsx†L19-L53】
