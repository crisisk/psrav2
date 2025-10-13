#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: scripts/observability_apply.sh [--help] [--plan] [--run]

Applies Prometheus and Grafana configuration for local environments.

Options:
  --plan     Show the planned actions (default).
  --run      Apply observability assets.
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
[plan] Observability apply workflow:
  - Validate YAML syntax for Prometheus and Grafana manifests under ops/observability/.
  - Optionally apply them to the current Kubernetes context.
PLAN
  exit 0
fi

if [[ ! -d ops/observability ]]; then
  echo "ops/observability directory not found; nothing to apply." >&2
  exit 0
fi

if ! command -v kubectl >/dev/null 2>&1; then
  echo "kubectl not detected; printing manifests instead." >&2
  find ops/observability -type f -print
  exit 0
fi

echo "[run] Applying observability manifests to the active Kubernetes context..."
for manifest in ops/observability/**/*.{yml,yaml,json}; do
  [[ -e "$manifest" ]] || continue
  kubectl apply -f "$manifest"
done
