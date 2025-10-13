# CI/CD Pipeline Documentation

## Overview

This document describes the comprehensive CI/CD pipeline implemented for the PSRA-LTSD Enterprise project. The pipeline includes multiple quality gates to ensure code quality, test coverage, type safety, and performance standards.

## Pipeline Architecture

### Workflow File
- **Location**: `.github/workflows/ci.yml`
- **Triggers**:
  - Pull requests to any branch
  - Pushes to `main` and `develop` branches
  - Manual workflow dispatch

### Jobs Structure

```
┌─────────────────────┐
│  frontend-quality   │
└─────────┬───────────┘
          │
          ├─────────────────────────────┐
          ↓                             ↓
┌─────────────────────┐     ┌─────────────────────┐
│   python-quality    │     │    e2e-tests        │
│  (Matrix: 3.10,3.11)│     └──────────┬──────────┘
└─────────┬───────────┘                │
          │                             │
          ├─────────────────────────────┤
          ↓                             ↓
┌─────────────────────────────────────────┐
│        performance-tests                │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│          quality-gate                   │
└─────────────────────────────────────────┘
```

## Quality Gates

### 1. Frontend Quality Gates

**Job**: `frontend-quality`

#### Checks Performed:
- **ESLint**: JavaScript/TypeScript linting
- **TypeScript Type Checking**: Full type safety validation
- **Unit Tests**: Vitest with coverage reporting
- **Coverage Threshold**: Configured via Vitest

#### Configuration:
- Node.js 20
- npm caching enabled
- Coverage reports uploaded as artifacts

#### Commands:
```bash
npm run lint        # ESLint
npm run typecheck   # TypeScript
npm run test        # Vitest with coverage
```

#### Failure Conditions:
- Any linting errors
- Type checking errors
- Test failures
- Coverage below configured threshold

---

### 2. Python Quality Gates (Matrix Testing)

**Job**: `python-quality`

**Strategy**: Matrix testing across Python 3.10 and 3.11

#### Checks Performed:

##### a. Ruff Linting
- **Purpose**: Fast Python linter (Rust-based)
- **Rules Enabled**:
  - E: pycodestyle errors
  - F: pyflakes
  - I: isort (import sorting)
  - N: pep8-naming
  - W: pycodestyle warnings
  - UP: pyupgrade
  - B: flake8-bugbear
  - C4: flake8-comprehensions
  - SIM: flake8-simplify
  - TCH: flake8-type-checking
  - Q: flake8-quotes
  - RUF: ruff-specific rules

**Command**:
```bash
poetry run ruff check . --output-format=github
```

**Failure Condition**: Any linting errors detected

---

##### b. Ruff Format Check
- **Purpose**: Ensure consistent code formatting
- **Configuration**: Black-compatible style

**Command**:
```bash
poetry run ruff format --check .
```

**Failure Condition**: Any formatting violations

**Fix Command**:
```bash
poetry run ruff format .
```

---

##### c. MyPy Type Checking (Strict Mode)
- **Purpose**: Static type checking
- **Mode**: Strict
- **Configuration** (pyproject.toml):
  ```toml
  [tool.mypy]
  python_version = "3.11"
  warn_return_any = true
  warn_unused_configs = true
  disallow_untyped_defs = true
  disallow_incomplete_defs = true
  ```

**Command**:
```bash
poetry run mypy . --strict --show-error-codes --pretty
```

**Failure Condition**: Any type errors detected

---

##### d. Pytest with Coverage
- **Purpose**: Run tests with coverage tracking
- **Minimum Coverage**: 80%
- **Coverage Settings**:
  - XML report (for CI/CD tools)
  - HTML report (for developers)
  - Terminal report with missing lines
  - JUnit XML (for test reporting)

**Command**:
```bash
poetry run pytest \
  --cov=. \
  --cov-report=xml \
  --cov-report=html \
  --cov-report=term-missing \
  --cov-fail-under=80 \
  --junitxml=pytest-report.xml \
  -v
```

**Failure Conditions**:
- Any test failures
- Coverage below 80%

**Coverage Exclusions** (pytest.ini):
- Test files
- Migrations
- Virtual environments
- Node modules
- Build artifacts

---

#### Caching Strategy:
- **Poetry virtualenv**: `~/.cache/pypoetry`, `.venv`
- **Pip cache**: `~/.cache/pip`
- **Cache key**: Based on Python version and lock file hashes

---

### 3. E2E Tests (Playwright)

**Job**: `e2e-tests`

**Dependencies**: Runs after `frontend-quality` succeeds

#### Configuration:
- Playwright browsers installed with dependencies
- Tests run via npm script

**Command**:
```bash
npm run test:e2e
```

#### Artifacts:
- Playwright HTML report
- Screenshots on failure
- Video recordings (if configured)

#### Failure Condition:
- Any E2E test failures

---

### 4. Performance Tests (k6)

**Job**: `performance-tests`

**Dependencies**: Runs after both `frontend-quality` and `python-quality` succeed

#### Configuration:
- **Tool**: k6 (Grafana k6)
- **Test Type**: Smoke test
- **Duration**: ~2 minutes
- **Load Profile**:
  - Ramp up: 30s to 10 users
  - Steady state: 1 minute at 10 users
  - Ramp down: 20s to 0 users

#### Performance Thresholds:
```javascript
{
  http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95th percentile < 500ms
  http_req_failed: ['rate<0.1'],                   // < 10% error rate
  'http_req_duration{type:health}': ['p(95)<200'], // Health checks < 200ms
}
```

#### Test Scenarios:
1. Health check endpoint (`/api/health`)
2. Homepage (`/`)
3. API status endpoint (`/api/v1/status`)

