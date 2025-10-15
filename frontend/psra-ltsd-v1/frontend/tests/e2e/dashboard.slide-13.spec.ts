import { test, expect } from '@playwright/test';

const ROUTE = '/dashboard/slide-13';

test.describe('Dashboard Slide 13 Page E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the specific dashboard slide page
    await page.goto(ROUTE);
  });

  test('should display the main content and page title', async ({ page }) => {
    // 1. Assert successful navigation and page title (assuming the page sets a title)
    await expect(page).toHaveURL(ROUTE);
    
    // Check for a generic page title or heading (e.g., role="heading" with level 1 or 2)
    // A robust application should have a clear, accessible main heading.
    const mainHeading = page.getByRole('heading', { level: 1 }).or(page.getByRole('heading', { level: 2 }));
    await expect(mainHeading).toBeVisible();
    
    // 2. Assert the main content area is visible
    // Assuming the main content is within a <main> tag or a container with a specific test-id
    const mainContent = page.getByRole('main').or(page.locator('[data-testid="slide-13-content"]'));
    await expect(mainContent).toBeVisible();

    // 3. Assert the presence of a common dashboard element, like a navigation bar or a slide container
    // This is a placeholder for a component that would be unique to a "slide" or "dashboard" view.
    const slideContainer = page.locator('[data-testid="dashboard-slide-container"]');
    await expect(slideContainer).toBeVisible();

    // 4. Check for a specific element that confirms the content is loaded, e.g., a chart or a key metric
    // Since it's "slide-13", it likely contains a visualization or a specific report.
    // We check for a generic chart/visualization container.
    const visualization = page.locator('[data-testid="slide-13-visualization"]').or(page.getByRole('img', { name: /chart|graph|diagram/i }));
    await expect(visualization).toBeVisible();
  });

  test('should have a functional back/navigation button if part of a sequence', async ({ page }) => {
    // Check for a button that allows navigation, common in multi-slide dashboards
    const backButton = page.getByRole('button', { name: /back|previous|vorige/i });
    
    // The button might not be visible on the first slide, but we check for its existence and visibility if present.
    if (await backButton.isVisible()) {
      await expect(backButton).toBeEnabled();
    }
  });
});
