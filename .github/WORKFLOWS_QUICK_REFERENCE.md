# GitHub Actions Workflows - Quick Reference

## Workflow Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PSRA-LTSD Enterprise v2 CI/CD                     │
│                     GitHub Actions Workflow Suite                    │
└─────────────────────────────────────────────────────────────────────┘

┌────────────────────┐
│   Code Changes     │
│   (Git Push/PR)    │
└──────┬─────────────┘
       │
       ├───────────────────────┐
       │                       │
       ▼                       ▼
┌─────────────┐        ┌──────────────┐
│   CI/CD     │        │   RAC Gate   │
│  Pipeline   │        │  Validation  │
└──────┬──────┘        └──────┬───────┘
       │                      │
       ├──────────────────────┤
       │                      │
       ▼                      ▼
┌─────────────┐        ┌──────────────┐
│  Security   │        │     ETL      │
│   Scanning  │        │  Validation  │
└──────┬──────┘        └──────┬───────┘
       │                      │
       └──────────┬───────────┘
                  │
                  ▼
           ┌─────────────┐
           │    SBOM     │
           │ Generation  │
           └──────┬──────┘
                  │
                  ▼
           ┌─────────────┐
           │ Deployment  │
           │  (Canary)   │
           └─────────────┘
```

## Workflow Matrix

| Workflow | Lines | Jobs | Runs On | Duration | Trigger |
|----------|-------|------|---------|----------|---------|
| **ci.yml** | 336 | 5 | ubuntu-latest | 15-20 min | PR, Push, Manual |
| **etl-validation.yml** | 181 | 1 | ubuntu-22.04 | 10-15 min | PR, Push, Manual |
| **security-scan.yml** | 222 | 7 | ubuntu-latest | 25-30 min | PR, Push, Daily, Manual |
| **sbom-generation.yml** | 352 | 6 | ubuntu-latest | 35-40 min | Push, Release, Weekly, Manual |
| **rac-gate.yml** | 57 | 1 | ubuntu-22.04 | 10 min | PR, Push |
| **deploy.yml** | 48 | 1 | ubuntu-latest | 5-10 min | Push (main), Manual |
| **deploy-canary.yml** | 968 | 8 | ubuntu-latest | 45-60 min | Push (main), Manual |

**Total**: 2,164 lines across 7 workflows

## Job Dependency Graph

### CI/CD Pipeline (ci.yml)
```
frontend-quality ────┐
                     ├──> e2e-tests ────┐
python-quality ──────┤                  ├──> quality-gate
                     └──> performance-tests ┘
```

### SBOM Generation (sbom-generation.yml)
```
generate-sbom-docker ────┐
generate-sbom-python ────┼──> vulnerability-scan-sbom ──> sbom-summary
generate-sbom-npm ───────┘            │
                                      └──> sbom-attestation (main only)
```

### Security Scanning (security-scan.yml)
```
trivy-container-scan ───┐
trivy-filesystem-scan ──┤
trivy-config-scan ──────┤
python-security-scan ───┼──> security-summary
npm-audit ──────────────┤
secret-scanning ────────┘
```

## Quick Command Reference

### Local Testing

```bash
# Frontend quality checks
npm run lint
npm run typecheck
npm run test

# Python quality checks
poetry run ruff check .
poetry run ruff format --check .
poetry run mypy . --strict
poetry run pytest --cov=. --cov-report=html

# E2E tests
npm run test:e2e

# ETL validation (dry-run)
poetry run python backend/app/etl/ingest_rules.py --validate-only

# Validate workflows
bash .github/workflows/validate-workflows.sh
```

### Manual Workflow Triggers

```bash
# Using GitHub CLI (gh)

# Trigger CI pipeline
gh workflow run ci.yml

# Trigger ETL validation
gh workflow run etl-validation.yml

# Trigger security scan
gh workflow run security-scan.yml

# Generate SBOM
gh workflow run sbom-generation.yml

# Deploy (canary)
gh workflow run deploy-canary.yml

# Check workflow status
gh run list --workflow=ci.yml --limit 5
```

### Artifact Downloads

```bash
# Download latest artifacts
gh run download --repo sevensa/psra-ltsd-enterprise-v2

# Download specific artifact
gh run download <run-id> -n python-coverage-3.11

