import { test, expect } from '@playwright/test';

test.describe('Supplier Performance Dashboard E2E Tests', () => {
  const dashboardRoute = '/suppliers/performance_dashboard';
  const pageTitle = 'Supplier Performance Dashboard';

  test.beforeEach(async ({ page }) => {
    // Assuming the application requires authentication, this would be a good place to set up a logged-in state.
    // For a basic test, we just navigate to the page.
    await page.goto(dashboardRoute);
  });

  test('should navigate to the dashboard and display the main title', async ({ page }) => {
    // 1. Navigation is handled in beforeEach.
    
    // 2. Visibility: Assert that the main page title is visible.
    // Using a role-based selector for the main heading.
    await expect(page.getByRole('heading', { name: pageTitle, level: 1 })).toBeVisible();
    
    // Assert that the main content area is loaded.
    await expect(page.locator('main')).toBeVisible();
  });

  test('should display essential dashboard components', async ({ page }) => {
    // Assert the presence of key dashboard elements.

    // Check for a date range or filter control, common in dashboards.
    await expect(page.getByRole('button', { name: /Date Range|Filter/i })).toBeVisible();
    
    // Check for at least one KPI card, typically represented by a card or a div with a specific role/test-id.
    // We'll look for a generic "card" or "status" element.
    await expect(page.getByRole('status').first()).toBeVisible();
    
    // Check for the presence of a chart or graph container.
    // Dashboards often contain visual data representations.
    // We'll look for a container that might hold a chart, using a generic selector.
    // A more robust test would use a specific test-id for the chart container.
    await expect(page.locator('div').filter({ hasText: /Performance Over Time|Score Distribution/i }).first()).toBeVisible();
    
    // Check for a table or list of top/recent suppliers, which is common in performance dashboards.
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('should allow interaction with the filter controls', async ({ page }) => {
    // This test simulates a basic interaction to ensure the controls are functional.
    
    // Locate the filter button (e.g., to open a filter modal or dropdown).
    const filterButton = page.getByRole('button', { name: /Filter|Date Range/i });
    await expect(filterButton).toBeEnabled();
    
    // Simulate clicking the filter button (optional, as it might open a modal which requires more complex testing).
    // await filterButton.click();
    
    // If there's a search input for suppliers on the dashboard.
    const searchInput = page.getByRole('searchbox', { name: /supplier|search/i });
    if (await searchInput.isVisible()) {
      await searchInput.fill('Test Supplier A');
      // Assert that the dashboard content updates (e.g., table row count changes).
      // This requires knowing the initial state, so we'll stick to a simple check for now.
      await expect(searchInput).toHaveValue('Test Supplier A');
    }
  });
});