# Quality Gates Quick Reference

## Pre-Commit Checklist

Before pushing your code, run these commands to ensure CI will pass:

### Frontend (Node.js/TypeScript)
```bash
npm run lint           # Check linting
npm run typecheck      # Check types
npm run test           # Run tests with coverage
npm run test:e2e       # Run E2E tests (optional)
```

**Or run all at once:**
```bash
npm run verify
```

### Backend (Python)
```bash
poetry run ruff check .              # Lint code
poetry run ruff format --check .     # Check formatting
poetry run mypy . --strict           # Type check
poetry run pytest --cov=. --cov-fail-under=80  # Test with coverage
```

**Auto-fix issues:**
```bash
poetry run ruff check . --fix        # Auto-fix linting issues
poetry run ruff format .             # Auto-format code
```

---

## Quality Gate Thresholds

| Gate | Tool | Threshold | Failure Condition |
|------|------|-----------|-------------------|
| **Python Linting** | Ruff | 0 errors | Any linting errors |
| **Python Formatting** | Ruff | 0 violations | Any format violations |
| **Type Checking** | MyPy (strict) | 0 errors | Any type errors |
| **Test Coverage** | Pytest/Coverage | ≥80% | Coverage < 80% |
| **Frontend Linting** | ESLint | 0 errors | Any linting errors |
| **Frontend Types** | TypeScript | 0 errors | Any type errors |
| **E2E Tests** | Playwright | 100% pass | Any test failures |
| **Performance** | k6 | p95 < 500ms | Threshold exceeded |

---

## Common Fixes

### Coverage Too Low
```bash
# 1. Run tests and see what's missing
poetry run pytest --cov=. --cov-report=term-missing

# 2. View HTML report
poetry run coverage html
open htmlcov/index.html  # or xdg-open on Linux

# 3. Add tests for uncovered lines
# 4. Re-run: poetry run pytest --cov=.
```

### Type Errors (MyPy)
```bash
# See detailed errors
poetry run mypy . --strict --show-error-codes --pretty

# Common fixes:
# - Add type hints: def func(arg: str) -> int:
# - Import types: from typing import List, Dict, Optional
# - Use # type: ignore[error-code] for edge cases
```

### Linting Errors (Ruff)
```bash
# Auto-fix most issues
poetry run ruff check . --fix

# Format code
poetry run ruff format .

# Check specific rule
poetry run ruff rule <ERROR_CODE>
```

### Frontend Type Errors
```bash
# Check types
npm run typecheck

# Common fixes:
# - Add proper TypeScript types
# - Use type assertions: value as Type
# - Fix import types
```

---

## CI/CD Pipeline Status

Check your PR for these job statuses:

✅ **frontend-quality** - Linting, types, tests
✅ **python-quality (3.10)** - Python 3.10 checks
✅ **python-quality (3.11)** - Python 3.11 checks
✅ **e2e-tests** - Playwright tests
✅ **performance-tests** - k6 smoke tests
✅ **quality-gate** - Overall status

---

## Quick Commands Reference

### Install Dependencies
```bash
# Frontend
npm ci

# Backend
poetry install --with dev
```

### Run Individual Tools
```bash
# Ruff (Python linter)
poetry run ruff check .
poetry run ruff check . --fix
poetry run ruff format .
poetry run ruff format --check .

# MyPy (Type checker)
poetry run mypy .
poetry run mypy . --strict

# Pytest (Tests + Coverage)
poetry run pytest
poetry run pytest --cov=.
poetry run pytest --cov=. --cov-fail-under=80
poetry run coverage report
poetry run coverage html

# ESLint (Frontend linter)
npm run lint

# TypeScript (Type checker)
npm run typecheck

# Vitest (Frontend tests)
npm run test
npm run test:watch

# Playwright (E2E tests)
npm run test:e2e
npm run test:e2e:ui

# k6 (Performance tests)
k6 run ops/loadtest/k6_smoke.js
BASE_URL=http://localhost:8000 k6 run ops/loadtest/k6_smoke.js
```

---

## Configuration Files

| File | Purpose |
|------|---------|
| `.github/workflows/ci.yml` | CI/CD pipeline definition |
| `pyproject.toml` | Python config (ruff, mypy, poetry) |
| `pytest.ini` | Pytest and coverage config |
| `package.json` | Node.js scripts and deps |
| `tsconfig.json` | TypeScript configuration |
| `playwright.config.ts` | Playwright E2E config |
| `ops/loadtest/k6_smoke.js` | k6 performance test |

---

## Getting Help

### Pipeline Failed?
1. Click on the failed job in GitHub Actions
2. Expand the failed step
3. Read the error message
4. Run the same command locally
5. Fix the issue and push again

### Still Stuck?
- Check `.github/CI_CD_DOCUMENTATION.md` for detailed info
- Ask the team in Slack/Teams
- Review recent successful PRs for examples

---

## Tips for Success

1. **Run checks before committing** - Save time by catching issues early
2. **Use auto-fix tools** - Let ruff and prettier fix formatting automatically
3. **Write tests incrementally** - Don't wait until the end to add tests
4. **Check coverage locally** - Use the HTML report to see what needs testing
5. **Use pre-commit hooks** - Automate checks with husky or pre-commit
6. **Keep dependencies updated** - Regularly update to get bug fixes

---

**Quick Start**: Run `npm run verify` for frontend and the Python commands above for backend before every commit!
