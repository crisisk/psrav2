# CI/CD Pipeline Visual Diagram

## Complete Pipeline Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         TRIGGER EVENT                                    │
│  • Pull Request  • Push to main/develop  • Manual Workflow Dispatch     │
└────────────────────────────┬─────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                     PARALLEL EXECUTION START                             │
└──────────────────────────────────────────────────────────────────────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
┏━━━━━━━━━━━━━━━━━━━━━┓         ┏━━━━━━━━━━━━━━━━━━━━━┓
┃  FRONTEND QUALITY   ┃         ┃  PYTHON QUALITY     ┃
┃    (Node.js 20)     ┃         ┃  (Matrix: 3.10/11)  ┃
┗━━━━━━━━━━━━━━━━━━━━━┛         ┗━━━━━━━━━━━━━━━━━━━━━┛
┃                     ┃         ┃                     ┃
┃ ✓ npm cache         ┃         ┃ ✓ pip cache         ┃
┃ ✓ npm ci            ┃         ┃ ✓ poetry cache      ┃
┃ ✓ ESLint            ┃         ┃ ✓ Poetry install    ┃
┃ ✓ TypeScript        ┃         ┃                     ┃
┃ ✓ Vitest            ┃         ┃ PYTHON 3.10:        ┃
┃ ✓ Coverage report   ┃         ┃   ✓ Ruff lint       ┃
┃                     ┃         ┃   ✓ Ruff format     ┃
┃ Artifacts:          ┃         ┃   ✓ MyPy strict     ┃
┃  • coverage/        ┃         ┃   ✓ Pytest (>80%)   ┃
┗━━━━━━━━━━━━━━━━━━━━━┛         ┃                     ┃
            │                   ┃ PYTHON 3.11:        ┃
            │                   ┃   ✓ Ruff lint       ┃
            │                   ┃   ✓ Ruff format     ┃
            │                   ┃   ✓ MyPy strict     ┃
            │                   ┃   ✓ Pytest (>80%)   ┃
            │                   ┃   ✓ Coverage check  ┃
            │                   ┃                     ┃
            │                   ┃ Artifacts:          ┃
            │                   ┃  • coverage.xml     ┃
            │                   ┃  • htmlcov/         ┃
            │                   ┃  • pytest-report    ┃
            │                   ┗━━━━━━━━━━━━━━━━━━━━━┛
            │                             │
            └─────────────┬───────────────┘
                          ▼
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                        E2E TESTS                              ┃
┃                     (Playwright)                              ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
┃ Dependencies: frontend-quality                                ┃
┃                                                               ┃
┃ ✓ Install Playwright browsers                                ┃
┃ ✓ Run E2E test suite                                         ┃
┃ ✓ Capture screenshots on failure                             ┃
┃                                                               ┃
┃ Artifacts:                                                    ┃
┃  • playwright-report/                                         ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
            │                             │
            └─────────────┬───────────────┘
                          ▼
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                   PERFORMANCE TESTS                           ┃
┃                         (k6)                                  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
┃ Dependencies: frontend-quality, python-quality                ┃
┃                                                               ┃
┃ ✓ Install k6                                                 ┃
┃ ✓ Create k6 smoke test                                       ┃
┃ ✓ Run performance test                                       ┃
┃                                                               ┃
┃ Thresholds:                                                   ┃
┃  • p(95) < 500ms                                             ┃
┃  • p(99) < 1000ms                                            ┃
┃  • Error rate < 10%                                          ┃
┃  • Health check p(95) < 200ms                                ┃
┃                                                               ┃
┃ Artifacts:                                                    ┃
┃  • k6-summary.json                                           ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                          │
                          ▼
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                   QUALITY GATE SUMMARY                        ┃
┃               (Always runs, aggregates results)               ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
┃                                                               ┃
┃ ✓ Check all job results                                      ┃
┃ ✓ Aggregate status                                           ┃
┃ ✓ Post PR comment (if PR)                                    ┃
┃ ✓ Fail if any critical gate failed                           ┃
┃                                                               ┃
┃ Output:                                                       ┃
┃  ┌────────────────────────────────────────────┐             ┃
┃  │ ## Quality Gate Results                    │             ┃
┃  │                                             │             ┃
┃  │ | Check              | Status    |         │             ┃
┃  │ |--------------------|-----------|         │             ┃
┃  │ | Frontend Quality   | ✅ success |         │             ┃
┃  │ | Python Quality     | ✅ success |         │             ┃
┃  │ | E2E Tests          | ✅ success |         │             ┃
┃  │ | Performance Tests  | ✅ success |         │             ┃
┃  │                                             │             ┃
┃  │ ### Requirements Met:                       │             ┃
┃  │ - ✅ Ruff linting passed                    │             ┃
┃  │ - ✅ MyPy type checking passed              │             ┃
┃  │ - ✅ Pytest coverage >= 80%                 │             ┃
┃  │ - ✅ E2E tests passed                       │             ┃
┃  │ - ✅ Performance benchmarks checked         │             ┃
┃  └────────────────────────────────────────────┘             ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                          │
                          ▼
                  ┌───────────────┐
                  │  SUCCESS ✅   │
                  │      OR       │
                  │  FAILURE ❌   │
                  └───────────────┘
