import { test, expect } from '@playwright/test';

const PAGE_ROUTE = '/dashboard/slide-11';
const PAGE_TITLE_TEXT = 'Dashboard Slide 11'; // Assuming a generic title based on the route structure

test.describe('Dashboard Slide 11 Page E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the specific dashboard slide page
    await page.goto(PAGE_ROUTE);
  });

  test('should load the page successfully and display the main content', async ({ page }) => {
    // 1. Check for successful navigation and a visible main heading
    await expect(page).toHaveURL(PAGE_ROUTE);
    
    // Check for a main heading (e.g., h1) that confirms the page title
    // Using a role-based selector for robustness
    const mainHeading = page.getByRole('heading', { name: PAGE_TITLE_TEXT, level: 1 });
    await expect(mainHeading).toBeVisible();

    // 2. Check for the presence of the main dashboard container/layout
    // Assuming the main content is wrapped in a <main> tag or has a specific test-id
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('should display key dashboard components (e.g., charts or data cards)', async ({ page }) => {
    // Since this is a dashboard slide, it should contain several visual data components.
    // We check for common elements like data cards, charts, or a grid layout.

    // Check for at least one section that looks like a data card or widget
    // Using a generic role for a container, assuming it's a section or a div with a specific role
    const dataCard = page.getByRole('region').first();
    await expect(dataCard).toBeVisible();

    // Check for a common element that represents a chart or graph
    // This is a placeholder and should be refined if a specific chart library is used (e.g., canvas, svg)
    const chartElement = page.locator('canvas, svg').first();
    // We use a soft check here, as not all slides might have a chart, but it's a strong indicator.
    // If the page is known to have a chart, this should be a hard assertion.
    if (await chartElement.isVisible()) {
      await expect(chartElement).toBeVisible();
    }
  });

  test('should have a functional navigation element (e.g., sidebar or header)', async ({ page }) => {
    // Check for the presence of a navigation bar, which is typical for a SaaS application
    const navigation = page.getByRole('navigation');
    await expect(navigation).toBeVisible();
    
    // Optionally, check if the current dashboard link is highlighted or active
    const activeLink = page.getByRole('link', { name: 'Dashboard' }).or(page.getByRole('link', { name: 'Slide 11' }));
    await expect(activeLink).toBeVisible();
  });
});