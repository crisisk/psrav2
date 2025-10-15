import { test, expect } from '@playwright/test';

const ONBOARDING_STEP_1_ROUTE = '/onboarding/step-1';

test.describe('Onboarding Step 1 Page E2E Tests', () => {
  test('should load the page and display the initial onboarding step elements', async ({ page }) => {
    // 1. Navigation: Navigate to the correct route
    await test.step('Navigate to Onboarding Step 1', async () => {
      await page.goto(ONBOARDING_STEP_1_ROUTE);
      // Wait for the main content to be visible
      await expect(page.getByRole('main')).toBeVisible();
    });

    // 2. Visibility: Assert that key elements are visible
    await test.step('Verify key elements are visible', async () => {
      // Check for a main heading, likely indicating the step or process title
      // Using a common pattern for a page title in an onboarding flow
      const pageTitle = page.getByRole('heading', { level: 1 });
      await expect(pageTitle).toBeVisible();
      // Optional: Check for a specific title text if known, e.g., 'Welcome' or 'Step 1 of X'
      // await expect(pageTitle).toHaveText(/Step 1/i);

      // Check for the step indicator or progress bar (if present)
      const stepIndicator = page.getByTestId('onboarding-step-indicator');
      await expect(stepIndicator).toBeVisible();

      // Check for the main content area, which should contain the form/selection
      const contentArea = page.getByRole('region', { name: /onboarding step content/i });
      await expect(contentArea).toBeVisible();
    });

    // 3. Functionality: Check for form elements and navigation buttons
    await test.step('Verify navigation controls are present', async () => {
      // Check for the primary action button to proceed to the next step
      const nextButton = page.getByRole('button', { name: /next|continue/i });
      await expect(nextButton).toBeVisible();
      await expect(nextButton).toBeEnabled(); // Should be enabled if no required input yet, or disabled if input is required

      // Check for a 'Back' or 'Skip' button, common in multi-step forms
      const backButton = page.getByRole('button', { name: /back|previous/i });
      // On step 1, a back button might be hidden or lead to a different page (e.g., dashboard)
      // We assert its presence if it's a standard component, or its absence if it's the first step
      // Assuming a standard flow where 'Back' is present but might be disabled or navigate away
      if (await backButton.isVisible()) {
        await expect(backButton).toBeVisible();
      } else {
        // If no back button, check for a 'Skip' or 'Exit' button
        const skipButton = page.getByRole('button', { name: /skip|exit/i });
        await expect(skipButton).toBeVisible();
      }
    });

    // 4. Robustness: Example of interacting with a potential form element
    await test.step('Verify form interaction (if applicable)', async () => {
      // Since we don't know the exact content, we check for a generic input field
      const inputField = page.getByRole('textbox').first();
      if (await inputField.isVisible()) {
        await inputField.fill('Test Data');
        await expect(inputField).toHaveValue('Test Data');
      }
    });
  });

  // Additional test case: Check for responsiveness or error states could be added here
});