// tests/e2e/persona-routes.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Persona Routes', () => {
  test('GET / should show "Welcome to PSRA-LTSD"', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/Welcome to PSRA-LTSD/i)).toBeVisible({ timeout: 10000 });
  });

  test('GET /dashboard should show "Compliance Manager Dashboard"', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/Compliance Manager Dashboard/i)).toBeVisible({ timeout: 10000 });
  });

  test('GET /cfo should show "CFO Dashboard"', async ({ page }) => {
    await page.goto('/cfo', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/CFO Dashboard/i)).toBeVisible({ timeout: 10000 });
  });

  test('GET /supplier should show "Supplier Portal"', async ({ page }) => {
    await page.goto('/supplier', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/Supplier Portal/i)).toBeVisible({ timeout: 10000 });
  });
});
