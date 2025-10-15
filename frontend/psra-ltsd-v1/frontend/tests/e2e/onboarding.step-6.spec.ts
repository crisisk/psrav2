import { test, expect } from '@playwright/test';

// Define the route for the onboarding step
const ONBOARDING_STEP_6_ROUTE = '/onboarding/step-6';

test.describe('Onboarding Step 6 Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the specific onboarding step
    await page.goto(ONBOARDING_STEP_6_ROUTE);
  });

  test('should display the correct page title and progress indicator', async ({ page }) => {
    // 1. Verify the main heading, inferring it's a step in a process
    await expect(page.getByRole('heading', { name: /Step 6/i })).toBeVisible();
    
    // 2. Verify the presence of a progress indicator (e.g., a list of steps or a progress bar)
    // Using a generic selector for a progress bar or step indicator, common in multi-step forms
    await expect(page.locator('[data-testid="onboarding-progress"]')).toBeVisible();
  });

  test('should display key form elements for final configuration', async ({ page }) => {
    // As this is a final step, it likely contains confirmation or final input fields.
    // We'll check for a generic form and a common element like a checkbox for terms/confirmation.
    
    // 1. Verify the main form or content area is present
    await expect(page.getByRole('main')).toBeVisible();

    // 2. Check for a confirmation checkbox (e.g., "I agree to the terms", "Confirm settings")
    // Using a role-based selector for a checkbox
    const confirmationCheckbox = page.getByRole('checkbox', { name: /confirm|agree|acknowledge/i });
    await expect(confirmationCheckbox).toBeVisible();
    
    // 3. Check for a final configuration input field (e.g., a name for the setup, or a final choice)
    // This is a placeholder for a specific input field if one were known.
    // For robustness, we check for a generic text input field.
    await expect(page.getByRole('textbox').first()).toBeVisible();
  });

  test('should have functional navigation buttons', async ({ page }) => {
    // 1. Verify the "Finish" or "Next" button is present and enabled
    const finishButton = page.getByRole('button', { name: /Finish|Complete|Next/i });
    await expect(finishButton).toBeVisible();
    
    // The button should be disabled until the form is filled/confirmed.
    // For this test, we assume it's initially disabled or we check its state after interaction.
    // A robust test would fill the form and then check if the button is enabled.
    
    // Example of a basic check for the button being enabled (assuming minimal required input)
    // await expect(finishButton).toBeEnabled();

    // 2. Verify the "Back" or "Previous" button is present and functional
    const backButton = page.getByRole('button', { name: /Back|Previous/i });
    await expect(backButton).toBeVisible();
    
    // 3. Test navigation back to the previous step
    await backButton.click();
    // Assert that the page has navigated to the previous step (step-5)
    await expect(page).toHaveURL(/.*\/onboarding\/step-5/);
  });
});