```

---

## Quality Gate Decision Tree

```
                      ┌─────────────────┐
                      │  Pipeline Start │
                      └────────┬────────┘
                               │
                ┌──────────────┴──────────────┐
                │                             │
        ┌───────▼─────────┐         ┌────────▼────────┐
        │ Frontend Check  │         │  Python Check   │
        │                 │         │   (3.10/3.11)   │
        └───────┬─────────┘         └────────┬────────┘
                │                             │
         ┌──────┴──────┐             ┌────────┴────────┐
         │             │             │                 │
    ┌────▼───┐   ┌────▼───┐   ┌─────▼────┐   ┌───────▼──────┐
    │ Lint   │   │ Types  │   │ Ruff     │   │ MyPy strict  │
    │  OK?   │   │  OK?   │   │  OK?     │   │   OK?        │
    └────┬───┘   └────┬───┘   └─────┬────┘   └───────┬──────┘
         │            │              │                │
         └──────┬─────┘              └────────┬───────┘
                │                             │
         ┌──────▼────────┐            ┌───────▼──────────┐
         │  Tests Pass?  │            │ Tests + Coverage │
         │               │            │     >= 80%?      │
         └──────┬────────┘            └───────┬──────────┘
                │                             │
                └───────────┬─────────────────┘
                            │
                    ┌───────▼───────┐
                    │  All Pass?    │
                    └───────┬───────┘
                            │
                ┌───────────┴───────────┐
                │                       │
            ┌───▼──┐               ┌────▼────┐
            │ YES  │               │   NO    │
            └───┬──┘               └────┬────┘
                │                       │
        ┌───────▼───────┐         ┌─────▼─────┐
        │  Run E2E Tests │        │  FAIL ❌  │
        └───────┬────────┘        └───────────┘
                │
         ┌──────▼──────┐
         │ E2E Pass?   │
         └──────┬──────┘
                │
                ├──────────────┐
                │              │
            ┌───▼──┐       ┌───▼───┐
            │ YES  │       │  NO   │
            └───┬──┘       └───┬───┘
                │              │
        ┌───────▼───────┐      │
        │  Run k6 Tests │      │
        └───────┬───────┘      │
                │              │
         ┌──────▼──────┐       │
         │ k6 Pass?    │       │
         │ (Warning)   │       │
         └──────┬──────┘       │
                │              │
                ├──────────────┘
                │
        ┌───────▼───────┐
        │ Quality Gate  │
        │   Summary     │
        └───────┬───────┘
                │
        ┌───────▼────────┐
        │  Post PR       │
        │  Comment       │
        └───────┬────────┘
                │
        ┌───────▼────────┐
        │  SUCCESS ✅    │
        │      OR        │
        │  FAILURE ❌    │
        └────────────────┘
```

---

## Failure Scenarios

### Scenario 1: Linting Failure
```
Frontend Quality → ESLint Fails ❌
                    ↓
              Pipeline Fails ❌
                    ↓
         PR blocked from merge
```

### Scenario 2: Coverage Below Threshold
```
Python Quality → Pytest Runs ✅
                    ↓
              Coverage 75% ❌
                    ↓
         Coverage Gate Fails ❌
                    ↓
         PR blocked from merge
```

### Scenario 3: Type Checking Failure
```
Python Quality → MyPy Strict ❌
                    ↓
         Type errors detected
                    ↓
         PR blocked from merge
```

### Scenario 4: E2E Test Failure
```
E2E Tests → Playwright Fails ❌
                    ↓
        Quality Gate Fails ❌
                    ↓
      PR blocked from merge
```

---

## Success Path

```
✅ Frontend Quality
    └─ ESLint passed
    └─ TypeScript passed
    └─ Vitest passed

✅ Python Quality (3.10)
    └─ Ruff lint passed
    └─ Ruff format passed
    └─ MyPy strict passed
    └─ Pytest passed (82% coverage)

✅ Python Quality (3.11)
    └─ Ruff lint passed
    └─ Ruff format passed
    └─ MyPy strict passed
    └─ Pytest passed (82% coverage)
    └─ Coverage gate passed

✅ E2E Tests
    └─ All Playwright tests passed

⚠️  Performance Tests
    └─ k6 smoke test completed
    └─ p95: 450ms ✅
    └─ Error rate: 5% ✅

