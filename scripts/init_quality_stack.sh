#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: scripts/init_quality_stack.sh [--help] [--plan] [--run]

Initialises local quality tooling (pre-commit, git hooks, baseline configuration).

Options:
  --plan     Print the steps that would be executed (default).
  --run      Execute the initialisation workflow.
  --help     Show this help text.
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
[plan] The following steps will be executed when run mode is enabled:
  1. Ensure pre-commit is installed.
  2. Install repository git hooks via pre-commit.
  3. Install npm dependencies for linting/testing.
  4. Validate that mandatory configuration files (.editorconfig, .gitignore, etc.) exist.
PLAN
  exit 0
fi

command -v pre-commit >/dev/null 2>&1 || {
  echo "pre-commit is required but not installed. Install it and rerun." >&2
  exit 1
}

echo "[run] Installing pre-commit hooks..."
pre-commit install

echo "[run] Installing npm dependencies (lint/test)..."
npm install --no-audit --prefer-offline

echo "[run] Verifying baseline configuration files..."
missing_files=()
for file in .editorconfig .gitignore .gitattributes; do
  [[ -f "$file" ]] || missing_files+=("$file")
done

if [[ ${#missing_files[@]} -gt 0 ]]; then
  echo "Missing required configuration files: ${missing_files[*]}" >&2
  exit 1
fi

echo "Quality stack initialised successfully."
