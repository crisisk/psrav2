import { test, expect } from '@playwright/test';

// Define the route for the System Performance Dashboard
const DASHBOARD_ROUTE = '/year1/system_performance_dashboard';

test.describe('System Performance Dashboard E2E Tests', () => {

  test('should load the dashboard and display key performance indicators', async ({ page }) => {
    // 1. Navigation: Navigate to the System Performance Dashboard route
    await test.step('Navigate to the dashboard', async () => {
      await page.goto(DASHBOARD_ROUTE);
      // Wait for the page to be fully loaded
      await page.waitForLoadState('networkidle');
    });

    // 2. Visibility: Assert that the main page title is visible
    await test.step('Verify main heading visibility', async () => {
      // Use a role-based selector for the main heading (h1)
      const mainHeading = page.getByRole('heading', { name: 'System Performance Dashboard', level: 1 });
      await expect(mainHeading).toBeVisible();
    });

    // 3. Functionality/Visibility: Assert that key dashboard components are present
    await test.step('Verify presence of key dashboard components', async () => {
      // Check for a main dashboard container or section
      const dashboardContainer = page.getByTestId('system-performance-dashboard');
      await expect(dashboardContainer).toBeVisible();

      // Check for common dashboard elements:
      // a) Metric Cards (e.g., for uptime, latency, error rate)
      // We assume there is a section for key metrics, identifiable by a role or test-id
      const metricCardsSection = page.getByRole('region', { name: /Key Metrics|Performance Indicators/i });
      await expect(metricCardsSection).toBeVisible();
      
      // b) Charts/Graphs (e.g., for historical data)
      // We assume charts are often identified by a title or a specific test-id
      const chartElement = page.getByRole('img', { name: /Performance Chart|System Load Graph/i });
      await expect(chartElement).toBeVisible();

      // c) A refresh or filter button, common on dashboards
      const refreshButton = page.getByRole('button', { name: /Refresh|Apply Filters/i });
      await expect(refreshButton).toBeVisible();
    });

    // 4. Robustness: Verify the presence of the main application navigation bar
    await test.step('Verify application navigation bar is present', async () => {
      // Assuming the main navigation is a 'navigation' role
      const navBar = page.getByRole('navigation');
      await expect(navBar).toBeVisible();
    });
  });
});
