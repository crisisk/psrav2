import { test, expect } from '@playwright/test';

const DASHBOARD_ROUTE = '/compliance/ai-act/ai_compliance_dashboard';
const DASHBOARD_TITLE = 'AI Act Compliance Dashboard';

test.describe('AI Act Compliance Dashboard E2E Tests', () => {
  test('should navigate to the dashboard and verify key components', async ({ page }) => {
    // 1. Navigation: Navigate to the correct route
    await test.step('Navigate to the AI Compliance Dashboard', async () => {
      await page.goto(DASHBOARD_ROUTE);
      // Wait for the page to load and settle
      await page.waitForLoadState('networkidle');
    });

    // 2. Visibility: Assert that key elements are visible
    await test.step('Verify the main dashboard title is visible', async () => {
      // Use role-based selector for a main heading
      const mainTitle = page.getByRole('heading', { name: DASHBOARD_TITLE, level: 1 });
      await expect(mainTitle).toBeVisible();
    });

    // 3. Functionality/Robustness: Check for typical dashboard elements
    await test.step('Verify the presence of key dashboard components', async () => {
      // Check for a main dashboard container (assuming a common test-id or role)
      const dashboardContainer = page.locator('[data-testid="ai-compliance-dashboard"]');
      await expect(dashboardContainer).toBeVisible();

      // Check for at least one key metric card (e.g., total AI systems)
      // Assuming metric cards have a common structure or test-id
      const metricCard = page.locator('[data-testid="metric-card-total-systems"]');
      await expect(metricCard).toBeVisible();
      
      // Check for a primary data visualization (e.g., a chart or graph)
      // Assuming charts are identifiable by a role or test-id
      const primaryChart = page.locator('[data-testid="compliance-status-chart"]');
      await expect(primaryChart).toBeVisible();

      // Check for a navigation element or link related to the AI Act
      const aiActLink = page.getByRole('link', { name: 'AI Act Regulations' });
      await expect(aiActLink).toBeVisible();
    });
  });
});