import { test, expect } from '@playwright/test';

// Define the route for the page under test
const ONBOARDING_STEP_5_ROUTE = '/onboarding/step-5';

test.describe('Onboarding Step 5 Page', () => {
  // Test to ensure the page loads correctly and displays the main elements
  test('should load the page and display the final onboarding step elements', async ({ page }) => {
    // 1. Navigation: Navigate to the correct route
    await test.step('Navigate to Onboarding Step 5', async () => {
      await page.goto(ONBOARDING_STEP_5_ROUTE);
      // Wait for the main content to be visible
      await expect(page.getByRole('main')).toBeVisible();
    });

    // 2. Visibility: Assert that key elements are visible
    await test.step('Verify page title and heading visibility', async () => {
      // Check for the main heading, inferring it's related to the final step or completion
      const pageTitle = page.getByRole('heading', { name: /Step 5: Finalize Onboarding|Review and Complete/i, level: 1 });
      await expect(pageTitle).toBeVisible();

      // Check for a progress indicator or step title
      const stepIndicator = page.getByText('Step 5 of 5', { exact: false });
      await expect(stepIndicator).toBeVisible();
    });

    // 3. Functionality: Check for form elements and the final action button
    await test.step('Verify form elements and action buttons', async () => {
      // Since it is a final step, it might contain a summary or a final confirmation checkbox
      const summarySection = page.getByRole('region', { name: /Summary|Review/i });
      await expect(summarySection).toBeVisible();

      // Check for the final action button, which is typically "Complete", "Finish", or "Submit"
      const completeButton = page.getByRole('button', { name: /Complete|Finish|Submit/i });
      await expect(completeButton).toBeVisible();
      
      // Check for a "Back" or "Previous" button to allow navigation to the previous step
      const backButton = page.getByRole('button', { name: /Back|Previous/i });
      await expect(backButton).toBeVisible();
    });

    // 4. Robustness: Check for the presence of the main application navigation/header
    await test.step('Verify application header/navigation is present', async () => {
      const header = page.getByRole('banner');
      await expect(header).toBeVisible();
    });
  });

  // Optional: Test for successful completion (requires mocking API response or actual data)
  // test('should allow successful completion of onboarding', async ({ page }) => {
  //   await page.goto(ONBOARDING_STEP_5_ROUTE);
  //   // ... fill out any final forms/checkboxes ...
  //   // await page.getByLabel('I agree to the terms').check();
  //   
  //   // Click the final action button
  //   // await page.getByRole('button', { name: /Complete|Finish/i }).click();
  //   
  //   // Assert navigation to the dashboard or success page
  //   // await page.waitForURL('/dashboard');
  //   // await expect(page.getByRole('heading', { name: 'Welcome to PSRA-LTSD' })).toBeVisible();
  // });
});
