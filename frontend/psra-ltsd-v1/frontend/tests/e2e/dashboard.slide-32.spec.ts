import { test, expect } from '@playwright/test';

const PAGE_ROUTE = '/dashboard/slide-32';
const PAGE_TITLE_TEXT = 'Slide 32: Customs Compliance Overview'; // Assuming a descriptive title based on the route

test.describe('Dashboard Slide 32 Page', () => {
  test('should load the page and display key dashboard elements', async ({ page }) => {
    // 1. Navigation
    await test.step('Navigate to the Dashboard Slide 32 page', async () => {
      await page.goto(PAGE_ROUTE);
      // Wait for the main content to be visible
      await expect(page.locator('main')).toBeVisible();
    });

    // 2. Visibility: Page Title/Heading
    await test.step('Verify the main page heading is visible', async () => {
      // Use a role-based selector for the main heading (h1)
      const pageHeading = page.getByRole('heading', { name: PAGE_TITLE_TEXT, level: 1 });
      await expect(pageHeading).toBeVisible();
    });

    // 3. Visibility: Main Dashboard Content Area
    await test.step('Verify the main dashboard content container is visible', async () => {
      // Assuming a common pattern for a main content area, e.g., a container with a specific role or test-id
      // Using a generic 'main' role and then checking for a section/article/div within it.
      // A robust test would look for a data visualization element, e.g., a chart container.
      const dashboardContainer = page.locator('[data-testid="slide-32-dashboard-container"]');
      
      // Fallback to a more generic selector if test-id is not available, but prefer the test-id.
      if (await dashboardContainer.isVisible()) {
        await expect(dashboardContainer).toBeVisible();
      } else {
        // Fallback: Check for a prominent section that likely holds the slide content
        const slideContent = page.getByRole('region').first();
        await expect(slideContent).toBeVisible();
      }
    });

    // 4. Robustness: Check for a common application element (e.g., a main navigation bar)
    await test.step('Verify the main application navigation is present', async () => {
      // Check for a navigation element, which is common in SaaS applications
      const navBar = page.getByRole('navigation');
      await expect(navBar).toBeVisible();
    });

    // 5. Accessibility: Check for a descriptive document title
    await test.step('Verify the document title is set correctly', async () => {
      await expect(page).toHaveTitle(/Slide 32/);
    });
  });
});