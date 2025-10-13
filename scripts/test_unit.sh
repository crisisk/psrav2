#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: scripts/test_unit.sh [--help] [--plan] [--run]

Runs unit test suites across Python and TypeScript packages.

Options:
  --plan     Show the commands that will run (default).
  --run      Execute the unit tests.
  --help     Display this help text.
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
[plan] Unit testing workflow:
  - python -m pytest --maxfail=1 --disable-warnings
  - npm run test -- --runInBand
PLAN
  exit 0
fi

status=0
if command -v python >/dev/null 2>&1 && [[ -f pytest.ini || -d tests ]]; then
  echo "[run] Executing Python unit tests..."
  python -m pytest --maxfail=1 --disable-warnings || status=$?
else
  echo "[run] No Python unit test suite detected; skipping." >&2
fi

echo "[run] Executing TypeScript unit tests..."
npm run test -- --runInBand || status=$?

exit $status
