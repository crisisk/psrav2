import { test, expect } from '@playwright/test';

test.describe('Certificates History Page', () => {
  const route = '/certificates/history';

  test('should navigate to the history page and display the main components', async ({ page }) => {
    // 1. Navigation
    await test.step('Navigate to the Certificates History route', async () => {
      await page.goto(route);
      // Wait for the page to load completely
      await page.waitForLoadState('networkidle');
    });

    // 2. Visibility and Key Elements
    await test.step('Verify page title and main header are visible', async () => {
      // Check for the main page title, using role 'heading' for robustness
      const pageTitle = page.getByRole('heading', { name: 'Certificate History', level: 1 });
      await expect(pageTitle).toBeVisible();
      
      // Check for a descriptive subtitle or breadcrumb (optional, but good practice)
      const breadcrumb = page.getByLabel('breadcrumb');
      await expect(breadcrumb).toBeVisible();
    });

    // 3. Functionality (History Log/Table)
    await test.step('Verify the history log or table is present', async () => {
      // A history page typically contains a log or a table of events.
      // We look for a table or a list that represents the history data.
      const historyTable = page.getByRole('table', { name: /history|log|audit/i }).or(page.getByTestId('history-log'));
      await expect(historyTable).toBeVisible();

      // Check for key columns/headers in the history table (e.g., Action, User, Timestamp)
      await expect(page.getByRole('columnheader', { name: 'Action' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'User' })).toBeVisible();
      await expect(page.getByRole('columnheader', { name: 'Timestamp' })).toBeVisible();
    });

    // 4. Robustness: Check for common UI elements in a SaaS application
    await test.step('Verify common application UI elements are present', async () => {
      // Check for the main application navigation bar
      const navBar = page.getByRole('navigation', { name: 'Main' });
      await expect(navBar).toBeVisible();

      // Check for a search or filter input, common on list/history pages
      const searchInput = page.getByRole('searchbox').or(page.getByPlaceholder(/search|filter/i));
      await expect(searchInput).toBeVisible();
    });
  });
});