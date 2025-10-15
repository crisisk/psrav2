import { test, expect } from '@playwright/test';

const ROUTE = '/year1/edge_function_monitoring';
const PAGE_TITLE = 'Edge Function Monitoring';

test.describe('Edge Function Monitoring Page', () => {
  test('should load the page and display the monitoring dashboard', async ({ page }) => {
    // 1. Navigation
    await test.step('Navigate to the Edge Function Monitoring route', async () => {
      await page.goto(ROUTE);
      // Wait for the main content to be visible
      await page.waitForLoadState('networkidle');
    });

    // 2. Visibility and Content Assertion
    await test.step('Verify the main page title is visible', async () => {
      // Use role-based selector for the main heading
      const mainHeading = page.getByRole('heading', { name: PAGE_TITLE, level: 1 });
      await expect(mainHeading).toBeVisible();
    });

    // 3. Functionality/Component Assertion (Inferred from "monitoring" purpose)
    await test.step('Verify the monitoring dashboard component is present', async () => {
      // Assuming a main monitoring component or container exists,
      // we'll look for a common element like a dashboard container or a primary chart area.
      // A good practice is to use a test-id if available, but we'll use a descriptive role/text.
      const dashboardContainer = page.getByTestId('edge-monitoring-dashboard')
        .or(page.getByText('Monitoring Data Last Updated:'))
        .or(page.getByRole('region', { name: 'Monitoring Dashboard' }));

      await expect(dashboardContainer).toBeVisible();
    });

    // 4. Robustness Check: Verify a common UI element like a navigation bar or footer is present
    await test.step('Verify a common application element (e.g., main navigation) is visible', async () => {
      const navBar = page.getByRole('navigation', { name: 'Main' });
      await expect(navBar).toBeVisible();
    });

    // 5. Check for interactive elements (e.g., a refresh button common in monitoring views)
    await test.step('Verify a refresh or filter button is present', async () => {
      const refreshButton = page.getByRole('button', { name: /refresh|update|filter/i });
      // Use toBeAttached() as the button might be conditionally disabled or hidden until data loads
      await expect(refreshButton).toBeAttached();
    });
  });
});