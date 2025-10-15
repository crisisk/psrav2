import { test, expect } from '@playwright/test';

const PAGE_ROUTE = '/dashboard/slide-40';

test.describe('Dashboard - Slide 40 Page E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Assuming the application requires authentication, a login step would be here.
    // For a robust test, we should ensure the user is logged in before navigating.
    // await login(page); 
    await page.goto(PAGE_ROUTE);
  });

  test('should navigate to the page and display the main content', async ({ page }) => {
    // 1. Assert successful navigation and URL
    await expect(page).toHaveURL(new RegExp(PAGE_ROUTE + '$'));

    // 2. Assert the main page title or heading is visible.
    // We use a generic role-based selector for a heading, assuming the slide has a title.
    const pageTitle = page.getByRole('heading', { name: /Slide 40|Dashboard View/i, level: 1 });
    await expect(pageTitle).toBeVisible();

    // 3. Assert the main content area is visible.
    // This assumes a main content container, often a <main> tag or a div with a specific role/test-id.
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();

    // 4. Assert the presence of a common dashboard element, like a sidebar or header navigation.
    const dashboardSidebar = page.getByRole('navigation', { name: /main|dashboard/i });
    await expect(dashboardSidebar).toBeVisible();
  });

  test('should display key data visualization components', async ({ page }) => {
    // Assuming a dashboard slide contains at least one major data visualization (e.g., a chart or table).
    // Use role-based selectors for common components like tables or figures.

    // Check for a data table
    const dataTable = page.getByRole('table');
    await expect(dataTable).toBeVisible({ timeout: 10000 }).or(
      // Check for a chart/figure if it's a visualization-heavy slide
      expect(page.getByRole('figure')).toBeVisible()
    );

    // Check for a specific interactive element, like a filter or a date range picker
    const filterButton = page.getByRole('button', { name: /Filter|Date Range/i });
    await expect(filterButton).toBeVisible();
  });

  test('should handle potential loading states gracefully', async ({ page }) => {
    // Wait for any potential loading spinner or skeleton to disappear.
    const loadingIndicator = page.getByRole('progressbar', { name: /loading/i });
    await expect(loadingIndicator).toBeHidden({ timeout: 15000 });

    // After loading, the main content should be fully interactive.
    const mainContent = page.locator('main');
    await expect(mainContent).toBeEnabled();
  });
});