# PSRA-LTSD Enterprise v2 — Origin Checker Dashboard

Deze repository bevat de productieklare versie van de PSRA Origin Checker frontend met geïntegreerde explainability, persona-gestuurde UAT-scenario’s en enterprise ready theming. De applicatie draait op Next.js 14 en sluit aan op de LangGraph-powered origin engine binnen deze monorepo.

## Hoogtepunten

- 🌗 **Volledige dark/light-modus** met persistente voorkeuren via de `ThemeProvider`.
- 👥 **Tien gevalideerde persona-flows** (zie [`docs/uat-persona-report.md`](docs/uat-persona-report.md)) voor gesimuleerde UAT en regressie.
- 📊 **Realtime dashboards**: HS39/HS40 statistieken, systeemstatus, explainability Sankey en KPI-gauges.
- 🧮 **Geherstructureerde Origin Calculator** met materiaalbewerkingen, guardrails en auditklare resultaten.
- 📑 **Factuur- en BOM-eligibility module** met LLM-consensus, WCO-controles en PSR-validaties per persona.
- 💬 **Feedbackloop** waarmee persona’s sentiment en verbeterpunten registreren.
- ♿ **Verbeterde toegankelijkheid**: semantische structuren, toetsenbordvriendelijke inputs, kleurcontrasten en aria-ondersteuning.

## Snelstart

```bash
npm install
npm run dev
```

De frontend start op `http://localhost:3000`. Zorg ervoor dat de API-routes in deze monorepo beschikbaar zijn (bijv. via `npm run dev` in de root of de relevante backend services).

## Belangrijke scripts

- `npm run dev` – ontwikkelserver met HMR.
- `npm run build` – productie build.
- `npm run start` – start de gecompileerde productieversie.
- `npm run lint` – voert Next.js ESLint uit.
- `npm run typecheck` – TypeScript `--noEmit` validatie.
- `npm run test` – Vitest suites.

## Architectuur & Componenten

- **`app/(site)/page.tsx`** – hoofdpagina met herontworpen hero, statistieken, calculator en zijpaneel.
- **`components/providers/theme-provider.tsx`** – lightweight theming met `data-theme` toggling en `localStorage` persistence.
- **`components/dashboard/OriginCalculator.tsx`** – nieuwe calculator met materiaalbeheer, persona-inzichten en explainability output.
- **`components/tables/DataTable.tsx`** – gestileerde certificaattabel met automatische refresh en skeleton states.
- **`components/dashboard/SystemStatus.tsx`** – realtime health snapshots voor database, cache, queues en notificaties.
- **`components/dashboard/FeedbackPanel.tsx` & `UserJourneys.tsx`** – persona feedback & journey samenvattingen.
- **`docs/uat-persona-report.md`** – overzicht van de tien UAT-persona’s inclusief resultaten.

## Factuur & BOM eligibility

- **Validator UI** – `components/invoices/InvoiceValidator.tsx` levert een toegankelijk formulier voor factuur/BOM uploads met CSV-parser die komma- en puntkomma gescheiden exports ondersteunt en inline foutmeldingen toont.
- **Validatorlogica** – `lib/invoice-validator.ts` koppelt BOM-regels aan de referentielijst (`data/reference/bom-checklist.ts`) en voert controles uit op LLM-consensus, WCO-bronnen, PSR-drempels, handelsafspraken, rulings en de-minimis-waarden. De output bevat eligibility, confidence en rationale.
- **API-route** – `POST /api/invoices/validate` valideert invoer met Zod, beschermt via RBAC (`supplier:upload`, `origin:write`, `compliance:manager`) en retourneert de volledige validatierespons.
- **Integraties** – `lib/integrations/external-connectors.ts` beschrijft endpoints voor CSV, XLSX, PDF/OCR en ERP-webhooks zodat koppelingen met SAP, Exact, AFAS, Dynamics en NetSuite voorbereid zijn.
- **Persona integratie** – de validator is opgenomen in supplier onboarding (`app/onboarding/import/page.tsx`) en in het persona-paneel van de Origin Calculator om suppliers, analysts en compliance-managers direct eligibility feedback te geven.

## Testing & Validatie

1. **Functioneel** – elke persona uit `data/persona-scenarios.ts` laadt automatisch de juiste gegevens in de calculator.
2. **Explainability** – klik in de certificaattabel om de Sankey-trace te laden; invalid responses tonen mensvriendelijke fouten.
3. **Theming** – schakel tussen licht/donker via de toggle; CSS-variabelen zorgen voor consistente kleuren.
4. **UAT-simulatie** – feedbackformulier registreert persona-sentiment; resultaten worden beschreven in [`docs/uat-persona-report.md`](docs/uat-persona-report.md).

## Verdere stappen

- Integratie met notificatieservice voor automatische verspreiding van persona-feedback.
- Uitbreiding van HS-code hints en inline documentatie voor APAC persona’s.
- Opzetten van end-to-end tests (bijv. Playwright) voor regressie op calculator en tabelinteractie.

Voor aanvullende implementatieplannen, zie de roadmap documenten in `/docs` en de strategische plannen in de root van de repo.

## Dependency-rapportage master-README

De README van de masterbranch beschreef enkel de frontend-quickstart. Voor volledige werking zijn daarnaast de volgende afhankelijke pakketten vereist:

### Frontend (Next.js) afhankelijkheden

- `next@14.2.5`, `react@18.3.1` en `react-dom@18.3.1` voor de applicatiebasis.
- Data- en visualisatiebibliotheken zoals `echarts@5.5.1`, `echarts-for-react@3.0.2` en `@tanstack/react-table@8.20.5`.
- Integraties met backend services via `pg@^8.11.3`, `ioredis@^5.8.0`, `bull@^4.16.5` en `bullmq@^5.58.9`.
- Documentgeneratie en validatie via `jspdf@^3.0.3`, `csv-parser@^3.2.0` en `zod@3.23.8`.

### Origin Engine (Python) afhankelijkheden

- API- en workflowstack: `fastapi`, `langgraph`, `langchain`, `langchain-openai`, `uvicorn` en `pydantic`.
- Datalaag: `sqlalchemy`, `alembic`, `psycopg2-binary`, `asyncpg` en `redis`.
- Gezondheids- en integratiemonitoring: `aiohttp`, `psutil`, `httpx`, `tenacity` en `python-dotenv`.

### Test- en kwaliteits tooling

- Frontend: `vitest`, `@vitest/coverage-v8` en `@vitest/ui`.
- Backend: `pytest`, `pytest-asyncio`, `pytest-cov`, plus linting tools (`black`, `isort`, `mypy`, `ruff`).

Deze inventarisatie maakt de afhankelijkheden expliciet zodat ontwikkelaars alle noodzakelijke componenten kunnen installeren.

