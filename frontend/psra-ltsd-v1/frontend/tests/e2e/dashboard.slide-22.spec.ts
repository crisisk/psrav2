import { test, expect } from '@playwright/test';

const PAGE_ROUTE = '/dashboard/slide-22';
const PAGE_TITLE_TEXT = 'Dashboard Slide 22'; // Assuming a generic title based on the route

test.describe('Dashboard Slide 22 Page E2E Tests', () => {
  test('should navigate to the page and verify key elements are visible', async ({ page }) => {
    // 1. Navigation: Navigate to the correct route
    await test.step(`Navigate to ${PAGE_ROUTE}`, async () => {
      await page.goto(PAGE_ROUTE);
      // Wait for the page to load completely
      await page.waitForLoadState('networkidle');
    });

    // 2. Visibility: Assert that key elements are visible
    await test.step('Verify page title and main content visibility', async () => {
      // Check for the main heading on the page. Using a role selector for robustness.
      const mainHeading = page.getByRole('heading', { name: PAGE_TITLE_TEXT, level: 1 });
      await expect(mainHeading).toBeVisible();

      // Check for the main content area. Assuming a main element or a container with a specific test-id.
      // Using a generic 'main' role as a robust fallback for the primary content container.
      const mainContent = page.getByRole('main');
      await expect(mainContent).toBeVisible();
      
      // Optional: Check for a common application element like a navigation bar or sidebar
      const navigationBar = page.getByRole('navigation');
      // Use toHaveCount(1) to ensure a single, distinct navigation element is present, if applicable.
      // If the navigation bar is optional or not guaranteed, this check can be removed or made softer.
      await expect(navigationBar).toBeVisible();
    });

    // 3. Functionality (if applicable): Check for common dashboard elements
    await test.step('Verify common dashboard elements', async () => {
      // Dashboards often contain charts or data visualizations.
      // Check for a common element like a chart container or a card.
      // This is a placeholder and should be replaced with actual selectors if the page structure is known.
      const dashboardCard = page.getByRole('region', { name: /data summary|kpi card/i }).first();
      await expect(dashboardCard).toBeVisible();
    });
  });
});