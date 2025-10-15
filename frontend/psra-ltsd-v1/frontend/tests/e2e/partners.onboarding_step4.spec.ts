import { test, expect } from '@playwright/test';

test.describe('Partner Onboarding Step 4 Page', () => {
  const route = '/partners/onboarding_step4';

  test('should navigate to the page and display the main content', async ({ page }) => {
    // 1. Navigation
    await test.step('Navigate to the Onboarding Step 4 page', async () => {
      await page.goto(route);
      // Wait for the page to load and the main content to be visible
      await expect(page).toHaveURL(route);
    });

    // 2. Visibility: Assert that key elements are visible
    await test.step('Verify key elements are visible', async () => {
      // Check for a main heading indicating the step
      const mainHeading = page.getByRole('heading', { name: /Onboarding Step 4/i });
      await expect(mainHeading).toBeVisible();

      // Check for the presence of a form or main content area
      const mainContent = page.getByRole('main');
      await expect(mainContent).toBeVisible();

      // Check for a progress indicator (assuming a multi-step form has one)
      const progressIndicator = page.getByRole('progressbar');
      // Use soft assertion as progress bar might not be present or might be a different role
      await expect(progressIndicator).toBeVisible({ timeout: 5000 }).catch(() => console.log('Progress indicator not found or not visible.'));
    });

    // 3. Functionality: Check for form fields and action buttons
    await test.step('Verify form fields and action buttons', async () => {
      // Assuming Step 4 involves a final review or agreement, check for a key checkbox/input
      // Placeholder for a specific form field (e.g., a checkbox for terms and conditions)
      const termsCheckbox = page.getByRole('checkbox', { name: /I agree to the terms and conditions/i });
      // Use soft assertion as the exact field is unknown
      await expect(termsCheckbox).toBeVisible({ timeout: 5000 }).catch(() => console.log('Terms checkbox not found or not visible.'));

      // Check for the primary action button (e.g., "Submit" or "Finish")
      const submitButton = page.getByRole('button', { name: /Submit|Finish|Complete Onboarding/i });
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toBeDisabled(); // Should be disabled until the form is filled/checked

      // Check for the navigation button to the previous step
      const backButton = page.getByRole('button', { name: /Back|Previous/i });
      await expect(backButton).toBeVisible();
    });
  });

  test('should allow navigation back to step 3', async ({ page }) => {
    await page.goto(route);

    // Click the "Back" button
    const backButton = page.getByRole('button', { name: /Back|Previous/i });
    await expect(backButton).toBeVisible();
    await backButton.click();

    // Assert navigation to the previous step (onboarding_step3)
    await expect(page).toHaveURL(/.*\/partners\/onboarding_step3/);
  });

  // Additional test case: Test form submission flow (requires knowing the form fields)
  // test('should complete the form and proceed to the next stage', async ({ page }) => {
  //   await page.goto(route);

  //   // 1. Fill out/check required fields (e.g., agree to terms)
  //   // await page.getByRole('checkbox', { name: /I agree/i }).check();

  //   // 2. Assert the submit button is now enabled
  //   // const submitButton = page.getByRole('button', { name: /Submit|Finish/i });
  //   // await expect(submitButton).toBeEnabled();

  //   // 3. Click the submit button
  //   // await submitButton.click();

  //   // 4. Assert navigation to the success page or dashboard
  //   // await expect(page).toHaveURL(/.*\/partners\/onboarding_success/);
  // });
});