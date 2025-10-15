import { test, expect } from '@playwright/test';

// Define the route for the page under test
const PAGE_ROUTE = '/dashboard/slide-44';
const PAGE_TITLE_TEXT = 'Dashboard Slide 44'; // Assuming a title based on the route

test.describe('Dashboard Slide 44 Page E2E Tests', () => {
  test('should load the page and display the main dashboard content', async ({ page }) => {
    // 1. Navigation: Navigate to the correct route
    await test.step('Navigate to the Dashboard Slide 44 page', async () => {
      await page.goto(PAGE_ROUTE);
      // Wait for the network to be idle, suggesting the page content has loaded
      await page.waitForLoadState('networkidle');
    });

    // 2. Visibility: Assert that key elements are visible.
    await test.step('Verify key elements are visible', async () => {
      // Check for the main page title. Using 'heading' role is robust.
      const pageTitle = page.getByRole('heading', { name: PAGE_TITLE_TEXT, level: 1 });
      await expect(pageTitle).toBeVisible();

      // Check for the main content area.
      // A common pattern for dashboard content is a main container or a section with a specific role.
      // Using a generic 'main' role or a 'region' role for the primary content.
      const mainContentArea = page.getByRole('main');
      await expect(mainContentArea).toBeVisible();

      // Since this is a "slide" in a dashboard, it likely contains a primary visualization or report.
      // Check for a common element like a chart container or a report panel.
      // We'll use a generic selector for a common dashboard component, assuming it has a distinct label or role.
      const dashboardPanel = page.getByRole('region', { name: /Report|Visualization|Slide Content/i }).first();
      await expect(dashboardPanel).toBeVisible();
    });

    // 3. Functionality (if applicable): Basic check for navigation bar presence
    await test.step('Verify application navigation is present', async () => {
      // Check for a common navigation element, like a sidebar or header navigation
      const navBar = page.getByRole('navigation');
      await expect(navBar).toBeVisible();
    });
  });
});