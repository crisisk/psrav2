import { test, expect } from '@playwright/test';

const PAGE_ROUTE = '/dashboard/slide-17';
const PAGE_TITLE_TEXT = 'Dashboard Slide 17'; // Assuming a title based on the route structure

test.describe('Dashboard Slide 17 Page', () => {
  test('should navigate to the page and display the main content', async ({ page }) => {
    // 1. Navigation
    await test.step('Navigate to the Dashboard Slide 17 page', async () => {
      await page.goto(PAGE_ROUTE);
      // Assert that the URL is correct after navigation
      await expect(page).toHaveURL(new RegExp(\`\${PAGE_ROUTE}$\`));
    });

    // 2. Visibility and Content Check
    await test.step('Verify key elements are visible', async () => {
      // Check for a main heading or title, using a robust role selector
      const pageTitle = page.getByRole('heading', { name: PAGE_TITLE_TEXT, level: 1 });
      await expect(pageTitle).toBeVisible();

      // Check for the main content area. A common pattern is a 'main' element or a container with a specific role/test-id.
      // Using 'main' role as a robust selector for the primary content area.
      const mainContent = page.getByRole('main');
      await expect(mainContent).toBeVisible();
      
      // Check for a common application element like a navigation bar (e.g., a 'navigation' role)
      const navBar = page.getByRole('navigation');
      await expect(navBar).toBeVisible();
    });

    // 3. Robustness Check (Optional: Check for a specific element that indicates a "slide" or "report" nature)
    await test.step('Verify the page structure is appropriate for a dashboard slide', async () => {
      // Assuming a dashboard slide might contain charts or specific data visualizations.
      // Check for a common container that might hold the slide's primary visualization/report.
      // Using a generic 'region' role for a section of the page, which is a good fallback for complex components.
      const slideContainer = page.getByRole('region').first();
      await expect(slideContainer).toBeVisible();
    });
  });
});
