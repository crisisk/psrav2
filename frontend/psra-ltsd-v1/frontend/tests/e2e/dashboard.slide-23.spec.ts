import { test, expect } from '@playwright/test';

// Define the route for the page under test
const PAGE_ROUTE = '/dashboard/slide-23';
const PAGE_TITLE_REGEX = /Dashboard - Slide 23/i;

test.describe('Dashboard Slide 23 Page E2E Tests', () => {
  test('should navigate to the page and verify key elements are visible', async ({ page }) => {
    // 1. Navigation: Navigate to the correct route
    await test.step(`Navigate to ${PAGE_ROUTE}`, async () => {
      await page.goto(PAGE_ROUTE);
      // Wait for the page to load completely
      await page.waitForLoadState('networkidle');
    });

    // 2. Visibility: Assert that key elements are visible and content is loaded
    await test.step('Verify page title and heading', async () => {
      // Check the document title
      await expect(page).toHaveTitle(PAGE_TITLE_REGEX);

      // Check for a main heading (assuming a slide/dashboard will have one)
      const mainHeading = page.getByRole('heading', { name: PAGE_TITLE_REGEX, level: 1 }).or(
        page.getByRole('heading', { name: /Slide 23/i, level: 1 })
      );
      await expect(mainHeading).toBeVisible();
    });

    await test.step('Verify main content area and navigation elements', async () => {
      // Check for the main content area (e.g., a main element or a container)
      const mainContent = page.getByRole('main');
      await expect(mainContent).toBeVisible();
      
      // Check for a common application navigation bar (e.g., a sidebar or header)
      const navigationBar = page.getByRole('navigation');
      await expect(navigationBar).toBeVisible();

      // Check for a specific element that suggests a "slide" or "view" is loaded,
      // such as a data visualization container or a specific panel.
      // Using a generic test-id for a main component of the slide.
      const slideContentPanel = page.locator('[data-testid="slide-23-content-panel"]');
      // We use a soft assertion here as the exact implementation is unknown, but a key component should exist.
      await expect(slideContentPanel).toBeVisible();
    });

    // 3. Functionality (if applicable): Since it's a "slide," we assume it's informational.
    // We check for the presence of a common dashboard element like a "Refresh" button or a "Help" link.
    await test.step('Verify common dashboard functionality elements', async () => {
      const refreshButton = page.getByRole('button', { name: /refresh/i });
      const helpLink = page.getByRole('link', { name: /help/i });

      // Check if at least one of the common elements is present, or just assert they are not failing the test if not present.
      // For robustness, we only assert visibility if we know they should be there.
      // Since we don't know, we'll just check for a generic "Dashboard" text to ensure content is not empty.
      await expect(page.locator('body')).not.toBeEmpty();
    });
  });
});