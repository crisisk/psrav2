#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: scripts/etl_rules_with_validation.sh [--help] [--plan] [--run]

Runs the Rules-as-Code ETL pipeline with Great Expectations validation.

Options:
  --plan     Describe the execution steps without running them (default).
  --run      Execute the ETL pipeline if available.
  --help     Show this help message.
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
[plan] The ETL pipeline will perform the following when run mode is enabled:
  1. Verify that backend/app/etl/ingest_rules.py exists.
  2. Execute the ingestion script in validation mode.
  3. Emit validation results and exit non-zero if any checks fail.
PLAN
  exit 0
fi

if [[ ! -f backend/app/etl/ingest_rules.py ]]; then
  echo "backend/app/etl/ingest_rules.py is not present yet. Skipping ETL run." >&2
  exit 0
fi

command -v python >/dev/null 2>&1 || {
  echo "Python interpreter is required for running the ETL." >&2
  exit 1
}

echo "[run] Executing Rules-as-Code ETL with validation..."
python backend/app/etl/ingest_rules.py --validate
