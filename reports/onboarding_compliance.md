# Compliance Manager Onboarding Audit

```mermaid
graph TD
  A[Account provisioned via compliance invite] --> B[Accept Keycloak role & MFA]
  B --> C[Launch onboarding wizard]
  C --> D[Select "Malik Harrison" EU-UK TCA scenario]
  D --> E[Upload calibration logs & process evidence]
  E --> F[Run origin check & review confidence drop alerts]
  F --> G[Share certificate with customs team]
```

## Journey Notes
- Persona success criteria emphasise tariff heading documentation and UK process logs, signalling the need for checklist-driven onboarding.【F:data/persona-scenarios.ts†L70-L105】
- The origin calculator validates HS code length and agreement but does not surface mandatory evidence uploads before calculation, risking failures when evidence is missing.【F:components/dashboard/OriginCalculator.tsx†L221-L314】
- Certificates list view refreshes every 30 seconds yet lacks filter presets for compliance personas to monitor exception queues.【F:components/tables/DataTable.tsx†L45-L129】

## Blockers & Risks
1. **Evidence workflow:** No guided upload state tied to persona risk focus (Chinese core scrutiny) even though success criteria require documentation before submission.【F:data/persona-scenarios.ts†L86-L103】【F:components/dashboard/OriginCalculator.tsx†L199-L239】
2. **Alerting:** Confidence drops are mentioned in persona insights but not visualised or persisted, so compliance managers could miss regression triggers.【F:data/persona-scenarios.ts†L95-L104】【F:components/dashboard/OriginCalculator.tsx†L318-L430】
3. **Role clarity:** Theme toggle & generic layout do not reflect compliance responsibilities (no SLA timers or pending-task counters in hero area).【F:components/dashboard/DashboardStats.tsx†L1-L104】

## Acceptance Criteria
- Compliance manager can complete onboarding with inline reminders to upload calibration logs before calculation.
- Exception queue widget surfaces when confidence falls below 80% and links to audit trail.
- Certificates table provides saved filters for EU-UK TCA and non-conform statuses within onboarding wizard.
