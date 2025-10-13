#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: scripts/test_integration.sh [--help] [--plan] [--run]

Runs integration test suites (Python markers and Playwright API tests).

Options:
  --plan     Show the execution strategy (default).
  --run      Execute integration tests.
  --help     Show this message.
USAGE
}

mode="plan"
while [[ "${1:-}" != "" ]]; do
  case "$1" in
    --help|-h)
      usage
      exit 0
      ;;
    --run)
      mode="run"
      ;;
    --plan|--dry-run)
      mode="plan"
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
  shift
done

if [[ "$mode" == "plan" ]]; then
  cat <<'PLAN'
[plan] Integration workflow:
  - python -m pytest -m integration
  - npx playwright test tests/e2e --config=tests/playwright.config.ts --project=api
PLAN
  exit 0
fi

status=0
if command -v python >/dev/null 2>&1 && [[ -f pytest.ini ]]; then
  echo "[run] Running Python integration tests..."
  python -m pytest -m integration || status=$?
else
  echo "[run] No Python integration tests configured; skipping." >&2
fi

if [[ -d tests/e2e ]]; then
  echo "[run] Running Playwright API integration tests..."
  npx playwright test tests/e2e --config=tests/playwright.config.ts --project=api || status=$?
else
  echo "[run] tests/e2e directory not found; skipping Playwright integration tests." >&2
fi

exit $status
