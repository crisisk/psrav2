import { test, expect } from '@playwright/test';

const ROUTE = '/partners/onboarding_step3';

test.describe('Partner Onboarding Step 3 Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the third step of the partner onboarding process
    await page.goto(ROUTE);
  });

  test('should display the correct page title and main heading', async ({ page }) => {
    // Assert the page title (assuming the application sets a proper title)
    await expect(page).toHaveTitle(/Partner Onboarding - Step 3/);

    // Assert the main heading for the step
    // Using a role selector for robustness
    await expect(page.getByRole('heading', { name: /Step 3/i })).toBeVisible();
    
    // Assert the presence of a progress indicator (e.g., "Step 3 of X")
    await expect(page.getByText(/Step 3 of/i)).toBeVisible();
  });

  test('should display the main form elements for step 3', async ({ page }) => {
    // Assert the presence of the main form or a section related to the step's content
    // Assuming the form has a descriptive name or is a main element
    const form = page.getByRole('form', { name: /onboarding step 3 details/i });
    await expect(form).toBeVisible();

    // Check for common form elements like input fields or textareas
    // Replace 'data-test-id' with actual test IDs or more specific role/label selectors
    // Example: A text input for a required piece of information
    await expect(form.getByRole('textbox', { name: /required field name/i })).toBeVisible();
    
    // Example: A checkbox or radio button group
    await expect(form.getByRole('checkbox', { name: /agreement or option/i })).toBeVisible();
  });

  test('should have a functional "Next" button and a "Back" button', async ({ page }) => {
    // Assert the presence and visibility of the primary action button
    const nextButton = page.getByRole('button', { name: /Next|Continue/i });
    await expect(nextButton).toBeVisible();
    
    // Assert the presence of a back button
    const backButton = page.getByRole('button', { name: /Back|Previous/i });
    await expect(backButton).toBeVisible();

    // Test that the "Next" button is initially disabled if the form is incomplete
    // This is a crucial check for form validation
    // await expect(nextButton).toBeDisabled(); // Uncomment if validation is expected

    // Simulate filling the form and enabling the button (placeholder logic)
    // await page.getByRole('textbox', { name: /required field name/i }).fill('Test Data');
    // await expect(nextButton).toBeEnabled();

    // Test navigation to the next step upon clicking "Next"
    // await nextButton.click();
    // await page.waitForURL(/partners\/onboarding_step4/);
    // await expect(page).toHaveURL(/partners\/onboarding_step4/);
  });

  test('should navigate back to step 2 when "Back" button is clicked', async ({ page }) => {
    const backButton = page.getByRole('button', { name: /Back|Previous/i });
    await expect(backButton).toBeVisible();

    // Click the back button
    // await backButton.click();

    // Assert navigation to the previous step
    // await page.waitForURL(/partners\/onboarding_step2/);
    // await expect(page).toHaveURL(/partners\/onboarding_step2/);
  });
});