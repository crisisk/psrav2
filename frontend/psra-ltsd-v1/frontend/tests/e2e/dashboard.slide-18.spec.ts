import { test, expect } from '@playwright/test';

const PAGE_ROUTE = '/dashboard/slide-18';
const PAGE_TITLE_TEXT = 'Dashboard Slide 18'; // Assuming a generic title based on the route structure

test.describe('Dashboard Slide 18 Page', () => {
  test('should navigate to the page and display main content', async ({ page }) => {
    // 1. Navigation
    await test.step('Navigate to the Dashboard Slide 18 page', async () => {
      await page.goto(PAGE_ROUTE);
      // Wait for the page to load completely, assuming a network idle state is a good indicator
      await page.waitForLoadState('networkidle');
    });

    // 2. Visibility and Content Assertion
    await test.step('Verify page title and main content visibility', async () => {
      // Assert the page title is correct (e.g., in the browser tab)
      await expect(page).toHaveTitle(/Dashboard/);

      // Assert the main heading or a key element is visible.
      // Using a generic heading role for robustness.
      const mainHeading = page.getByRole('heading', { name: PAGE_TITLE_TEXT, exact: true });
      await expect(mainHeading).toBeVisible();

      // Assert that the main content area (e.g., the slide container) is present.
      // Assuming the main content is within a main landmark or a specific test-id.
      // Using a generic role for the main content area.
      const mainContent = page.getByRole('main');
      await expect(mainContent).toBeVisible();

      // Further check for common dashboard elements (e.g., a chart or metric card)
      // This is a placeholder and should be refined if specific elements are known.
      const dashboardPanel = page.getByTestId('dashboard-slide-18-panel');
      // If the element is not guaranteed to have a test-id, use a more generic selector
      // await expect(page.locator('.slide-content')).toBeVisible();
      // Since we don't know the exact structure, we'll stick to the main content check.
    });

    // 3. Functionality (if applicable) - Not directly applicable for a static dashboard slide,
    // but we can check for common navigation elements.
    await test.step('Verify common application elements are present', async () => {
      // Check for the main application navigation bar
      const navBar = page.getByRole('navigation', { name: 'Main' });
      await expect(navBar).toBeVisible();

      // Check for the user profile/settings button (e.g., in the header)
      const userMenu = page.getByRole('button', { name: /User Menu|Profile/i });
      await expect(userMenu).toBeVisible();
    });
  });
});