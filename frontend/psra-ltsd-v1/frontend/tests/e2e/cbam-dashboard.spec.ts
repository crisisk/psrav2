import { test, expect } from '@playwright/test';

const CBAM_DASHBOARD_ROUTE = '/compliance/cbam/dashboard';

test.describe('CBAM Dashboard Page E2E Tests', () => {
  test('should navigate to the CBAM Dashboard and verify key elements', async ({ page }) => {
    // 1. Navigation
    await test.step('Navigate to the CBAM Dashboard route', async () => {
      await page.goto(CBAM_DASHBOARD_ROUTE);
      // Wait for the page to load and settle
      await page.waitForLoadState('networkidle');
    });

    // 2. Visibility and Content Verification
    await test.step('Verify the main page title is visible', async () => {
      // Assuming the main title is an h1 with the text "CBAM Dashboard" or similar
      const pageTitle = page.getByRole('heading', { name: 'CBAM Dashboard', level: 1 });
      await expect(pageTitle).toBeVisible();
    });

    await test.step('Verify the presence of a main content area or layout', async () => {
      // Check for a main container element, often a <main> or a div with a specific role/test-id
      const mainContent = page.getByRole('main');
      await expect(mainContent).toBeVisible();
    });

    // 3. Functionality (Dashboard-specific checks)
    await test.step('Verify key dashboard components (KPI cards) are visible', async () => {
      // Dashboards typically have summary cards (KPIs) at the top.
      // We'll look for a generic element that represents a summary card or widget.
      // Using a generic selector and expecting at least a few to be present.
      const kpiCards = page.getByRole('region', { name: /summary|kpi|metric/i });
      // Expect at least 3 summary cards to be present, which is common for dashboards
      await expect(kpiCards).toHaveCount(3);
    });

    await test.step('Verify the presence of a primary data visualization (chart)', async () => {
      // Check for a common chart container, often identified by a role or a title.
      const primaryChart = page.getByRole('heading', { name: /Emissions Over Time|Compliance Status|CBAM Liability/i });
      await expect(primaryChart).toBeVisible();
      // Optionally, check for the chart canvas itself, if applicable
      // await expect(page.locator('.chart-container')).toBeVisible();
    });

    await test.step('Verify the presence of a filter or date selection component', async () => {
      // Dashboards usually have a way to filter the data, e.g., by date range or entity.
      const filterButton = page.getByRole('button', { name: /Filter|Date Range|Select Period/i });
      await expect(filterButton).toBeVisible();
    });

    // 4. Robustness Check (e.g., checking for a common navigation element)
    await test.step('Verify the main application navigation is present', async () => {
      const navBar = page.getByRole('navigation', { name: 'Main' });
      await expect(navBar).toBeVisible();
    });
  });
});