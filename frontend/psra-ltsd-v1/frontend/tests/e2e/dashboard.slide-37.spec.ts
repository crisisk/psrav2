import { test, expect } from '@playwright/test';

const PAGE_ROUTE = '/dashboard/slide-37';

test.describe('Dashboard Slide 37 Page E2E Tests', () => {
  test('should load the page and display key structural elements', async ({ page }) => {
    // 1. Navigation: Navigate to the correct route
    await test.step('Navigate to the Dashboard Slide 37 page', async () => {
      await page.goto(PAGE_ROUTE);
      // Wait for the network to be idle and the page to be fully loaded
      await page.waitForLoadState('networkidle');
    });

    // 2. Visibility: Assert that key elements are visible
    await test.step('Verify the page title and main content area are visible', async () => {
      // Check for a generic page title or heading (e.g., h1 or a role="heading")
      // Assuming the slide title is the most prominent text on the page
      const pageTitle = page.getByRole('heading', { name: /Slide 37/i, level: 1 });
      await expect(pageTitle).toBeVisible();
      
      // Check for the main content area, which is crucial for a dashboard slide
      // Using a generic main role selector for robustness
      const mainContent = page.getByRole('main');
      await expect(mainContent).toBeVisible();
      
      // Check for a common application structure element, like a navigation bar
      const navBar = page.getByRole('navigation');
      await expect(navBar).toBeVisible();
    });

    // 3. Functionality (if applicable): Check for specific slide-related elements
    await test.step('Verify the presence of a visual container for the slide content', async () => {
      // Assuming the slide content is contained within a card or panel
      // Using a generic container selector (e.g., a div with a specific test-id or class)
      // Since we don't know the exact implementation, we'll check for a common container role
      const slideContainer = page.locator('section').first(); // Often slides are in sections
      await expect(slideContainer).toBeVisible();
      
      // Assert that the page URL is correct
      await expect(page).toHaveURL(new RegExp(PAGE_ROUTE + '$'));
    });
  });
});