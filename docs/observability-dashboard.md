# Observability Dashboard (DevOps + AI)

## Doelen
- Real-time inzicht in origin-calculatie doorlooptijd en foutpercentages.
- Bewaken van database- en queue-belasting om certificate-backlog te voorkomen.
- Transparantie bieden over AI-beslissingen voor auditors en productteams.

## Metrics & Panels
| Categorie | Metric | Bron | Visualisatie | Alerting |
|-----------|--------|------|--------------|----------|
| API Performance | `origin_calculation_duration_ms` (p50/p95) | Next.js route logging + OpenTelemetry | Time-series + percentile band | Alert bij p95 > 500ms (5m) |
| Queue Health | `certificate_jobs_active`, `certificate_jobs_failed` | Bull/BullMQ metrics endpoint | SingleStat + sparkline | Alert bij failed delta > 5 |
| Database | `certificates_created_count`, `certificates_pending_count` | SQL view (`certificates_daily_kpis`) | Bar chart + stacked area | Alert bij pending > 200 |
| AI Quality | `origin_confidence_avg`, `origin_is_conform_rate` | Repository `createCertificate` hook + analytics table | Dual-axis line chart | Alert bij confidence < 0.6 |
| User Journey | `calculator_submission_rate`, `calculator_error_rate` | Frontend telemetry (Next.js instrumentation) | Funnel | Alert bij error rate > 10% |
| Compliance | `pii_access_events` | Audit log (future) | Table + severity badge | Slack-notificatie |

## Architectuur
1. **Instrumentation**: Gebruik Next.js middleware + server actions om OpenTelemetry traces te emitteren (`@opentelemetry/api`).
2. **Collector**: Deploy OTEL Collector (sidecar) die traces/metrics naar Prometheus + Loki stuurt.
3. **Storage**: Prometheus voor metrics, Loki voor logs, Tempo voor traces.
4. **Dashboard**: Grafana met gedeelde map `dashboards/origin.json` in repo voor IaC.
5. **Alerting**: Grafana Alerting -> Slack/MS Teams webhooks met runbook links.

## Implementatiestappen
1. Voeg `observability/` directory toe met OTEL config en Helm chart values.
2. Introduceer `instrumentation.ts` in Next.js (App Router) voor request spans.
3. Bouw `lib/metrics.ts` helper (wrapping `@opentelemetry/api` en `prom-client`).
4. Maak Prisma event hooks voor certificate create/update en stuur metrics.
5. Schrijf Terraform module voor Prometheus/Grafana stack (of gebruik managed). 
6. Documenteer runbooks in `docs/runbooks/origin-calculator.md` (to create).

## KPI Targets
- p95 berekening < 400ms
- Faalpercentage < 2%
- Pending certificates < 50
- AI confidence gemiddeld > 0.75
