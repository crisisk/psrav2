import { test, expect } from '@playwright/test';

// Define the route for the page under test
const PAGE_ROUTE = '/dashboard/slide-49';

test.describe('Dashboard Slide 49 Page E2E Tests', () => {

  test('should navigate to the page and verify key elements are visible', async ({ page }) => {
    // 1. Navigation: Navigate to the correct route
    await test.step('Navigate to the Dashboard Slide 49 page', async () => {
      await page.goto(PAGE_ROUTE);
      // Wait for the page to load and settle
      await page.waitForLoadState('networkidle');
    });

    // 2. Visibility: Assert that key elements are visible and content is present
    await test.step('Verify page title and main heading', async () => {
      // Check for the main page title (e.g., in the document title)
      await expect(page).toHaveTitle(/Dashboard | Slide 49/i);

      // Check for a main heading on the page, using a robust role selector
      const mainHeading = page.getByRole('heading', { name: /Slide 49/i, level: 1 });
      await expect(mainHeading).toBeVisible();
    });

    // 3. Functionality/Content: Check for typical dashboard components
    await test.step('Verify presence of main dashboard components', async () => {
      // Check for the main content area (e.g., a container for the slide)
      const mainContent = page.locator('main');
      await expect(mainContent).toBeVisible();

      // Assuming a dashboard slide contains at least one data card or visualization
      // Use a generic selector for a common dashboard element like a card or panel
      // A good practice is to use a test-id if available, but here we use a role for a generic container
      const dataPanel = page.getByRole('region', { name: /data visualization|metrics summary/i }).first();
      // If the page is complex, we might check for multiple specific elements.
      // For a generic slide, checking for at least one data-related component is a good start.
      await expect(dataPanel).toBeVisible();

      // Check for a common navigation element, like a sidebar or header, to ensure the app shell is loaded
      const appHeader = page.getByRole('banner'); // e.g., the main application header
      await expect(appHeader).toBeVisible();
    });

    // 4. Robustness: Check for no critical errors
    // Note: Playwright does not have a built-in way to check console errors without a listener,
    // but we can check for a common "error" or "not found" message on the page.
    await test.step('Verify no "Not Found" or error messages are displayed', async () => {
      const notFoundText = page.getByText(/404|page not found|an error occurred/i);
      await expect(notFoundText).not.toBeVisible();
    });
  });
});