import { test, expect } from '@playwright/test';

const PAGE_ROUTE = '/dashboard/slide-20';

test.describe('Dashboard Slide 20 Page E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the specific dashboard slide page
    await page.goto(PAGE_ROUTE);
  });

  test('should navigate to the page successfully and display the main heading', async ({ page }) => {
    // 1. Navigation Check
    await expect(page).toHaveURL(PAGE_ROUTE);
    
    // 2. Visibility Check: Main Heading/Title
    // Assuming the page has a main heading (h1 or h2) that describes the content.
    // Using a role selector for robustness.
    const mainHeading = page.getByRole('heading', { name: /Slide 20|Dashboard View/i }).first();
    await expect(mainHeading).toBeVisible();
    
    // 3. Visibility Check: Page Title in the browser tab
    await expect(page).toHaveTitle(/Slide 20|Dashboard/i);
  });

  test('should display key dashboard components', async ({ page }) => {
    // 4. Functionality/Component Check: Main Content Area
    // Check for a main content area or a primary widget, which is typical for a dashboard slide.
    // We use a generic role like 'main' or 'region' for the primary content container.
    const mainContent = page.getByRole('main');
    await expect(mainContent).toBeVisible();

    // 5. Functionality/Component Check: A specific, important widget (e.g., a chart or data summary)
    // Assuming a dashboard slide contains at least one significant data visualization or summary card.
    // Look for a common element like a 'region' or a 'figure' that might represent a widget.
    const primaryWidget = page.getByRole('region').or(page.getByRole('figure')).first();
    await expect(primaryWidget).toBeVisible();
  });

  test('should display the application navigation bar', async ({ page }) => {
    // 6. Robustness Check: Global Navigation
    // Check for the presence of a global navigation element, which should be on every page.
    const navBar = page.getByRole('navigation');
    await expect(navBar).toBeVisible();
  });
});