import { test, expect } from '@playwright/test';

// Define the route for the Onboarding Import page
const ONBOARDING_IMPORT_ROUTE = '/onboarding/import';

test.describe('Onboarding Import Page E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the Onboarding Import page
    await page.goto(ONBOARDING_IMPORT_ROUTE);
  });

  test('should navigate to the Onboarding Import page and display the main header', async ({ page }) => {
    // 1. Verify successful navigation and URL
    await expect(page).toHaveURL(new RegExp(ONBOARDING_IMPORT_ROUTE + '$'));

    // 2. Assert that the main page title is visible.
    // Using a role-based selector for a level 1 heading, which is common for main page titles.
    const pageTitle = page.getByRole('heading', { name: /Onboarding: Data Import/i, level: 1 });
    await expect(pageTitle).toBeVisible();
  });

  test('should display the file upload component and import instructions', async ({ page }) => {
    // 1. Check for the presence of a file input element, which is central to an import page.
    // Using a role-based selector for a file input.
    const fileInput = page.getByLabel(/Upload File|Select File|Choose File/i);
    await expect(fileInput).toBeVisible();

    // 2. Check for a prominent button to trigger the import or continue the process.
    // This assumes a "Continue" or "Import" button exists after a file is selected.
    const continueButton = page.getByRole('button', { name: /Continue|Import Data|Next Step/i });
    await expect(continueButton).toBeVisible();
    await expect(continueButton).toBeDisabled(); // Should be disabled initially until a file is uploaded

    // 3. Check for general instructions or a description of the import process.
    // This is a more general check for instructional text on the page.
    const instructions = page.getByText(/Please upload your data file|Supported formats include/i);
    await expect(instructions).toBeVisible();
  });

  test('should display a link or button to skip the import step', async ({ page }) => {
    // In an onboarding flow, there is often an option to skip or do it later.
    const skipLink = page.getByRole('link', { name: /Skip this step|Do this later/i });
    const skipButton = page.getByRole('button', { name: /Skip this step|Do this later/i });

    // Expect at least one of the skip elements to be visible.
    await expect(skipLink.or(skipButton)).toBeVisible();
  });

  // NOTE: A more advanced test would involve actually uploading a mock file and asserting the next step,
  // but this requires a mock file and knowledge of the application's API response, which is out of scope.
  // The current tests cover navigation and visibility of critical components.
});
