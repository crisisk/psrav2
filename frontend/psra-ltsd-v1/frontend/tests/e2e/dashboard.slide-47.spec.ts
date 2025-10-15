import { test, expect } from '@playwright/test';

// Define the route for the page
const PAGE_ROUTE = '/dashboard/slide-47';
const PAGE_TITLE_TEXT = 'Dashboard Slide 47'; // Placeholder for the expected page title

test.describe('Dashboard Slide 47 E2E Tests', () => {
  test('should navigate to the slide and display main content', async ({ page }) => {
    // 1. Navigation: Navigate to the correct route
    await test.step('Navigate to the Dashboard Slide 47 page', async () => {
      await page.goto(PAGE_ROUTE);
      // Wait for the page to load completely
      await page.waitForLoadState('networkidle');
    });

    // 2. Visibility: Assert that key elements are visible
    await test.step('Verify page title and main content visibility', async () => {
      // Check for the page title in the document title
      await expect(page).toHaveTitle(new RegExp(PAGE_TITLE_TEXT, 'i'));

      // Check for a main heading (e.g., h1) which often acts as the page title
      // Using a role-based selector for robustness
      const mainHeading = page.getByRole('heading', { name: PAGE_TITLE_TEXT, level: 1, exact: false });
      await expect(mainHeading).toBeVisible();

      // Check for the main content area of the slide
      // Assuming the main content is contained within a <main> tag or a section with a specific role
      const mainContent = page.getByRole('main');
      await expect(mainContent).toBeVisible();
      
      // Check for a common dashboard element like a navigation bar or sidebar
      const navigationBar = page.getByRole('navigation');
      await expect(navigationBar).toBeVisible();
    });

    // 3. Functionality (if applicable): Minimal check for a static slide
    // Since this is a "slide," we primarily check for content presence, not complex interaction.
    await test.step('Verify static content presence', async () => {
      // Check for at least one major visual element, like a chart or a card, 
      // which is common in dashboard slides. Using a generic role.
      const visualElement = page.getByRole('region').first(); // 'region' is a good generic role for a content block
      await expect(visualElement).toBeVisible();
    });
  });
});
