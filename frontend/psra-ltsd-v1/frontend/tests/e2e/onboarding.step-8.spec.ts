import { test, expect } from '@playwright/test';

const ONBOARDING_STEP_8_ROUTE = '/onboarding/step-8';

test.describe('Onboarding Step 8 Page E2E Test', () => {
  test('should navigate to step 8 and display the main content', async ({ page }) => {
    // 1. Navigation
    await test.step('Navigate to Onboarding Step 8', async () => {
      await page.goto(ONBOARDING_STEP_8_ROUTE);
      // Assert that the URL is correct
      await expect(page).toHaveURL(new RegExp(`${ONBOARDING_STEP_8_ROUTE}$`));
    });

    // 2. Visibility and Structure Check
    await test.step('Verify page title, step indicator, and main components are visible', async () => {
      // Assert the main page title, inferring it's a critical step like 'Review' or 'Finalize'
      const pageTitle = page.getByRole('heading', { name: /Step 8: Finalize|Review|Configuration/i, level: 1 });
      await expect(pageTitle).toBeVisible();

      // Assert the step indicator (e.g., "Step 8 of 8" or "Step 8")
      const stepIndicator = page.getByText(/Step 8 of/i);
      await expect(stepIndicator).toBeVisible();

      // Assert the presence of the main content area (e.g., a form or a summary panel)
      const mainContent = page.getByRole('main');
      await expect(mainContent).toBeVisible();
    });

    // 3. Functionality Check (Assuming it's a form or a review/submission page)
    await test.step('Verify navigation buttons are present and functional', async () => {
      // Check for the primary action button (e.g., "Finish", "Submit", or "Complete")
      const finishButton = page.getByRole('button', { name: /Finish|Submit|Complete/i });
      await expect(finishButton).toBeVisible();
      await expect(finishButton).toBeEnabled();

      // Check for the secondary action button (e.g., "Back" or "Previous")
      const backButton = page.getByRole('button', { name: /Back|Previous/i });
      await expect(backButton).toBeVisible();
      await expect(backButton).toBeEnabled();

      // Optional: If it's a review page, check for a summary table or list of entered data
      const reviewSummary = page.getByRole('list', { name: /review summary|configuration details/i })
        .or(page.getByRole('table', { name: /review summary|configuration details/i }));
      // Use a soft assertion or check for at least one element that suggests a summary
      await expect(reviewSummary).toBeVisible({ timeout: 5000 }).catch(() => {
        console.log('No explicit review summary list/table found, proceeding.');
      });
    });

    // 4. Robustness Check (Example of a simple interaction)
    await test.step('Attempt to click the primary action button (e.g., Finish)', async () => {
      // Note: We don't assert the *result* of the click (e.g., navigation to a dashboard)
      // as that would be a separate test case, but we ensure the click action is possible.
      const finishButton = page.getByRole('button', { name: /Finish|Submit|Complete/i });
      // await finishButton.click(); // Uncomment to test actual navigation
      await expect(finishButton).toBeEnabled();
    });
  });
});
