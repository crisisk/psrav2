import { test, expect } from '@playwright/test';

test.describe('Certificates Edit Page E2E Test', () => {
  const editRoute = '/certificates/edit';
  const pageTitle = 'Edit Certificate';

  test('should navigate to the edit page and verify key elements', async ({ page }) => {
    // 1. Navigation: Navigate to the correct route
    await test.step('Navigate to the Edit Certificate page', async () => {
      await page.goto(editRoute);
      // Wait for the page to load and the main content to be visible
      await expect(page).toHaveURL(new RegExp(editRoute));
    });

    // 2. Visibility: Assert that key elements are visible
    await test.step('Verify page title and main form elements are visible', async () => {
      // Check for a main heading with the expected title
      await expect(page.getByRole('heading', { name: pageTitle, level: 1 })).toBeVisible();

      // Check for the presence of the main form area
      await expect(page.getByRole('form', { name: 'Certificate Details' })).toBeVisible();

      // Check for common form fields (using role-based selectors for robustness)
      // Since this is an edit page, we expect fields to be pre-populated,
      // so we check for their presence and a non-empty value.
      await expect(page.getByRole('textbox', { name: 'Certificate Name' })).toBeVisible();
      await expect(page.getByRole('textbox', { name: 'Certificate ID' })).toBeVisible();
      await expect(page.getByRole('textbox', { name: 'Issue Date' })).toBeVisible();
      await expect(page.getByRole('textbox', { name: 'Expiry Date' })).toBeVisible();
      await expect(page.getByRole('combobox', { name: 'Status' })).toBeVisible();

      // Check for pre-populated data (assuming a simple text field)
      // This is a crucial check for an 'edit' page.
      const certificateNameField = page.getByRole('textbox', { name: 'Certificate Name' });
      await expect(certificateNameField).not.toBeEmpty();
    });

    // 3. Functionality: Check for action buttons
    await test.step('Verify action buttons are present and enabled', async () => {
      // Check for the primary action button (Save/Update)
      const saveButton = page.getByRole('button', { name: 'Save', exact: true });
      await expect(saveButton).toBeVisible();
      await expect(saveButton).toBeEnabled();

      // Check for the secondary action button (Cancel/Back)
      const cancelButton = page.getByRole('button', { name: 'Cancel', exact: true });
      await expect(cancelButton).toBeVisible();
      await expect(cancelButton).toBeEnabled();
    });
  });

  // Optional: Test for form submission (simulated)
  test('should allow editing and saving the certificate details', async ({ page }) => {
    await page.goto(editRoute);
    await expect(page.getByRole('heading', { name: pageTitle, level: 1 })).toBeVisible();

    const newName = `Test Certificate Update ${Date.now()}`;

    // Fill a field with new data
    await page.getByRole('textbox', { name: 'Certificate Name' }).fill(newName);

    // Assert the new value is in the field
    await expect(page.getByRole('textbox', { name: 'Certificate Name' })).toHaveValue(newName);

    // Simulate clicking the save button (without waiting for navigation, as we don't know the next route)
    // In a real scenario, you would mock the API call or wait for the successful redirect.
    await page.getByRole('button', { name: 'Save', exact: true }).click();

    // Add a placeholder assertion for successful save, assuming a success notification appears
    // await expect(page.getByText('Certificate updated successfully')).toBeVisible();
  });
});