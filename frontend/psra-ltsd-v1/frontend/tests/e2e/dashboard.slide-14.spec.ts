import { test, expect } from '@playwright/test';

test.describe('Dashboard Slide 14 Page', () => {
  const route = '/dashboard/slide-14';
  const pageTitle = 'Slide 14: Key Performance Indicators'; // Assuming a descriptive title for a dashboard slide

  test('should navigate to the page and display key elements', async ({ page }) => {
    // 1. Navigation
    await test.step('Navigate to the Dashboard Slide 14 route', async () => {
      await page.goto(route);
      // Wait for the main content to load
      await page.waitForLoadState('networkidle');
    });

    // 2. Visibility and Content Assertion
    await test.step('Verify page title and main content visibility', async () => {
      // Assert the page URL is correct
      await expect(page).toHaveURL(new RegExp(route + '$'));

      // Assert the main page title is visible (using a common role for headings)
      const mainHeading = page.getByRole('heading', { name: pageTitle, level: 1 });
      await expect(mainHeading).toBeVisible();

      // Assert the main content area is visible (assuming a main element or a specific test-id)
      // Using a generic main role for the page content
      const mainContent = page.getByRole('main');
      await expect(mainContent).toBeVisible();

      // Assert common dashboard elements are present for robustness
      // Assuming a navigation bar is present
      const navBar = page.getByRole('navigation', { name: /main|dashboard/i });
      await expect(navBar).toBeVisible();

      // Assuming a sidebar or a list of slides/sections is present
      const sidebar = page.getByRole('complementary', { name: /sidebar|menu/i });
      await expect(sidebar).toBeVisible();
    });

    // 3. Functionality (if applicable - checking for slide-specific content)
    await test.step('Verify slide-specific content elements', async () => {
      // Since it is a slide, it likely contains charts, graphs, or key metrics.
      // Check for a common element like a chart container or a metric card.
      const chartContainer = page.getByRole('region', { name: /chart|graph|metrics/i }).first();
      await expect(chartContainer).toBeVisible();

      // Check for a button or link to the next slide (common in presentation-style dashboards)
      const nextSlideButton = page.getByRole('link', { name: /next|slide/i }).or(page.getByRole('button', { name: /next|slide/i }));
      // We only assert that the selector exists, as its visibility might depend on the slide number.
      // If it's the last slide, this might not be visible, but for a generic test, we check for its presence.
      await expect(nextSlideButton).not.toBeHidden();
    });
  });
});