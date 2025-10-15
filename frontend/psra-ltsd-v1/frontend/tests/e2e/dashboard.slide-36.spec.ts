import { test, expect } from '@playwright/test';

// Define the route for the page under test
const PAGE_ROUTE = '/dashboard/slide-36';
const PAGE_TITLE_TEXT = 'Slide 36'; // Assuming a title based on the route structure

test.describe('Dashboard Slide 36 Page E2E Tests', () => {

  test('should navigate to the page and verify key elements are visible', async ({ page }) => {
    // 1. Navigation: Navigate to the correct route
    await test.step('Navigate to the Dashboard Slide 36 page', async () => {
      await page.goto(PAGE_ROUTE);
      // Wait for the network to be idle or for a specific element to appear
      await page.waitForLoadState('networkidle');
    });

    // 2. Visibility: Assert that key elements are visible
    await test.step('Verify the page title is visible', async () => {
      // Use getByRole('heading') for the main page title (h1)
      // Fallback to checking the document title if a specific h1 is not guaranteed
      await expect(page).toHaveTitle(/Slide 36/i);

      // Check for a main heading element on the page
      const mainHeading = page.getByRole('heading', { name: PAGE_TITLE_TEXT, level: 1 }).or(
        page.getByRole('heading', { name: PAGE_TITLE_TEXT, level: 2 })
      );
      await expect(mainHeading).toBeVisible();
    });

    await test.step('Verify the main content area is present', async () => {
      // The main content of a dashboard slide is often contained within a <main> or a container with a specific role/label.
      // We check for the main landmark role to ensure the primary content is loaded.
      const mainContent = page.getByRole('main');
      await expect(mainContent).toBeVisible();
      
      // Additionally, check for a common application component like a navigation bar
      const navBar = page.getByRole('navigation');
      await expect(navBar).toBeVisible();
    });

    // 3. Functionality (if applicable): Check for data display or static content
    await test.step('Verify the presence of data display elements (assuming a dashboard slide)', async () => {
      // Since this is a "slide", it likely contains charts, cards, or specific data points.
      // We check for a generic data container or a common element like a card.
      // This assertion is a placeholder and should be refined if the actual content structure is known (e.g., getByRole('figure', { name: 'Sales Chart' }))
      const dataCard = page.getByRole('region').or(page.getByRole('article'));
      await expect(dataCard).toHaveCount(1); // Expect at least one main content card/region
    });
  });
});