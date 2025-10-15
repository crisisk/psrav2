import { test, expect } from '@playwright/test';

// Define the route for the home page
const HOME_ROUTE = '/';

test.describe('Home Page E2E Tests', () => {
  test('should navigate to the home page and verify key elements', async ({ page }) => {
    // 1. Navigation: Navigate to the correct route
    await test.step('Navigate to the Home Page', async () => {
      await page.goto(HOME_ROUTE);
      // Wait for the page to load completely
      await page.waitForLoadState('networkidle');
    });

    // 2. Visibility: Assert that key elements are visible
    await test.step('Verify Page Title and URL', async () => {
      // Assuming the home page title is "PSRA-LTSD | Home" or similar
      await expect(page).toHaveTitle(/PSRA-LTSD/);
      await expect(page).toHaveURL(HOME_ROUTE);
    });

    await test.step('Verify Main Heading and Content', async () => {
      // Check for a main heading (e.g., h1) which is a key indicator of content loading
      const mainHeading = page.getByRole('heading', { level: 1 });
      await expect(mainHeading).toBeVisible();
      // Optionally, check for non-empty text in the heading
      await expect(mainHeading).not.toBeEmpty();
    });

    await test.step('Verify Primary Call-to-Action (CTA) Button', async () => {
      // Check for a primary button, which is common on a landing page
      // Using a generic role selector for robustness, assuming a "Get Started" or "Login" button
      const ctaButton = page.getByRole('button', { name: /get started|login|sign in/i }).first();
      await expect(ctaButton).toBeVisible();
      await expect(ctaButton).toBeEnabled();
    });

    await test.step('Verify Navigation Bar or Header', async () => {
      // Check for the presence of a navigation bar or header element
      const header = page.getByRole('banner');
      await expect(header).toBeVisible();

      // Check for a common navigation link, e.g., "About" or "Features"
      const navLink = page.getByRole('link', { name: /about|features|contact/i }).first();
      await expect(navLink).toBeVisible();
    });
  });
});