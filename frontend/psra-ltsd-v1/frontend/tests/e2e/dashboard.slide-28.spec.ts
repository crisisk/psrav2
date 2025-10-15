import { test, expect } from '@playwright/test';

test.describe('Dashboard Slide 28 Page E2E Tests', () => {
  const route = '/dashboard/slide-28';

  test('should navigate to the page and display key dashboard elements', async ({ page }) => {
    // 1. Navigation: Navigate to the correct route
    await test.step('Navigate to the Dashboard Slide 28 page', async () => {
      await page.goto(route);
      // Wait for the network to be idle and the page to be fully loaded
      await page.waitForLoadState('networkidle');
    });

    // 2. Visibility: Assert that key elements are visible.
    await test.step('Verify page title and main content visibility', async () => {
      // Check for a main heading, which often serves as the page title.
      // Using a role-based selector for robustness.
      const pageTitle = page.getByRole('heading', { name: /Slide 28/i, level: 1 });
      await expect(pageTitle).toBeVisible();
      
      // Check for the main content area of the dashboard.
      // Assuming the main content is contained within a <main> element or a div with a specific role/test-id.
      // Using a generic 'main' role as a robust fallback for the primary content container.
      const mainContent = page.getByRole('main');
      await expect(mainContent).toBeVisible();

      // Check for a common application element like a navigation bar or sidebar
      const navBar = page.getByRole('navigation');
      await expect(navBar).toBeVisible();
    });

    // 3. Functionality (Inferred for a dashboard/detail page): Check for specific data display.
    await test.step('Verify presence of expected dashboard components (e.g., charts or metrics)', async () => {
      // Since this is a "slide" on a dashboard, it likely contains a primary visualization or metric.
      // Check for a common element like a chart container or a metric card.
      // Using a test-id is preferred, but in its absence, we check for a generic 'region' or 'figure'.
      const dashboardWidget = page.getByRole('region').or(page.getByRole('figure'));
      // Expect at least one primary dashboard component to be present.
      await expect(dashboardWidget.first()).toBeVisible();
    });
  });
});