import { test, expect } from '@playwright/test';

const PAGE_ROUTE = '/compliance/ai-act/emissions_data_collection';
const PAGE_TITLE_TEXT = 'Emissions Data Collection';

test.describe('AI Act Emissions Data Collection Page', () => {
  test('should navigate to the page and verify key elements', async ({ page }) => {
    // 1. Navigation
    await test.step('Navigate to the Emissions Data Collection page', async () => {
      await page.goto(PAGE_ROUTE);
      // Wait for the page to fully load and settle
      await page.waitForLoadState('networkidle');
    });

    // 2. Visibility and Content
    await test.step('Verify page title and main heading', async () => {
      // Check the document title
      await expect(page).toHaveTitle(new RegExp(PAGE_TITLE_TEXT));

      // Check for the main heading using role-based selector
      const mainHeading = page.getByRole('heading', { name: PAGE_TITLE_TEXT, level: 1 });
      await expect(mainHeading).toBeVisible();
    });

    // 3. Functionality (Inferred: Data Collection/Form)
    await test.step('Verify the presence of the main data collection component', async () => {
      // Check for a main content area or a form element
      // Using a generic main role or a form role as a robust check
      const mainContent = page.getByRole('main');
      await expect(mainContent).toBeVisible();

      // Check for a form or a section that implies data entry/management
      // This assumes the page contains a form for data collection or a table for management.
      const formOrTable = page.getByRole('form').or(page.getByRole('table'));
      await expect(formOrTable).toBeVisible();
      
      // Check for a primary action button, e.g., "Save", "Submit", or "Upload"
      const primaryButton = page.getByRole('button', { name: /save|submit|upload/i });
      await expect(primaryButton).toBeVisible();
    });

    // 4. Robustness Check: Ensure a common element like a navigation bar is present
    await test.step('Verify application-wide navigation bar is visible', async () => {
      const navBar = page.getByRole('navigation');
      await expect(navBar).toBeVisible();
    });
  });
});