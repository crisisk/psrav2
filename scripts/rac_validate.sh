#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: scripts/rac_validate.sh [--help] [--plan] [--run]

Validates Rules-as-Code assets using the JSON Schema and golden test suite.

Options:
  --plan     Display the validation steps (default).
  --run      Execute the validation suite.
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
[plan] Validation workflow:
  1. Run JSON Schema validation for /psr/rules/**/*.yaml.
  2. Execute the golden pytest suite under tests/golden/.
PLAN
  exit 0
fi

if [[ ! -d tests/golden ]]; then
  echo "tests/golden suite not present yet; skipping execution." >&2
  exit 0
fi

command -v pytest >/dev/null 2>&1 || {
  echo "pytest is required for running golden tests." >&2
  exit 1
}

if [[ -f psr/loader/psr_loader.py ]]; then
  echo "[run] Running schema validation via psr_loader..."
  python -m psr.loader.psr_loader --schema psr/schema/psr_rule.schema.v2.json --rules-dir psr/rules
else
  echo "psr/loader/psr_loader.py not found; skipping schema validation." >&2
fi

echo "[run] Executing golden tests..."
pytest tests/golden
