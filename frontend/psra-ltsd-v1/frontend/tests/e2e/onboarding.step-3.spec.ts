import { test, expect } from '@playwright/test';

test.describe('Onboarding Step 3 Page', () => {
  const route = '/onboarding/step-3';

  test('should navigate to the page and verify key elements', async ({ page }) => {
    // 1. Navigation
    await test.step('Navigate to Onboarding Step 3', async () => {
      await page.goto(route);
      // Expect the URL to be correct
      await expect(page).toHaveURL(new RegExp(route + '$'));
    });

    // 2. Visibility and Content Assertions
    await test.step('Verify page structure and content', async () => {
      // Assert the main heading for the step
      const mainHeading = page.getByRole('heading', { level: 1 });
      await expect(mainHeading).toBeVisible();
      // Since the exact text is unknown, we check for a common pattern
      await expect(mainHeading).toHaveText(/Step 3/i);

      // Assert the presence of the main form/content area
      const mainContent = page.locator('main');
      await expect(mainContent).toBeVisible();

      // Assert the presence of a form or key input fields (assuming it's a form step)
      // We look for a common form element like a text input or a checkbox/radio group
      const formElement = page.getByRole('form');
      await expect(formElement).toBeVisible();
      
      // Assuming a form step requires user input, check for a generic input field
      const inputField = formElement.locator('input, textarea, select').first();
      await expect(inputField).toBeVisible();
    });

    // 3. Functionality (Step Controls)
    await test.step('Verify step navigation controls', async () => {
      // Check for the "Next" or "Finish" button
      const nextButton = page.getByRole('button', { name: /Next|Finish|Complete/i });
      await expect(nextButton).toBeVisible();
      await expect(nextButton).toBeEnabled();

      // Check for the "Back" button
      const backButton = page.getByRole('button', { name: /Back|Previous/i });
      await expect(backButton).toBeVisible();
      await expect(backButton).toBeEnabled();
    });
  });
});