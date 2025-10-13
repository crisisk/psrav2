# Enterprise Improvement Plan – Multi-LLM Consensus & HITL Uplift

## Context and Discovery (Last 20 Hours)
- Reviewed newly merged UI and data experience updates (`components/dashboard/*`, `docs/uat-persona-report.md`) to understand current customer-facing flows and telemetry touchpoints.
- Assessed fresh infrastructure blueprints including `Kubernetes Migration Architecture.md`, `OpenBao Namespace Design.md`, and `langgraph-origin-engine.yaml` to align application changes with platform-level controls.
- Analysed the expanded ML assets (`ml_service.py`, `optimized_origin_calculation_graph.py`) and the LangGraph origin engine plans to anchor AI orchestration to the documented business logic.

## Improvements Executed in This Iteration
1. **Multi-LLM Consensus Engine (Phase 2 Roadmap Alignment)**
   - Added configurable AI provider registry with OpenAI, Anthropic, Azure OpenAI, and deterministic fallbacks, parsing infrastructure secrets from environment variables for production readiness. 【F:lib/config.ts†L1-L127】
   - Implemented an orchestration layer that fans out origin-calculation verdicts to multiple LLM providers, normalises their responses, and derives a consensus score with dissent tracking and audit trails. 【F:lib/ai/consensus-orchestrator.ts†L1-L292】【F:lib/ai/types.ts†L1-L68】
   - Enriched the advanced origin engine to merge human-authored rules with AI consensus outcomes, promoting confidence blending, dissent surfacing, and audit exports in a single result envelope. 【F:lib/advanced-origin-engine.ts†L1-L112】

2. **Human-in-the-Loop (HITL) Escalations & Tasking**
   - Extended the central task queue to provision a dedicated human-review lane, with automatic high-priority notifications and deterministic fallbacks when Redis is unavailable. 【F:lib/task-queue.ts†L1-L261】
   - Updated the origin calculation API to persist AI insights inside certificates, raise audit events, and queue manual review jobs whenever consensus confidence falls below enterprise thresholds. 【F:app/api/origin/calculate/route.ts†L1-L161】

## Follow-Up Roadmap (Enterprise Grade)
- **LangGraph Integration:** Port the deterministic fallback engine to consume `langgraph-origin-engine.yaml` DAG definitions for full parity with the roadmap artefacts.
- **Observability & ML Monitoring:** Wire consensus telemetry into the `DevOps & AI Observability Dashboard.md` data model and push latency/confidence metrics to Prometheus (`prometheus.yml`).
- **Secure Secrets Distribution:** Materialise OpenBao blueprints by linking `ai-orchestrator.hcl` credentials with the new AI provider registry, ensuring rotation via `rotate_secrets.sh` and `OpenBao Secret Rotation.md` playbooks.
- **Persona Feedback Loop:** Connect `components/dashboard/FeedbackPanel.tsx` to the HITL queue for analyst acknowledgement, closing the multi-LLM → human review → customer feedback loop described in `docs/uat-persona-report.md`.

## Risk Register & Mitigations
| Risk | Impact | Mitigation |
| --- | --- | --- |
| Provider outages or API quota exhaustion | Consensus engine degradation | Deterministic fallback providers and configurable retry/backoff policies in the orchestrator. 【F:lib/ai/consensus-orchestrator.ts†L93-L206】 |
| Missing secrets in lower environments | Runtime failures during AI calls | Automatic provider skipping with detailed audit logging to support SecOps triage. 【F:lib/ai/consensus-orchestrator.ts†L97-L158】 |
| Human-review backlog saturation | SLA breaches for complex cases | Dedicated `human-review` queue with notifications and monitoring hooks for Ops dashboards. 【F:lib/task-queue.ts†L87-L205】 |

## Next Validation Steps
1. Execute the end-to-end origin calculation happy path and verify AI consensus metadata is surfaced in the dashboard components introduced in the latest UI refresh.
2. Run `npm run verify` once credentials are provided to validate lint, type, and test coverage with the new HITL queue interfaces.
3. Coordinate with the platform team to template AI provider secrets inside Keycloak (`ai-client.json`) and OpenBao policies before enabling the orchestrator in production.
