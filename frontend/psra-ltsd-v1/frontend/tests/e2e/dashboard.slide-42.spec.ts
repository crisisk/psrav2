import { test, expect } from '@playwright/test';

test.describe('Dashboard Slide 42 Page E2E Tests', () => {
  const route = '/dashboard/slide-42';
  const pageTitle = 'Dashboard Slide 42'; // Assuming a title based on the route

  test('should navigate to the page and display the main content', async ({ page }) => {
    // 1. Navigation: Navigate to the correct route
    await test.step(`Navigate to ${route}`, async () => {
      await page.goto(route);
      // Wait for the network to be idle and page to be fully loaded
      await page.waitForLoadState('networkidle');
    });

    // 2. Visibility: Assert that key elements are visible and correct
    await test.step('Verify page title and main elements', async () => {
      // Check for the correct URL
      await expect(page).toHaveURL(new RegExp(route + '$'));

      // Check for the page title in the document title
      await expect(page).toHaveTitle(new RegExp(pageTitle));

      // Check for a main heading (e.g., h1) with the page title
      // Using a role-based selector for robustness
      const mainHeading = page.getByRole('heading', { name: pageTitle, level: 1 });
      await expect(mainHeading).toBeVisible();

      // Check for the main content area, assuming a standard layout element
      // Use a test-id or a semantic role like 'main'
      const mainContent = page.getByRole('main');
      await expect(mainContent).toBeVisible();
    });

    // 3. Functionality (Information Display): Check for a key dashboard element
    await test.step('Verify the presence of the slide/widget container', async () => {
      // Since it's 'slide-42', we expect a specific, self-contained component.
      // We'll look for a generic container with a descriptive name or test-id.
      const slideContainer = page.getByTestId('slide-42-container');
      
      // Fallback to a more generic selector if test-id is not present, 
      // but keep the test-id as the primary recommendation for robust tests.
      if (await slideContainer.isVisible()) {
        await expect(slideContainer).toBeVisible();
      } else {
        // Fallback: Check for a section or article role that might contain the slide content
        const slideSection = page.getByRole('article').filter({ hasText: pageTitle });
        await expect(slideSection).toBeVisible();
      }
    });
  });
});