import { test, expect } from '@playwright/test';

test.describe('Onboarding Introduction Page', () => {
  const route = '/onboarding/intro';

  test('should navigate to the introduction page and display key elements', async ({ page }) => {
    // 1. Navigation: Navigate to the correct route
    await test.step('Navigate to the Onboarding Introduction page', async () => {
      await page.goto(route);
      // Wait for the page to be fully loaded
      await page.waitForLoadState('networkidle');
    });

    // 2. Visibility: Assert that key elements are visible
    await test.step('Verify page title and main heading visibility', async () => {
      // Check for a descriptive page title
      await expect(page).toHaveTitle(/Onboarding Introduction|Welcome/i);

      // Check for a main heading, typically an h1 or a large text element
      const mainHeading = page.getByRole('heading', { name: /Welcome|Get Started|Introduction/i, level: 1 });
      await expect(mainHeading).toBeVisible();
    });

    await test.step('Verify introductory content and primary CTA button', async () => {
      // Check for the presence of the main introductory content area
      // Using a generic role like 'main' or a test-id if available. Assuming 'main' for robustness.
      const mainContent = page.getByRole('main');
      await expect(mainContent).toBeVisible();

      // Check for the primary Call-to-Action (CTA) button to proceed
      // Common text for an onboarding CTA is "Get Started", "Next", or "Continue"
      const ctaButton = page.getByRole('button', { name: /Get Started|Next|Continue/i });
      await expect(ctaButton).toBeVisible();
      
      // Assert that the button is enabled, indicating the user can proceed
      await expect(ctaButton).toBeEnabled();
    });

    // Optional: Check for a skip or exit button, common in onboarding flows
    await test.step('Verify optional skip/exit button visibility', async () => {
      const skipButton = page.getByRole('button', { name: /Skip|Exit|Later/i }).or(page.getByRole('link', { name: /Skip|Exit|Later/i }));
      // The button might not exist, so we use a soft assertion or check if it's present but not strictly required to be visible.
      // For this test, we'll check if it exists, but not fail the test if it doesn't.
      const skipButtonCount = await skipButton.count();
      if (skipButtonCount > 0) {
        console.log('Skip/Exit button found and visible.');
        await expect(skipButton.first()).toBeVisible();
      } else {
        console.log('No explicit Skip/Exit button found, which is acceptable.');
      }
    });
  });
});