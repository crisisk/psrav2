import { test, expect } from '@playwright/test';

const PAGE_ROUTE = '/compliance/ai-act/certificate_management';
const PAGE_TITLE_TEXT = 'AI Act Certificate Management';

test.describe('AI Act Certificate Management Page', () => {
  test('should navigate to the page and verify key elements', async ({ page }) => {
    // 1. Navigation: Navigate to the correct route
    await test.step('Navigate to the AI Act Certificate Management page', async () => {
      await page.goto(PAGE_ROUTE);
      // Wait for the page to load and settle
      await page.waitForLoadState('networkidle');
    });

    // 2. Visibility: Assert that key elements are visible
    await test.step('Verify page title and main heading are visible', async () => {
      // Check for the main heading on the page
      const mainHeading = page.getByRole('heading', { name: PAGE_TITLE_TEXT, level: 1 });
      await expect(mainHeading).toBeVisible();
      
      // Optionally, check the document title (browser tab title)
      await expect(page).toHaveTitle(/AI Act Certificate Management/);
    });

    // 3. Functionality: Check for list/table and a creation button
    await test.step('Verify the presence of the certificate list/table', async () => {
      // Assuming the list of certificates is presented in a table or a list.
      // We look for a common container role like 'grid' (for a data table) or 'list'
      // A more robust check would be a specific test-id, but we use a generic role here.
      const certificateList = page.getByRole('grid', { name: /certificate list/i }).or(page.getByRole('table', { name: /certificate list/i }));
      await expect(certificateList).toBeVisible();
    });

    await test.step('Verify the presence of the "Create New Certificate" button', async () => {
      // Check for a button that allows creation of a new certificate.
      const createButton = page.getByRole('button', { name: /Create New Certificate|Add Certificate/i });
      await expect(createButton).toBeVisible();
      
      // Optional: Verify the button is enabled
      await expect(createButton).toBeEnabled();
    });

    // 4. Robustness: Check for a search/filter input, common in management pages
    await test.step('Verify the presence of a search input for filtering certificates', async () => {
      const searchInput = page.getByRole('searchbox', { name: /search certificates|filter/i }).or(page.getByPlaceholder(/Search certificates/i));
      await expect(searchInput).toBeVisible();
    });
  });
});