# PSRA-LTSD — Onboarding & UX Executive Summary

| Persona | Friction (0–5, 5 = severe) | Time-to-Value (est.) | Top Blockers | High-Impact Fix | KPI Lift |
| --- | --- | --- | --- | --- | --- |
| CFO / Finance | 3 | 2.5h | Needs ROI context after certificate generation; manual cost inputs not captured. | Add landed-cost field + auto-export from calculator. | TTVC ↓25% via automated savings memo. |
| Compliance Manager | 2 | 90m | Persona hand-off lacks checklist for documentation uploads. | Embed required-docs wizard triggered by persona scenario. | Determination accuracy +5 pp (fewer missed docs). |
| Analyst / Operator | 2 | 75m | Bill of materials editing lacks guard-rails for HS validation feedback. | Inline validation badges + quick-fill from persona library. | Auto-determination rate +8 pp. |
| Auditor | 3 | 3h | No in-app sampling queue or export status, despite audit insights. | Add sampling backlog widget + e-signature status. | Audit-trail completeness +12 pp. |
| Supplier | 4 | 4h | External upload & invite flow absent; reliant on internal operator. | Publish supplier invite page w/ doc checklist & SLA timer. | Upload success rate +30 pp. |
| System Admin | 2 | 45m | Health endpoint lacks SLA breach alerts / trend history. | Add alert thresholds + Prometheus annotations. | p95 latency SLO adherence +10 pp. |

**First-success path gaps:** Persona scenarios embed objectives and success criteria, but the UI still expects users to hand-edit HS codes and processes before they can call the engine, extending TTV beyond <10 minutes for several roles.【F:data/persona-scenarios.ts†L31-L214】【F:components/dashboard/OriginCalculator.tsx†L115-L223】 The updated `/api/origin/calculate` route now falls back to persona data when the advanced engine or database is unavailable, ensuring certificate previews persist across onboarding demos.【F:app/api/origin/calculate/route.ts†L20-L191】【F:lib/repository.ts†L217-L269】

## Top 10 Fixes (Projected KPI Impact)
1. Guided BoM validation badges + persona autofill to cut manual edits (TTVC −35%, Analyst auto-determination +8 pp).【F:components/dashboard/OriginCalculator.tsx†L148-L205】
2. Landed-cost & ROI summary card appended to certificate result for finance (TTVC −25%, ROI tracking readiness +20 pp).【F:components/dashboard/OriginCalculator.tsx†L221-L314】
3. Required-document checklist integrated with persona risk focus (Exception rate −15%, Audit pass +10 pp).【F:data/persona-scenarios.ts†L47-L214】
4. Sampling backlog widget and signature tracker for auditors (Audit trail completeness +12 pp).【F:data/persona-scenarios.ts†L367-L399】【F:components/tables/DataTable.tsx†L59-L126】
5. Supplier self-service upload page linked to persona success criteria (Supplier onboarding completion +30 pp).【F:data/persona-scenarios.ts†L217-L364】
6. Alert thresholds & latency panels tied to `/api/health` telemetry (p95 latency SLO +10 pp).【F:components/dashboard/SystemStatus.tsx†L1-L120】
7. KPI glossary & filters for CFO dashboard (determin. accuracy visibility +10 pp).【F:components/dashboard/DashboardStats.tsx†L1-L104】
8. Persona-driven explainability linking to Sankey data for manual overrides (Manual override rate −5 pp).【F:components/dashboard/OriginCalculator.tsx†L316-L430】
9. Export flow to attach sustainability KPIs for ESG personas (ROI visibility +12 pp).【F:data/persona-scenarios.ts†L143-L177】
10. External supplier SLA timer surfaced in health view (Supplier response time −20%).【F:components/dashboard/SystemStatus.tsx†L104-L118】

