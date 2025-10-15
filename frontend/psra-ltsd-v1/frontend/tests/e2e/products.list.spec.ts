import { test, expect } from '@playwright/test';

// Define the route for the Products List page
const PRODUCTS_LIST_ROUTE = '/products/list_page';
const PAGE_TITLE = 'Products List';

test.describe('Products List Page E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the Products List page
    await page.goto(PRODUCTS_LIST_ROUTE);
    // Wait for the main content to load
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to the Products List page and display the correct title', async ({ page }) => {
    // 1. Assert successful navigation and URL
    await expect(page).toHaveURL(new RegExp(`.*${PRODUCTS_LIST_ROUTE}`));

    // 2. Assert the main page title is visible
    // Using role 'heading' with level 1 for the main title is a robust practice
    const mainTitle = page.getByRole('heading', { name: PAGE_TITLE, level: 1 });
    await expect(mainTitle).toBeVisible();
  });

  test('should display the data table and search/filter controls', async ({ page }) => {
    // 1. Assert the presence of the main data table/grid
    // Assuming the table has a role 'grid' or 'table'
    const dataTable = page.getByRole('grid', { name: /products/i }).or(page.getByRole('table'));
    await expect(dataTable).toBeVisible();

    // 2. Assert the presence of a search input field
    const searchInput = page.getByRole('searchbox', { name: /search|filter/i }).or(page.getByPlaceholder(/search products/i));
    await expect(searchInput).toBeVisible();

    // 3. Assert that at least one product row is present (assuming non-empty state)
    // This checks for a row within the table/grid
    const firstRow = page.getByRole('row').nth(1); // Skip header row
    await expect(firstRow).toBeVisible();
  });

  test('should display the "Create New Product" button', async ({ page }) => {
    // 1. Assert the presence of the primary call-to-action button
    // Using role 'link' or 'button' with the name 'Create' or 'New' is robust
    const createButton = page.getByRole('link', { name: /create new product|add product/i }).or(page.getByRole('button', { name: /create new product|add product/i }));
    await expect(createButton).toBeVisible();
    
    // 2. Optional: Check if the button is enabled (ready to be clicked)
    await expect(createButton).toBeEnabled();
  });
});
