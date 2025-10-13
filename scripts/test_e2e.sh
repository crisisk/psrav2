#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: scripts/test_e2e.sh [--help] [--plan] [--run]

Executes browser end-to-end tests with Playwright.

Options:
  --plan     Describe the steps (default).
  --run      Execute Playwright tests.
  --help     Display this help message.
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
[plan] Playwright E2E workflow:
  - Install Playwright browsers if not already present.
  - Run npx playwright test --config=tests/playwright.config.ts --project=chromium
PLAN
  exit 0
fi

if [[ ! -f tests/playwright.config.ts ]]; then
  echo "tests/playwright.config.ts not found; cannot run E2E tests." >&2
  exit 0
fi

if [[ "${PLAYWRIGHT_BROWSERS_PATH:-}" == "" ]]; then
  echo "[run] Installing Playwright browsers..."
  npx playwright install --with-deps || {
    echo "Failed to install Playwright browsers." >&2
    exit 1
  }
fi

echo "[run] Executing Playwright E2E tests..."
npx playwright test --config=tests/playwright.config.ts --project=chromium
