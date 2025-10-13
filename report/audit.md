# PSRA-LTSD Enterprise v2 — Repository Audit

## Snapshot
- **Languages**: TypeScript/JavaScript (Next.js), SQL (Prisma), Shell.
- **Frameworks**: Next.js 14, React 18, TailwindCSS, Prisma.
- **Build Tooling**: npm, Next.js, Prisma CLI.
- **CI/CD**: GitHub Actions in `/ci` (build/security pipeline plus release).
- **Containers**: Hardened multi-stage Dockerfile (non-root runtime, BuildKit ready).
- **Security Tooling**: Syft SBOM, Trivy filesystem scan, CodeQL analysis, Cosign signing.
- **External Artifacts**: No additional ZIP archives detected in repo clone as of this audit cycle.

## Findings

| Area | Issue | Severity | Recommendation | Type |
| --- | --- | --- | --- | --- |
| Governance | Repository lacked CODEOWNERS, PR template, CONTRIBUTING guidance | Medium | Add governance artefacts to clarify ownership and review expectations | Structural |
| Build | Common task automation inconsistent across docs/scripts | Medium | Provide canonical Makefile targets for setup/test/build and document usage | Quick Win |
| CI | Previous pipeline missed matrix validation and hardened scans | High | Add Node version matrix, strict Trivy exit codes, and cache configuration | Structural |
| Security | Missing SBOM and image signing pipeline integration | High | Automate Syft SBOM, Trivy, CodeQL, and Cosign within CI/CD | Structural |
| Release | Lack of reproducible Docker image workflow | Medium | Deliver multi-stage Dockerfile and release automation with cached BuildKit | Structural |
| Documentation | Architecture/process docs absent outside README | Medium | Provide ARCHITECTURE/CONTRIBUTING/SECURITY references while leaving README unchanged this cycle | Quick Win |
| Data | `app/api/hs-codes` offline path returned empty array without seeds | High | Ship deterministic seed data and TARIC fallback | Bugfix |
| Assets | Requested ZIP bundles (e.g. `PSRA-LTSD_v5.6.1_FULL.zip`) not present in repository | Low | Note absence in audit; await upstream upload before integration | Observation |
| Dependency Hygiene | Pre-commit hooks not enforcing standardized checks | Medium | Configure lint/typecheck/test hooks and pin tool revisions | Quick Win |
| Secrets | `.env.example` minimal and lacked TARIC guidance | Low | Expand template with documented variables and reference SECURITY.md | Quick Win |

## Quick Wins Implemented
- Restored HS code offline fallback logic with TARIC client chain.
- Added Makefile, npm scripts, and pre-commit hooks covering lint/typecheck/test/build.
- Created CODEOWNERS, PR template, CONTRIBUTING, SECURITY, and ARCHITECTURE references.
- Added Syft SBOM generation, strict Trivy scanning, and security artefact uploads.
- Introduced Vitest coverage for the origin engine and PDF generation flows to prevent regressions during persona UAT.
- Delivered certificate retrieval and PDF endpoints that function with both Postgres and mock data for offline parity.
- Hardened optional services (Redis cache, BullMQ queue, SMTP notifications, audit logging) with environment-driven toggles and in-memory fallbacks so builds succeed without infrastructure dependencies.

## Structural Initiatives Launched
- CI workflow with Node 20/22 matrix, dependency caching, lint/typecheck/build, SBOM, Trivy (failing on HIGH/CRITICAL), and CodeQL.
- Release workflow with Docker build caching, SBOM attachment, Cosign signing, and GitHub Release publication.
- Multi-stage Dockerfile for reproducible builds and non-root runtime aligned with 12-Factor principles.
- Security documentation aligned with OWASP ASVS L2 plus TARIC environment hardening guidance.

## Outstanding Risks
- Database migrations/seeding should be validated in CI once a test database is available.
- Observability stack (audit-service, tracing) stores events locally when PostgreSQL is disabled but still requires downstream log shipping once infra is available.
- TARIC integration requires network connectivity; add contract tests with mocked responses when API keys become available.
- Need automated tests beyond static analysis to cover origin engine logic and persona scenarios.
- Await arrival of upstream ZIP bundles before planning further migrations; re-run audit after assets land.
