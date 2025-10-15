import { test, expect } from '@playwright/test';

test.describe('Dashboard Slide 25 Page E2E Tests', () => {
  const route = '/dashboard/slide-25';

  test('should navigate to the page and verify key elements are visible', async ({ page }) => {
    // 1. Navigation: Navigate to the correct route
    await test.step('Navigate to the Dashboard Slide 25 page', async () => {
      await page.goto(route);
      // Wait for the page to load and settle
      await page.waitForLoadState('networkidle');
    });

    // 2. Visibility: Assert that key elements are visible
    await test.step('Verify page title and main content visibility', async () => {
      // Assert the page URL is correct
      await expect(page).toHaveURL(new RegExp(route + '$'));

      // Assert the main page title is visible.
      // Using a generic role selector for a heading, assuming the page has a main title.
      const pageTitle = page.getByRole('heading', { name: /Slide 25|Dashboard/i }).first();
      await expect(pageTitle).toBeVisible();

      // Assert the main content area is visible.
      // Using a generic selector for the main content area, which is common in Next.js apps.
      const mainContent = page.locator('main');
      await expect(mainContent).toBeVisible();

      // Assert a primary dashboard element is present.
      // Assuming a dashboard slide contains a chart, table, or a key metric card.
      // Using a data-testid for robustness, which should be added to the main component of the slide.
      const slideContent = page.locator('[data-testid="slide-25-content"]');
      await expect(slideContent).toBeVisible();
    });

    // 3. Functionality (if applicable): Check for common dashboard interactions
    await test.step('Verify common dashboard interactions (e.g., refresh button)', async () => {
      // Check for a common dashboard feature like a refresh or filter button.
      const refreshButton = page.getByRole('button', { name: /Refresh|Update Data/i });
      // The button might not always be present, so we check if it's visible if it exists.
      if (await refreshButton.isVisible()) {
        await expect(refreshButton).toBeEnabled();
      }
    });
  });
});