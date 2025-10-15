import { test, expect } from '@playwright/test';

const ONBOARDING_STEP_2_ROUTE = '/onboarding/step-2';

test.describe('Onboarding Step 2 Page', () => {
  test('should navigate to the page and verify key elements', async ({ page }) => {
    // 1. Navigation: Navigate to the correct route
    await test.step('Navigate to Onboarding Step 2', async () => {
      await page.goto(ONBOARDING_STEP_2_ROUTE);
      // Assert that the URL is correct
      await expect(page).toHaveURL(new RegExp(ONBOARDING_STEP_2_ROUTE + '$'));
    });

    // 2. Visibility: Assert that key elements are visible
    await test.step('Verify page structure and content', async () => {
      // Check for a main heading indicating the step
      const pageTitle = page.getByRole('heading', { name: /Step 2/i });
      await expect(pageTitle).toBeVisible();
      
      // Check for the main content area (assuming a form or main section)
      const mainContent = page.getByRole('main');
      await expect(mainContent).toBeVisible();

      // Check for a progress indicator or step navigation (common in onboarding)
      const progressIndicator = page.getByRole('navigation', { name: /onboarding progress/i });
      // This is an optional check, but good for robustness in a multi-step flow
      // await expect(progressIndicator).toBeVisible(); 
    });

    // 3. Functionality: Check for form elements and navigation buttons
    await test.step('Verify form elements and navigation buttons', async () => {
      // Since this is a generic step 2, we check for common form elements
      // In a real application, these selectors would be more specific (e.g., for 'Company Name' input)
      
      // Check for at least one text input field (e.g., for data entry)
      const textInput = page.getByRole('textbox').first();
      await expect(textInput).toBeVisible();

      // Check for the primary action button to proceed to the next step
      const continueButton = page.getByRole('button', { name: /Continue|Next/i });
      await expect(continueButton).toBeVisible();
      await expect(continueButton).toBeEnabled(); // Should be enabled if form is valid or empty

      // Check for a back button or link to the previous step
      const backButton = page.getByRole('button', { name: /Back|Previous/i }).or(page.getByRole('link', { name: /Back|Previous/i }));
      await expect(backButton).toBeVisible();
    });
  });
});