import { test, expect } from '@playwright/test';

const HUMAN_OVERSIGHT_ROUTE = '/compliance/ai-act/human_oversight';

test.describe('AI Act Human Oversight Compliance Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the Human Oversight compliance page
    await page.goto(HUMAN_OVERSIGHT_ROUTE);
  });

  test('should navigate to the page and display the main heading', async ({ page }) => {
    // 1. Assert successful navigation and page title
    await expect(page).toHaveURL(HUMAN_OVERSIGHT_ROUTE);
    await expect(page).toHaveTitle(/Human Oversight/); // Assuming the page title contains "Human Oversight"

    // 2. Assert that the main heading is visible, using a role-based selector
    const mainHeading = page.getByRole('heading', { name: /Human Oversight/i, level: 1 });
    await expect(mainHeading).toBeVisible();

    // 3. Assert the presence of a main content area (e.g., a dashboard or configuration form)
    // This is a generic check for the main container of the page content.
    const mainContentArea = page.getByRole('main');
    await expect(mainContentArea).toBeVisible();

    // 4. Assert the presence of a common application navigation element (e.g., a sidebar or header link)
    const complianceNav = page.getByRole('link', { name: /Compliance/i });
    await expect(complianceNav).toBeVisible();
  });

  test('should display a section related to AI Act compliance details', async ({ page }) => {
    // Since this is a compliance page, it should contain instructional or configuration text.
    // Check for a common element like a paragraph or a section with a specific role.
    const complianceSection = page.getByRole('region', { name: /AI Act Compliance/i }).or(page.getByText(/AI Act/i).first());
    await expect(complianceSection).toBeVisible();
  });

  // Additional test case for a common feature on a compliance/configuration page: a save/submit button
  test('should display a configuration or action button', async ({ page }) => {
    // Check for a primary action button, like "Save Configuration" or "Submit Report"
    const actionButton = page.getByRole('button', { name: /Save|Submit|Configure/i }).first();
    // We only assert its presence, not its enabled state, as it might be disabled initially.
    await expect(actionButton).toBeVisible();
  });
});