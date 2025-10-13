# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- Rules-as-Code v2 foundation: strict JSON Schema, validated HS39/HS40 exemplars, and automated CLI validation tooling.
- Rust-native RaC validator with auto-built Python bindings and pre-commit enforcement hooks.
- Golden pytest suite and GitHub Actions gate to block merges on RaC schema or test regressions.
- Repository governance baseline (Makefile, pre-commit, CODEOWNERS, CI workflows).
- Supply-chain security tooling (Syft SBOM, Trivy scanning, Cosign release pipeline).
- Documentation set (ARCHITECTURE.md, CONTRIBUTING.md, SECURITY.md, audit and implementation plan reports).
- Multi-stage Dockerfile and release automation scaffolding.
- Vitest-powered behavioural coverage for the advanced origin engine and PDF certificate generator.
- Certificate detail and PDF streaming endpoints with mock-aware fallbacks for offline environments.
- Invoice eligibility validator covering BOM cross-checks, WCO/PSR controls and persona-aware integration guidance.
- Canonical PSRA domain contracts (HSCode, Agreement, Rule, Evaluation payloads) backed by immutable Pydantic models.
- Postgres Data Access Layer for rule retrieval and verdict persistence with provenance capture.
- Great Expectations-backed RaC ETL pipeline and integration tests powered by Testcontainers Postgres instances.
- Deterministic origin evaluation engine producing canonical PSRA verdicts with provenance and audit-ready citations.
- Cached HMRC, TARIC en WCO connectoren met health-checks en pytest contracttests.
- Multi-LLM orchestrator router met kostenbewuste routing, consensus-judge, caching en readiness gating.
- LTSD FastAPI-microservice met `/evaluate` en `/generate` endpoints, ledger-integratie en PDF-notary streaming.
- Pytest coverage voor LTSD evaluatie-, fout- en certificaatpaden met ledgerasserties.
- Next.js LTSD addon API-routes met Zod-contracten, camel⇄snake transformatie en upstream foutpropagatie plus Vitest-regressies.
- ERP-integratieservice met canonieke inventory-contracten, Postgres outbox-tabel en pytest-gedreven saga/idempotency regressies.

### Changed
- HS code API now falls back to seeded dataset when the database and TARIC return no matches.
- `make test` now delegates to the consolidated `npm run verify` workflow (lint, typecheck, unit tests).
- RBAC utilities now guard invoice validation alongside origin calculation and certificate issuance.

### Fixed
- Ensured persona-driven workflows operate with seeded data even without a live database connection.
- PDF generation now renders rule insights, BoM snapshots, and persona context instead of placeholder strings.
