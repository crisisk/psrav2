import { test, expect } from '@playwright/test';

// The base URL is assumed to be configured in the Playwright config file.
const CREATE_CERTIFICATE_ROUTE = '/certificates/create';

test.describe('Certificate Creation Page E2E Tests', () => {
  /**
   * Test 1: Verify successful navigation and page title/heading visibility.
   */
  test('should navigate to the create certificate page and display the main heading', async ({ page }) => {
    await test.step('Navigate to the creation route', async () => {
      await page.goto(CREATE_CERTIFICATE_ROUTE);
    });

    await test.step('Verify the page is loaded and the main heading is visible', async () => {
      // Assuming the main heading is an h1 with text "Create New Certificate" or similar.
      // Using a role selector for robustness.
      const pageTitle = page.getByRole('heading', { name: /Create New Certificate|New Certificate/i, level: 1 });
      await expect(pageTitle).toBeVisible();
    });

    await test.step('Verify the presence of a common application navigation element (e.g., a sidebar or header)', async () => {
      // Assuming a navigation bar is present, identifiable by the 'navigation' role.
      const navigationBar = page.getByRole('navigation');
      await expect(navigationBar).toBeVisible();
    });
  });

  /**
   * Test 2: Verify the presence of essential form elements and action buttons.
   */
  test('should display all required form fields and action buttons', async ({ page }) => {
    await page.goto(CREATE_CERTIFICATE_ROUTE);

    await test.step('Verify key input fields are visible', async () => {
      // In a compliance application, fields like Name, Type, and Dates are essential.
      // Using label text for robust selection.

      // Example 1: Certificate Name/Identifier
      const nameInput = page.getByLabel(/Certificate Name|Identifier/i);
      await expect(nameInput).toBeVisible();
      await expect(nameInput).toBeEditable();

      // Example 2: Certificate Type (often a dropdown/select)
      const typeSelect = page.getByRole('combobox', { name: /Certificate Type/i });
      await expect(typeSelect).toBeVisible();

      // Example 3: Issue Date (often a date picker/input)
      const issueDateInput = page.getByLabel(/Issue Date/i);
      await expect(issueDateInput).toBeVisible();
    });

    await test.step('Verify action buttons are visible', async () => {
      // The form must have a primary submission button.
      const submitButton = page.getByRole('button', { name: /Create Certificate|Save/i });
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toBeEnabled(); // Should be enabled initially or after filling required fields

      // The form should also have a cancel/back button.
      const cancelButton = page.getByRole('button', { name: /Cancel|Back/i });
      await expect(cancelButton).toBeVisible();
    });
  });

  /**
   * Test 3: Basic form interaction test (e.g., filling a field).
   * This is a minimal test to ensure the form is interactive.
   */
  test('should allow user to input data into a form field', async ({ page }) => {
    await page.goto(CREATE_CERTIFICATE_ROUTE);

    const nameInput = page.getByLabel(/Certificate Name|Identifier/i);
    const testValue = `Test Certificate ${Date.now()}`;

    await test.step('Fill the name input field', async () => {
      await nameInput.fill(testValue);
    });

    await test.step('Verify the input value is correctly set', async () => {
      await expect(nameInput).toHaveValue(testValue);
    });
  });
});