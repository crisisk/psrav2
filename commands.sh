#!/usr/bin/env bash
set -euo pipefail

# Install dependencies
make setup

# Static analysis and tests
make test

# Build production bundle
make build

# Generate SBOM and run vulnerability scan
make sbom
make scan

# Build docker image (optional)
make docker-build
