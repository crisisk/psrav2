# Usability & Accessibility Audit (WCAG 2.2 AA)

## Findings & Fixes
1. **Focus management after calculations** – After `handleCalculate`, focus remains on the "Bereken" button; screen-reader users do not discover the status message or new result. Implement `focus()` on the result heading or use `aria-live` region update tied to `statusMessage` and `error` states.【F:components/dashboard/OriginCalculator.tsx†L221-L314】
2. **Button/Link contrast in tables** – `DataTable` renders action buttons with text-only styles (`className="text-sm font-semibold text-red-500"`) that may fail contrast on dark mode. Apply utility classes (e.g., `text-red-600 dark:text-red-300` plus underline on focus) and ensure `button` receives `aria-label` when only color differentiates action.【F:components/tables/DataTable.tsx†L100-L129】
3. **Polling feedback** – Dashboard stats and system status use skeleton loaders but do not expose live region updates for refreshed counts, reducing accessibility for CFO/compliance personas tracking KPI deltas. Wrap metric tiles in `role="status" aria-live="polite"` or provide offscreen update text.【F:components/dashboard/DashboardStats.tsx†L24-L104】【F:components/dashboard/SystemStatus.tsx†L77-L118】
4. **Form field grouping** – Persona selector and BoM inputs lack `fieldset`/`legend`, making it harder for assistive tech to understand grouping. Wrap related inputs (persona select, HS code, product info) in fieldsets with descriptive legends referencing persona objectives to satisfy WCAG 1.3.1.【F:components/dashboard/OriginCalculator.tsx†L155-L239】
5. **Keyboard shortcuts for table refresh** – Certificates table auto-refreshes but lacks manual refresh or skip-to-latest control; add keyboard-activated control or announce refresh schedule to support operators with screen readers.【F:components/tables/DataTable.tsx†L45-L126】
6. **Theme toggle semantics** – `ThemeToggle` control should expose `aria-pressed` or `role="switch"` with state to satisfy WCAG 4.1.2, ensuring system admins and auditors can confirm mode changes.【F:app/(site)/page.tsx†L21-L40】

## Recommended Fix Plan
- Add reusable `LiveRegion` component for status updates and integrate with calculator, stats, and health widgets.
- Standardise action buttons with Tailwind utility tokens ensuring ≥ 4.5:1 contrast in both themes.
- Introduce persona-aware legends and helper text for forms, referencing scenario objectives for clarity.
