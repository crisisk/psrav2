#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: scripts/build_release_bundle.sh [--help] [--plan] [--run] [--output <dir>]

Creates a release bundle containing build artifacts, SBOM, and changelog excerpts.

Options:
  --plan             Describe the workflow (default).
  --run              Execute the bundle generation.
  --output <dir>     Destination directory (default: dist/release-bundle).
  --help             Show this help text.
USAGE
}

mode="plan"
output_dir="dist/release-bundle"

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
    --output)
      shift
      output_dir="${1:-}"
      if [[ -z "$output_dir" ]]; then
        echo "Output directory cannot be empty." >&2
        exit 1
      fi
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
  cat <<PLAN
[plan] Release bundle workflow:
  - npm run build
  - Generate SBOM via syft (if available).
  - Collect CHANGELOG.md, RUNBOOK.md, docs/EXEC_PLAN.md into the bundle.
  - Archive results to $output_dir
PLAN
  exit 0
fi

mkdir -p "$output_dir"

if command -v npm >/dev/null 2>&1; then
  echo "[run] Building Next.js application..."
  npm run build
else
  echo "npm not found; skipping frontend build." >&2
fi

if command -v syft >/dev/null 2>&1; then
  echo "[run] Generating SBOM with syft..."
  syft . -o json >"$output_dir/sbom.json"
else
  echo "syft not installed; SBOM not generated." >&2
fi

for file in CHANGELOG.md RUNBOOK.md docs/EXEC_PLAN.md; do
  if [[ -f "$file" ]]; then
    cp "$file" "$output_dir/"
  fi
done

bundle_archive="${output_dir}.tgz"
tar czf "$bundle_archive" -C "$(dirname "$output_dir")" "$(basename "$output_dir")"

echo "Release bundle created at $bundle_archive"
