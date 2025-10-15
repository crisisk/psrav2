import { test, expect } from '@playwright/test';

const PAGE_ROUTE = '/compliance/ai-act/conformity_assessment';
const PAGE_TITLE = 'AI Act Conformity Assessment';

test.describe('AI Act Conformity Assessment Page', () => {
  test('should navigate to the page and verify key elements', async ({ page }) => {
    // 1. Navigation
    await test.step('Navigate to the Conformity Assessment page', async () => {
      await page.goto(PAGE_ROUTE);
      // Wait for the main content to load
      await page.waitForLoadState('networkidle');
    });

    // 2. Visibility and Content Verification
    await test.step('Verify page title and main heading', async () => {
      // Check for the document title
      await expect(page).toHaveTitle(new RegExp(PAGE_TITLE));

      // Check for the main heading using role-based selector
      const mainHeading = page.getByRole('heading', { name: PAGE_TITLE, level: 1 });
      await expect(mainHeading).toBeVisible();
    });

    // 3. Functionality/Structure Verification (Inferred)
    await test.step('Verify the presence of the main compliance workflow container', async () => {
      // Assuming a main content area or container for the assessment workflow
      const mainContent = page.getByRole('main');
      await expect(mainContent).toBeVisible();

      // Check for a common element in a compliance/workflow page, e.g., a "Start Assessment" button or a "Summary" section.
      // Using a generic text search for robustness in a large application.
      const startButton = page.getByRole('button', { name: /Start Assessment|New Assessment/i });
      const summarySection = page.getByText(/Assessment Status|Compliance Summary/i);

      // Assert that at least one key action or information element is present
      await expect(startButton.or(summarySection)).toBeVisible();
    });

    // 4. Robustness: Check for common layout elements (e.g., a persistent navigation bar)
    await test.step('Verify common layout elements', async () => {
      // Assuming a global navigation or sidebar is present
      const navBar = page.getByRole('navigation');
      await expect(navBar).toBeVisible();
    });
  });
});