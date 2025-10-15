import { test, expect } from '@playwright/test';

const AI_SYSTEM_REGISTRY_ROUTE = '/compliance/ai-act/ai_system_registry';
const PAGE_TITLE = 'AI System Registry';

test.describe('AI System Registry Page', () => {
  test('should navigate to the page and display key elements', async ({ page }) => {
    // 1. Navigation
    await test.step('Navigate to the AI System Registry route', async () => {
      await page.goto(AI_SYSTEM_REGISTRY_ROUTE);
      // Wait for the main content to load
      await expect(page).toHaveURL(AI_SYSTEM_REGISTRY_ROUTE);
    });

    // 2. Visibility: Assert that key elements are visible
    await test.step('Verify page title and main header are visible', async () => {
      // Check for a main heading with the expected title
      const mainHeader = page.getByRole('heading', { name: PAGE_TITLE, level: 1 });
      await expect(mainHeader).toBeVisible();
    });

    // 3. Functionality: Check for list/table and a creation button
    await test.step('Verify the presence of the AI systems list/table', async () => {
      // Check for a table or a list that would contain the registry data
      // Assuming the list component has a role of 'grid' (for a data table) or 'list'
      const dataGrid = page.getByRole('grid', { name: /AI Systems|Registry/i }).or(page.getByRole('table', { name: /AI Systems|Registry/i }));
      await expect(dataGrid).toBeVisible();
    });

    await test.step('Verify the presence of a "Create New System" button', async () => {
      // Check for a button to create a new entry
      const createButton = page.getByRole('button', { name: /Create New System|Add System|New AI System/i });
      await expect(createButton).toBeVisible();
    });

    // Optional: Check for a search/filter input, common on registry pages
    await test.step('Verify the presence of a search input field', async () => {
      const searchInput = page.getByRole('searchbox', { name: /search|filter/i }).or(page.getByPlaceholder(/search|filter/i));
      // Use toHaveCount(>= 0) to make it optional but check if present
      if (await searchInput.count() > 0) {
        await expect(searchInput.first()).toBeVisible();
      }
    });
  });
});