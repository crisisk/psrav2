import { test, expect } from '@playwright/test';

const PAGE_ROUTE = '/dashboard/slide-21';
const PAGE_TITLE_REGEX = /Dashboard Slide 21|Slide 21|Dashboard/i;

test.describe('Dashboard Slide 21 Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the specific dashboard slide page
    await page.goto(PAGE_ROUTE);
  });

  test('should load successfully and display the main content', async ({ page }) => {
    // 1. Assert successful navigation and URL
    await expect(page).toHaveURL(new RegExp(PAGE_ROUTE + '$'));

    // 2. Assert the page title is correct (using a flexible regex for robustness)
    // This assumes the page sets a title that includes "Dashboard" and "Slide 21"
    await expect(page).toHaveTitle(PAGE_TITLE_REGEX);

    // 3. Assert a main heading is visible, which typically contains the page's name.
    // Prioritize role-based selector for robustness.
    const mainHeading = page.getByRole('heading', { name: PAGE_TITLE_REGEX, level: 1 });
    await expect(mainHeading).toBeVisible();

    // 4. Assert the main content area is present.
    // This is a general check for the primary content container, often a 'main' element.
    const mainContent = page.getByRole('main');
    await expect(mainContent).toBeVisible();

    // 5. Assert the presence of a common application element, like a navigation bar or sidebar.
    // This ensures the application shell is loaded correctly.
    const navBar = page.getByRole('navigation');
    await expect(navBar).toBeVisible();

    // 6. Assert that the page contains some form of visual data, as is typical for a dashboard slide.
    // This is a placeholder for a more specific chart/metric selector if known.
    // We check for a common element like a 'figure' or a 'section' with a descriptive name.
    const dashboardSection = page.getByRole('region', { name: /dashboard content|metrics|charts/i }).first();
    await expect(dashboardSection).toBeVisible();
  });

  test('should handle missing data gracefully (if applicable)', async ({ page }) => {
    // NOTE: This test is a placeholder. In a real-world scenario, this would involve
    // mocking API responses to simulate a no-data state and asserting the presence
    // of a "No data available" message or similar placeholder.
    // Since we cannot mock the API here, we skip the actual assertion but keep the
    // test structure to indicate a necessary test case.
    test.skip();
  });
});