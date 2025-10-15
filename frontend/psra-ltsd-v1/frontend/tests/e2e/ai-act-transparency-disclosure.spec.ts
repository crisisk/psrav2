import { test, expect } from '@playwright/test';

const PAGE_ROUTE = '/compliance/ai-act/transparency_disclosure';
const PAGE_TITLE_REGEX = /AI Act Transparency Disclosure/i;

test.describe('AI Act Transparency Disclosure Page', () => {
  test('should navigate to the page and verify key elements', async ({ page }) => {
    // 1. Navigation
    await test.step('Navigate to the Transparency Disclosure page', async () => {
      await page.goto(PAGE_ROUTE);
      // Wait for the page to load and settle
      await page.waitForLoadState('networkidle');
    });

    // 2. Visibility and Content Assertion
    await test.step('Verify page title and main heading', async () => {
      // Check the document title
      await expect(page).toHaveTitle(PAGE_TITLE_REGEX);

      // Check for a main heading on the page
      const mainHeading = page.getByRole('heading', { name: PAGE_TITLE_REGEX, level: 1 });
      await expect(mainHeading).toBeVisible();
    });

    // 3. Functionality/Structure Assertion
    await test.step('Verify the presence of the main content/form area', async () => {
      // Assuming the main content is within a section or main element
      const mainContentArea = page.locator('main');
      await expect(mainContentArea).toBeVisible();

      // Check for a section that would contain the disclosure information or form
      // Using a generic role like 'region' or 'form' as a robust selector
      const disclosureSection = page.getByRole('region', { name: /disclosure|transparency|form/i }).or(page.getByRole('form'));
      await expect(disclosureSection).toBeVisible();
      
      // Since it's a disclosure page, check for a key piece of text or a button
      // For example, a button to submit disclosure or a link to documentation
      const submitButton = page.getByRole('button', { name: /submit|save|disclose/i });
      const infoLink = page.getByRole('link', { name: /documentation|guidance/i });

      // Assert that at least one of the expected functional elements is present
      await expect(submitButton.or(infoLink)).toBeVisible();
    });

    // 4. Robustness: Check for common application elements (e.g., navigation bar)
    await test.step('Verify the presence of the application navigation bar', async () => {
      const navBar = page.getByRole('navigation');
      await expect(navBar).toBeVisible();
    });
  });
});