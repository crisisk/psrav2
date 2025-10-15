import { test, expect } from '@playwright/test';

test.describe('Dashboard Slide 27 Page E2E Tests', () => {
  const pageUrl = '/dashboard/slide-27';

  test('should navigate to the page and display the main content', async ({ page }) => {
    // 1. Navigation: Navigate to the correct route
    await test.step('Navigate to the Dashboard Slide 27 page', async () => {
      await page.goto(pageUrl);
      // Wait for the network to be idle and the page to be fully loaded
      await page.waitForLoadState('networkidle');
    });

    // 2. Visibility: Assert that key elements are visible and the page is loaded
    await test.step('Verify page title and main content visibility', async () => {
      // Assert the page title is correct (assuming the title is set dynamically or statically)
      await expect(page).toHaveTitle(/Slide 27 | PSRA-LTSD/);

      // Check for a main heading, which is a strong indicator of content presence
      // Using a role-based selector for robustness
      const mainHeading = page.getByRole('heading', { level: 1 });
      await expect(mainHeading).toBeVisible();
      // A generic check for the main content area, assuming a standard layout
      const mainContent = page.locator('main');
      await expect(mainContent).toBeVisible();

      // Check for a common dashboard element like a navigation bar or sidebar
      const navBar = page.getByRole('navigation');
      await expect(navBar).toBeVisible();
    });

    // 3. Functionality (if applicable): Check for specific slide/dashboard elements
    await test.step('Verify specific slide content elements', async () => {
      // Since this is a "slide" in a dashboard, we check for a container that holds the slide content.
      // We use a generic data-testid or a more specific role if known.
      // Assuming a data-testid="slide-container" or a section role for the main slide area.
      const slideContainer = page.locator('[data-testid="slide-27-container"]');
      // Fallback to a generic section if the test-id is not available
      const fallbackContainer = page.getByRole('region').first(); 
      
      // We assert that at least one of the potential containers is visible, 
      // indicating the slide content has rendered.
      await expect(slideContainer.or(fallbackContainer)).toBeVisible();
    });
  });
});