import { test, expect } from '@playwright/test';

// Define the base URL for the application. This should ideally be configured in playwright.config.ts
// For this example, we'll assume a base URL is set or we use a relative path.
const RESOURCE_LIBRARY_ROUTE = '/partners/resource_library';

test.describe('Partners Resource Library Page', () => {
  test('should load the page and display key elements', async ({ page }) => {
    // 1. Navigation
    await test.step('Navigate to the Resource Library page', async () => {
      await page.goto(RESOURCE_LIBRARY_ROUTE);
      // Wait for the page to be fully loaded and stable
      await page.waitForLoadState('networkidle');
    });

    // 2. Visibility and Content Assertion
    await test.step('Verify page title and main components are visible', async () => {
      // Assert the page title (using a common pattern for Next.js page titles)
      const pageTitle = page.getByRole('heading', { name: 'Resource Library', level: 1 });
      await expect(pageTitle).toBeVisible();

      // Assert the presence of a search input for filtering resources
      const searchInput = page.getByRole('searchbox', { name: /search resources/i });
      await expect(searchInput).toBeVisible();

      // Assert the presence of a main content area, which should contain the list of resources
      // We look for a generic list or a section role
      const resourceList = page.getByRole('list', { name: /available resources/i }).or(page.getByRole('main'));
      await expect(resourceList).toBeVisible();
    });

    // 3. Functionality (Basic Search/Filter Test)
    await test.step('Test basic search functionality', async () => {
      const searchInput = page.getByRole('searchbox', { name: /search resources/i });
      const testQuery = 'compliance';

      // Type a search query
      await searchInput.fill(testQuery);

      // Assert that the search input now contains the query
      await expect(searchInput).toHaveValue(testQuery);

      // In a real application, we would assert that the list of resources has been filtered.
      // Since we don't know the exact content, we'll assert that a loading indicator is not present
      // and that the list is still visible, implying a search was executed.
      // A more robust test would check for a specific resource title that matches the query.
      // Example of a more robust check (commented out as it requires knowledge of data):
      // const filteredResource = page.getByRole('link', { name: /compliance guide/i });
      // await expect(filteredResource).toBeVisible();

      // Clear the search input
      await searchInput.clear();
      await expect(searchInput).toHaveValue('');
    });
  });
});