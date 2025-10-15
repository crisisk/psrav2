import { test, expect } from '@playwright/test';

const ROUTE = '/onboarding/step-10';
const FILENAME = 'onboarding.step-10.spec.ts';

test.describe(`E2E Test: ${ROUTE}`, () => {
  test('should navigate to the page and verify key elements are visible', async ({ page }) => {
    // 1. Navigation
    await test.step(`Navigate to ${ROUTE}`, async () => {
      await page.goto(ROUTE);
      // Wait for the page to load and the main content to be visible
      await page.waitForLoadState('networkidle');
    });

    // 2. Visibility and Content Assertions
    await test.step('Verify page title and main heading', async () => {
      // Assuming the page title is set correctly
      await expect(page).toHaveTitle(/Onboarding Step 10/i);

      // Check for a main heading that indicates the step
      // Using a role selector for robustness
      const mainHeading = page.getByRole('heading', { name: /Step 10/i, level: 1 });
      await expect(mainHeading).toBeVisible();
    });

    // 3. Functionality Check (Call-to-Action)
    await test.step('Verify the primary call-to-action button is present and enabled', async () => {
      // Onboarding steps typically have a "Next" or "Finish" button.
      // Using a role selector for a button with a common label.
      const ctaButton = page.getByRole('button', { name: /Next|Finish|Complete/i });
      
      // Assert the button is visible and enabled, ready for the user to proceed.
      await expect(ctaButton).toBeVisible();
      await expect(ctaButton).toBeEnabled();
    });

    // 4. Robustness Check (Optional: Check for a progress indicator or step navigation)
    await test.step('Verify the presence of an onboarding progress indicator', async () => {
      // Look for a common element like a progress bar or step list
      // Using a generic selector that might match a navigation or status element
      const progressIndicator = page.locator('[data-testid="onboarding-progress"], [aria-label="Onboarding progress"]');
      await expect(progressIndicator).toBeVisible();
    });
  });
});