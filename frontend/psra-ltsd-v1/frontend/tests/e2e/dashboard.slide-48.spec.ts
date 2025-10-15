import { test, expect } from '@playwright/test';

const PAGE_ROUTE = '/dashboard/slide-48';
const PAGE_TITLE_TEXT = 'Slide 48'; // Assuming the title is derived from the route segment

test.describe('Dashboard Slide 48 Page', () => {
  test('should navigate to the page and display key elements', async ({ page }) => {
    // 1. Navigation
    await test.step('Navigate to the Dashboard Slide 48 page', async () => {
      await page.goto(PAGE_ROUTE);
      // Wait for the page to load completely
      await page.waitForLoadState('networkidle');
    });

    // 2. Visibility and Content Assertion
    await test.step('Verify page title and main content visibility', async () => {
      // Assert the page title is correct (using a common Playwright selector for a main heading)
      const pageTitle = page.getByRole('heading', { name: PAGE_TITLE_TEXT, level: 1 });
      await expect(pageTitle).toBeVisible();

      // Assert the main content area is visible (assuming a main element or a specific data-testid)
      const mainContent = page.locator('main');
      await expect(mainContent).toBeVisible();

      // Assert for the presence of a key visual component, typical for a slide/dashboard
      // Using a generic selector for a chart or panel, which is common in dashboards
      const dashboardPanel = page.getByRole('region', { name: /dashboard|slide content|report/i }).or(page.locator('[data-testid="slide-content"]'));
      await expect(dashboardPanel).toBeVisible();
    });

    // 3. Robustness: Check for a common application element like a navigation bar
    await test.step('Verify application navigation elements are present', async () => {
      const navBar = page.getByRole('navigation');
      await expect(navBar).toBeVisible();
    });
  });
});