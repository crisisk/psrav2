# Architecture Overview

## System Context

PSRA-LTSD Enterprise v2 is a Next.js 14 application that exposes dashboards, persona-driven origin calculations, and supporting APIs. The stack aligns with 12-Factor principles: configuration via environment variables, stateless route handlers, and ephemeral storage.

## Components

### Frontend
- React server components under `app/` and client components in `components/`.
- TailwindCSS for styling; charts rendered via `echarts-for-react`.
- Persona harness defined in `data/persona-scenarios.ts` and consumed by `OriginCalculator`.

### APIs
- Route handlers under `app/api/**` implement RESTful endpoints.
- Zod validation ensures payload integrity (e.g. `/api/certificates`).
- TARIC integration lives in `lib/taric-client.ts` with caching and graceful fallbacks.
- Certificate download endpoints (`/api/certificates/[id]` + `/api/certificates/[id]/pdf`) surface structured data and PDF artefacts via `lib/pdf-generator.ts`.

### Data Layer
- `lib/db.ts` wraps the PostgreSQL connection pool.
- `lib/repository.ts` provides higher-level persistence functions with mock fallbacks.
- Prisma models defined in `prisma/schema.prisma`; `prisma/seed.ts` hydrates HS codes, agreements, origin rules, and certificates.

### Supporting Services
- Mock data module under `lib/mock-data.ts` for offline/demo scenarios.
- `lib/config.ts` normalises environment-based feature flags so Redis queues, audit logging, and SMTP alerts can be toggled per deployment.
- Optional background infrastructure (`lib/task-queue.ts`, `lib/notification-service.ts`, `lib/audit-service.ts`) automatically fall back to in-memory execution when Redis, PostgreSQL, or SMTP providers are unavailable.

## Deployment Pipeline

1. `make build` generates a production build.
2. Docker image built from `Dockerfile` (multi-stage, non-root runtime).
3. CI pipeline (`ci/ci.yml`) runs lint, typecheck, build, SBOM, Trivy, and CodeQL.
4. Release workflow (`ci/release.yml`) publishes signed container images and attaches SBOM artifacts to GitHub Releases.

## Data Flows

- **HS Codes**: `/api/hs-codes` queries PostgreSQL, falls back to TARIC, then to seeded JSON.
- **Origin Calculation**: `OriginCalculator` submits to `/api/origin/calculate`, which leverages `AdvancedOriginEngine` to evaluate applicable rules.
- **Certificates**: `/api/certificates` supports GET/POST, persisting via `lib/repository.ts` and mirrored into mock storage when the database is unavailable. `/api/certificates/[id]` exposes detail views and `/api/certificates/[id]/pdf` streams generated PDF certificates for downstream auditors.
- **Analytics**: `/api/analytics` aggregates certificate metrics; when DB access fails it reuses mock data for parity.

## Observability

- `/api/health` surfaces dependency health (database, Redis, queues, notifications) to the dashboard System Status widget.
- `lib/audit-service.ts` records audit/security events to PostgreSQL when enabled, or to an in-memory circular buffer in offline environments.
- Dashboard cards poll the APIs to provide live indicators.

## Security Considerations

- Input validation via Zod and TypeScript typing.
- Parameterised SQL queries to mitigate injection.
- TARIC requests performed over HTTPS with caching to reduce load.
- Pre-commit hooks and Vitest coverage enforce lint/typecheck/unit tests before merge.
