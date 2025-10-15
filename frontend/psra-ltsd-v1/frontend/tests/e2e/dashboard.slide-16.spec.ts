import { test, expect } from '@playwright/test';

// Define the route for the Dashboard Slide 16 page
const DASHBOARD_SLIDE_16_ROUTE = '/dashboard/slide-16';

test.describe('Dashboard Slide 16 Page E2E Tests', () => {
  /**
   * Test case 1: Verify successful navigation and page title.
   */
  test('should navigate to the Dashboard Slide 16 page and display the main heading', async ({ page }) => {
    // 1. Navigation: Navigate to the correct route
    await test.step('Navigate to the Dashboard Slide 16 page', async () => {
      await page.goto(DASHBOARD_SLIDE_16_ROUTE);
      // Wait for the page to load completely
      await page.waitForLoadState('networkidle');
    });

    // 2. Visibility: Assert that key elements are visible
    await test.step('Verify page title and main content visibility', async () => {
      // Check for the main page heading, assuming it contains "Slide 16" or "Dashboard"
      // Using a role-based selector for robustness
      const mainHeading = page.getByRole('heading', { name: /Dashboard|Slide 16/i }).first();
      await expect(mainHeading).toBeVisible();
      
      // Check for the presence of a main content area or container
      // Assuming a common layout element like a main tag or a container with a specific role
      const mainContent = page.locator('main');
      await expect(mainContent).toBeVisible();

      // Check for a common navigation element (e.g., a sidebar or header)
      const navigationBar = page.getByRole('navigation').first();
      await expect(navigationBar).toBeVisible();
    });
  });

  /**
   * Test case 2: Verify the presence of a specific dashboard component (e.g., a chart or data card).
   * This is a generic check since the exact content is unknown, but a dashboard slide should have some visual data.
   */
  test('should display at least one data visualization or card component', async ({ page }) => {
    await page.goto(DASHBOARD_SLIDE_16_ROUTE);
    await page.waitForLoadState('networkidle');

    await test.step('Verify presence of a data component', async () => {
      // Look for common dashboard elements like cards, charts, or tables
      // Using a generic selector for a card or a section that typically holds data
      const dataCard = page.locator('[data-testid^="dashboard-card"], [role="region"], .chart-container').first();
      
      // If the page is a dashboard slide, it must contain some primary content.
      // We assert that at least one major content block is present.
      await expect(dataCard).toBeVisible();
    });
  });
});