✅ Quality Gate Summary
    └─ All gates passed
    └─ PR comment posted
    └─ Build successful

→ Ready to Merge! 🎉
```

---

## Caching Flow

```
┌─────────────────────────────────────────────┐
│          Cache Key Generation               │
└──────────────────┬──────────────────────────┘
                   │
    ┌──────────────┴──────────────┐
    │                             │
┌───▼────────────┐    ┌───────────▼──────────┐
│  Node.js       │    │    Python            │
│  package-lock  │    │ poetry.lock +        │
│  .json hash    │    │ requirements.txt     │
└───┬────────────┘    └───────────┬──────────┘
    │                             │
    │                             │
┌───▼────────────┐    ┌───────────▼──────────┐
│ Cache Lookup   │    │  Cache Lookup        │
│ node_modules/  │    │  ~/.cache/poetry     │
│                │    │  ~/.cache/pip        │
│                │    │  .venv/              │
└───┬────────────┘    └───────────┬──────────┘
    │                             │
    ├─────────────┬───────────────┤
    │             │               │
┌───▼──┐     ┌────▼────┐     ┌────▼──┐
│Cache │     │  Cache  │     │ Cache │
│ Hit  │     │  Miss   │     │  Hit  │
└───┬──┘     └────┬────┘     └────┬──┘
    │             │               │
    │      ┌──────▼───────┐       │
    │      │   Download   │       │
    │      │ Dependencies │       │
    │      └──────┬───────┘       │
    │             │               │
    │      ┌──────▼───────┐       │
    │      │ Save to Cache│       │
    │      └──────┬───────┘       │
    │             │               │
    └─────────────┴───────────────┘
                  │
          ┌───────▼────────┐
          │ Use Dependencies│
          └────────────────┘

Expected Speedup:
  • Cache Hit:  2-3 minutes
  • Cache Miss: 5-7 minutes
  • Speedup:    50-70%
```

---

## Artifact Generation & Storage

```
┌──────────────────────────────────────────┐
│         Test Execution                   │
└──────────────┬───────────────────────────┘
               │
    ┌──────────┴──────────┐
    │                     │
┌───▼─────────┐   ┌───────▼────────┐
│  Coverage   │   │  Test Results  │
│  Reports    │   │  (JUnit XML)   │
└───┬─────────┘   └───────┬────────┘
    │                     │
    └──────────┬──────────┘
               │
    ┌──────────▼───────────┐
    │  Upload to GitHub    │
    │  Actions Artifacts   │
    └──────────┬───────────┘
               │
    ┌──────────▼───────────┐
    │  Available for:      │
    │  • Download          │
    │  • Viewing           │
    │  • CI/CD tools       │
    │  (7 day retention)   │
    └──────────────────────┘

Artifacts per job:
  • frontend-quality     → coverage/
  • python-quality-3.10  → coverage.xml, htmlcov/, pytest-report.xml
  • python-quality-3.11  → coverage.xml, htmlcov/, pytest-report.xml
  • e2e-tests           → playwright-report/
  • performance-tests   → k6-summary.json
```

---

## Matrix Testing Visualization

```
┌──────────────────────────────────────────┐
│      Python Quality Job                  │
└──────────────┬───────────────────────────┘
               │
    ┌──────────┴──────────┐
    │                     │
┌───▼─────────────┐  ┌────▼────────────┐
│  Python 3.10    │  │  Python 3.11    │
│                 │  │                 │
│ ✓ Ruff lint     │  │ ✓ Ruff lint     │
│ ✓ Ruff format   │  │ ✓ Ruff format   │
│ ✓ MyPy strict   │  │ ✓ MyPy strict   │
│ ✓ Pytest        │  │ ✓ Pytest        │
│ ✓ Coverage      │  │ ✓ Coverage      │
│                 │  │ ✓ Coverage Gate │
└─────────────────┘  └─────────────────┘
    │                     │
    └──────────┬──────────┘
               │
    ┌──────────▼───────────┐
    │   Both Must Pass     │
    │   to Continue        │
    └──────────────────────┘

Benefits:
  ✓ Catches version-specific bugs
  ✓ Ensures compatibility
  ✓ Parallel execution
  ✓ Fail-fast: false (continues testing)
```

---

## Legend

```
┏━━━━━━━━━━━━┓  Required job (hard fail)
┃            ┃
┗━━━━━━━━━━━━┛

┌────────────┐  Optional/Warning
│            │
└────────────┘

    ▼          Flow direction

    ├──────    Split/Branch

✅ Success     Passed check
❌ Failure     Failed check
⚠️  Warning    Warning state
```

---

**Version**: 1.0
**Last Updated**: 2025-10-13
