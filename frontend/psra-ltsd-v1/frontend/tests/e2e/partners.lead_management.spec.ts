import { test, expect } from '@playwright/test';

const PAGE_ROUTE = '/partners/lead_management';
const PAGE_TITLE_TEXT = 'Lead Management'; // Assuming a common page title structure

test.describe('Partners Lead Management Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the Lead Management page
    await page.goto(PAGE_ROUTE);
  });

  test('should display the main page title and structure correctly', async ({ page }) => {
    // 1. Assert correct navigation and page title
    await expect(page).toHaveURL(PAGE_ROUTE);
    
    // Check for a main heading (e.g., h1) with the expected title text
    const pageTitle = page.getByRole('heading', { name: PAGE_TITLE_TEXT, level: 1 });
    await expect(pageTitle).toBeVisible();

    // 2. Assert visibility of key structural elements (e.g., main content area)
    // Assuming a main content area or a unique section for the lead management dashboard
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('should display the lead data grid and a create button', async ({ page }) => {
    // 3. Assert the presence of the main data display component (e.g., a data grid or table)
    // Using a generic role for a table or grid. A more specific test-id is preferred in a real app.
    const leadDataGrid = page.getByRole('grid', { name: /lead list|management table/i }).or(page.getByRole('table'));
    await expect(leadDataGrid).toBeVisible();

    // 4. Assert the presence of a functional element, like a "Create New Lead" button
    const createButton = page.getByRole('button', { name: /create new lead|add lead/i });
    await expect(createButton).toBeVisible();
    
    // Optional: Check for search/filter input field
    const searchInput = page.getByRole('searchbox').or(page.getByPlaceholder(/search leads|filter/i));
    await expect(searchInput).toBeVisible();
  });

  test('should ensure the page is fully loaded and interactive', async ({ page }) => {
    // Check for a common loading indicator to ensure it disappears
    // Assuming a loading spinner or progress bar is used
    const loadingIndicator = page.getByRole('progressbar').or(page.getByText(/loading/i));
    await expect(loadingIndicator).toBeHidden({ timeout: 10000 });

    // Check for the presence of the main navigation bar (assuming it's a persistent element)
    const navBar = page.getByRole('navigation', { name: /main|primary/i });
    await expect(navBar).toBeVisible();
  });
});