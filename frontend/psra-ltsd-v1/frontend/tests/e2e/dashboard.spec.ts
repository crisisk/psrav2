import { test, expect } from '@playwright/test';

// Define the route for the dashboard page
const DASHBOARD_ROUTE = '/dashboard';

test.describe('Dashboard Page E2E Tests', () => {
  // Test 1: Verify successful navigation and page title
  test('should navigate to the dashboard and display the correct title', async ({ page }) => {
    await test.step('Navigate to the dashboard route', async () => {
      await page.goto(DASHBOARD_ROUTE);
      // Wait for the main content to load
      await page.waitForLoadState('networkidle');
    });

    await test.step('Verify the page URL and title', async () => {
      // Check that the URL is correct
      await expect(page).toHaveURL(new RegExp(\`\${DASHBOARD_ROUTE}$\`));
      // Check for a main heading or title, assuming "Dashboard" is a common title
      const mainHeading = page.getByRole('heading', { name: /dashboard|welcome/i, level: 1 });
      await expect(mainHeading).toBeVisible();
    });
  });

  // Test 2: Verify the presence of common SaaS application elements (e.g., navigation and main content area)
  test('should display essential application components', async ({ page }) => {
    await page.goto(DASHBOARD_ROUTE);
    await page.waitForLoadState('networkidle');

    await test.step('Verify the main navigation/sidebar is visible', async () => {
      // Look for a navigation element, common roles are 'navigation' or 'banner'
      const navBar = page.getByRole('navigation').or(page.getByRole('banner'));
      await expect(navBar).toBeVisible();
    });

    await test.step('Verify the main content area is present', async () => {
      // Look for the main content area, typically role='main'
      const mainContent = page.getByRole('main');
      await expect(mainContent).toBeVisible();
    });
  });

  // Test 3: Verify the presence of typical dashboard widgets/cards
  test('should display key performance indicator (KPI) widgets', async ({ page }) => {
    await page.goto(DASHBOARD_ROUTE);
    await page.waitForLoadState('networkidle');

    // Dashboard pages typically have cards or sections summarizing data.
    // We'll check for a few common ones by their role or a generic container.
    // Assuming key metrics are presented in distinct cards or groups.
    const dashboardCards = page.getByRole('region', { name: /summary|metrics|overview|widget/i }).or(page.locator('.dashboard-card'));

    await test.step('Verify at least three key dashboard widgets are present', async () => {
      // This is a heuristic check for a functional dashboard layout
      await expect(dashboardCards).toHaveCount(3, { timeout: 10000 });
    });

    await test.step('Verify a common widget like "Pending Tasks" or "Recent Activity" is visible', async () => {
      // Check for a specific, high-priority widget title
      const pendingTasksWidget = page.getByRole('heading', { name: /pending tasks|recent activity|alerts/i });
      await expect(pendingTasksWidget).toBeVisible();
    });
  });
});