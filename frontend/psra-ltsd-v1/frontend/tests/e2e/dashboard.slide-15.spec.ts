import { test, expect } from '@playwright/test';

// Define the base URL for the application, assuming it's set in the Playwright config
const SLIDE_ROUTE = '/dashboard/slide-15';
const PAGE_TITLE_TEXT = 'Dashboard Slide 15'; // Assuming a generic title based on the route structure

test.describe('Dashboard Slide 15 Page E2E Tests', () => {

  test('should navigate to the slide and verify core content visibility', async ({ page }) => {
    // 1. Navigation: Navigate to the correct route
    await test.step('Navigate to the Dashboard Slide 15 page', async () => {
      await page.goto(SLIDE_ROUTE);
      // Wait for the network to be idle, suggesting the page has loaded its main content
      await page.waitForLoadState('networkidle');
    });

    // 2. Visibility: Assert that key elements are visible and the page is correct
    await test.step('Verify page title and main heading are visible', async () => {
      // Check for the page title in the document head (optional, but good practice)
      // Note: Playwright's page.title() is often the most reliable way to get the document title
      // await expect(page).toHaveTitle(/Dashboard Slide 15/); 

      // Check for a main heading (h1) on the page, which is a key indicator of content
      const mainHeading = page.getByRole('heading', { name: PAGE_TITLE_TEXT, level: 1 });
      
      // Use a more generic heading check if the exact title is unknown, or check for a main content area
      const mainContentArea = page.getByRole('main');

      // Assert that the main content area is present
      await expect(mainContentArea).toBeVisible();

      // Assert that a main heading is present (assuming the page has one)
      // This assertion is conditional on the page having a clear H1 matching the expected title.
      // If the page uses a different title or structure, this should be adjusted.
      // For robustness, we'll check for a generic main heading or a section title.
      const genericHeading = page.getByRole('heading').first();
      await expect(genericHeading).toBeVisible();
    });

    // 3. Functionality (if applicable): Check for common dashboard elements
    await test.step('Verify common dashboard components are present', async () => {
      // Check for a primary navigation bar (e.g., a sidebar or header)
      const navBar = page.getByRole('navigation');
      await expect(navBar).toBeVisible();

      // Check for a common element like a "Settings" or "User Profile" link/button
      const userProfileLink = page.getByRole('button', { name: /user|profile|account/i }).or(page.getByRole('link', { name: /user|profile|account/i }));
      await expect(userProfileLink).toBeVisible();

      // Check for a specific "slide" or "report" container, which is the main purpose of this page
      const slideContainer = page.locator('[data-testid="slide-15-container"]').or(page.locator('.slide-content'));
      await expect(slideContainer).toBeVisible();
      
      // Assert that the slide container is not empty (contains at least one child element)
      await expect(slideContainer).not.toBeEmpty();
    });
  });
});