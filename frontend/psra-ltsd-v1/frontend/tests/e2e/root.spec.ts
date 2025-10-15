import { test, expect } from '@playwright/test';

// Define the base URL for the application, which should be configured in playwright.config.ts
const ROOT_ROUTE = '/';

test.describe('Root Page (Dashboard)', () => {
  // Use test.beforeEach to navigate to the page before each test in this suite
  test.beforeEach(async ({ page }) => {
    await page.goto(ROOT_ROUTE);
  });

  test('should navigate to the root route and display the main dashboard structure', async ({ page }) => {
    // 1. Navigation Assertion
    // Check that the URL is correct after navigation
    await expect(page).toHaveURL(ROOT_ROUTE);

    // 2. Visibility: Check for key structural elements common to a SaaS dashboard.

    // Check for the main application title/logo (e.g., in a header/navbar)
    // Assuming the application name "PSRA-LTSD" or a similar title is present.
    // Using a role-based selector for a heading or a test-id for the logo.
    const appTitle = page.getByRole('heading', { name: /PSRA-LTSD|Dashboard/i }).first();
    await expect(appTitle).toBeVisible();

    // Check for the main navigation bar (Sidebar or Top Nav)
    const navBar = page.getByRole('navigation');
    await expect(navBar).toBeVisible();

    // Check for the main content area, which should contain the dashboard widgets
    // Using a test-id is ideal here, but a generic role like 'main' is a good fallback.
    const mainContent = page.getByRole('main');
    await expect(mainContent).toBeVisible();

    // 3. Functionality/Content: Check for typical dashboard elements.

    // Check for a welcome message or user-specific greeting
    const welcomeMessage = page.getByText(/Welcome|Hello|Overview/i).first();
    await expect(welcomeMessage).toBeVisible();

    // Check for at least one key dashboard widget/card (e.g., a card summarizing data)
    // Assuming dashboard widgets are often represented by a generic 'region' or 'article' role.
    const dashboardWidget = page.getByRole('region').or(page.getByRole('article')).first();
    await expect(dashboardWidget).toBeVisible();

    // Check for a link to a major section, e.g., 'Certificates' or 'Reports'
    const majorLink = page.getByRole('link', { name: /Certificates|Reports|Shipments/i }).first();
    await expect(majorLink).toBeVisible();
  });

  test('should ensure the primary navigation links are functional', async ({ page }) => {
    // This test ensures that the main navigation links are present and clickable.
    // It doesn't navigate away, but asserts the link is correctly formed.

    // Check for a link to the 'Certificates' list page
    const certificatesLink = page.getByRole('link', { name: /Certificates/i });
    await expect(certificatesLink).toBeVisible();
    // Assert the link points to the expected route
    await expect(certificatesLink).toHaveAttribute('href', /certificates\/list/);

    // Check for a link to the 'Reports' page
    const reportsLink = page.getByRole('link', { name: /Reports/i });
    await expect(reportsLink).toBeVisible();
    await expect(reportsLink).toHaveAttribute('href', /reports/);
  });
});