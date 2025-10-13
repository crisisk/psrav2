# PSRA-LTSD Onboarding Readiness Checklist

## Persona Acceptance
- [ ] **CFO / Finance** – Certificate preview includes ROI delta, landed cost, and savings memo per onboarding audit.【F:reports/onboarding_cfo.md†L6-L24】
- [ ] **Compliance Manager** – Evidence checklist enforced before origin calculation and confidence alerts trigger backlog task.【F:reports/onboarding_compliance.md†L6-L27】
- [ ] **Analyst / Operator** – Minimal HS dataset import triggers explainability focus and feedback linkage.【F:reports/onboarding_analyst.md†L6-L27】
- [ ] **Auditor** – Sampling queue, signature status, and audit trail export visible post-calculation.【F:reports/onboarding_auditor.md†L6-L27】
- [ ] **Supplier** – External portal tracks document uploads, ESG attachments, and SLA timer.【F:reports/onboarding_supplier.md†L6-L27】
- [ ] **System Admin** – Health dashboard gated by admin role with SLA thresholds and alert destinations configured.【F:reports/onboarding_sysadmin.md†L6-L27】

## Technical Gates
- [ ] `/api/origin/calculate` returns 201 with persisted certificate when DB disabled (fallback enabled).【F:app/api/origin/calculate/route.ts†L20-L191】【F:lib/repository.ts†L217-L269】
- [ ] Prometheus and health endpoints protected by auth + rate limiting per security issues log.【F:issues/code_quality_issues.json†L2-L44】
- [ ] Dashboard polling uses shared backoff/abort utility and exposes live regions for refreshed metrics.【F:reports/code_quality.md†L19-L43】【F:reports/usability_a11y.md†L4-L17】
- [ ] Persona KPI widgets implemented with glossary links and filters per dashboard recommendations.【F:reports/dashboards.md†L6-L43】
- [ ] E2E Playwright suite passes for all onboarding personas using seeded fixtures.【F:tests/e2e/onboarding_psra.spec.ts†L4-L120】
