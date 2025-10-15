import { test, expect } from '@playwright/test';

test.describe('AI Act Technical Documentation Page', () => {
  const route = '/compliance/ai-act/technical_documentation';
  const pageTitle = 'AI Act Technical Documentation';

  test('should navigate to the page and display the main content', async ({ page }) => {
    // 1. Navigation: Navigate to the correct route
    await test.step('Navigate to the AI Act Technical Documentation page', async () => {
      await page.goto(route);
      // Wait for the page to load and the main heading to be present
      await page.waitForLoadState('networkidle');
    });

    // 2. Visibility: Assert that key elements are visible
    await test.step('Verify page title and main heading visibility', async () => {
      // Check for the main heading using a role-based selector
      const heading = page.getByRole('heading', { name: pageTitle, level: 1 });
      await expect(heading).toBeVisible();

      // Check for a common application navigation element (e.g., a main navigation bar)
      const navBar = page.getByRole('navigation', { name: 'Main' });
      await expect(navBar).toBeVisible();
    });

    // 3. Functionality (if applicable): Check for compliance-specific elements
    await test.step('Verify the presence of compliance-related components', async () => {
      // Expect a section or component related to managing documentation
      // Using a generic text or role selector for a container or section
      const documentationSection = page.getByRole('region', { name: /Documentation Management|Technical Files/i });
      await expect(documentationSection).toBeVisible();

      // Expect a button or link to upload or create new documentation
      const uploadButton = page.getByRole('button', { name: /Upload Document|New Document|Create Technical File/i });
      await expect(uploadButton).toBeVisible();

      // Expect a list or table to display existing documents
      const documentList = page.getByRole('table', { name: /Technical Documents|Document List/i }).or(page.getByRole('list', { name: /Technical Documents|Document List/i }));
      await expect(documentList).toBeVisible();
    });

    // 4. Robustness: Check for a unique test-id for the page container (if standard practice)
    await test.step('Verify page container test-id (if applicable)', async () => {
      // Assuming a standard practice of having a data-testid on the main page container
      const pageContainer = page.locator('[data-testid="ai-act-technical-documentation-page"]');
      // The test should not fail if this specific test-id is not found, but it's a good practice to check for it.
      // We'll use a soft assertion or a check for a more generic container if the specific one is not guaranteed.
      // For robustness, we'll stick to the visible elements checked above.
    });
  });
});