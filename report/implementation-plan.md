# Implementation Plan

1. **Reconfirm Asset Inventory** (ETA: 0.25 day, Impact: Medium)
   - Verify absence of requested ZIP archives in workspace; document status in `report/audit.md`.
   - Establish intake checklist for future uploads so integrations can start immediately once assets land.

2. **Stabilise Offline Fallbacks** (ETA: 0.5 day, Impact: High)
   - Ensure HS code search returns seeded data when DB/TARIC unavailable.
   - Validate Origin Calculator personas against mock repository and TARIC fallback client.
   - Capture health indicators for database/Redis/task queue/SMTP so dashboards reflect degraded modes.

3. **Governance & Developer Experience** (ETA: 1 day, Impact: High)
   - Maintain Makefile, pre-commit hooks, CODEOWNERS, CONTRIBUTING, SECURITY policy, and CHANGELOG.
   - Keep README untouched per stakeholder request while referencing supporting docs.

4. **Automate Quality & Security Gates** (ETA: 1 day, Impact: High)
   - Run GitHub Actions matrix builds for Node 20 LTS and Node 22 (experimental) with dependency caching.
   - Enforce Syft SBOM generation, Trivy scans with HIGH/CRITICAL exit codes, and CodeQL analysis uploading SARIF.

5. **Harden Supply Chain & Releases** (ETA: 1 day, Impact: Medium)
   - Use multi-stage Dockerfile with non-root runner and BuildKit cache.
   - Release workflow pushes signed images, publishes SBOM/scan artefacts, and tags SemVer releases.

6. **Security Documentation & Checklists** (ETA: 0.5 day, Impact: Medium)
   - Maintain ASVS Level 2 checklist under `docs/security` and link from SECURITY/PR templates.
   - Track OWASP Top 10 considerations and escalate gaps during code reviews.

7. **Behavioural Coverage & Artefact Hardening** (ETA: 0.75 day, Impact: High)
   - Add deterministic Vitest suites for the origin engine and PDF generator, exporting coverage reports for CI attestation.
   - Backfill certificate retrieval endpoints and PDF streaming API to unblock persona UAT download checks.
   - Update audit/report documentation with new coverage gates, feature toggles, and offline parity expectations.

8. **Future Enhancements** (ETA: TBD, Impact: High)
   - Add automated integration tests for origin engine, TARIC client, and persona flows once datasets stabilise.
   - Instrument observability stack (structured logging, tracing) via `lib/audit-service.ts` and surface metrics in CI.
   - Provide Terraform/Kubernetes manifests in `/infra` once runtime targets are finalised.
