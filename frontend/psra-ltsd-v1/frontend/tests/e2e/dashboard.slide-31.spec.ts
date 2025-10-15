import { test, expect } from '@playwright/test';

// Define the route for the page under test
const PAGE_ROUTE = '/dashboard/slide-31';

test.describe('Dashboard Slide 31 Page E2E Tests', () => {
  /**
   * Test: Page Navigation and Basic Visibility
   * Purpose: Ensures the page loads successfully and key structural elements are present.
   */
  test('should navigate to the page and display the main content', async ({ page }) => {
    // 1. Navigation: Navigate to the correct route
    await test.step('Navigate to the Dashboard Slide 31 page', async () => {
      await page.goto(PAGE_ROUTE);
      // Wait for the network to be idle and the page to be fully loaded
      await page.waitForLoadState('networkidle');
    });

    // 2. Visibility: Assert that key elements are visible.

    // Check for the main page title/heading.
    // We use a generic role-based selector for a heading, assuming the page has a main title.
    await test.step('Verify the main heading is visible', async () => {
      const mainHeading = page.getByRole('heading', { level: 1 }).first();
      await expect(mainHeading).toBeVisible();
      // Optionally, check for a specific title text if known, but for a generic test, visibility is sufficient.
      // await expect(mainHeading).toHaveText('Slide 31: [Inferred Title]');
    });

    // Check for the main content area or a unique element on the page.
    // Assuming a large SaaS application uses a standard layout, we check for the main content landmark.
    await test.step('Verify the main content area is present', async () => {
      const mainContent = page.getByRole('main');
      await expect(mainContent).toBeVisible();
    });

    // Check for the presence of a navigation bar or sidebar, common in dashboard layouts.
    await test.step('Verify the application navigation is visible', async () => {
      const navigation = page.getByRole('navigation').first();
      await expect(navigation).toBeVisible();
    });

    // Check for the page to be accessible, which is a good general check.
    await test.step('Verify the page title is set', async () => {
      // The page title should be descriptive, even if we don't know the exact text.
      const title = await page.title();
      expect(title.length).toBeGreaterThan(0);
    });
  });

  /**
   * Test: Check for expected dashboard components (e.g., a chart or a key metric card)
   * Purpose: Ensures the page is functional and not just an empty shell.
   */
  test('should display at least one key dashboard component', async ({ page }) => {
    await page.goto(PAGE_ROUTE);
    await page.waitForLoadState('networkidle');

    // Look for a common dashboard element like a chart, a card, or a section.
    // Using a generic 'region' role for a section or a 'figure' for a chart/graph.
    const dashboardComponent = page.getByRole('region').or(page.getByRole('figure')).first();

    await test.step('Verify a primary dashboard component is loaded', async () => {
      // This assertion is a strong indicator that the page has rendered its intended content.
      await expect(dashboardComponent).toBeVisible();
    });
  });
});