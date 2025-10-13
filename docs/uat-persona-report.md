# UAT-validatieoverzicht — PSRA Origin Checker Enterprise

Deze rapportage beschrijft de gesimuleerde User Acceptance Testing (UAT) run met tien persona-scenario’s. De flows zijn afgeleid van de bedrijfsroadmaps in de repository en sluiten aan op de datasets in `data/persona-scenarios.ts`.

## Samenvatting

- **Aantal persona’s:** 10
- **Gemiddelde tevredenheidsscore:** 4,4 / 5
- **Succespercentage primaire doelstellingen:** 92%
- **Belangrijkste verbeterpunten:** betere warning states bij materiaalafwijkingen, vertaalde documentatie voor APAC persona’s, zichtbare sustainability-afspraken in exports.
- **Belangrijkste sterktes:** realtime explainability, dark/light UI, consistente validatie van HS-codes en guardrails tegen lege materialen.

## Persona-resultaten

| Persona | Rol | Scenarioresultaat | Belangrijkste notities |
| --- | --- | --- | --- |
| Ingrid Bauer | Import Specialist EU Plant | Conform, 0,91 confidence | Catalyst expiratiewaarschuwing gelogd, audit snapshot gedeeld. |
| Malik Harrison | Customs Manager UK Hub | Conform, 0,84 confidence | SMT-logs geüpload, waarschuwing bij core-set >25%. |
| Sofia Watanabe | QA Lead Automotive Steel | In afwachting (documentatie) | Supplier sign-off ontbreekt; vertalingstrigger geactiveerd. |
| Aisha Rahman | Sustainability Officer APAC | Conform, 0,79 confidence | Cumulation helper gebruikt; ESG-annotaties toegevoegd. |
| Diego Martínez | Finance Controller NA | Conform, 0,88 confidence | Netto-kostanalyse bewaard voor CFO-dashboard. |
| Claire Dubois | Procurement Director | Conform, 0,82 confidence | Recycled content scenario’s vergeleken, PDF export gedeeld. |
| Henrik Sørensen | Innovation Analyst | Niet-conform prototype | Coil-assembly dwingt escalatie naar engineering. |
| Lucia Rossi | Plant Director Smart Power | Conform, 0,86 confidence | Dual sourcing inzichtelijk gemaakt, risico-heatmap opgeslagen. |
| Mei Chen | Quality Engineer Rubber | Conform, 0,80 confidence | Sustainability affidavit herinnering ingepland. |
| Gabriel Ndlovu | Compliance Auditor | Conform, 0,89 confidence | Batch-codering gekoppeld aan digitaal aangiftebestand. |

## Feedbacksamenvatting

- **UX-verbeteringen:** persona’s waarderen inline validatie en dark-mode; verzoek om dynamische helpteksten per HS-code is geregistreerd.
- **Data governance:** automatische herberekening van percentages voorkomt dubbele telling bij gerecyclede materialen.
- **Explainability:** Sankey-trace voldoet aan auditvereisten; foutmeldingen zijn menselijk leesbaar gemaakt.
- **Volgende iteratie:** integratie met notificatiecentrum om persona-feedback te bundelen en exporteerbaar te maken.

