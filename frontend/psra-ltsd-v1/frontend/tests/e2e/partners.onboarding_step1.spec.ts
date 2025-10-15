import { test, expect } from '@playwright/test';

const ONBOARDING_STEP_1_ROUTE = '/partners/onboarding_step1';

test.describe('Partner Onboarding Step 1 Page', () => {
  test('should navigate to the page and verify key elements are visible', async ({ page }) => {
    // 1. Navigation: Navigate to the correct route
    await test.step('Navigate to Partner Onboarding Step 1', async () => {
      await page.goto(ONBOARDING_STEP_1_ROUTE);
      // Wait for the main content to load
      await expect(page).toHaveURL(ONBOARDING_STEP_1_ROUTE);
    });

    // 2. Visibility: Assert that key elements are visible
    await test.step('Verify page title and main heading', async () => {
      // Assuming the page has a title or main heading related to the step
      const pageTitle = page.getByRole('heading', { name: /Partner Onboarding/i });
      await expect(pageTitle).toBeVisible();
      
      // Check for the step indicator
      const stepIndicator = page.getByText(/Step 1 of/i);
      await expect(stepIndicator).toBeVisible();
    });

    // 3. Functionality: Check for form elements and navigation buttons
    await test.step('Verify form elements are present', async () => {
      // Check for common form fields in an initial onboarding step
      // Using role-based selectors for robustness
      
      // Example 1: Company Name input
      const companyNameInput = page.getByRole('textbox', { name: /Company Name/i });
      await expect(companyNameInput).toBeVisible();

      // Example 2: Contact Person input
      const contactPersonInput = page.getByRole('textbox', { name: /Contact Person/i });
      await expect(contactPersonInput).toBeVisible();

      // Example 3: Email input
      const emailInput = page.getByRole('textbox', { name: /Email/i });
      await expect(emailInput).toBeVisible();
      
      // Example 4: Phone Number input
      const phoneInput = page.getByRole('textbox', { name: /Phone Number/i });
      await expect(phoneInput).toBeVisible();
    });

    await test.step('Verify navigation button is present', async () => {
      // Check for the "Next" button to proceed to the next step
      const nextButton = page.getByRole('button', { name: /Next|Continue/i });
      await expect(nextButton).toBeVisible();
      await expect(nextButton).toBeEnabled(); // Should be enabled if form is valid, but we only check visibility/presence here
    });
  });
});
