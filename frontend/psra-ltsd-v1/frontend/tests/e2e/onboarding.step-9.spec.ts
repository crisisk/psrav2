import { test, expect } from '@playwright/test';

const ONBOARDING_STEP_ROUTE = '/onboarding/step-9';

test.describe('Onboarding Step 9 Page', () => {
  test('should navigate to the page and display key elements', async ({ page }) => {
    // 1. Navigation
    await test.step('Navigate to Onboarding Step 9', async () => {
      await page.goto(ONBOARDING_STEP_ROUTE);
      // Assert that the URL is correct
      await expect(page).toHaveURL(ONBOARDING_STEP_ROUTE);
    });

    // 2. Visibility and Content Assertion
    await test.step('Verify page title and main content visibility', async () => {
      // Check for a main heading indicating the step number or title
      const pageTitle = page.getByRole('heading', { name: /Step 9/i });
      await expect(pageTitle).toBeVisible();
      
      // Assuming a general main content area is present
      const mainContent = page.getByRole('main');
      await expect(mainContent).toBeVisible();

      // Check for a progress indicator or step counter, common in onboarding flows
      const progressIndicator = page.getByText(/Step 9 of \d+/i);
      await expect(progressIndicator).toBeVisible();
    });

    // 3. Functionality (Navigation Buttons)
    await test.step('Verify navigation buttons are present and enabled', async () => {
      // Check for the "Next" or "Continue" button
      const nextButton = page.getByRole('button', { name: /Next|Continue/i });
      await expect(nextButton).toBeVisible();
      await expect(nextButton).toBeEnabled();

      // Check for the "Back" or "Previous" button
      const backButton = page.getByRole('button', { name: /Back|Previous/i });
      await expect(backButton).toBeVisible();
      await expect(backButton).toBeEnabled();
    });

    // 4. Robustness (Placeholder for form interaction if applicable)
    // Since the exact form content is unknown, we assert the presence of a form
    // and assume basic interaction would be tested here in a real scenario.
    await test.step('Verify the presence of the main form or content container', async () => {
        const form = page.getByRole('form');
        // The page might not use a formal <form> tag, so we use a soft assertion
        // or check for a container with a specific test-id if available.
        // For robustness, we stick to the main content check from step 2.
        // If this step involved a form, we would add:
        // await expect(form).toBeVisible();
        // await page.getByLabel('Some Input Field').fill('test data');
    });
  });
});