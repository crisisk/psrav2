import { test, expect } from '@playwright/test';

test.describe('Supplier Onboarding Form Page', () => {
  const route = '/suppliers/onboarding_form';

  test('should navigate to the onboarding form and verify key elements', async ({ page }) => {
    // 1. Navigation
    await test.step('Navigate to the Supplier Onboarding Form page', async () => {
      await page.goto(route);
      // Wait for the page to load and settle
      await page.waitForLoadState('networkidle');
    });

    // 2. Visibility and Structure
    await test.step('Verify page title and main form heading are visible', async () => {
      // Assert the page URL is correct
      await expect(page).toHaveURL(new RegExp(route + '$'));

      // Assert the main heading is present. Using role 'heading' with a level or name is robust.
      const mainHeading = page.getByRole('heading', { name: /Supplier Onboarding/i, level: 1 });
      await expect(mainHeading).toBeVisible();
    });

    await test.step('Verify key form fields are present', async () => {
      // Check for common supplier information fields using role-based selectors
      // Company Name
      const companyNameField = page.getByRole('textbox', { name: /Company Name/i });
      await expect(companyNameField).toBeVisible();
      await expect(companyNameField).toBeEditable();

      // Contact Person Name
      const contactNameField = page.getByRole('textbox', { name: /Contact Person/i });
      await expect(contactNameField).toBeVisible();
      await expect(contactNameField).toBeEditable();

      // Email Address
      const emailField = page.getByRole('textbox', { name: /Email Address/i });
      await expect(emailField).toBeVisible();
      await expect(emailField).toBeEditable();

      // Address (assuming a multi-line or separate fields)
      const addressField = page.getByRole('textbox', { name: /Address Line 1/i });
      await expect(addressField).toBeVisible();
      await expect(addressField).toBeEditable();
    });

    // 3. Functionality Check (Submit Button)
    await test.step('Verify the submission button is present and enabled', async () => {
      // Check for the primary action button, typically a 'Submit' or 'Next' button
      const submitButton = page.getByRole('button', { name: /Submit|Next/i });
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toBeEnabled();
    });
  });

  // Optional: Add a test to ensure form validation works (e.g., required fields)
  test('should display validation errors on empty submission', async ({ page }) => {
    await page.goto(route);
    await page.waitForLoadState('networkidle');

    const submitButton = page.getByRole('button', { name: /Submit|Next/i });
    await submitButton.click();

    // Assert that a common validation error message appears, or that specific fields show errors
    // This is a placeholder and depends on the actual implementation's error messages.
    const errorMessage = page.getByText(/Please fill out this field|is required/i);
    await expect(errorMessage).toBeVisible();
  });
});