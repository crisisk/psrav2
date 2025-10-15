import { test, expect } from '@playwright/test';

// Define the route for the Partner Onboarding Step 2 page
const ONBOARDING_STEP2_ROUTE = '/partners/onboarding_step2';

test.describe('Partner Onboarding Step 2 Page E2E Tests', () => {
  test('should navigate to the page and verify key elements', async ({ page }) => {
    // 1. Navigation
    await test.step('Navigate to the Partner Onboarding Step 2 page', async () => {
      await page.goto(ONBOARDING_STEP2_ROUTE);
      // Assuming the application requires authentication, this test should run after a successful login.
      // For a robust test, consider mocking the authentication state or logging in first.
    });

    // 2. Visibility and Structure
    await test.step('Verify the page title and main heading', async () => {
      // Check for the main heading, using a role selector for robustness
      const mainHeading = page.getByRole('heading', { name: /Partner Onboarding - Step 2/i });
      await expect(mainHeading).toBeVisible();
      
      // Check for a progress indicator or step number
      const stepIndicator = page.getByText('Step 2 of', { exact: false });
      await expect(stepIndicator).toBeVisible();
    });

    await test.step('Verify the presence of the main form area', async () => {
      // Check for a form element or a section that contains the form
      const form = page.getByRole('form');
      await expect(form).toBeVisible();
    });

    // 3. Functionality - Form Elements (Placeholder for common form elements)
    await test.step('Verify the presence of expected form fields', async () => {
      // Since the exact fields are unknown, we check for common form elements like labels and inputs.
      // In a real-world scenario, replace these with specific field checks (e.g., 'Company Name', 'Address Line 1').
      
      // Example: Check for a text input field (assuming one exists)
      const inputField = page.getByRole('textbox').first();
      await expect(inputField).toBeVisible();
      
      // Example: Check for a submit/next button
      const nextButton = page.getByRole('button', { name: /Next|Continue|Submit/i });
      await expect(nextButton).toBeVisible();
      await expect(nextButton).toBeEnabled(); // Should be enabled if form is valid or initially
    });

    // 4. Robustness - Navigation Buttons
    await test.step('Verify the presence and state of navigation buttons', async () => {
      // Check for the "Back" button
      const backButton = page.getByRole('button', { name: /Back|Previous/i });
      await expect(backButton).toBeVisible();
      await expect(backButton).toBeEnabled();
      
      // Check for the "Next" button (already checked, but good to re-verify contextually)
      const nextButton = page.getByRole('button', { name: /Next|Continue|Submit/i });
      await expect(nextButton).toBeVisible();
    });
  });
  
  // Optional: Add a test to ensure the "Back" button works
  test('should navigate back to step 1 when the Back button is clicked', async ({ page }) => {
    await page.goto(ONBOARDING_STEP2_ROUTE);
    
    const backButton = page.getByRole('button', { name: /Back|Previous/i });
    await expect(backButton).toBeVisible();
    
    // Click the back button
    await backButton.click();
    
    // Assert that the page has navigated to the expected previous step (Step 1)
    // Assuming Step 1 is at /partners/onboarding_step1
    await expect(page).toHaveURL(/.*\/partners\/onboarding_step1/);
    
    // Optional: Verify a key element on the previous page
    const step1Heading = page.getByRole('heading', { name: /Partner Onboarding - Step 1/i });
    await expect(step1Heading).toBeVisible();
  });
});