import { test, expect } from '@playwright/test';

// Define the route for the Bulk Approval page
const BULK_APPROVAL_ROUTE = '/certificates/bulk_approval';
const PAGE_TITLE_TEXT = 'Bulk Certificate Approval';

test.describe('Certificates Bulk Approval Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the bulk approval route
    await page.goto(BULK_APPROVAL_ROUTE);
    // Assuming a successful navigation and page load
    await expect(page).toHaveURL(new RegExp(BULK_APPROVAL_ROUTE));
  });

  test('should display the correct page title and main heading', async ({ page }) => {
    // 1. Check for the main page heading
    const mainHeading = page.getByRole('heading', { name: PAGE_TITLE_TEXT, level: 1 });
    await expect(mainHeading).toBeVisible();

    // 2. Check for the page title in the document head
    await expect(page).toHaveTitle(/Bulk Certificate Approval/);
  });

  test('should display the list/table of certificates and selection mechanism', async ({ page }) => {
    // 1. Check for a container that holds the list or table of items
    // Using a generic role for a data grid or table
    const certificateList = page.getByRole('grid', { name: /Certificates pending approval/i });
    await expect(certificateList).toBeVisible();

    // 2. Check for at least one row/item in the list (assuming data is present)
    // This is a common pattern for checking if the list is populated
    const firstListItem = certificateList.getByRole('row').first();
    // We expect more than just the header row, so we check for the second row
    await expect(certificateList.getByRole('row').nth(1)).toBeVisible();

    // 3. Check for a selection mechanism (e.g., a checkbox) on the first item
    const firstItemCheckbox = firstListItem.getByRole('checkbox').first();
    await expect(firstItemCheckbox).toBeVisible();
  });

  test('should display the primary bulk action button', async ({ page }) => {
    // Check for the primary action button, likely "Approve Selected" or "Submit"
    const approveButton = page.getByRole('button', { name: /Approve Selected|Submit Bulk Approval/i });
    await expect(approveButton).toBeVisible();
    // The button should be disabled by default if no items are selected
    await expect(approveButton).toBeDisabled();
  });

  test('should enable the bulk action button when an item is selected', async ({ page }) => {
    // 1. Check for the list container
    const certificateList = page.getByRole('grid', { name: /Certificates pending approval/i });
    await expect(certificateList).toBeVisible();

    // 2. Select the first item by clicking its checkbox
    const firstItemCheckbox = certificateList.getByRole('row').nth(1).getByRole('checkbox').first();
    await firstItemCheckbox.click();

    // 3. Check if the primary action button is now enabled
    const approveButton = page.getByRole('button', { name: /Approve Selected|Submit Bulk Approval/i });
    await expect(approveButton).toBeEnabled();
  });
});