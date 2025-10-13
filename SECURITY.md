# Security Policy

## Supported Versions

We follow Semantic Versioning. The most recent minor release receives security updates. Hotfixes for prior releases are assessed case by case.

## Reporting a Vulnerability

1. Email `security@psra.example.com` with the vulnerability details, impact, and reproduction steps.
2. Encrypt sensitive details using our PGP key (fingerprint: `A1B2 C3D4 E5F6 7890 1234 5678 9ABC DEF0 1234 5678`).
3. Expect acknowledgement within 48 hours and triage updates within five business days.

## Security Requirements

- **OWASP Top 10 / ASVS**: Route handlers must demonstrate mitigations for injection, XSS, broken authentication, and logging/monitoring gaps. Reference the ASVS L2 checklist in `docs/security/asvs-l2-checklist.md`.
- **Dependency Governance**: `make scan` must produce a clean Trivy report or include a documented risk acceptance in the PR description.
- **Supply Chain Hardening**: Release artifacts must include a CycloneDX SBOM (`make sbom`) and be signed with Sigstore Cosign during CI (see `ci/release.yml`).
- **Secrets Management**: Environment configuration lives in `.env.local` for development. Never commit secrets to the repo. Use GitHub Actions secrets for CI/CD.

## Disclosure Timeline

We commit to coordinated disclosure. If we cannot deliver a fix within 30 days, we will publish interim mitigations and a revised ETA.
