import { test, expect } from '@playwright/test';

const PAGE_ROUTE = '/partners/partner_settings';
const PAGE_TITLE = 'Partner Settings'; // Assuming a common title structure

test.describe('Partner Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the Partner Settings page
    await page.goto(PAGE_ROUTE);
  });

  test('should display the correct page title and main heading', async ({ page }) => {
    // 1. Check for the page title in the document head
    await expect(page).toHaveTitle(new RegExp(PAGE_TITLE));

    // 2. Check for the main heading on the page
    // Using role='heading' with level 1 is a robust way to find the main title
    const mainHeading = page.getByRole('heading', { name: PAGE_TITLE, level: 1 });
    await expect(mainHeading).toBeVisible();
  });

  test('should display key settings sections and configuration forms', async ({ page }) => {
    // Assuming the settings page is structured with distinct sections for different configurations.
    // Use role='heading' with level 2 or 3 to find section titles.

    // Example 1: General Information Section
    const generalSettingsSection = page.getByRole('heading', { name: /General Settings|Partner Information/i, level: 2 });
    await expect(generalSettingsSection).toBeVisible();

    // Example 2: API/Integration Settings Section
    const apiSettingsSection = page.getByRole('heading', { name: /API Settings|Integration/i, level: 2 });
    await expect(apiSettingsSection).toBeVisible();

    // Example 3: User Management/Permissions Section (if applicable)
    const userSettingsSection = page.getByRole('heading', { name: /User Management|Permissions/i, level: 2 });
    await expect(userSettingsSection).toBeVisible();
  });

  test('should display action buttons for saving and canceling changes', async ({ page }) => {
    // Check for the presence of the primary action button (Save/Update)
    const saveButton = page.getByRole('button', { name: /Save|Update|Apply/i });
    await expect(saveButton).toBeVisible();
    await expect(saveButton).toBeEnabled(); // Should be enabled by default or after changes

    // Check for the secondary action button (Cancel)
    const cancelButton = page.getByRole('button', { name: /Cancel|Discard/i });
    await expect(cancelButton).toBeVisible();
  });

  test('should ensure the main content area is loaded', async ({ page }) => {
    // A general check to ensure the main content container is present and not empty.
    // This assumes a common layout structure with a 'main' element.
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
    // A more specific check for a common element like a form or a tab list
    const formOrTabs = page.getByRole('form').or(page.getByRole('tablist'));
    await expect(formOrTabs).toBeVisible();
  });
});