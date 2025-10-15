import { test, expect } from '@playwright/test';

const TRACKER_ROUTE = '/compliance/ai-act/supplier_carbon_tracker';
const PAGE_TITLE_TEXT = 'Supplier Carbon Tracker';

test.describe('Supplier Carbon Tracker Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TRACKER_ROUTE);
  });

  test('should navigate to the correct route and display the main heading', async ({ page }) => {
    // 1. Navigation Check
    await expect(page).toHaveURL(new RegExp(TRACKER_ROUTE + '$'));

    // 2. Visibility Check: Main Title
    // Use role='heading' with level 1 or a specific text match for robustness
    const mainHeading = page.getByRole('heading', { name: PAGE_TITLE_TEXT, level: 1 });
    await expect(mainHeading).toBeVisible();
  });

  test('should display key compliance and data components', async ({ page }) => {
    // 1. Check for a main dashboard or data container
    const mainContent = page.getByRole('main');
    await expect(mainContent).toBeVisible();

    // 2. Check for a data visualization component (e.g., a chart or graph)
    // Assuming a common pattern like a container with a specific role or data-testid
    const carbonChart = page.getByRole('region', { name: /carbon data visualization/i }).or(page.locator('[data-testid="carbon-chart"]'));
    await expect(carbonChart).toBeVisible();

    // 3. Check for a data table to list suppliers or tracking details
    const dataTable = page.getByRole('table', { name: /supplier carbon data/i }).or(page.locator('[data-testid="supplier-data-table"]'));
    await expect(dataTable).toBeVisible();
    
    // Check for at least one row in the table (excluding header) to ensure data is loaded
    const tableRows = dataTable.locator('tbody tr');
    await expect(tableRows).not.toHaveCount(0);
  });

  test('should include filtering and search functionality', async ({ page }) => {
    // 1. Check for a search input field
    const searchInput = page.getByRole('searchbox', { name: /search supplier/i }).or(page.getByPlaceholder(/search supplier/i));
    await expect(searchInput).toBeVisible();

    // 2. Check for a filter button or dropdown (e.g., to filter by compliance status or date)
    const filterButton = page.getByRole('button', { name: /filter|options/i }).or(page.locator('[data-testid="filter-button"]'));
    await expect(filterButton).toBeVisible();
  });

  test('should allow interaction with the search input', async ({ page }) => {
    const searchInput = page.getByRole('searchbox', { name: /search supplier/i }).or(page.getByPlaceholder(/search supplier/i));
    
    // Simulate typing a search query
    const testQuery = 'EcoCorp';
    await searchInput.fill(testQuery);
    await expect(searchInput).toHaveValue(testQuery);
    
    // Clear the input
    await searchInput.clear();
    await expect(searchInput).toHaveValue('');
  });
});