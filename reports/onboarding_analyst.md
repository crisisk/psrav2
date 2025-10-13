# Analyst / Operator Onboarding Audit

```mermaid
graph TD
  A[Operator invited via queue backlog] --> B[Accept analyst workspace role]
  B --> C[Pick "Ingrid Bauer" polymer scenario]
  C --> D[Validate HS + origin mix vs success criteria]
  D --> E[Run calculation]
  E --> F[Review explainability & confidence delta]
  F --> G[Trigger feedback loop or override]
```

## Journey Notes
- Scenario requires non-originating share under 40% with tariff shift confirmation, matching operator workflow that needs quick validation guidance.【F:data/persona-scenarios.ts†L31-L67】
- Origin calculator sanitises HS codes and normalises material percentages but lacks inline indicators when coverage deviates strongly from product value until after submission.【F:components/dashboard/OriginCalculator.tsx†L134-L205】
- Explainability panel depends on selecting a certificate row; no onboarding cue directs operators to the data table after calculation.【F:components/dashboard/OriginCalculator.tsx†L316-L430】【F:components/tables/DataTable.tsx†L87-L129】

## Blockers & Risks
1. **Coverage gap messaging:** Status message warns about material-value deltas but does not explain corrective action or allow balancing via quick adjustments.【F:components/dashboard/OriginCalculator.tsx†L246-L270】
2. **Explainability discoverability:** Operators may miss the Sankey panel because selection state is not highlighted post-calculation.【F:components/dashboard/OriginCalculator.tsx†L316-L430】
3. **Feedback loop friction:** Feedback panel exists but is disconnected from calculation result, so operators cannot submit persona-specific notes without re-entering details.【F:components/dashboard/OriginCalculator.tsx†L316-L430】

## Acceptance Criteria
- Analyst completes minimal HS39/40 dataset import and origin check without editing sanitized fields manually.
- Post-calculation toast or deep link focuses the explainability panel and audit trail.
- Feedback submission auto-populates with persona context and attaches to certificate record.
