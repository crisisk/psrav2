import { test, expect } from '@playwright/test';

const PAGE_ROUTE = '/dashboard/slide-33';
const PAGE_TITLE_TEXT = 'Slide 33: Key Dashboard Metric'; // Placeholder for an expected title

test.describe('Dashboard Slide 33 Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the specific dashboard slide page
    await page.goto(PAGE_ROUTE);
  });

  test('should navigate successfully and display the main content', async ({ page }) => {
    // 1. Verify successful navigation by checking the URL
    await expect(page).toHaveURL(new RegExp(PAGE_ROUTE + '$'));

    // 2. Assert that the main page container is visible
    // Using a role-based selector for the main content area
    const mainContent = page.getByRole('main');
    await expect(mainContent).toBeVisible();

    // 3. Assert that a primary heading (e.g., the slide title) is visible
    // Using a role-based selector for a level 1 heading
    const pageTitle = mainContent.getByRole('heading', { level: 1, name: PAGE_TITLE_TEXT, exact: false });
    await expect(pageTitle).toBeVisible();
    
    // 4. Check for a common application element like a navigation bar or sidebar
    // Assuming a common navigation structure exists
    const navigationBar = page.getByRole('navigation');
    await expect(navigationBar).toBeVisible();

    // 5. Check for a key element specific to a "slide" or "report" page, 
    // such as a data visualization container or a report panel.
    // Using a test-id or a descriptive role for a report/chart area.
    const reportPanel = mainContent.locator('[data-testid="slide-33-report-panel"]');
    // Fallback to a generic section if test-id is not present
    if (await reportPanel.isVisible()) {
        await expect(reportPanel).toBeVisible();
    } else {
        const genericSection = mainContent.getByRole('region').first();
        await expect(genericSection).toBeVisible();
    }
  });

  test('should have a correct page title in the browser tab', async ({ page }) => {
    // Verify the browser tab title is set correctly
    await expect(page).toHaveTitle(/Dashboard | Slide 33/); // Adjust regex based on actual application title format
  });
});