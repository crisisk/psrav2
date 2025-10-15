import { test, expect } from '@playwright/test';

const PAGE_ROUTE = '/dashboard/slide-30';
const PAGE_TITLE_TEXT = 'Slide 30'; // Assuming a title based on the route name

test.describe('Dashboard Slide 30 Page E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the specific dashboard slide page
    await page.goto(PAGE_ROUTE);
  });

  test('should navigate to the page successfully and display the main content', async ({ page }) => {
    // 1. Assert successful navigation by checking the URL
    await expect(page).toHaveURL(new RegExp(PAGE_ROUTE + '$'));

    // 2. Assert the page title is correct (assuming the page title reflects the slide name)
    // We use a generic selector for a main heading (h1) or a role-based selector for a page title.
    const pageTitle = page.getByRole('heading', { name: PAGE_TITLE_TEXT, level: 1 }).or(page.getByTestId('page-title'));
    await expect(pageTitle).toBeVisible();

    // 3. Assert the main content area is visible
    // This is a robust way to check for the primary content container of the page.
    const mainContent = page.getByRole('main');
    await expect(mainContent).toBeVisible();

    // 4. Assert the presence of a common application element, like a main navigation bar or header
    const appHeader = page.getByRole('banner'); // Represents the main application header
    await expect(appHeader).toBeVisible();

    // 5. Assert that the page contains some content, indicating it's not empty.
    // This is a general check for the presence of text content on the page.
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('should display the dashboard navigation structure', async ({ page }) => {
    // Assuming a side navigation or breadcrumbs for a dashboard structure
    const navigation = page.getByRole('navigation');
    await expect(navigation).toBeVisible();

    // Optional: Check for a specific element that indicates the slide is part of a sequence
    // For example, a "Next Slide" button or a slide counter.
    const nextButton = page.getByRole('button', { name: /next|continue/i });
    if (await nextButton.isVisible()) {
      await expect(nextButton).toBeEnabled();
    }
  });
});