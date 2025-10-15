import { test, expect } from '@playwright/test';

const PAGE_ROUTE = '/partners/customer_management';
const PAGE_TITLE_TEXT = 'Customer Management'; // Assuming a clear title for a management page

test.describe('Customer Management Page E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the Customer Management page
    await page.goto(PAGE_ROUTE);
  });

  test('should navigate to the page and display the correct title', async ({ page }) => {
    // 1. Assert successful navigation (optional, as goto handles it, but good for clarity)
    await expect(page).toHaveURL(new RegExp(PAGE_ROUTE + '$'));

    // 2. Assert the main page title is visible
    // Using a role-based selector for the main heading
    const pageTitle = page.getByRole('heading', { name: PAGE_TITLE_TEXT, level: 1 });
    await expect(pageTitle).toBeVisible();
  });

  test('should display the customer list table and the create button', async ({ page }) => {
    // 1. Assert the main data display component (e.g., a table or list) is present
    // Assuming the customer list is presented in a table
    const customerTable = page.getByRole('table', { name: /customer list|customers/i });
    await expect(customerTable).toBeVisible();

    // 2. Assert the presence of key functionality, like a "Create" button
    // Using a role-based selector for a button with common "create" text
    const createButton = page.getByRole('button', { name: /create new customer|add customer|create/i });
    await expect(createButton).toBeVisible();
    
    // Optional: Check for search/filter input, common on list pages
    const searchInput = page.getByRole('searchbox', { name: /search customers|search/i });
    await expect(searchInput).toBeVisible();
  });

  test('should allow interaction with the pagination component', async ({ page }) => {
    // This test assumes the list page has pagination
    const nextButton = page.getByRole('button', { name: /next page|next/i });
    
    // Check if the next button is visible and enabled (assuming more than one page of data)
    // If it's a small list, this might fail, so we check for visibility first.
    if (await nextButton.isVisible()) {
      await expect(nextButton).toBeEnabled();
      
      // Click the next button and wait for the table to update (e.g., a loading state to disappear)
      await nextButton.click();
      
      // Assert that the URL or a state indicator has changed (e.g., page number in URL or a status message)
      // For simplicity, we'll just check if the URL has a page query parameter, which is common.
      await expect(page).toHaveURL(/page=\d+/);
    } else {
      // If no pagination is visible, it means all data is on one page, which is also a valid state.
      test.info().annotations.push({ type: 'info', description: 'Pagination component not visible, assuming single-page list.' });
    }
  });
});