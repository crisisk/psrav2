# GitHub Actions CI/CD Workflows Documentation

This document provides a comprehensive overview of all GitHub Actions workflows configured for the PSRA-LTSD Enterprise v2 project.

## Table of Contents

1. [Overview](#overview)
2. [Workflow Catalog](#workflow-catalog)
3. [Workflow Details](#workflow-details)
4. [Quality Gates & Requirements](#quality-gates--requirements)
5. [Security Scanning](#security-scanning)
6. [SBOM Generation](#sbom-generation)
7. [Automated Dependency Updates](#automated-dependency-updates)
8. [Triggers & Scheduling](#triggers--scheduling)
9. [Artifacts & Retention](#artifacts--retention)
10. [Best Practices](#best-practices)

---

## Overview

The PSRA-LTSD Enterprise v2 project uses a comprehensive GitHub Actions CI/CD suite that includes:

- **Quality Assurance**: Automated testing, linting, and type checking
- **Security Scanning**: Vulnerability detection and secret scanning
- **ETL Validation**: Data pipeline validation and dry-run tests
- **SBOM Generation**: Software Bill of Materials for supply chain security
- **Automated Deployments**: Kubernetes deployments with canary strategies
- **Dependency Management**: Automated dependency updates via Dependabot

**Total Workflows**: 7 active workflows
**Total Lines of Configuration**: 2,164 lines
**Supported Languages**: JavaScript/TypeScript, Python
**Container Support**: Docker, Kubernetes

---

## Workflow Catalog

| Workflow | File | Purpose | Trigger |
|----------|------|---------|---------|
| CI/CD Pipeline | `ci.yml` | Quality gates, tests, coverage | PR, Push, Manual |
| ETL Validation | `etl-validation.yml` | Validate ETL pipelines dry-run | PR, Push, Manual |
| Security Scanning | `security-scan.yml` | Vulnerability scanning with Trivy | PR, Push, Schedule, Manual |
| SBOM Generation | `sbom-generation.yml` | Generate SBOMs with Syft | Push, PR, Release, Schedule |
| Deploy (Simple) | `deploy.yml` | Basic K8s deployment | Push to main, Manual |
| Canary Deploy | `deploy-canary.yml` | Advanced canary deployment | Push to main, Manual |
| RAC Gate | `rac-gate.yml` | Rules-as-Code validation | PR, Push |

---

## Workflow Details

### 1. CI/CD Pipeline (`ci.yml`)

**Purpose**: Comprehensive quality assurance pipeline with frontend and backend validation.

**Key Features**:
- **Frontend Quality**:
  - ESLint linting
  - TypeScript type checking
  - Vitest unit tests with coverage
  - Coverage artifacts uploaded

- **Python Quality** (Matrix: Python 3.10, 3.11):
  - Ruff linting with GitHub annotations
  - Ruff format checking
  - MyPy strict type checking
  - Pytest with coverage (minimum 80% required)
  - Coverage reports in XML, HTML, and terminal formats

- **E2E Tests**:
  - Playwright tests
  - Automated browser installation
  - Test reports and screenshots

- **Performance Tests**:
  - k6 load testing (smoke tests)
  - Performance thresholds validation
  - Results exported to JSON

- **Quality Gate Summary**:
  - Aggregates all test results
  - Posts status comment on PRs
  - Enforces 80% code coverage requirement

**Artifacts Generated**:
- Frontend coverage reports
- Python coverage reports (per Python version)
- Playwright test reports
- k6 performance results

**Triggers**:
- Pull requests to any branch
- Push to `main` or `develop`
- Manual dispatch

**Duration**: ~15-20 minutes

---

### 2. ETL Validation (`etl-validation.yml`)

**Purpose**: Validate ETL pipeline configurations and data quality before deployment.

**Key Features**:
- **YAML Schema Validation**: Validates all rule files against schema
- **ETL Dry-Run**: Runs ingestion pipeline in validation-only mode
- **Rule Count Verification**: Ensures rules are discovered and parsed correctly
- **Data Quality Checks**: Uses Great Expectations to validate:
  - Rule ID uniqueness
  - Agreement code presence
  - HS code format (6-digit validation)
  - Priority ranges (0-999)
  - Jurisdiction counts (1-10)

**Technologies Used**:
- Python 3.11
- Poetry dependency management
- Rust toolchain (for PSR loader)
- Great Expectations
- Pandas

**Validation Steps**:
1. Schema validation against YAML definitions
2. Dry-run ETL ingestion (no database writes)
3. Rule uniqueness validation
4. Data quality expectations

**Triggers**:
- PRs or pushes affecting:
  - `psr/**` (Rules-as-Code files)
  - `backend/app/etl/**`
  - `backend/app/dal/**`
  - `backend/app/contracts/**`
  - `backend/app/db/**`
  - `pyproject.toml`, `poetry.lock`
- Manual dispatch

**Duration**: ~10-15 minutes

---

### 3. Security Scanning (`security-scan.yml`)

**Purpose**: Comprehensive security vulnerability scanning across multiple surfaces.

**Security Jobs**:

#### 3.1 Trivy Container Scan
- Scans built Docker images for vulnerabilities
- Checks OS and library vulnerabilities
- Severity levels: CRITICAL, HIGH, MEDIUM
- Results uploaded to GitHub Security tab (SARIF format)

#### 3.2 Trivy Filesystem Scan
- Scans repository filesystem for vulnerabilities
- Identifies issues in source code dependencies
- SARIF results for GitHub Security integration

#### 3.3 Trivy IaC Configuration Scan
- Scans Infrastructure as Code configurations
- Detects misconfigurations in Docker, K8s, etc.
- Non-blocking (exit code 0)

#### 3.4 Python Security Scan
- **Bandit**: Python security linter for common vulnerabilities
- **Safety**: Checks for known vulnerabilities in dependencies
- JSON reports uploaded as artifacts

#### 3.5 NPM Security Audit
- Runs `npm audit` on frontend dependencies
- JSON report uploaded as artifact
- Identifies vulnerable npm packages

#### 3.6 Secret Detection
- **TruffleHog OSS**: Scans for leaked secrets
- Checks commit history
- Only reports verified secrets

**Triggers**:
- Pull requests to `main` or `develop`
- Push to `main`
- Daily schedule at 2 AM UTC
- Manual dispatch

**Permissions Required**:
- `contents: read`
- `security-events: write`
- `actions: read`

**Duration**: ~25-30 minutes (all jobs)

---

### 4. SBOM Generation (`sbom-generation.yml`)

**Purpose**: Generate Software Bill of Materials for supply chain security and compliance.

**SBOM Jobs**:

#### 4.1 Docker Image SBOM
- Uses Syft to scan Docker images
- Generates multiple formats:
  - SPDX JSON
  - CycloneDX JSON
  - SPDX YAML
  - Table format (human-readable)
- Attaches to GitHub Releases

#### 4.2 Python Backend SBOM
- Scans Python dependencies
- Exports Poetry dependencies to requirements.txt
- Generates SPDX and CycloneDX formats
- Runs pip-audit for vulnerability checks

#### 4.3 NPM Frontend SBOM
- Scans npm dependencies
- Uses both Syft and native npm SBOM
- Multiple format outputs

#### 4.4 Vulnerability Scanning
- **Grype**: Scans generated SBOMs for vulnerabilities
- Checks Docker, Python, and NPM SBOMs
- JSON and table format results

#### 4.5 SBOM Attestation (Main branch only)
- Uses Cosign for cryptographic attestation
- Signs SBOM with keyless signing (Sigstore)
- Attaches attestation to container images
- Verifies attestation after generation

**Formats Generated**:
- SPDX JSON (industry standard)
- CycloneDX JSON (OWASP standard)
- SPDX YAML
- Native npm SBOM

**Triggers**:
- Push to `main` or `develop`
- Pull requests to `main`
- GitHub Releases
- Weekly schedule (Sundays at 3 AM UTC)
- Manual dispatch

**Artifacts Retention**: 90 days

**Duration**: ~35-40 minutes (all jobs)

---

### 5. Simple Deployment (`deploy.yml`)

**Purpose**: Basic Kubernetes deployment to Sevensa VPS.

**Steps**:
1. Build Docker image
2. Push to GitHub Container Registry (ghcr.io)
3. Write kubeconfig from secrets
4. Update or create Kubernetes deployment
5. Wait for rollout status (120s timeout)

**Environment**:
- Namespace: `sevensa`
- Deployment: `psra-new`
- Registry: `ghcr.io`

**Triggers**:
- Push to `main`
- Manual dispatch

**Secrets Required**:
- `KUBECONFIG_B64`: Base64-encoded kubeconfig

---

### 6. Canary Deployment (`deploy-canary.yml`)

**Purpose**: Advanced canary deployment with gradual rollout and automated rollback.

**Key Features**:
- Gradual traffic shift (0% → 10% → 50% → 100%)
- Health checks between stages
- Automated rollback on failure
- Metric-based validation
- Slack notifications

**Deployment Stages**:
1. **Build & Push**: Docker image to registry
2. **Deploy Canary**: 10% traffic to canary pods
3. **Health Check**: Validate canary health
4. **Progressive Rollout**: Gradually increase traffic
5. **Full Rollout**: 100% traffic to new version
6. **Cleanup**: Remove old canary deployment

**Health Checks**:
- HTTP health endpoint checks
- Response time validation (< 500ms)
- Error rate monitoring (< 5%)
- Metric aggregation

**Rollback Triggers**:
- Health check failures
- High error rates
- Performance degradation
- Manual intervention

**Duration**: ~45-60 minutes (full rollout)

---

### 7. RAC Gate (`rac-gate.yml`)

**Purpose**: Validate Rules-as-Code changes before merge.

**Validation Steps**:
1. Set up Python 3.11 and Rust toolchain
2. Install Poetry and dependencies
3. Run pre-commit hooks
4. Execute golden tests

**Triggers**:
- PRs or pushes affecting:
  - `psr/**`
  - `tests/golden/**`
  - `scripts/rac_validate.sh`
  - `.pre-commit-config.yaml`
  - `pyproject.toml`, `poetry.lock`

**Duration**: ~10 minutes

---

## Quality Gates & Requirements

### Code Coverage Requirements

| Language | Minimum Coverage | Tool |
|----------|------------------|------|
| Python | 80% | pytest-cov |
| JavaScript/TypeScript | 80% | Vitest |

### Linting Standards

#### Python (Ruff)
- pycodestyle errors (E)
- pyflakes (F)
- isort (I)
- pep8-naming (N)
- pycodestyle warnings (W)
- pyupgrade (UP)
- flake8-bugbear (B)
- flake8-comprehensions (C4)
- flake8-simplify (SIM)
- flake8-type-checking (TCH)

#### TypeScript (ESLint)
- Next.js ESLint configuration
- TypeScript ESLint recommended rules
- Custom rules per project configuration

### Type Checking

#### Python (MyPy)
- Strict mode enabled
- `disallow_untyped_defs = true`
- `disallow_incomplete_defs = true`
- `warn_return_any = true`
- `warn_unused_configs = true`

#### TypeScript
- Strict mode enabled
- No implicit any
- Strict null checks

---

## Security Scanning

### Vulnerability Scanning Coverage

| Component | Tool | Severity Levels | Frequency |
|-----------|------|----------------|-----------|
| Container Images | Trivy | CRITICAL, HIGH, MEDIUM | Every PR/Push + Daily |
| Filesystem | Trivy | CRITICAL, HIGH, MEDIUM | Every PR/Push + Daily |
| IaC Configs | Trivy | CRITICAL, HIGH, MEDIUM | Every PR/Push + Daily |
| Python Deps | Bandit, Safety | All | Every PR/Push + Daily |
| NPM Deps | npm audit | All | Every PR/Push + Daily |
| Secrets | TruffleHog | Verified only | Every PR/Push |

### Security Reporting

All security scan results are:
1. Uploaded to GitHub Security tab (SARIF format where applicable)
2. Stored as workflow artifacts (30-day retention)
3. Available for download and review
4. Integrated with GitHub's Dependabot alerts

### Secret Detection

TruffleHog scans for:
- AWS keys
- API tokens
- Database credentials
- Private keys
- OAuth tokens
- Generic secrets with high entropy

---

## SBOM Generation

### SBOM Standards Supported

| Format | Standard | Use Case |
|--------|----------|----------|
| SPDX JSON | ISO/IEC 5962 | Industry standard, legal compliance |
| CycloneDX JSON | OWASP | Security-focused, vulnerability tracking |
| SPDX YAML | ISO/IEC 5962 | Human-readable, documentation |

### SBOM Contents

Each SBOM includes:
- **Component inventory**: All dependencies with versions
- **License information**: SPDX license identifiers
- **Relationship data**: Dependency tree structure
- **Package metadata**: Authors, checksums, locations
- **Vulnerability data**: Known CVEs (via Grype)

### SBOM Attestation

For production builds (`main` branch):
- SBOMs are cryptographically signed using Cosign
- Keyless signing via Sigstore (OIDC-based)
- Attestations attached to container images
- Verifiable by consumers using Cosign

### Supply Chain Security

The SBOM workflow provides:
1. **Transparency**: Complete visibility into dependencies
2. **Vulnerability Tracking**: Automated CVE detection
3. **License Compliance**: SPDX license tracking
4. **Provenance**: Attestation of build artifacts
5. **Auditability**: Historical SBOM snapshots (90-day retention)

---

## Automated Dependency Updates

### Dependabot Configuration

**File**: `.github/dependabot.yml`

#### Monitored Ecosystems

1. **NPM (Frontend)**
   - Weekly updates (Mondays at 9 AM CET)
   - Groups: React, TypeScript, Playwright, Testing
   - Major version updates blocked for: Next.js, React

2. **Python (Backend)**
   - Weekly updates (Mondays at 9 AM CET)
   - Groups: LangChain, FastAPI, Database, Testing
   - Major version updates blocked for: FastAPI, SQLAlchemy, Pydantic

3. **GitHub Actions**
   - Weekly updates (Mondays at 9 AM CET)
   - Updates action versions automatically

4. **Docker**
   - Weekly updates (Mondays at 9 AM CET)
   - Updates base images in Dockerfile

#### Update Strategy

- **Open PRs Limit**: 10 per ecosystem (5 for GitHub Actions)
- **Auto-assignment**: `sevensa-team`
- **Auto-review**: `sevensa-team`
- **Labels**: `dependencies`, `automated`, ecosystem-specific
- **Commit prefix**: `chore(deps)` or `chore(deps-dev)`

#### Dependency Grouping

Groups are used to batch related updates:
- Frontend: React, TypeScript, Playwright, Testing libraries
- Backend: LangChain, FastAPI, Database drivers, Testing tools

This reduces PR noise and makes reviewing easier.

---

## Triggers & Scheduling

### Automated Schedules

| Workflow | Schedule | Time (UTC) | Purpose |
|----------|----------|------------|---------|
| Security Scanning | Daily | 2:00 AM | Continuous security monitoring |
| SBOM Generation | Weekly (Sunday) | 3:00 AM | Weekly supply chain audit |
| Dependabot | Weekly (Monday) | 8:00 AM (CET = 7 AM UTC) | Dependency updates |

### Event Triggers

#### Pull Requests
- All workflows run on PRs (except deployments)
- Provides immediate feedback to developers
- Quality gates must pass before merge

#### Push to Main
- Triggers full CI/CD pipeline
- Executes deployment workflows
- Generates SBOMs and attestations
- Updates security scans

#### Manual Dispatch
- All workflows support `workflow_dispatch`
- Allows on-demand execution
- Useful for testing and debugging

#### Release Events
- Triggers SBOM generation
- Attaches SBOMs to GitHub Release
- Creates signed attestations

---

## Artifacts & Retention

### Artifact Categories

#### Test Reports
- **Type**: Coverage reports, test results, screenshots
- **Retention**: 7 days
- **Workflows**: CI, ETL Validation, RAC Gate

#### Security Reports
- **Type**: Vulnerability scans, audit results
- **Retention**: 30 days
- **Workflows**: Security Scanning

#### SBOMs
- **Type**: Software Bill of Materials, attestations
- **Retention**: 90 days
- **Workflows**: SBOM Generation

#### Performance Reports
- **Type**: k6 results, load test summaries
- **Retention**: 7 days
- **Workflows**: CI

### Artifact Access

Artifacts can be accessed via:
1. GitHub Actions UI (Workflow run page)
2. GitHub CLI: `gh run download <run-id>`
3. GitHub API: `GET /repos/:owner/:repo/actions/artifacts`

---

## Best Practices

### For Developers

1. **Local Testing First**
   - Run linters and tests locally before pushing
   - Use pre-commit hooks for automatic validation
   - Test ETL changes with `--validate-only` flag

2. **Understanding Failures**
   - Check workflow annotations in GitHub UI
   - Download artifacts for detailed reports
   - Review coverage gaps in HTML reports

3. **Security Issues**
   - Address security scan findings promptly
   - Review Dependabot PRs regularly
   - Never commit secrets (TruffleHog will catch them)

4. **Coverage Requirements**
   - Maintain 80% code coverage minimum
   - Write tests for new features before implementation
   - Use `pytest --cov` locally to check coverage

### For Reviewers

1. **Quality Gate Status**
   - Ensure all CI checks pass before approval
   - Review coverage reports for gaps
   - Check security scan results

2. **Dependency Updates**
   - Review Dependabot PRs for breaking changes
   - Check changelog/release notes for major updates
   - Validate that tests still pass

3. **Security Alerts**
   - Prioritize CRITICAL and HIGH severity findings
   - Verify that fixes don't introduce new vulnerabilities
   - Update documentation if security configs change

### For Operators

1. **Monitoring Workflows**
   - Review scheduled workflow results daily
   - Investigate repeated failures
   - Monitor artifact storage usage

2. **Secret Management**
   - Rotate `KUBECONFIG_B64` regularly
   - Audit secret access permissions
   - Keep GitHub token permissions minimal

3. **Artifact Cleanup**
   - Automatic cleanup after retention period
   - Download critical artifacts for long-term storage
   - Adjust retention periods based on compliance needs

---

## Workflow Metrics

### Success Rates (Target)

| Workflow | Target Success Rate | Current |
|----------|---------------------|---------|
| CI/CD Pipeline | > 95% | Monitor |
| ETL Validation | > 98% | Monitor |
| Security Scanning | > 90% | Monitor |
| SBOM Generation | > 95% | Monitor |
| Deployments | > 98% | Monitor |

### Performance Targets

| Workflow | Target Duration | Actual |
|----------|----------------|--------|
| CI/CD Pipeline | < 20 min | ~15-20 min |
| ETL Validation | < 15 min | ~10-15 min |
| Security Scanning | < 30 min | ~25-30 min |
| SBOM Generation | < 40 min | ~35-40 min |

---

## Troubleshooting

### Common Issues

#### 1. Coverage Below 80%
**Symptom**: Pytest fails with coverage error
**Solution**:
- Run `poetry run pytest --cov=. --cov-report=html`
- Open `htmlcov/index.html` to see coverage gaps
- Add tests for uncovered code

#### 2. Ruff Linting Failures
**Symptom**: Ruff check fails in CI
**Solution**:
- Run `poetry run ruff check . --fix` locally
- Commit the auto-fixes
- For manual fixes, follow ruff error messages

#### 3. MyPy Type Errors
**Symptom**: MyPy strict mode fails
**Solution**:
- Run `poetry run mypy . --strict --show-error-codes`
- Add type annotations to functions
- Use `# type: ignore[error-code]` sparingly for edge cases

#### 4. Playwright Test Failures
**Symptom**: E2E tests fail in CI but pass locally
**Solution**:
- Check if test is timing-sensitive
- Increase timeout values in playwright.config.ts
- Review screenshots in workflow artifacts

#### 5. Security Scan False Positives
**Symptom**: Trivy reports vulnerabilities in packages you can't update
**Solution**:
- Check if vulnerability affects your usage
- Add to `.trivyignore` if truly false positive
- Document the decision in a comment

#### 6. SBOM Generation Timeout
**Symptom**: Syft scan times out
**Solution**:
- Check Docker image size (should be < 2 GB)
- Verify multi-stage build is working
- Increase timeout in workflow if legitimate

---

## Maintenance

### Regular Maintenance Tasks

#### Weekly
- Review Dependabot PRs
- Check security scan results
- Review failed workflow runs

#### Monthly
- Audit artifact storage usage
- Review workflow performance metrics
- Update action versions if needed

#### Quarterly
- Review and update quality thresholds
- Audit secret rotation
- Review SBOM coverage

### Updating Workflows

1. **Make Changes**: Edit workflow YAML files
2. **Test**: Use manual dispatch to test changes
3. **Document**: Update this file with changes
4. **Review**: Have another team member review
5. **Monitor**: Watch first few runs after deployment

### Version Pinning

Actions are pinned using commit SHA or version tags:
- **Recommended**: Use SHA for security (`actions/checkout@a12b3c4...`)
- **Alternative**: Use version with SHA (`actions/checkout@v4` + Dependabot)

---

## Related Documentation

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Trivy Documentation](https://aquasecurity.github.io/trivy/)
- [Syft Documentation](https://github.com/anchore/syft)
- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [Playwright Documentation](https://playwright.dev)
- [Ruff Documentation](https://docs.astral.sh/ruff/)
- [MyPy Documentation](https://mypy.readthedocs.io/)

---

## Support

For issues or questions about workflows:
1. Check this documentation first
2. Review workflow run logs in GitHub Actions UI
3. Contact DevOps team: devops@sevensa.nl
4. Create an issue in the repository

---

**Last Updated**: 2025-10-13
**Version**: 2.0.0
**Maintained By**: Sevensa DevOps Team
