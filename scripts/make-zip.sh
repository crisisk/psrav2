#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
ARTIFACT_DIR="$ROOT_DIR/dist"
ARCHIVE_NAME="psra-ltsd-enterprise-v2_$(date +%Y%m%d%H%M%S).tar.gz"

rm -rf "$ARTIFACT_DIR"
mkdir -p "$ARTIFACT_DIR"

npm run build

tar -C "$ROOT_DIR" -czf "$ARTIFACT_DIR/$ARCHIVE_NAME" .next package.json package-lock.json public

echo "Created artifact at $ARTIFACT_DIR/$ARCHIVE_NAME"
