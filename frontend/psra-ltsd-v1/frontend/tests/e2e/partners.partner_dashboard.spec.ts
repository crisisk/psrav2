import { test, expect } from '@playwright/test';

// Define the route for the Partner Dashboard page
const PARTNER_DASHBOARD_ROUTE = '/partners/partner_dashboard';

test.describe('Partner Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the Partner Dashboard page
    await page.goto(PARTNER_DASHBOARD_ROUTE);
  });

  test('should navigate to the Partner Dashboard and display the main title', async ({ page }) => {
    // 1. Assert successful navigation (check URL)
    await expect(page).toHaveURL(PARTNER_DASHBOARD_ROUTE);

    // 2. Assert the main page title is visible
    // Using role 'heading' with level 1 for the main page title
    const pageTitle = page.getByRole('heading', { name: 'Partner Dashboard', level: 1 });
    await expect(pageTitle).toBeVisible();
  });

  test('should display key dashboard summary cards', async ({ page }) => {
    // Dashboards typically have summary cards for KPIs. We check for common ones.
    // Using a generic role for a card or section, and checking for common labels.

    // Expect a section or card for "Total Certificates"
    const totalCertificatesCard = page.getByRole('region', { name: /Total Certificates|Certificates Summary/i });
    await expect(totalCertificatesCard).toBeVisible();

    // Expect a section or card for "Pending Approvals"
    const pendingApprovalsCard = page.getByRole('region', { name: /Pending Approvals|Approvals Required/i });
    await expect(pendingApprovalsCard).toBeVisible();

    // Expect a section or card for "Recent Activity" or "Latest Submissions"
    const recentActivitySection = page.getByRole('region', { name: /Recent Activity|Latest Submissions/i });
    await expect(recentActivitySection).toBeVisible();
  });

  test('should display the main navigation bar', async ({ page }) => {
    // Assert that the main application navigation is present
    const navBar = page.getByRole('navigation', { name: /main|primary/i });
    await expect(navBar).toBeVisible();
  });

  test('should contain a link to create a new certificate or submission', async ({ page }) => {
    // Dashboards often have a quick action button for the primary task.
    const createButton = page.getByRole('link', { name: /Create New|New Submission|New Certificate/i });
    // We use a soft assertion here as the button might be in the navigation or on the dashboard itself.
    await expect(createButton).toBeVisible();
  });
});
