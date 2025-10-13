# Roadmap vNext (6 weken)

| Week | Deliverable | Eigenaar | Details | Status |
|------|-------------|----------|---------|--------|
| 1 | Repository hygiëne & documentatie cleanup | Tech Lead | Verwijder legacy zip-archieven, voeg `.gitignore` uitbreidingen en `CONTRIBUTING.md` toe, creëer gestandaardiseerde `.env.example`. | ✅ Afgerond |
| 2 | Basis CI/CD en kwaliteitschecks | DevOps | Introduceer GitHub Actions met lint (ESLint), type-check (tsc), en unit tests (Jest/Vitest). Voeg pre-commit hooks toe via Husky. | 🔄 In uitvoering (workflow actief, uitbreiden met build/tests) |
| 3 | Datalaag hardening | Backend | Schrijf Prisma schema/migraties, implementeer transactionele certificate-service, voeg seed scripts en rollback handleiding toe. | ⏳ Gepland |
| 4 | Observability & AI dashboard MVP | Data/AI | Bouw Grafana-dashboard volgens `docs/observability-dashboard.md`, koppel origin-engine metrics en certificate throughput. | ⏳ Gepland |
| 5 | Security & compliance sprint | SecOps | Implementeer secret rotation (Vault/AWS Secrets Manager), schrijf DPIA-checklist, documenteer logging & retention beleid. | ⏳ Gepland |
| 6 | UX polish & user validation | Product/UX | Uitvoeren van A/B-test voor OriginCalculator-flow, toevoegen van accessibility-audits (axe), documenteer persona-feedback en release-notes. | ⏳ Gepland |

## Milestones
- **M3 (week 3)**: `main` branch protected met verplichte checks en database migraties.
- **M5 (week 5)**: Security review afgerond inclusief pen-testrapport en geüpdatete SLA's.
- **Release (week 6)**: Sign-off na UAT met bijgewerkt productdossier en trainingsmateriaal.
