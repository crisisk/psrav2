import { test, expect } from '@playwright/test';

// Define the route for the Certificates List page
const CERTIFICATES_LIST_ROUTE = '/certificates/list';
const PAGE_TITLE = 'Certificates List';

test.describe('Certificates List Page', () => {
  test('should load the page and display the list of certificates', async ({ page }) => {
    // 1. Navigation: Navigate to the correct route
    await test.step('Navigate to the Certificates List route', async () => {
      await page.goto(CERTIFICATES_LIST_ROUTE);
      // Wait for the main content to be visible
      await page.waitForLoadState('networkidle');
    });

    // 2. Visibility: Assert that key elements are visible
    await test.step('Verify page title and main heading', async () => {
      // Check for the main heading using the 'heading' role and text
      const mainHeading = page.getByRole('heading', { name: PAGE_TITLE, level: 1 });
      await expect(mainHeading).toBeVisible();
      
      // Optional: Check the document title
      await expect(page).toHaveTitle(/Certificates/);
    });

    // 3. Functionality: Check for a data table and a "Create" button
    await test.step('Verify the presence of the data table and the create button', async () => {
      // Assert the presence of the main data table (using a generic 'grid' or 'table' role)
      // Assuming the list of certificates is presented in a data grid/table
      const dataTable = page.getByRole('grid', { name: /certificates list/i }).or(page.getByRole('table', { name: /certificates list/i }));
      await expect(dataTable).toBeVisible();

      // Assert the presence of the "Create New Certificate" button/link
      // Using 'link' or 'button' role with descriptive text
      const createButton = page.getByRole('link', { name: /create new certificate/i }).or(page.getByRole('button', { name: /create new certificate/i }));
      await expect(createButton).toBeVisible();
    });

    // 4. Robustness: Check for a common element like a navigation bar or main layout
    await test.step('Verify main application layout elements', async () => {
      // Assuming a global navigation bar is present
      const navBar = page.getByRole('navigation', { name: /main/i });
      await expect(navBar).toBeVisible();
    });
  });
});
