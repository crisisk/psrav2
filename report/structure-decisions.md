# Structure & Tooling Decisions

## Repository Layout
- Added `/docs` for architectural, security, and process documentation.
- Introduced `/ci` to host GitHub Actions workflows, separating automation from app code.
- Added `/scripts` for operational helpers (e.g. packaging script referenced by npm).
- Created `/infra` as a placeholder for future IaC assets to avoid mixing runtime manifests with app code.
- Added `/sbom` to store generated CycloneDX artefacts required by release and compliance workflows.

## Tooling
- Established `.editorconfig` and `.gitattributes` for consistent formatting across editors and platforms.
- Added `.pre-commit-config.yaml` to run lint/typecheck/test/build before commits.
- Introduced `Makefile` to standardise setup, lint, test, build, SBOM, scan, and release commands.
- Added `/tests` with Vitest configuration to provide deterministic behavioural coverage alongside static analysis.
- Created multi-stage `Dockerfile` aligned with 12-Factor and container security best practices (non-root runtime, BuildKit ready).
- Added `lib/config.ts` to centralise environment parsing, ensuring Redis/queue/audit/SMTP integrations can be toggled without code changes.

## Governance
- Added `.github/CODEOWNERS` and PR template to enforce clear review ownership and expectations.
- Adopted Keep a Changelog via `CHANGELOG.md` and documented release process in CONTRIBUTING.
- Added SECURITY policy referencing OWASP ASVS L2 and supply-chain requirements.

## CI/CD
- `ci/ci.yml` orchestrates linting, type checking, unit tests via Vitest, Next.js build, SBOM generation, Trivy scan (failing on HIGH/CRITICAL issues), and CodeQL analysis with dependency caching and Node 20/22 matrix coverage.
- `ci/release.yml` builds and signs Docker images, attaches SBOMs, and publishes GitHub Releases following SemVer tags.

These decisions prioritise reproducibility, security, and reviewer clarity while keeping the existing Next.js stack intact.
