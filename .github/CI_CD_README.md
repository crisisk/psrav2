# CI/CD Pipeline

## Quick Start

### Local Validation (Before Pushing)

Run the validation script to check all quality gates locally:

```bash
./scripts/validate_quality_gates.sh
```

Or validate specific components:

```bash
./scripts/validate_quality_gates.sh --frontend
./scripts/validate_quality_gates.sh --backend
./scripts/validate_quality_gates.sh --performance
```

### Manual Checks

**Frontend:**
```bash
npm run verify  # Runs: lint, typecheck, test
```

**Backend:**
```bash
poetry run ruff check . && \
poetry run ruff format --check . && \
poetry run mypy . --strict && \
poetry run pytest --cov=. --cov-fail-under=80
```

---

## Pipeline Overview

The CI/CD pipeline enforces comprehensive quality gates on every pull request and push to main/develop branches.

### Pipeline Jobs

```
┌─────────────────────┐
│  frontend-quality   │  ← ESLint, TypeScript, Vitest
└─────────┬───────────┘
          │
          ├─────────────────────────────┐
          ↓                             ↓
┌─────────────────────┐     ┌─────────────────────┐
│   python-quality    │     │    e2e-tests        │
│  (Python 3.10/3.11) │     │    (Playwright)     │
└─────────┬───────────┘     └─────────┬───────────┘
          │                            │
          └──────────┬─────────────────┘
                     ↓
          ┌─────────────────────┐
          │ performance-tests   │
          │      (k6)           │
          └─────────┬───────────┘
                    ↓
          ┌─────────────────────┐
          │   quality-gate      │  ← Final status & PR comment
          └─────────────────────┘
```

---

## Quality Gates

### 1. Frontend Quality
- **ESLint**: Code linting
- **TypeScript**: Type checking
- **Vitest**: Unit tests with coverage

### 2. Python Quality (Matrix: 3.10, 3.11)
- **Ruff Linting**: Fast Python linting
- **Ruff Format**: Code formatting check
- **MyPy Strict**: Static type checking
- **Pytest**: Tests with ≥80% coverage

### 3. E2E Tests
- **Playwright**: End-to-end browser tests

### 4. Performance Tests
- **k6**: Load testing with thresholds
  - p95 latency < 500ms
  - Error rate < 10%

### 5. Quality Gate Summary
- Aggregates all results
- Posts status to PR
- Fails build if gates don't pass

---

## Thresholds & Requirements

| Gate | Threshold | Hard Fail |
|------|-----------|-----------|
| Python Coverage | ≥ 80% | ✅ Yes |
| Python Linting | 0 errors | ✅ Yes |
| Python Formatting | 0 violations | ✅ Yes |
| Type Checking | 0 errors | ✅ Yes |
| Frontend Linting | 0 errors | ✅ Yes |
| Frontend Types | 0 errors | ✅ Yes |
| Unit Tests | 100% pass | ✅ Yes |
| E2E Tests | 100% pass | ✅ Yes |
| Performance (p95) | < 500ms | ⚠️ Warning |

---

## Caching Strategy

The pipeline uses aggressive caching to speed up builds:

### Node.js
- **Cache**: `node_modules/`
- **Key**: `package-lock.json` hash
- **Tool**: `actions/setup-node@v4` with `cache: 'npm'`

### Python
- **Cache**:
  - `~/.cache/pypoetry`
  - `~/.cache/pip`
  - `.venv/`
- **Key**: Python version + `poetry.lock` + `requirements.txt` hashes
- **Tool**: `actions/cache@v4`

**Expected speedup**: 50-70% reduction in build time on cache hits

---

## Documentation

- **Comprehensive Guide**: [CI_CD_DOCUMENTATION.md](./CI_CD_DOCUMENTATION.md)
- **Quick Reference**: [QUALITY_GATES_QUICK_REFERENCE.md](./QUALITY_GATES_QUICK_REFERENCE.md)

---

## Common Issues & Solutions

### ❌ Coverage Below 80%

**Problem**: `Coverage X% is below the required 80% threshold`

**Solution**:
```bash
# Check what's missing
poetry run coverage report --show-missing

# View HTML report
poetry run coverage html && open htmlcov/index.html

# Add tests for uncovered code
```

---

