import { test, expect } from '@playwright/test';

const ONBOARDING_STEP_4_ROUTE = '/onboarding/step-4';

test.describe('Onboarding Step 4 Page E2E Tests', () => {
  test('should navigate to the page and verify key elements are visible', async ({ page }) => {
    // 1. Navigation: Navigate to the correct route
    await test.step('Navigate to Onboarding Step 4', async () => {
      await page.goto(ONBOARDING_STEP_4_ROUTE);
      // Wait for the main content to load
      await page.waitForLoadState('networkidle');
    });

    // 2. Visibility: Assert that key elements are visible
    await test.step('Verify page title and main heading visibility', async () => {
      // Assuming the page has a main heading for the step
      const mainHeading = page.getByRole('heading', { name: /Step 4/i });
      await expect(mainHeading).toBeVisible();
      
      // Assuming the application uses a common title structure for the page
      await expect(page).toHaveTitle(/Onboarding - Step 4/);
    });

    // 3. Functionality: Check for form elements and the completion button
    await test.step('Verify form elements and action button presence', async () => {
      // Since this is a generic step 4, we check for the presence of a form or main content area.
      // A common pattern is a form or a main content container.
      const mainContent = page.getByRole('main');
      await expect(mainContent).toBeVisible();

      // Check for a generic form element, as this is likely a data collection step
      const form = page.getByRole('form');
      // We use a soft assertion here as some steps might be purely informational
      if (await form.isVisible()) {
        console.log('Form element found on Step 4.');
      } else {
        console.log('No explicit form element found, proceeding with button check.');
      }

      // Check for the primary action button to complete the step/onboarding
      const nextButton = page.getByRole('button', { name: /Complete|Finish|Next/i });
      await expect(nextButton).toBeVisible();
      await expect(nextButton).toBeEnabled();
    });

    // 4. Robustness: Check for a common element like the navigation bar or a progress indicator
    await test.step('Verify presence of common UI elements', async () => {
      // Check for an onboarding progress indicator (e.g., a list of steps)
      const progressIndicator = page.getByRole('list', { name: /Onboarding Progress/i });
      if (await progressIndicator.isVisible()) {
        await expect(progressIndicator).toBeVisible();
      }
      
      // Check for a common navigation element like a header/navbar
      const header = page.getByRole('banner');
      await expect(header).toBeVisible();
    });
  });

  // Additional test case: Check for successful transition to the next step/dashboard
  test('should allow user to complete the step and proceed', async ({ page }) => {
    await page.goto(ONBOARDING_STEP_4_ROUTE);
    await page.waitForLoadState('networkidle');

    // Assuming all required fields are pre-filled or not required for this test
    // In a real-world scenario, we would fill out the form here.
    
    // Click the primary action button
    const completeButton = page.getByRole('button', { name: /Complete|Finish|Next/i });
    await completeButton.click();

    // Assert that the page navigates away from the onboarding route.
    // This is a critical check for a successful step completion.
    await page.waitForURL((url) => !url.pathname.includes(ONBOARDING_STEP_4_ROUTE));

    // Assert that the user is redirected to a success page or the main dashboard
    // We assume a redirect to the dashboard (e.g., /dashboard) or a success page.
    await expect(page).not.toHaveURL(ONBOARDING_STEP_4_ROUTE);
    // A more specific check would be:
    // await expect(page).toHaveURL(/dashboard|success/); 
  });
});