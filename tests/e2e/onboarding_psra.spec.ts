// tests/e2e/onboarding_psra.spec.ts
import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

test.describe('PSRA-LTSD Onboarding', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup');
    await page.getByLabel('Work email').fill(process.env.TEST_EMAIL ?? 'finance@example.com');
    await page.getByLabel('Password').fill(process.env.TEST_PASSWORD ?? 'P@ssw0rd123');
    await page.getByRole('button', { name: /create account/i }).click();
    if (process.env.TEST_VERIFY_URL) {
      await page.goto(process.env.TEST_VERIFY_URL);
    }
    await expect(page.getByText(/organization name/i)).toBeVisible();
    await page.getByLabel(/organization name/i).fill('Witcom Pilot');
    await page.getByRole('button', { name: /continue/i }).click();
  });

  test('Compliance Manager → first LTSD in <10 minutes', async ({ page }) => {
    await test.step('Org setup & persona', async () => {
      await page.getByText('Compliance Manager').click();
      await page.getByRole('button', { name: /continue/i }).click();
      await page.getByLabel('Persona-scenario').selectOption({ label: 'Malik Harrison' });
    });

    await journeyToCertificate(page, {
      uploadEvidence: true,
      hsCode: '850440',
      personaOption: 'Malik Harrison',
    });

    await test.step('Verify audit trail visibility', async () => {
      await expect(page.getByText(/audit trail/i)).toBeVisible();
    });
  });

  test('CFO → ROI visibility during onboarding', async ({ page }) => {
    await page.getByText(/finance/i).click();
    await page.getByRole('button', { name: /continue/i }).click();

    await journeyToCertificate(page, {
      hsCode: '730890',
      personaOption: 'Diego Martínez',
    });

    await test.step('Finance summary present', async () => {
      await expect(page.getByText(/savings|roi/i)).toBeVisible({ timeout: 10000 });
    });
  });

  test('Analyst → explainability hand-off', async ({ page }) => {
    await page.getByText(/analyst|operator/i).click();
    await page.getByRole('button', { name: /continue/i }).click();

    await journeyToCertificate(page, {
      hsCode: '390110',
      personaOption: 'Ingrid Bauer',
    });

    await test.step('Explainability Sankey visible', async () => {
      await expect(page.getByTestId('explainability-sankey')).toBeVisible();
    });
  });

  test('Auditor → sampling ready certificate', async ({ page }) => {
    await page.getByText(/auditor/i).click();
    await page.getByRole('button', { name: /continue/i }).click();

    await journeyToCertificate(page, {
      hsCode: '482110',
      personaOption: 'Gabriel Ndlovu',
    });

    await test.step('Sampling checklist available', async () => {
      await expect(page.getByText(/sampling queue|signature status/i)).toBeVisible();
    });
  });

  test('Supplier → document upload and confirmation', async ({ page }) => {
    await page.getByText(/supplier/i).click();
    await page.getByRole('button', { name: /continue/i }).click();

    await test.step('Upload minimal HS dataset', async () => {
      await page.goto('/onboarding/import');
      await page.setInputFiles('input[type=file]', 'fixtures/hs39_40_minimal.csv');
      await page.getByRole('button', { name: /import/i }).click();
      await expect(page.getByText(/import successful/i)).toBeVisible();
    });

    await test.step('Confirm SLA timer present', async () => {
      await expect(page.getByText(/sla/i)).toBeVisible();
    });
  });

  test('System Admin → health & metrics verified', async ({ page }) => {
    await page.getByText(/system admin/i).click();
    await page.getByRole('button', { name: /continue/i }).click();

    await page.goto('/dashboard');
    await expect(page.getByText(/platform health/i)).toBeVisible();
    await expect(page.getByText(/redis/i)).toBeVisible();
    await expect(page.getByText(/uptime|sla/i)).toBeVisible();
  });
});

async function journeyToCertificate(
  page: Page,
  options: { personaOption: string; hsCode: string; uploadEvidence?: boolean }
) {
  await test.step('Select persona scenario', async () => {
    await page.goto('/dashboard');
    await page.getByLabel('Persona-scenario').selectOption({ label: options.personaOption });
  });

  await test.step('Run origin calculation', async () => {
    await page.getByLabel('HS-code').fill(options.hsCode);
    await page.getByRole('button', { name: /bereken|determine|calculate/i }).click();
    await expect(page.getByText(/certificaat|certificate/i)).toBeVisible();
  });

  if (options.uploadEvidence) {
    await test.step('Attach calibration logs', async () => {
      await page.getByRole('button', { name: /upload evidence|add document/i }).click();
      await page.setInputFiles('input[type=file]', 'fixtures/calibration_log.pdf');
      await expect(page.getByText(/evidence uploaded/i)).toBeVisible();
    });
  }

  await test.step('Generate LTSD', async () => {
    await page.getByRole('button', { name: /generate ltst|ltsd|certificate/i }).click();
    await expect(page.getByText(/certificate ready|preview/i)).toBeVisible();
    await page.getByRole('button', { name: /export pdf/i }).click();
  });
}
