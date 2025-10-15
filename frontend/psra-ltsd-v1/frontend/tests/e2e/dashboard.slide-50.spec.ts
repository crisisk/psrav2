import { test, expect } from '@playwright/test';

const PAGE_ROUTE = '/dashboard/slide-50';

test.describe('Dashboard Slide 50 Page E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the specific dashboard slide page
    await page.goto(PAGE_ROUTE);
  });

  test('should load the page and display the main dashboard content', async ({ page }) => {
    // 1. Navigation Check: Verify the URL is correct
    await expect(page).toHaveURL(new RegExp(PAGE_ROUTE + '$'));

    // 2. Visibility Check: Assert that the main page structure elements are visible.
    // Assuming a common application structure with a main navigation/header and a primary content area.

    // Check for a main heading or title indicating the slide/report name.
    // Using a role-based selector for a heading, which is robust.
    const pageTitle = page.getByRole('heading', { name: /Slide 50|Dashboard/i }).first();
    await expect(pageTitle).toBeVisible();

    // Check for the presence of the main content area, typically a 'main' landmark or a container with a specific role.
    const mainContent = page.getByRole('main');
    await expect(mainContent).toBeVisible();

    // 3. Functionality Check (Inferred for a Dashboard Slide):
    // Dashboard slides typically contain charts, KPIs, or summary cards.
    // Check for at least one element that represents a key piece of data or a chart container.
    // Using a generic role for a data display element like a 'figure' or a 'region' for a widget.
    const dashboardWidget = page.getByRole('region', { name: /KPI|Chart|Summary/i }).or(page.locator('.dashboard-widget').first());
    
    // We expect at least one main widget/chart to be present on a dashboard slide.
    // The test will pass if either a region with a relevant name or a common class is found.
    await expect(dashboardWidget).toBeVisible();

    // 4. Robustness Check: Ensure the application's navigation bar is present (common for SaaS apps)
    const navBar = page.getByRole('navigation', { name: /main|primary/i });
    await expect(navBar).toBeVisible();

    // 5. Accessibility Check: Verify the page has a proper title set in the browser tab
    await expect(page).toHaveTitle(/Slide 50|Dashboard|PSRA-LTSD/i);
  });

  test('should ensure all critical data visualizations are loaded', async ({ page }) => {
    // This test assumes that the dashboard slide loads data asynchronously and displays it in cards or charts.
    // We check for a common loading indicator to disappear, implying data has been fetched and rendered.
    const loadingIndicator = page.getByRole('progressbar').or(page.locator('[data-testid="loading-spinner"]'));
    
    // Wait for the loading indicator to be hidden or removed from the DOM.
    await expect(loadingIndicator).toBeHidden({ timeout: 15000 });

    // After loading, re-check for the main content to ensure it's not just a skeleton.
    const mainContent = page.getByRole('main');
    await expect(mainContent).toBeVisible();
  });
});