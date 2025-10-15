import { test, expect } from '@playwright/test';

const PAGE_ROUTE = '/dashboard/slide-46';
const PAGE_TITLE_TEXT = 'Slide 46'; // Assuming a title based on the route segment

test.describe('Dashboard - Slide 46 Page', () => {
  test('should navigate to the page and display the main content', async ({ page }) => {
    // 1. Navigation
    await test.step('Navigate to the Slide 46 dashboard page', async () => {
      await page.goto(PAGE_ROUTE);
      // Wait for the page to load completely
      await page.waitForLoadState('networkidle');
    });

    // 2. Visibility & Content Check
    await test.step('Verify key elements are visible', async () => {
      // Check for the main page container or a robust element that signifies the page is loaded
      const mainContent = page.locator('main').or(page.getByRole('main'));
      await expect(mainContent).toBeVisible();

      // Check for a common page header or title element
      // Using a generic role-based selector for a heading (h1, h2, etc.)
      const pageTitle = page.getByRole('heading', { name: PAGE_TITLE_TEXT, exact: true });
      await expect(pageTitle).toBeVisible();
      
      // Assuming a standard SaaS application structure, check for the main navigation/sidebar
      const navigationBar = page.getByRole('navigation');
      await expect(navigationBar).toBeVisible();
    });

    // 3. Functionality (Basic Check for a Dashboard Slide)
    await test.step('Verify the page structure is a dashboard slide', async () => {
      // Check for a common dashboard element, like a panel or card
      // This is a generic check, a more specific test-id would be better if available
      const dashboardPanel = page.getByRole('region').or(page.locator('.dashboard-panel'));
      // We expect at least one main content panel to be present
      await expect(dashboardPanel.first()).toBeVisible();
    });
  });
});