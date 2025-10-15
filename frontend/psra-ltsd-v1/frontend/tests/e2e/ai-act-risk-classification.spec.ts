import { test, expect } from '@playwright/test';

const PAGE_ROUTE = '/compliance/ai-act/risk_classification';
const PAGE_TITLE = 'AI Act Risk Classification';

test.describe('AI Act Risk Classification Page', () => {
  test('should navigate to the page and verify key elements', async ({ page }) => {
    // 1. Navigation
    await test.step('Navigate to the AI Act Risk Classification page', async () => {
      await page.goto(PAGE_ROUTE);
      // Wait for the main content to load
      await page.waitForLoadState('networkidle');
    });

    // 2. Visibility and Content Verification
    await test.step('Verify page title and main heading', async () => {
      // Check the document title
      await expect(page).toHaveTitle(new RegExp(PAGE_TITLE));

      // Check for a main heading on the page
      const mainHeading = page.getByRole('heading', { name: PAGE_TITLE, level: 1 });
      await expect(mainHeading).toBeVisible();
    });

    // 3. Functionality/Structure Verification (Inferred)
    await test.step('Verify the presence of the main classification component', async () => {
      // The page is likely a form or a display for the classification process.
      // We look for a common container or a button that initiates the process.

      // Check for a main content area (e.g., a form or a dashboard card)
      const mainContentArea = page.getByRole('main');
      await expect(mainContentArea).toBeVisible();

      // Check for a button or link that might be used to start/submit the classification
      // Using a generic name, as the exact text is unknown.
      const classificationButton = page.getByRole('button', { name: /Classify|Submit|Start Assessment/i });
      // We expect at least one of these to be present, or a form to be visible.
      // If the button is not visible, we check for a form or a specific section.
      const formOrSection = page.getByRole('form', { name: /Risk Classification/i })
        .or(page.getByTestId('risk-classification-section'));

      await expect(classificationButton.or(formOrSection)).toBeVisible();
    });

    // 4. Robustness: Check for the presence of a common navigation element (e.g., a sidebar or header)
    await test.step('Verify the presence of the application navigation bar', async () => {
      const navBar = page.getByRole('navigation', { name: /Main|Primary/i });
      await expect(navBar).toBeVisible();
    });
  });
});