# List available artifacts
gh api repos/sevensa/psra-ltsd-enterprise-v2/actions/artifacts
```

## Environment Variables

### CI/CD Pipeline
```yaml
NODE_VERSION: '20'
PYTHON_VERSION: '3.11'
COVERAGE_THRESHOLD: 80
```

### Deployments
```yaml
REGISTRY: ghcr.io
IMAGE_NAME: ghcr.io/sevensa/psra-ltsd-enterprise-v2
NAMESPACE: sevensa
DEPLOYMENT: psra-new
```

## Required Secrets

| Secret | Usage | Where |
|--------|-------|-------|
| `GITHUB_TOKEN` | Built-in token for GitHub API, GHCR | All workflows |
| `KUBECONFIG_B64` | Base64-encoded Kubernetes config | Deployment workflows |
| `SLACK_WEBHOOK_URL` | (Optional) Slack notifications | deploy-canary.yml |

## Quality Gates

### Must Pass Before Merge

- [x] Ruff linting (no errors)
- [x] Ruff formatting (code is formatted)
- [x] MyPy type checking (strict mode)
- [x] Pytest coverage >= 80%
- [x] All unit tests passing
- [x] ESLint (no errors)
- [x] TypeScript compilation (no errors)
- [x] Vitest unit tests passing

### Should Pass (Warning on Failure)

- [ ] E2E tests (Playwright)
- [ ] Performance tests (k6)
- [ ] Security scans (no CRITICAL vulnerabilities)

## Coverage Targets

| Component | Tool | Target | Current |
|-----------|------|--------|---------|
| Python Backend | pytest-cov | 80% | Monitor in CI |
| TypeScript Frontend | Vitest | 80% | Monitor in CI |
| E2E Coverage | Playwright | N/A | Functional |

## Security Scan Matrix

| Scan Type | Tool | Severity | Frequency |
|-----------|------|----------|-----------|
| Container | Trivy | CRITICAL, HIGH, MEDIUM | PR + Daily |
| Filesystem | Trivy | CRITICAL, HIGH, MEDIUM | PR + Daily |
| IaC | Trivy | CRITICAL, HIGH, MEDIUM | PR + Daily |
| Python Deps | Bandit + Safety | All | PR + Daily |
| NPM Deps | npm audit | All | PR + Daily |
| Secrets | TruffleHog | Verified | PR |

## SBOM Formats

| Format | Standard | Tool | Use Case |
|--------|----------|------|----------|
| SPDX JSON | ISO/IEC 5962 | Syft | Industry standard, legal |
| CycloneDX JSON | OWASP | Syft | Security-focused |
| SPDX YAML | ISO/IEC 5962 | Syft | Human-readable |

## Workflow Schedules

```
Monday 09:00 CET  →  Dependabot updates
Daily  02:00 UTC  →  Security scanning
Sunday 03:00 UTC  →  SBOM generation
```

## Artifact Retention

| Type | Retention | Examples |
|------|-----------|----------|
| Test Reports | 7 days | Coverage, Playwright reports |
| Security Reports | 30 days | Trivy, Bandit, Safety results |
| SBOMs | 90 days | SPDX, CycloneDX files |
| Performance | 7 days | k6 results |

## Troubleshooting Decision Tree

```
┌─────────────────┐
│  Workflow Failed │
└────────┬─────────┘
         │
    ┌────▼─────┐
    │ Job Type? │
    └────┬─────┘
         │
    ┌────┴──────────────────────────┐
    │                               │
┌───▼────┐                    ┌─────▼──────┐
│ Linting │                   │   Tests    │
└───┬────┘                    └─────┬──────┘
    │                               │
    │ Run locally:                  │ Run locally:
    │ - ruff check .                │ - pytest --cov=.
    │ - npm run lint                │ - npm run test
    │                               │
    │                          ┌────▼────────┐
    │                          │ Coverage <80%?│
    │                          └────┬─────────┘
    │                               │
    │                          ┌────▼─────────┐
    │                          │ Add tests    │
    │                          │ htmlcov/     │
    │                          └──────────────┘
    │
┌───▼────────────┐
│ Security Issue? │
└───┬────────────┘
    │
    │ Check severity:
    │ - CRITICAL: Fix immediately
    │ - HIGH: Fix before merge
    │ - MEDIUM: Fix in follow-up
    │
└───▼─────────────┐
    │ Deployment?   │
    └───┬───────────┘
        │
        │ Check:
        │ - KUBECONFIG_B64 secret
        │ - K8s cluster access
        │ - Image build logs
        │
        └──────────────┘
```

## Performance Benchmarks

### Workflow Execution Times (Target vs Actual)

```
ci.yml              ▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░  15-20 min ✓
etl-validation.yml  ▓▓▓▓▓▓▓▓░░░░░░░░  10-15 min ✓
security-scan.yml   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  25-30 min ✓
sbom-generation.yml ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  35-40 min ✓
rac-gate.yml        ▓▓▓▓▓░░░░░░░░░░░░  10 min ✓
deploy.yml          ▓▓▓░░░░░░░░░░░░░░  5-10 min ✓
deploy-canary.yml   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  45-60 min ✓
```

## Feature Detection

The following features are implemented across the workflow suite:

✅ Source checkout (actions/checkout@v4)
✅ Node.js 20 setup with npm caching
✅ Python 3.11 setup with Poetry
✅ Docker build and push (multi-stage)
✅ Trivy security scanning (container, fs, IaC)
✅ SBOM generation with Syft
✅ Playwright E2E testing
✅ Pytest with coverage (80% threshold)
✅ Ruff linting and formatting
✅ MyPy strict type checking
✅ k6 performance testing
✅ Dependabot configuration
✅ Secret scanning (TruffleHog)
✅ Cosign SBOM attestation
✅ Grype vulnerability scanning
✅ Canary deployments
✅ Automated rollback
✅ Quality gate summaries
✅ PR status comments

## Integration Points

### GitHub Security Tab
- Trivy SARIF uploads
- Dependabot alerts
- Code scanning results

### GitHub Container Registry
- Docker image storage
- SBOM attestations
- Image vulnerability scanning

### Kubernetes Cluster
- Automated deployments
- Canary rollouts
- Health checks

### External Tools
- Slack (optional notifications)
- Sigstore (SBOM signing)
- k6 Cloud (optional perf monitoring)

## Quick Links

- [Full Documentation](.github/WORKFLOWS.md)
- [Workflow Files](.github/workflows/)
- [Dependabot Config](.github/dependabot.yml)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Validation Script](.github/workflows/validate-workflows.sh)

## Support

**Questions?** Contact: devops@sevensa.nl
**Issues?** Create a GitHub issue
**Docs?** See [WORKFLOWS.md](.github/WORKFLOWS.md)

---

**Last Updated**: 2025-10-13
**Version**: 2.0.0
