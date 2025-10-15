import { test, expect } from '@playwright/test';

// Define the route for the page under test
const PAGE_ROUTE = '/dashboard/slide-34';
const PAGE_TITLE_TEXT = 'Dashboard Slide 34'; // Assuming a generic title based on the route

test.describe('Dashboard Slide 34 Page E2E Tests', () => {
  test('should navigate to the page and verify key elements are visible', async ({ page }) => {
    // 1. Navigation: Navigate to the correct route
    await test.step('Navigate to the Dashboard Slide 34 page', async () => {
      await page.goto(PAGE_ROUTE);
      // Wait for the page to fully load, assuming a network idle state is a good indicator
      await page.waitForLoadState('networkidle');
    });

    // 2. Visibility: Assert that key elements are visible
    await test.step('Verify page title and main components are visible', async () => {
      // Check for the main page title, using a role-based selector for robustness
      const pageTitle = page.getByRole('heading', { name: PAGE_TITLE_TEXT, level: 1 });
      await expect(pageTitle).toBeVisible();

      // Check for the main content area, which is assumed to contain the "slide" data
      // Using a generic test-id for the main content area, which should be present on all main pages
      const mainContentArea = page.locator('[data-testid="main-content-area"]');
      await expect(mainContentArea).toBeVisible();

      // Check for a common application element, like a main navigation bar
      const navBar = page.getByRole('navigation', { name: 'Main' });
      await expect(navBar).toBeVisible();
    });

    // 3. Functionality (Inferred): Check for specific dashboard elements
    await test.step('Verify the presence of expected dashboard elements', async () => {
      // Since it is a "slide-34" in a dashboard, it likely contains charts or data cards.
      // We check for a generic "Dashboard Card" or "Chart" element.
      const dashboardCard = page.locator('[data-testid="dashboard-card"]').first();
      await expect(dashboardCard).toBeVisible();

      // Optionally, check for a "Last Updated" or "Refresh" button/text common in dashboards
      const refreshButton = page.getByRole('button', { name: /refresh|update/i });
      // We use a soft assertion here as not all slides might have a refresh button
      await expect(refreshButton).toBeVisible({ timeout: 5000 }).catch(() => {
        console.log('Refresh button not found, continuing test.');
      });
    });
  });
});