**Test File**: `ops/loadtest/k6_smoke.js`

#### Metrics Tracked:
- HTTP request duration (avg, p95, p99)
- Error rate
- Custom response time trends
- Request count
- Virtual users

#### Artifacts:
- k6 summary JSON
- Console output with metrics

**Note**: Performance tests may be skipped in CI environments without running services.

---

### 5. Quality Gate Summary

**Job**: `quality-gate`

**Dependencies**: Runs after all other jobs (always runs)

#### Functions:
1. **Status Aggregation**: Collects results from all quality gates
2. **Failure Detection**: Fails if any critical gate fails
3. **PR Comments**: Posts summary to pull requests
4. **Final Verdict**: Determines overall pipeline success

#### PR Comment Template:
```markdown
## Quality Gate Results

| Check | Status |
|-------|--------|
| Frontend Quality | ✅ success |
| Python Quality | ✅ success |
| E2E Tests | ✅ success |
| Performance Tests | ✅ success |

### Requirements Met:
- ✅ Ruff linting passed
- ✅ MyPy type checking (strict mode) passed
- ✅ Pytest coverage >= 80%
- ✅ E2E tests passed
- ✅ Performance benchmarks checked

**All quality gates have been verified!**
```

---

## Local Development

### Running Quality Checks Locally

#### Frontend:
```bash
# Install dependencies
npm ci

# Run all checks
npm run verify  # Runs lint, typecheck, and test

# Individual checks
npm run lint
npm run typecheck
npm run test
npm run test:e2e
```

#### Python:
```bash
# Install dependencies
poetry install --with dev

# Run all checks
poetry run ruff check .
poetry run ruff format --check .
poetry run mypy . --strict
poetry run pytest --cov=. --cov-fail-under=80

# Auto-fix formatting
poetry run ruff format .
```

#### Performance:
```bash
# Install k6 (Linux)
sudo apt-get install k6

# Run smoke test
k6 run ops/loadtest/k6_smoke.js

# With custom base URL
BASE_URL=http://localhost:8000 k6 run ops/loadtest/k6_smoke.js
```

---

## Configuration Files

### Key Configuration Files:
- `.github/workflows/ci.yml` - Main CI/CD pipeline
- `pyproject.toml` - Python project configuration, ruff, mypy settings
- `pytest.ini` - Pytest and coverage configuration
- `package.json` - Node.js scripts and dependencies
- `playwright.config.ts` - Playwright E2E test configuration
- `ops/loadtest/k6_smoke.js` - k6 performance test

---

## Environment Variables

### CI/CD Environment:
- `NODE_VERSION`: Node.js version (default: 20)
- `PYTHON_CACHE_PATH`: Python cache location

### k6 Tests:
- `BASE_URL`: Base URL for performance tests (default: http://localhost:3000)

---

## Troubleshooting

### Common Issues:

#### 1. Coverage Below Threshold
**Error**: `Coverage X% is below the required 80% threshold`

**Solutions**:
- Add more tests to untested code paths
- Check coverage report: `coverage report --show-missing`
- Review HTML report: `htmlcov/index.html`
- Exclude non-testable code with `# pragma: no cover`

#### 2. MyPy Type Errors
**Error**: `Type checking failed`

**Solutions**:
- Add type hints to function signatures
- Use `from typing import ...` for complex types
- Check `--show-error-codes` output for specific issues
- Use `# type: ignore[error-code]` for unavoidable issues

#### 3. Ruff Linting Failures
**Error**: `Ruff linting failed`

**Solutions**:
- Run `ruff check . --fix` to auto-fix issues
- Run `ruff format .` to fix formatting
- Check specific rule with `ruff rule <CODE>`
- Disable specific rules in `pyproject.toml` if needed

#### 4. E2E Test Failures
**Error**: `Playwright tests failed`

**Solutions**:
- Run tests locally: `npm run test:e2e:ui`
- Check screenshots in test artifacts
- Update selectors if UI changed
- Verify test data setup

#### 5. Performance Test Failures
**Error**: `k6 thresholds exceeded`

**Solutions**:
- Check if service is running
- Review performance metrics in summary
- Adjust thresholds if requirements changed
- Optimize slow endpoints

---

## Best Practices

### Before Committing:
1. Run `npm run verify` for frontend code
2. Run `poetry run ruff check . && poetry run mypy . --strict` for Python
3. Ensure tests pass: `npm run test` and `poetry run pytest`
4. Check coverage locally

### During PR Review:
1. Wait for all CI checks to pass
2. Review coverage reports in artifacts
3. Check for performance regressions
4. Address all quality gate failures

### Maintaining Quality:
1. Keep coverage above 80% for all new code
2. Add type hints to all new Python functions
3. Run linters before committing (use pre-commit hooks)
4. Write E2E tests for critical user journeys
5. Monitor performance trends over time

---

## Continuous Improvement

### Metrics to Track:
- Test coverage trends
- Build duration trends
- Performance metrics (p95, p99 latencies)
- Failure rates by job
- Time to fix failures

### Future Enhancements:
- [ ] Add integration tests job
- [ ] Add security scanning (SAST, dependency scanning)
- [ ] Add Docker image building and scanning
- [ ] Add staging deployment after quality gates
- [ ] Add performance regression detection
- [ ] Add test result trending dashboard
- [ ] Add notification integrations (Slack, email)

---

## Support

For issues with the CI/CD pipeline:
1. Check this documentation
2. Review workflow run logs in GitHub Actions
3. Check individual job logs for specific errors
4. Consult the project team

---

**Last Updated**: 2025-10-13
**Version**: 1.0
**Maintained by**: DevOps Team
