import { test, expect } from '@playwright/test';

test.describe('Partner Onboarding Step 5 Page', () => {
  const ONBOARDING_STEP_5_ROUTE = '/partners/onboarding_step5';

  test('should navigate to the page and verify key elements', async ({ page }) => {
    // 1. Navigation: Navigate to the correct route
    await test.step('Navigate to Onboarding Step 5', async () => {
      await page.goto(ONBOARDING_STEP_5_ROUTE);
      // Assuming a successful navigation and a main content area is present
      await expect(page).toHaveURL(ONBOARDING_STEP_5_ROUTE);
    });

    // 2. Visibility: Assert that key elements are visible
    await test.step('Verify page title and step indicator', async () => {
      // Check for a main heading or title indicating the current step
      // Using a role-based selector for a heading, which is robust
      const pageTitle = page.getByRole('heading', { name: /Onboarding Step 5/i, level: 1 });
      await expect(pageTitle).toBeVisible();
      
      // Check for the main form or container for the step content
      const stepContainer = page.getByRole('main');
      await expect(stepContainer).toBeVisible();
    });

    // 3. Functionality: Check for form elements and navigation buttons
    await test.step('Verify form fields and navigation buttons', async () => {
      // Since this is a form step, check for at least one expected input field
      // Replace 'some-input-field-label' with an actual label or placeholder if known
      // Example: Check for a text input field (e.g., for document upload or final confirmation)
      const primaryInput = page.getByRole('textbox').first();
      await expect(primaryInput).toBeVisible();

      // Check for the "Next" or "Submit" button to proceed
      const nextButton = page.getByRole('button', { name: /Next|Submit|Complete/i });
      await expect(nextButton).toBeVisible();
      await expect(nextButton).toBeEnabled();

      // Check for the "Back" button to return to the previous step
      const backButton = page.getByRole('button', { name: /Back|Previous/i });
      await expect(backButton).toBeVisible();
    });
  });

  // Optional: Add a test to ensure the "Back" button works correctly
  test('should allow navigation back to the previous step', async ({ page }) => {
    await page.goto(ONBOARDING_STEP_5_ROUTE);

    const backButton = page.getByRole('button', { name: /Back|Previous/i });
    await expect(backButton).toBeVisible();

    // Click the back button
    await backButton.click();

    // Assert that the URL has changed to the expected previous step (Step 4)
    // This assumes the previous step is /partners/onboarding_step4
    await expect(page).not.toHaveURL(ONBOARDING_STEP_5_ROUTE);
    await expect(page).toHaveURL(/partners\/onboarding_step4/);
  });
});