# ASVS Level 2 Checklist (PSRA-LTSD)

| Control | Description | Status | Owner |
| --- | --- | --- | --- |
| V1 | Architecture, design & threat modelling documented in `ARCHITECTURE.md` | In Progress | @psra-security |
| V2 | Authentication & session management validated via NextAuth penetration checklist | Pending | @psra-security |
| V3 | Access control for persona data enforced server-side | In Progress | @psra-compliance-arch |
| V4 | Input validation with Zod on all API handlers | In Progress | @psra-appsec |
| V5 | Cryptographic controls delegated to infrastructure (TLS 1.2+) | Configured | @psra-platform |
| V6 | Stored data classification: HS codes, origin rules, certificates | Complete | @psra-data |
| V7 | Error handling avoids sensitive info leakage | In Progress | @psra-appsec |
| V8 | Logging instrumentation centralised (audit-service) | Pending | @psra-observability |
| V9 | Data protection (PII minimised; encryption at rest) | Pending | @psra-platform |
| V10 | Communications security (TARIC integration via HTTPS) | Complete | @psra-network |
| V11 | Business logic validated by persona regression harness | In Progress | @psra-quality |
| V12 | File & resource security (PDF generation sandboxed) | Pending | @psra-security |
| V13 | API security (rate limiting middleware) | Pending | @psra-platform |
| V14 | Configuration hardening (12-factor envs) | In Progress | @psra-build-engineering |
| V15 | Validation & sanitisation (Zod + parameterised queries) | In Progress | @psra-appsec |
| V16 | Mobile/responsive coverage (Tailwind responsive utilities) | Complete | @psra-ux |
| V17 | Security tests automated in CI (Trivy, CodeQL) | Planned | @psra-build-engineering |
| V18 | DevSecOps metrics tracked (scan pass rate) | Planned | @psra-security |
