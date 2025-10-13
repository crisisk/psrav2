#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: scripts/test_load_smoke.sh [--help] [--plan] [--run]

Executes the k6 smoke test scenario defined in ops/loadtest/k6_smoke.js.

Options:
  --plan     Describe the execution steps (default).
  --run      Execute the k6 smoke test.
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
[plan] k6 smoke test workflow:
  - Ensure k6 is installed.
  - Run k6 run ops/loadtest/k6_smoke.js with environment variables for base URL and thresholds.
PLAN
  exit 0
fi

if [[ ! -f ops/loadtest/k6_smoke.js ]]; then
  echo "ops/loadtest/k6_smoke.js not found; skipping load smoke test." >&2
  exit 0
fi

command -v k6 >/dev/null 2>&1 || {
  echo "k6 is required for load smoke testing. Install it first." >&2
  exit 1
}

echo "[run] Executing k6 smoke test..."
k6 run ops/loadtest/k6_smoke.js
