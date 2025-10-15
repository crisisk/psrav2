import { test, expect } from '@playwright/test';

const PAGE_ROUTE = '/dashboard/slide-39';
const PAGE_TITLE_REGEX = /Dashboard: Slide 39/i;

test.describe('Dashboard Slide 39 Page', () => {
  test('should navigate to the page and display the main content', async ({ page }) => {
    // 1. Navigation
    await test.step(`Navigate to ${PAGE_ROUTE}`, async () => {
      await page.goto(PAGE_ROUTE);
      // Wait for the page to load completely
      await page.waitForLoadState('networkidle');
    });

    // 2. Visibility and Content Assertions
    await test.step('Verify page title and main elements are visible', async () => {
      // Check for the page title in the document head
      await expect(page).toHaveTitle(PAGE_TITLE_REGEX);

      // Check for a main heading (e.g., h1 or a role="heading" with level 1)
      const mainHeading = page.getByRole('heading', { name: PAGE_TITLE_REGEX, level: 1 }).or(
        page.getByRole('heading', { name: /Slide 39/i, level: 1 })
      );
      await expect(mainHeading).toBeVisible();

      // Check for the main content area (assuming a common layout structure)
      const mainContent = page.getByRole('main');
      await expect(mainContent).toBeVisible();

      // Check for a common application navigation element (e.g., a sidebar or header nav)
      const navBar = page.getByRole('navigation');
      await expect(navBar).toBeVisible();
    });

    // 3. Robustness: Check for a specific element that indicates a "slide" or data visualization
    await test.step('Verify the presence of a data visualization or slide container', async () => {
      // Look for a container that might hold the slide content, using a generic test-id or class
      const slideContainer = page.locator('[data-testid="slide-container"]').or(
        page.locator('.slide-content')
      );
      // We expect at least one of these common elements to be present
      await expect(slideContainer.first()).toBeVisible();
    });
  });
});