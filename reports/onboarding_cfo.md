# CFO / Finance Onboarding Audit

```mermaid
graph TD
  A[Sign up with finance role] --> B[Verify email & accept org invite]
  B --> C[Select "Diego Martínez" scenario]
  C --> D[Review auto-filled BoM & manufacturing steps]
  D --> E[Run origin calculation & receive confidence score]
  E --> F[Download ROI-ready certificate packet]
  F --> G[Share savings summary with stakeholders]
```

## Journey Notes
- Persona objective is to quantify USMCA duty savings with RVC sensitivity, so onboarding must surface ROI metrics early.【F:data/persona-scenarios.ts†L180-L214】
- Origin calculator pre-fills BoM and processes, but users still edit HS codes and agreement before submitting, creating friction and risking validation errors.【F:components/dashboard/OriginCalculator.tsx†L115-L239】
- Result payload lacks landed-cost or finance annotations; the fallback API currently returns confidence and rule summaries only.【F:app/api/origin/calculate/route.ts†L20-L191】

## Blockers & Risks
1. **Financial KPI gap:** No landed-cost capture or savings memo, so finance must export raw data and calculate ROI offline.【F:components/dashboard/OriginCalculator.tsx†L221-L314】
2. **Manual BoM adjustments:** Sanitisation trims HS codes but provides no delta view when finance tweaks value assumptions for sensitivity analysis.【F:components/dashboard/OriginCalculator.tsx†L160-L205】
3. **Certificate persistence:** Mock persistence works offline, yet there is no status view linking certificates back to finance dashboards for recurring reviews.【F:lib/repository.ts†L217-L269】

## Acceptance Criteria
- Finance persona can generate a certificate preview with ROI delta in <15 minutes without editing HS codes manually.
- Savings memo auto-attached to certificate export referencing net-cost method assumptions.
- Dashboard highlights new certificates for finance review with confidence and landed-cost variance flags.
