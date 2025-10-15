import { test, expect } from '@playwright/test';

const PAGE_ROUTE = '/partners/commission_tracking';
const PAGE_TITLE_TEXT = 'Commission Tracking';

test.describe('Partner Commission Tracking Page', () => {
  test('should navigate to the page and verify key elements', async ({ page }) => {
    // 1. Navigation
    await test.step('Navigate to the Commission Tracking page', async () => {
      await page.goto(PAGE_ROUTE);
      // Wait for the page to load and the main content to be visible
      await page.waitForLoadState('networkidle');
    });

    // 2. Visibility and Content Verification
    await test.step('Verify the main page title is visible', async () => {
      // Use role-based selector for the main heading
      const pageTitle = page.getByRole('heading', { name: PAGE_TITLE_TEXT, level: 1 });
      await expect(pageTitle).toBeVisible();
    });

    await test.step('Verify the presence of a data table/grid for commission data', async () => {
      // Look for a common table or grid structure, or a container with a specific role/test-id
      // Assuming a table is used to display the list of commissions
      const dataTable = page.getByRole('table', { name: /commission|tracking|data/i }).or(page.getByTestId('commission-tracking-table'));
      await expect(dataTable).toBeVisible();
    });

    await test.step('Verify the presence of search or filter controls', async () => {
      // Look for a search input field
      const searchInput = page.getByRole('searchbox').or(page.getByPlaceholder(/search|filter/i));
      await expect(searchInput).toBeVisible();
      
      // Look for a button to apply filters (if applicable)
      const filterButton = page.getByRole('button', { name: /filter|apply/i }).or(page.getByTestId('filter-button'));
      // The filter button might not be immediately visible if the filter panel is closed, so we check for the search input as the primary control.
      // If a dedicated filter button is expected, uncomment the line below:
      // await expect(filterButton).toBeVisible();
    });

    // 3. Robustness Check: Verify the main application navigation is present
    await test.step('Verify the main application navigation is present', async () => {
      const navBar = page.getByRole('navigation');
      await expect(navBar).toBeVisible();
    });
  });
});