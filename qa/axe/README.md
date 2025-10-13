# Axe Accessibility Checks

## Setup
```bash
npm i -D axe-core @axe-core/playwright
```

## Usage
Run axe within Playwright using the shared onboarding spec:
```bash
AXE=true npx playwright test tests/e2e/onboarding_psra.spec.ts --project=chromium
```
Inside tests, add helper:
```ts
import { configureAxe } from '@axe-core/playwright';
const axe = await configureAxe(page, { rules: { 'color-contrast': { enabled: true } } });
const results = await axe.analyze();
expect(results.violations).toEqual([]);
```

## Reporting
- Export results to JSON using `await axe.saveResults('artifacts/axe-report.json');`
- Attach to CI as artifact and reference in CHECKLIST.