### ❌ MyPy Type Errors

**Problem**: `Type checking failed`

**Solution**:
```bash
# See detailed errors
poetry run mypy . --strict --show-error-codes --pretty

# Common fixes:
# 1. Add type hints: def func(arg: str) -> int:
# 2. Import types: from typing import List, Dict, Optional
# 3. Use ignore comments: # type: ignore[error-code]
```

---

### ❌ Ruff Linting Failed

**Problem**: `Ruff linting failed`

**Solution**:
```bash
# Auto-fix most issues
poetry run ruff check . --fix

# Format code
poetry run ruff format .

# Check specific rule
poetry run ruff rule <ERROR_CODE>
```

---

### ❌ E2E Tests Failed

**Problem**: `Playwright tests failed`

**Solution**:
```bash
# Run tests with UI
npm run test:e2e:ui

# Debug mode
PWDEBUG=1 npm run test:e2e

# Check screenshots in artifacts
```

---

### ❌ Performance Thresholds Exceeded

**Problem**: `k6 thresholds exceeded`

**Solution**:
1. Check if service is running
2. Review performance metrics
3. Optimize slow endpoints
4. Adjust thresholds if needed

---

## Local Development Workflow

### Before Committing

1. **Run validation script:**
   ```bash
   ./scripts/validate_quality_gates.sh
   ```

2. **Fix any issues:**
   - Auto-fix formatting: `poetry run ruff format .`
   - Auto-fix linting: `poetry run ruff check . --fix`
   - Add missing tests

3. **Verify again:**
   ```bash
   ./scripts/validate_quality_gates.sh
   ```

4. **Commit and push:**
   ```bash
   git add .
   git commit -m "Your message"
   git push
   ```

---

## Matrix Testing

Python code is tested against multiple versions:
- Python 3.10
- Python 3.11

This ensures compatibility across supported Python versions.

---

## Artifacts & Reports

The pipeline generates and uploads:

1. **Frontend Coverage** (`coverage/`)
2. **Python Coverage** (per Python version)
   - `coverage.xml`
   - `htmlcov/`
   - `pytest-report.xml`
3. **Playwright Report** (`playwright-report/`)
4. **k6 Results** (`k6-summary.json`)

**Retention**: 7 days

---

## Pipeline Triggers

The pipeline runs on:
- ✅ Pull requests (all branches)
- ✅ Push to `main` branch
- ✅ Push to `develop` branch
- ✅ Manual trigger (workflow_dispatch)

---

## Configuration Files

| File | Purpose |
|------|---------|
| `.github/workflows/ci.yml` | Main pipeline definition |
| `pyproject.toml` | Python tools config (ruff, mypy) |
| `pytest.ini` | Pytest & coverage settings |
| `package.json` | Node.js scripts |
| `tsconfig.json` | TypeScript config |
| `playwright.config.ts` | E2E test config |
| `ops/loadtest/k6_smoke.js` | Performance test |

---

## Monitoring & Metrics

### What to Track
- ✅ Build duration trends
- ✅ Test coverage trends
- ✅ Failure rates by job
- ✅ Performance metrics (p95, p99)
- ✅ Time to fix failures

### GitHub Actions Insights
View pipeline metrics in GitHub:
`Repository → Actions → Workflows → CI/CD Pipeline`

---

## Future Enhancements

Planned improvements:
- [ ] Security scanning (SAST, SCA)
- [ ] Container image scanning
- [ ] Staging deployment
- [ ] Performance regression detection
- [ ] Test result trending
- [ ] Notification integrations

---

## Support

**Need help?**
1. Check [CI_CD_DOCUMENTATION.md](./CI_CD_DOCUMENTATION.md)
2. Run `./scripts/validate_quality_gates.sh --help`
3. Review workflow logs in GitHub Actions
4. Contact the DevOps team

---

## Badge Status

Add to your README.md:

```markdown
[![CI/CD Pipeline](https://github.com/YOUR_ORG/psra-ltsd-enterprise-v2/workflows/CI/CD%20Pipeline%20with%20Quality%20Gates/badge.svg)](https://github.com/YOUR_ORG/psra-ltsd-enterprise-v2/actions)
```

---

**Version**: 1.0
**Last Updated**: 2025-10-13
**Maintained by**: DevOps Team
