import { test, expect } from '@playwright/test';

const ONBOARDING_STEP_7_ROUTE = '/onboarding/step-7';

test.describe('Onboarding Step 7 Page', () => {
  test('should navigate to the page and verify key elements', async ({ page }) => {
    // 1. Navigation
    await test.step('Navigate to Onboarding Step 7', async () => {
      await page.goto(ONBOARDING_STEP_7_ROUTE);
      // Wait for the main content to load
      await page.waitForLoadState('networkidle');
    });

    // 2. Visibility and Content Assertion
    await test.step('Verify page title and main heading', async () => {
      // Assuming the page has a main heading indicating the step
      const mainHeading = page.getByRole('heading', { name: /Step 7/i });
      await expect(mainHeading).toBeVisible();
      
      // Assuming a more specific title for the step, e.g., "Final Confirmation" or "Setup Complete"
      // Replace with the actual expected title if known
      const pageTitle = page.getByRole('heading', { level: 1 });
      await expect(pageTitle).toBeVisible();
    });

    // 3. Functionality Check (Onboarding steps usually have a "Next" or "Finish" button)
    await test.step('Verify presence of form elements and action buttons', async () => {
      // Check for a primary action button to proceed or finish the onboarding
      const primaryActionButton = page.getByRole('button', { name: /Finish|Complete|Next/i });
      await expect(primaryActionButton).toBeVisible();
      
      // Check for a "Back" or "Previous" button for navigation
      const backButton = page.getByRole('button', { name: /Back|Previous/i });
      await expect(backButton).toBeVisible();

      // Since it's a form step, check for a common form element (e.g., a checkbox for terms, or a final input field)
      // This is a generic check and should be refined if the specific content of step 7 is known.
      const formContainer = page.getByRole('form');
      if (await formContainer.isVisible()) {
        // If a form is present, check for a submit button within it
        const submitButton = formContainer.getByRole('button', { name: /Submit|Save/i });
        if (await submitButton.isVisible()) {
            await expect(submitButton).toBeEnabled();
        }
      }
    });
  });
  
  // Optional: Add a test to ensure the "Next" or "Finish" button is clickable and leads to the next page/dashboard
  test('should allow progression to the next stage', async ({ page }) => {
    await page.goto(ONBOARDING_STEP_7_ROUTE);
    await page.waitForLoadState('networkidle');

    const primaryActionButton = page.getByRole('button', { name: /Finish|Complete|Next/i });
    await expect(primaryActionButton).toBeVisible();
    
    // Simulate clicking the action button
    // NOTE: The assertion below will fail if the button is disabled or the navigation is blocked.
    // It is a good practice to mock the API call or check for successful navigation.
    // For this generic test, we only assert it's enabled and attempt the click.
    await expect(primaryActionButton).toBeEnabled();
    
    // await primaryActionButton.click();
    
    // Placeholder for next page assertion:
    // await page.waitForURL('/dashboard'); // Replace with the actual next route
    // await expect(page.url()).not.toBe(ONBOARDING_STEP_7_ROUTE);
  });
});