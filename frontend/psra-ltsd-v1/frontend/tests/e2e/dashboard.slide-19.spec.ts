import { test, expect } from '@playwright/test';

const PAGE_ROUTE = '/dashboard/slide-19';
const PAGE_TITLE = 'Dashboard Slide 19'; // Assuming a generic title based on the route

test.describe('Dashboard Slide 19 Page E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the specific dashboard slide page
    await page.goto(PAGE_ROUTE);
  });

  test('should display the correct page title and main content', async ({ page }) => {
    // 1. Verify successful navigation and page title
    await expect(page).toHaveURL(PAGE_ROUTE);
    
    // Check for a main heading or title element, using a robust role selector
    // Assuming the page has a main heading (h1) that reflects the content
    const mainHeading = page.getByRole('heading', { name: PAGE_TITLE, level: 1 });
    await expect(mainHeading).toBeVisible();

    // 2. Verify the main content area is visible
    // This checks for the presence of the primary content container, which is a good proxy for page load success.
    // Using a generic role like 'main' or a test-id if available is best practice.
    const mainContent = page.getByRole('main');
    await expect(mainContent).toBeVisible();

    // 3. Verify common dashboard elements (e.g., a navigation bar or sidebar)
    // Assuming a common application structure with a navigation bar.
    const navBar = page.getByRole('navigation');
    await expect(navBar).toBeVisible();
  });

  test('should not contain any critical error messages', async ({ page }) => {
    // Check for common error indicators that might suggest a failed load or server issue
    const errorMessages = [
      'Something went wrong',
      'Application Error',
      '500 Internal Server Error',
      '404 Not Found',
    ];

    for (const message of errorMessages) {
      await expect(page.getByText(message, { exact: true })).not.toBeVisible();
    }
  });
});