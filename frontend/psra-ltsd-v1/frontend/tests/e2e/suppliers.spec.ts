import { test, expect } from '@playwright/test';

const SUPPLIERS_LIST_ROUTE = '/suppliers/list_page';
const PAGE_TITLE_TEXT = 'Suppliers'; // Assuming a common page title for a list page

test.describe('Suppliers List Page E2E Tests', () => {
  test('should navigate to the suppliers list page and verify key elements', async ({ page }) => {
    // 1. Navigation
    await test.step('Navigate to the Suppliers List page', async () => {
      await page.goto(SUPPLIERS_LIST_ROUTE);
      // Wait for the page to be fully loaded and stable
      await page.waitForLoadState('networkidle');
    });

    // 2. Visibility and Content Verification
    await test.step('Verify the page title and main heading', async () => {
      // Check the document title
      await expect(page).toHaveTitle(/Suppliers/);

      // Check for a main heading (using role-based selector for robustness)
      const mainHeading = page.getByRole('heading', { name: PAGE_TITLE_TEXT, level: 1 });
      await expect(mainHeading).toBeVisible();
    });

    // 3. Functionality Checks (List Page Specific)
    await test.step('Verify the presence of the data table and the create button', async () => {
      // Check for the main data table/grid (using a common role for tables)
      const dataTable = page.getByRole('table', { name: /suppliers list/i });
      // Fallback check for a common list container if 'table' role is not used
      const listContainer = page.locator('[data-testid="suppliers-list-container"]');
      
      // Assert that at least one of the expected list/table elements is visible
      await expect(dataTable.or(listContainer)).toBeVisible();

      // Check for the "Create New Supplier" button (using role and common text)
      const createButton = page.getByRole('button', { name: /create new supplier/i });
      // Fallback check for a link if it's not a button
      const createLink = page.getByRole('link', { name: /create new supplier/i });

      // Assert that the CTA button/link is visible
      await expect(createButton.or(createLink)).toBeVisible();
    });

    // 4. Robustness Check (Optional: Search/Filter)
    await test.step('Verify the presence of a search input field', async () => {
      const searchInput = page.getByRole('searchbox', { name: /search suppliers/i });
      // Fallback check for a generic text input with a placeholder
      const genericInput = page.getByPlaceholder(/search/i);

      // Assert that a search mechanism is present
      await expect(searchInput.or(genericInput)).toBeVisible();
    });
  });
});