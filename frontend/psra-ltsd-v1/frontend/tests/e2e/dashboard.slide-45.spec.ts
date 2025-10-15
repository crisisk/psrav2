import { test, expect } from '@playwright/test';

const PAGE_ROUTE = '/dashboard/slide-45';
const PAGE_TITLE_TEXT = 'Dashboard Slide 45'; // Assuming a standard title based on the route

test.describe('Dashboard Slide 45 Page E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Navigation: Navigate to the correct route.
    await page.goto(PAGE_ROUTE);
  });

  test('should navigate to the page and display the main content', async ({ page }) => {
    // Assert the URL is correct
    await expect(page).toHaveURL(new RegExp(PAGE_ROUTE + '$'));

    // Assert the page title is correct (using the <title> tag)
    await expect(page).toHaveTitle(new RegExp(PAGE_TITLE_TEXT));

    // 2. Visibility: Assert that key elements are visible.

    // Check for the main application header/navigation (assuming a standard layout)
    const header = page.getByRole('banner');
    await expect(header).toBeVisible();
    
    // Check for the main content area (assuming a main element is used)
    const mainContent = page.getByRole('main');
    await expect(mainContent).toBeVisible();

    // Check for the page-specific title (e.g., an H1 inside the main content)
    const pageHeading = mainContent.getByRole('heading', { name: PAGE_TITLE_TEXT, level: 1 });
    await expect(pageHeading).toBeVisible();

    // 3. Functionality (if applicable): Check for expected dashboard elements.
    // Since this is a "slide" in a dashboard, we expect data visualizations or key metric cards.
    
    // Check for at least one data visualization container (e.g., a card or panel)
    // Using a generic selector for a common dashboard component, assuming a role or test-id.
    // Replace 'data-testid=dashboard-card' with the actual test-id if known.
    const dashboardCard = page.locator('[data-testid^="dashboard-card-"]');
    // We expect at least one card to be present on a dashboard slide.
    await expect(dashboardCard.first()).toBeVisible();

    // Check for a common element like a "Last Updated" timestamp or a filter button
    const filterButton = page.getByRole('button', { name: /Filter|Options|Settings/i });
    // This is optional, but common in dashboards. We check if it's present, but don't fail if not.
    if (await filterButton.isVisible()) {
      test.info().annotations.push({ type: 'info', description: 'Filter button found and visible.' });
    }
  });
});